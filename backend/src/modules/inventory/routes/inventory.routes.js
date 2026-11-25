
import { Router } from "express";

import inventoryController from "../controllers/inventory.controller.js";

import {
  getInventoryHistorySchema,
  getInventorySchema,
  restockSchema,
} from "../validations/inventory.validation.js";

import authenticate from "../../../middlewares/authenticate.middleware.js";
import authorize from "../../../middlewares/authorize.middleware.js";
import validate from "../../../middlewares/validate.middleware.js";

const router = Router();

// Only authenticated admins can manage inventory.
router.use(authenticate);
router.use(authorize("ADMIN"));

// GET /api/v1/admin/inventory
router.get(
  "/",
  inventoryController.getAll
);

// GET /api/v1/admin/inventory/:productId/history
router.get(
  "/:productId/history",
  validate(getInventoryHistorySchema),
  inventoryController.getHistory
);

// GET /api/v1/admin/inventory/:productId
router.get(
  "/:productId",
  validate(getInventorySchema),
  inventoryController.getOne
);

// PATCH /api/v1/admin/inventory/:productId/restock
router.patch(
  "/:productId/restock",
  validate(restockSchema),
  inventoryController.restock
);

export default router;
