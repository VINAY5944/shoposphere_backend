
import { Router } from "express";

import authController from "../controllers/auth.controller.js";
import validate from "../../../middlewares/validate.middleware.js";
import { loginSchema } from "../validations/auth.validation.js";

const router = Router();

// Admin login
router.post(
  "/admin/login",
  validate(loginSchema),
  authController.adminLogin
);

// Customer login
router.post(
  "/user/login",
  validate(loginSchema),
  authController.userLogin
);

export default router;
