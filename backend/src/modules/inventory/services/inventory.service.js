
import sequelize from "../../../config/database.js";

import inventoryRepository from "../repositories/inventory.repository.js";
import inventoryMovementRepository from "../repositories/inventory-movement.repository.js";
import productService from "../../products/services/product.service.js";
import {
  decodeCursor,
  encodeCursor,
  getCursorMeta,
  getCursorPagination,
} from "../../../shared/utils/cursorPagination.js";

import createError from "../../../shared/utils/error.js";
const decodeHistoryCursor = (cursor) => {
  if (!cursor) {
    return null;
  }

  const payload = decodeCursor(cursor);

  if (
    Object.keys(payload).length !== 2 ||
    typeof payload.createdAt !== "string" ||
    typeof payload.id !== "string" ||
    !/^[1-9]\d{0,18}$/.test(payload.id) ||
    BigInt(payload.id) > 9223372036854775807n
  ) {
    throw createError("Invalid pagination cursor");
  }

  const createdAt = new Date(payload.createdAt);

  if (
    Number.isNaN(createdAt.getTime()) ||
    createdAt.toISOString() !== payload.createdAt ||
    encodeCursor(payload) !== cursor
  ) {
    throw createError("Invalid pagination cursor");
  }

  return {
    createdAt,
    id: payload.id,
  };
};

// Get stock for one product.
const getInventoryByProductId = async (productId) => {
  const inventory = await inventoryRepository.findByProductId(
    productId
  );

  if (!inventory) {
    throw createError("Inventory record not found", 404);
  }

  return inventory;
};

// Get all inventory records.
const getAllInventory = async () => {
  return inventoryRepository.findAllWithProducts();
};

const getHistory = async (productId, query = {}) => {
  const inventory = await inventoryRepository.findByProductId(productId);

  if (!inventory) {
    throw createError("Inventory record not found", 404);
  }

  const { limit, cursor: rawCursor } = getCursorPagination(query);
  const cursor = decodeHistoryCursor(rawCursor);
  const movements = await inventoryMovementRepository.findByProductId({
    productId,
    limit,
    cursor,
  });
  const hasNextPage = movements.length > limit;

  if (hasNextPage) {
    movements.pop();
  }

  const lastMovement = movements[movements.length - 1];
  const nextCursor =
    hasNextPage && lastMovement
      ? encodeCursor({
          createdAt: new Date(lastMovement.createdAt).toISOString(),
          id: String(lastMovement.id),
        })
      : null;

  return {
    data: movements,
    pagination: getCursorMeta({
      limit,
      hasNextPage,
      nextCursor,
    }),
  };
};

// Add stock to an existing inventory record.
const restock = async (productId, quantity) => {
  return sequelize.transaction(async (transaction) => {
    // Lock the inventory row.
    const inventory =
      await inventoryRepository.findByProductIdForUpdate(
        productId,
        transaction
      );

    if (!inventory) {
      throw createError("Inventory record not found", 404);
    }

    // Ensure the product still exists and is active.
    await productService.getProductById(productId);

    const previousQuantity = inventory.quantity;
    const newQuantity = inventory.quantity + quantity;

    if (!Number.isSafeInteger(newQuantity) || newQuantity > 2147483647) {
      throw createError("Stock quantity is too large", 400);
    }

    await inventoryRepository.updateQuantity(
      inventory,
      newQuantity,
      transaction
    );

    await inventoryMovementRepository.create(
      {
        productId,
        type: "RESTOCK",
        quantityChange: quantity,
        previousQuantity,
        newQuantity,
        reference: null,
        createdAt: new Date(),
      },
      transaction
    );

    return {
      productId,
      previousQuantity,
      addedQuantity: quantity,
      availableQuantity: newQuantity,
    };
  });
};

// Decrease stock while holding the inventory row lock in the order transaction.
const decreaseStock = async (productId, quantity, orderNumber, transaction) => {
  if (!transaction) {
    throw new Error("A transaction is required to decrease inventory");
  }

  const inventory =
    await inventoryRepository.findByProductIdForUpdate(
      productId,
      transaction
    );

  if (!inventory) {
    throw createError("Inventory record not found", 404);
  }

  if (inventory.quantity < quantity) {
    throw createError(
      `Insufficient stock for product ${productId}`,
      409
    );
  }

  const previousQuantity = inventory.quantity;
  const newQuantity = previousQuantity - quantity;

  await inventoryRepository.updateQuantity(
    inventory,
    newQuantity,
    transaction
  );

  await inventoryMovementRepository.create(
    {
      productId,
      type: "ORDER",
      quantityChange: -quantity,
      previousQuantity,
      newQuantity,
      reference: orderNumber,
      createdAt: new Date(),
    },
    transaction
  );

  return inventory;
};

export default {
  getInventoryByProductId,
  getAllInventory,
  getHistory,
  restock,
  decreaseStock,
};
