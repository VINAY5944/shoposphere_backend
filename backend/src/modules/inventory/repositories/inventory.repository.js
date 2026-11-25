
import Inventory from "../models/Inventory.js";
import "../models/associations.js";

// Find inventory using product ID.
const findByProductId = async (productId, transaction = null) => {
  return Inventory.findOne({
    where: { productId },
    transaction,
  });
};

// Find inventory and lock its database row.
const findByProductIdForUpdate = async (
  productId,
  transaction
) => {
  return Inventory.findOne({
    where: { productId },
    transaction,
    lock: transaction.LOCK.UPDATE,
  });
};

// Create an inventory record.
const create = async (inventoryData, transaction = null) => {
  return Inventory.create(inventoryData, {
    transaction,
  });
};

// Update inventory quantity.
const updateQuantity = async (
  inventory,
  quantity,
  transaction = null
) => {
  return inventory.update(
    { quantity },
    { transaction }
  );
};

// Get inventory records with product details.
const findAllWithProducts = async () => {
  return Inventory.findAll({
    include: [
      {
        association: "product",
        attributes: ["id", "name", "sku", "isActive"],
      },
    ],
    order: [["id", "ASC"]],
  });
};

export default {
  findByProductId,
  findByProductIdForUpdate,
  create,
  updateQuantity,
  findAllWithProducts,
};
