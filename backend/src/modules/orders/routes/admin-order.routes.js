import { Router } from "express";

import validate from "../../../middlewares/validate.middleware.js";
import adminOrderController from "../controllers/admin-order.controller.js";
import { getOrderSchema } from "../validations/order.validation.js";

const router = Router();

router.get("/", adminOrderController.list);
router.get(
  "/:orderId",
  validate(getOrderSchema),
  adminOrderController.getOne
);

export default router;
