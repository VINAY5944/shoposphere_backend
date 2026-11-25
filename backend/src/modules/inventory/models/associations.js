
import Inventory from "./Inventory.js";
import Product from "../../products/models/Product.js";

// A product has one inventory record.
Product.hasOne(Inventory, {
  foreignKey: "productId",
  as: "inventory",
});

// An inventory record belongs to one product.
Inventory.belongsTo(Product, {
  foreignKey: "productId",
  as: "product",
});

export { Inventory };
