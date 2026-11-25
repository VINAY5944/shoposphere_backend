
import sequelize from "../../../config/database.js";

import cartRepository from "../repositories/cart.repository.js";
import cartItemRepository from "../repositories/cartItem.repository.js";

import productService from "../../products/services/product.service.js";

const createError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

// Get or create the customer's cart.
const getOrCreateCart = async (userId, transaction = null) => {
  return cartRepository.findOrCreate(userId, transaction);
};

// Add products to the cart.
const addItem = async (userId, items) => {
  // Combine duplicate product IDs.
  const quantityMap = new Map();

  for (const item of items) {
    const productId = String(item.productId);

    const newQuantity =
      (quantityMap.get(productId) || 0) + item.quantity;

    if (!Number.isSafeInteger(newQuantity)) {
      throw createError("Product quantity is too large", 400);
    }

    quantityMap.set(productId, newQuantity);
  }

  // Validate every product before changing the cart.
  for (const productId of quantityMap.keys()) {
    await productService.getProductById(productId);
  }

  return sequelize.transaction(async (transaction) => {
    // Create the cart if it doesn't exist.
    await getOrCreateCart(userId, transaction);

    // Lock the cart row to serialize concurrent modifications.
    const cart = await cartRepository.findByUserId(
      userId,
      transaction
    );

    for (const [productId, quantity] of quantityMap) {
      const existingItem =
        await cartItemRepository.findByCartAndProduct(
          cart.id,
          productId,
          transaction
        );

      if (existingItem) {
        const updatedQuantity = existingItem.quantity + quantity;

        if (!Number.isSafeInteger(updatedQuantity)) {
          throw createError("Product quantity is too large", 400);
        }

        await cartItemRepository.update(
          existingItem,
          { quantity: updatedQuantity },
          transaction
        );
      } else {
        await cartItemRepository.create(
          {
            cartId: cart.id,
            productId,
            quantity,
          },
          transaction
        );
      }
    }

    return {
      message: "Products added to cart successfully",
      productsAdded: quantityMap.size,
    };
  });
};

// Get the customer's cart.
const getCart = async (userId) => {
  await getOrCreateCart(userId);

  const cart = await cartRepository.findByUserIdWithItems(userId);

  const items = cart.items.map((item) => {
    const product = item.product;
    const available = product && product.isActive;

    const unitPrice = available ? Number(product.price) : 0;

    return {
      id: item.id,
      productId: item.productId,
      name: product?.name ?? null,
      sku: product?.sku ?? null,
      imageUrl: product?.imageUrl ?? null,
      quantity: item.quantity,
      unitPrice,
      subtotal: unitPrice * item.quantity,
      available,
    };
  });

  const totalItems = items.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const totalAmount = items.reduce(
    (total, item) => total + item.subtotal,
    0
  );

  return {
    cartId: cart.id,
    items,
    totalItems,
    totalAmount: Number(totalAmount.toFixed(2)),
  };
};

// Update a cart item's quantity.
const updateItem = async (userId, itemId, quantity) => {
  return sequelize.transaction(async (transaction) => {
    // Lock the customer's cart first.
    const cart = await cartRepository.findByUserId(
      userId,
      transaction
    );

    if (!cart) {
      throw createError("Cart not found", 404);
    }

    const cartItem = await cartItemRepository.findByIdAndCartId(
      itemId,
      cart.id,
      transaction
    );

    if (!cartItem) {
      throw createError("Cart item not found", 404);
    }

    await cartItemRepository.update(
      cartItem,
      { quantity },
      transaction
    );

    return {
      message: "Cart item quantity updated successfully",
    };
  });
};

// Remove selected items from the cart.
const removeItem = async (userId, itemIds) => {
  return sequelize.transaction(async (transaction) => {
    const cart = await cartRepository.findByUserId(
      userId,
      transaction
    );

    if (!cart) {
      throw createError("Cart not found", 404);
    }

    const uniqueItemIds = [...new Set(itemIds.map(String))];

    const cartItems = await cartItemRepository.findByIdsAndCartId(
      uniqueItemIds,
      cart.id,
      transaction
    );

    if (cartItems.length !== uniqueItemIds.length) {
      throw createError(
        "One or more cart items were not found",
        404
      );
    }

    await cartItemRepository.removeByIdsAndCartId(
      uniqueItemIds,
      cart.id,
      transaction
    );

    return {
      message: "Cart items removed successfully",
      itemsRemoved: uniqueItemIds.length,
    };
  });
};

// Remove all items from the cart.
const clearCart = async (userId) => {
  return sequelize.transaction(async (transaction) => {
    const cart = await cartRepository.findByUserId(
      userId,
      transaction
    );

    if (!cart) {
      return {
        message: "Cart is already empty",
      };
    }

    await cartItemRepository.clearByCartId(
      cart.id,
      transaction
    );

    return {
      message: "Cart cleared successfully",
    };
  });
};

// Get cart items for checkout.
// When a transaction is provided, lock the cart row first.
const getCartForCheckout = async (userId, transaction = null) => {
  const cart = await cartRepository.findByUserId(
    userId,
    transaction
  );

  if (!cart) {
    throw createError("Your cart is empty", 400);
  }

  const cartWithItems = await cartRepository.findByUserIdWithItems(
    userId,
    transaction
  );

  if (!cartWithItems || cartWithItems.items.length === 0) {
    throw createError("Your cart is empty", 400);
  }

  return cartWithItems;
};

// Clear cart items after a successful cart checkout.
// This does not delete the cart itself.
const clearCartItems = async (userId, transaction = null) => {
  const cart = await cartRepository.findByUserId(
    userId,
    transaction
  );

  if (!cart) {
    throw createError("Cart not found", 404);
  }

  await cartItemRepository.clearByCartId(
    cart.id,
    transaction
  );
};

export default {
  addItem,
  getCart,
  updateItem,
  removeItem,
  clearCart,
  getCartForCheckout,
  clearCartItems,
};
