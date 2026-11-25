import { Router } from "express";

import orderController from "../controllers/order.controller.js";
import authenticate from "../../../middlewares/authenticate.middleware.js";
import authorize from "../../../middlewares/authorize.middleware.js";
import validate from "../../../middlewares/validate.middleware.js";
import { getOrderSchema } from "../validations/order.validation.js";

const router = Router();

router.use(authenticate);
router.use(authorize("CUSTOMER"));

router.get("/", orderController.listMine);
router.get("/:orderId", validate(getOrderSchema), orderController.getMine);

export default router;
