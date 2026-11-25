
import express from "express";
import cors from "cors";
import path from "node:path";

import publicRoutes from "./routes/public.routes.js";
import userRoutes from "./routes/user.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import categoryRoutes from "./routes/category.routes.js";

import cartRoutes from "./modules/cart/routes/cart.routes.js";
import checkoutRoutes from "./modules/orders/routes/checkout.routes.js";
import orderRoutes from "./modules/orders/routes/orders.routes.js";
import productRoutes from "./routes/product.routes.js";
import errorHandler from "./middlewares/error.middleware.js";

const app = express();

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

app.use(
  "/uploads",
  express.static(path.resolve(process.cwd(), "uploads"))
);

app.get("/api/v1/health", (req, res) => {
  res.json({
    success: true,
    message: "ShopSphere API is running",
  });
});

app.use("/api/v1", publicRoutes);
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/categories", categoryRoutes);
app.use("/api/v1/cart", cartRoutes);
app.use("/api/v1/orders", orderRoutes);
app.use("/api/v1/product", productRoutes);
app.use("/api/v1/products", productRoutes);
// Checkout routes.
app.use("/api/v1/checkout", checkoutRoutes);

// Error handler must remain last.
app.use(errorHandler);

export default app;
