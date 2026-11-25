
import { Router } from "express";

import productController from "../controllers/product.controller.js";
import validate from "../../../middlewares/validate.middleware.js";

import {
  createProductSchema,
  updateProductSchema,
} from "../validations/product.validation.js";
import upload from "../../../middlewares/upload.middleware.js";
import validateImage from "../../../middlewares/validateImage.middleware.js";

const router = Router();

// Create product.
router.post(
  "/",
  upload.single("image"),
  validateImage,
  validate(createProductSchema),
  productController.create
);

router.patch(
  "/:productId",
  upload.single("image"),
  validateImage,
  validate(updateProductSchema),
  productController.update
);
// Soft delete product.
router.delete(
  "/:productId",
  productController.remove
);

export default router;
