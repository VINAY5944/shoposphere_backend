
import crypto from "node:crypto";
import sequelize from "../../../config/database.js";

import User from "../../users/models/User.js";
import productService from "../../products/services/product.service.js";
import inventoryService from "../../inventory/services/inventory.service.js";
import cartService from "../../cart/services/cart.service.js";

import { processPayment } from "../../payments/services/payment.service.js";
import { PAYMENT_STATUS } from "../../payments/constants/payment.constants.js";

import { enqueueOrderConfirmationEmail } from "../../notifications/services/email.service.js";

import * as orderRepository from "../repositories/order.repository.js";

const createError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

// Convert a decimal price into integer paise.
const toPaise = (price) => {
  const value = String(price);
  const match = value.match(/^(\d+)(?:\.(\d{1,2}))?$/);

  if (!match) {
    throw createError("Invalid product price", 400);
  }

  const rupees = BigInt(match[1]);
  const paise = BigInt((match[2] || "").padEnd(2, "0") || "0");

  return rupees * 100n + paise;
};

// Convert integer paise into a DECIMAL string.
const formatAmount = (paise) => {
  const rupees = paise / 100n;
  const remainingPaise = String(paise % 100n).padStart(2, "0");

  return `${rupees}.${remainingPaise}`;
};

// Combine duplicate products and validate quantities.
const normalizeItems = (items) => {
  if (!Array.isArray(items) || items.length === 0) {
    throw createError("At least one product is required", 400);
  }

  if (items.length > 100) {
    throw createError("Maximum 100 products are allowed", 400);
  }

  const quantityMap = new Map();

  for (const item of items) {
    const productId = String(item.productId);
    const quantity = item.quantity;

    if (!/^[1-9]\d*$/.test(productId)) {
      throw createError("Invalid product ID", 400);
    }

    if (!Number.isSafeInteger(quantity) || quantity <= 0) {
      throw createError("Invalid product quantity", 400);
    }

    const newQuantity =
      (quantityMap.get(productId) || 0) + quantity;

    if (!Number.isSafeInteger(newQuantity)) {
      throw createError("Product quantity is too large", 400);
    }

    quantityMap.set(productId, newQuantity);
  }

  return [...quantityMap.entries()].map(
    ([productId, quantity]) => ({
      productId,
      quantity,
    })
  );
};

// Fetch current products and calculate the total.
const prepareOrderItems = async (items) => {
  const preparedItems = [];
  let totalPaise = 0n;

  for (const item of items) {
    const product = await productService.getProductById(
      item.productId
    );

    if (!product.isActive) {
      throw createError(
        `Product ${item.productId} is unavailable`,
        400
      );
    }

    const inventory =
      await inventoryService.getInventoryByProductId(
        item.productId
      );

    if (!inventory || inventory.quantity < item.quantity) {
      throw createError(
        `Insufficient stock for ${product.name}`,
        409
      );
    }

    const unitPricePaise = toPaise(product.price);
    const lineTotalPaise =
      unitPricePaise * BigInt(item.quantity);

    totalPaise += lineTotalPaise;

    preparedItems.push({
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      unitPrice: formatAmount(unitPricePaise),
      quantity: item.quantity,
      lineTotal: formatAmount(lineTotalPaise),
    });
  }

  if (totalPaise <= 0n) {
    throw createError("Order total must be greater than zero", 400);
  }

  return {
    items: preparedItems,
    totalAmount: formatAmount(totalPaise),
    totalPaise,
  };
};

// Generate a unique human-readable order number.
const generateOrderNumber = () => {
  return `ORD-${Date.now()}-${crypto
    .randomBytes(4)
    .toString("hex")
    .toUpperCase()}`;
};

// Compare two product lists independent of their array order.
const haveSameItems = (firstItems, secondItems) => {
  if (firstItems.length !== secondItems.length) {
    return false;
  }

  const expectedItemsMap = new Map(
    firstItems.map((item) => [
      item.productId,
      item.quantity,
    ])
  );

  return secondItems.every(
    (item) =>
      expectedItemsMap.get(item.productId) === item.quantity
  );
};

