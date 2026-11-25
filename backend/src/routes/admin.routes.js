
import { Router } from "express";

import authenticate from "../middlewares/authenticate.middleware.js";
import authorize from "../middlewares/authorize.middleware.js";
import categoryRoutes from "../modules/products/routes/category.routes.js"
import productManagementRoutes from "../modules/products/routes/product.routes.js";
import inventoryRoutes from "../modules/inventory/routes/inventory.routes.js";
import dashboardRoutes from "../modules/users/routes/admin.routes.js";
import adminOrderRoutes from "../modules/orders/routes/admin-order.routes.js";
import adminNotificationRoutes from "../modules/notifications/routes/admin-notification.routes.js";
const router = Router();

// First verify JWT.
router.use(authenticate);

// Then verify ADMIN role.
router.use(authorize("ADMIN"));

router.use("/", dashboardRoutes);
router.use("/orders", adminOrderRoutes);
router.use("/notifications", adminNotificationRoutes);

// Category management
router.use("/categories", categoryRoutes);
// All routes below are now ADMIN-only.
router.use("/products", productManagementRoutes);
router.use("/inventory", inventoryRoutes);
export default router;
