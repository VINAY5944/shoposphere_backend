import { Router } from "express";

import authenticate from "../middlewares/authenticate.middleware.js";

import categoryController from "../modules/products/controllers/category.controller.js";

const router = Router();

// Verify JWT, but don't check the role.
router.use(authenticate);

// Both Admin and Customer can list categories.
router.get("/", categoryController.list);

export default router;