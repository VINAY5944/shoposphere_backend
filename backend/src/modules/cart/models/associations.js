
import Cart from "./Cart.js";
import CartItem from "./CartItem.js";

import User from "../../users/models/User.js";
import Product from "../../products/models/Product.js";

// A user has one cart.
User.hasOne(Cart, {
  foreignKey: "userId",
  as: "cart",
});

// A cart belongs to one user.
Cart.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

// A cart contains multiple items.
Cart.hasMany(CartItem, {
  foreignKey: "cartId",
  as: "items",
});

// A cart item belongs to one cart.
CartItem.belongsTo(Cart, {
  foreignKey: "cartId",
  as: "cart",
});

// A cart item references one product.
CartItem.belongsTo(Product, {
  foreignKey: "productId",
  as: "product",
});

// A product can appear in multiple carts.
Product.hasMany(CartItem, {
  foreignKey: "productId",
  as: "cartItems",
});

export { Cart, CartItem };
