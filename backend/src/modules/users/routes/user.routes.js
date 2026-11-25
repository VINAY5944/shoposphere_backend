import { Router } from "express";

import authenticate from "../../../middlewares/authenticate.middleware.js";
import validate from "../../../middlewares/validate.middleware.js";
import userController from "../controllers/user.controller.js";
import { registerUserSchema } from "../validations/user.validation.js";

const router = Router();

// Customer registration is public.
router.post(
  "/",
  validate(registerUserSchema),
  userController.register
);

// All routes below require authentication.
router.use(authenticate);

// GET logged-in user's profile
router.get("/me", userController.getMe);

export default router;