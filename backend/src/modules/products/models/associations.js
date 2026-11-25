
import Category from "./Category.js";
import Product from "./Product.js";

// A category can belong to another category.
Category.belongsTo(Category, {
  foreignKey: "parentId",
  as: "parent",
});

// A category can have multiple child categories.
Category.hasMany(Category, {
  foreignKey: "parentId",
  as: "children",
});

// A product belongs to one category.
Product.belongsTo(Category, {
  foreignKey: "categoryId",
  as: "category",
});

// A category can contain multiple products.
Category.hasMany(Product, {
  foreignKey: "categoryId",
  as: "products",
});

export { Category, Product };
