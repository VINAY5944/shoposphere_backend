
import User from "../../users/models/User.js";
import Product from "../../products/models/Product.js";

import Order from "./Order.js";
import OrderItem from "./OrderItem.js";

// User and Order
User.hasMany(Order, {
  foreignKey: "userId",
  as: "orders",
});

Order.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

// Order and OrderItem
Order.hasMany(OrderItem, {
  foreignKey: "orderId",
  as: "items",
});

OrderItem.belongsTo(Order, {
  foreignKey: "orderId",
  as: "order",
});

// Product and OrderItem
Product.hasMany(OrderItem, {
  foreignKey: "productId",
  as: "orderItems",
});

OrderItem.belongsTo(Product, {
  foreignKey: "productId",
  as: "product",
});

export { Order, OrderItem };
