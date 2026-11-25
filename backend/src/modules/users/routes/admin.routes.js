import { Router } from "express";

import validate from "../../../middlewares/validate.middleware.js";
import adminController from "../controllers/admin.controller.js";
import {
  customerIdSchema,
  updateCustomerStatusSchema,
} from "../validations/user.validation.js";

const router = Router();

const validateCustomerId = (req, res, next) => {
  const result = customerIdSchema.safeParse(req.params.customerId);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: result.error.issues.map((issue) => ({
        field: "customerId",
        message: issue.message,
      })),
    });
  }

  next();
};

// This router is mounted after auth and ADMIN authorization in the parent router.
router.get("/dashboard", adminController.getDashboard);
router.get("/customers", adminController.listCustomers);
router.get(
  "/customers/:customerId",
  validateCustomerId,
  adminController.getCustomer
);
router.patch(
  "/customers/:customerId/status",
  validateCustomerId,
  validate(updateCustomerStatusSchema),
  adminController.updateCustomerStatus
);

export default router;