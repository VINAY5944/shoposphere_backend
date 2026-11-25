
import { Router } from "express";

import authenticate from "../middlewares/authenticate.middleware.js";

import productController from "../modules/products/controllers/product.controller.js";

const router = Router();

// Both Admin and Customer must have a valid JWT.
router.use(authenticate);

// Get all active products.
router.get("/", productController.list);

// Get one active product.
router.get("/:productId", productController.getOne);

export default router;
