
import { Router } from "express";

import authenticate from "../middlewares/authenticate.middleware.js";

import userController from "../modules/users/controllers/user.controller.js";

const router = Router();

// Verify JWT.
router.use(authenticate);

// Any authenticated user can read their own profile.
router.get("/me", userController.getMe);

export default router;
