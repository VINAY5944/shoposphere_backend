
import cartService from "../services/cart.service.js";

// POST /api/v1/cart/items
const addItems = async (req, res) => {
  const { items } = req.body;

  const result = await cartService.addItem(
    req.auth.userId,
    items
  );

  return res.status(200).json({
    success: true,
    ...result,
  });
};

// GET /api/v1/cart
const getCart = async (req, res) => {
  const cart = await cartService.getCart(req.auth.userId);

  return res.status(200).json({
    success: true,
    message: "Cart fetched successfully",
    data: cart,
  });
};

// PATCH /api/v1/cart/items/:itemId
const updateItem = async (req, res) => {
  const { itemId } = req.params;
  const { quantity } = req.body;

  const result = await cartService.updateItem(
    req.auth.userId,
    itemId,
    quantity
  );

  return res.status(200).json({
    success: true,
    ...result,
  });
};

// DELETE /api/v1/cart/items
const removeItems = async (req, res) => {
  const { itemIds } = req.body;

  const result = await cartService.removeItem(
    req.auth.userId,
    itemIds
  );

  return res.status(200).json({
    success: true,
    ...result,
  });
};

// DELETE /api/v1/cart
const clearCart = async (req, res) => {
  const result = await cartService.clearCart(req.auth.userId);

  return res.status(200).json({
    success: true,
    ...result,
  });
};

export default {
  addItems,
  getCart,
  updateItem,
  removeItems,
  clearCart,
};
