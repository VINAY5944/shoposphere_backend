
import { Router } from "express";

import cartController from "../controllers/cart.controller.js";

import {
  addItemsSchema,
  updateItemSchema,
  removeItemsSchema,
} from "../validations/cart.validation.js";

import authenticate from "../../../middlewares/authenticate.middleware.js";
import authorize from "../../../middlewares/authorize.middleware.js";
import validate from "../../../middlewares/validate.middleware.js";

const router = Router();

// All cart endpoints require authentication and CUSTOMER role.
router.use(authenticate);
router.use(authorize("CUSTOMER"));

// Add multiple products.
router.post(
  "/items",
  validate(addItemsSchema),
  cartController.addItems
);

// Get cart.
router.get(
  "/",
  cartController.getCart
);

// Update one item's quantity.
router.patch(
  "/items/:itemId",
  validate(updateItemSchema),
  cartController.updateItem
);

// Delete multiple items.
router.delete(
  "/items",
  validate(removeItemsSchema),
  cartController.removeItems
);

// Clear entire cart.
router.delete(
  "/",
  cartController.clearCart
);

export default router;
