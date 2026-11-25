import { Router } from "express";

import categoryController from "../controllers/category.controller.js";
import validate from "../../../middlewares/validate.middleware.js";

import {
  categoryIdSchema,
  createCategorySchema,
  updateCategorySchema,
} from "../validations/category.validation.js";

const router = Router();

const validateCategoryId = (req, res, next) => {
  const result = categoryIdSchema.safeParse(req.params);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
  }

  next();
};

// Create category
router.post(
  "/",
  validate(createCategorySchema),
  categoryController.create
);

// Get one category.
router.get(
  "/:categoryId",
  validateCategoryId,
  categoryController.getOne
);

// Update category
router.patch(
  "/:categoryId",
  validateCategoryId,
  validate(updateCategorySchema),
  categoryController.update
);

export default router;