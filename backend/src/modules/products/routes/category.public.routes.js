import { Router } from "express";
import categoryController from "../controllers/category.controller.js";

const router = Router();

// Public category listing
router.get("/", categoryController.list);

export default router;