// Shared checkout logic for both purchase flows.
const completeCheckout = async ({
  userId,
  items,
  paymentPassword,
  clearCart = false,
}) => {
  const normalizedItems = normalizeItems(items);

  if (
    typeof paymentPassword !== "string" ||
    !paymentPassword
  ) {
    throw createError("Payment password is required", 400);
  }

  const user = await User.findByPk(userId);

  if (!user || !user.isActive) {
    throw createError("Customer account not found", 404);
  }

  // Fetch current product prices and validate stock.
  const prepared = await prepareOrderItems(normalizedItems);

  // Simulate payment outside the database transaction.
  const payment = await processPayment({
    password: paymentPassword,
    amount: prepared.totalAmount,
    currency: "INR",
  });

  if (payment.status !== PAYMENT_STATUS.SUCCESS) {
    return {
      success: false,
      paymentStatus: PAYMENT_STATUS.FAILED,
      paymentReference: payment.paymentReference,
      message: payment.message,
    };
  }

  const orderNumber = generateOrderNumber();

  // Create order, order items, and decrease stock atomically.
  const order = await sequelize.transaction(
    async (transaction) => {
      // Lock inventory records in sorted product ID order.
      // This reduces the risk of deadlocks when orders contain
      // multiple products.
      const sortedItems = [...prepared.items].sort((a, b) => {
        const firstId = BigInt(a.productId);
        const secondId = BigInt(b.productId);

        if (firstId < secondId) return -1;
        if (firstId > secondId) return 1;
        return 0;
      });

      for (const item of sortedItems) {
        await inventoryService.decreaseStock(
          item.productId,
          item.quantity,
          orderNumber,
          transaction
        );
      }

      // For cart checkout, lock and verify the cart.
      if (clearCart) {
        const currentCart =
          await cartService.getCartForCheckout(
            userId,
            transaction
          );

        const currentItems = normalizeItems(
          currentCart.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          }))
        );

        // Compare by product ID, not array position.
        const sameItems = haveSameItems(
          normalizedItems,
          currentItems
        );

        if (!sameItems) {
          throw createError(
            "Your cart changed during payment. Please try again.",
            409
          );
        }
      }

      const createdOrder = await orderRepository.create(
        {
          userId,
          orderNumber,
          status: "CONFIRMED",
          paymentStatus: PAYMENT_STATUS.SUCCESS,
          totalAmount: prepared.totalAmount,
          currency: "INR",
          paymentReference: payment.paymentReference,
        },
        transaction
      );

      const orderItems = prepared.items.map((item) => ({
        orderId: createdOrder.id,
        productId: item.productId,
        productName: item.productName,
        sku: item.sku,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        lineTotal: item.lineTotal,
      }));

      await orderRepository.createItems(
        orderItems,
        transaction
      );

      // Clear cart only for cart checkout.
      if (clearCart) {
        await cartService.clearCartItems(
          userId,
          transaction
        );
      }

      return createdOrder;
    }
  );

  // Queue email only after the database transaction commits.
  let notificationQueued = false;

  try {
    await enqueueOrderConfirmationEmail({
      email: user.email,
      customerName: user.name,
      orderNumber,
      totalAmount: prepared.totalAmount,
      currency: "INR",
    });

    notificationQueued = true;
  } catch (error) {
    console.error(
      "Order confirmation email could not be queued:",
      error.message
    );
  }

  return {
    success: true,
    paymentStatus: PAYMENT_STATUS.SUCCESS,
    message: "Order placed successfully",
    orderId: String(order.id),
    orderNumber: order.orderNumber,
    totalAmount: prepared.totalAmount,
    currency: "INR",
    paymentReference: payment.paymentReference,
    notificationQueued,
  };
};

// Buy Now: products are supplied directly by the frontend.
const checkoutNow = async ({
  userId,
  items,
  paymentPassword,
}) => {
  return completeCheckout({
    userId,
    items,
    paymentPassword,
    clearCart: false,
  });
};

// Cart checkout: products come from the customer's cart.
const checkoutCart = async ({
  userId,
  paymentPassword,
}) => {
  const cart = await cartService.getCartForCheckout(userId);

  const items = cart.items.map((item) => ({
    productId: item.productId,
    quantity: item.quantity,
  }));

  return completeCheckout({
    userId,
    items,
    paymentPassword,
    clearCart: true,
  });
};

export default {
  checkoutNow,
  checkoutCart,
};
