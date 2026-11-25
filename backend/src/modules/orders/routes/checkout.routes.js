
import { Router } from "express";

import checkoutController from "../controllers/checkout.controller.js";

import authenticate from "../../../middlewares/authenticate.middleware.js";
import authorize from "../../../middlewares/authorize.middleware.js";
import validate from "../../../middlewares/validate.middleware.js";

import {
  checkoutNowSchema,
  checkoutCartSchema,
} from "../validations/checkout.validation.js";

const router = Router();

// All checkout endpoints require authentication.
router.use(authenticate);

// Only customers can place orders.
router.use(authorize("CUSTOMER"));

// Buy Now checkout.
router.post(
  "/buy-now",
  validate(checkoutNowSchema),
  checkoutController.checkoutNow
);

// Cart checkout.
router.post(
  "/cart",
  validate(checkoutCartSchema),
  checkoutController.checkoutCart
);

export default router;
