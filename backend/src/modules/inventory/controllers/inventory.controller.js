
import inventoryService from "../services/inventory.service.js";

// GET /api/v1/admin/inventory
const getAll = async (req, res) => {
  const inventory = await inventoryService.getAllInventory();

  return res.status(200).json({
    success: true,
    message: "Inventory fetched successfully",
    data: inventory,
  });
};

// GET /api/v1/admin/inventory/:productId
const getOne = async (req, res) => {
  const { productId } = req.params;

  const inventory =
    await inventoryService.getInventoryByProductId(productId);

  return res.status(200).json({
    success: true,
    message: "Inventory fetched successfully",
    data: inventory,
  });
};

// GET /api/v1/admin/inventory/:productId/history
const getHistory = async (req, res) => {
  const { productId } = req.params;
  const result = await inventoryService.getHistory(productId, req.query);

  return res.status(200).json({
    success: true,
    message: "Inventory history fetched successfully",
    ...result,
  });
};

// PATCH /api/v1/admin/inventory/:productId/restock
const restock = async (req, res) => {
  const { productId } = req.params;
  const { quantity } = req.body;

  const result = await inventoryService.restock(
    productId,
    quantity
  );

  return res.status(200).json({
    success: true,
    message: "Inventory restocked successfully",
    data: result,
  });
};

export default {
  getAll,
  getOne,
  getHistory,
  restock,
};
