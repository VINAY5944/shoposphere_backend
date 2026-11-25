
import { Op } from "sequelize";

import Product from "../models/Product.js";

// Register Product and Category associations.
import "../models/associations.js";

// Find a product by ID.
const findById = async (id, transaction = null) => {
  return Product.findByPk(id, {
    transaction,
  });
};
const softDelete = async (product, transaction = null) => {
  return product.update(
    {
      isActive: false,
      imageUrl: null,
    },
    { transaction }
  );
};
// Find a product by slug.
const findBySlug = async (slug, transaction = null) => {
  return Product.findOne({
    where: { slug },
    transaction,
  });
};

// Find a product by SKU.
const findBySku = async (sku, transaction = null) => {
  return Product.findOne({
    where: { sku },
    transaction,
  });
};

// Create a product.
const create = async (productData, transaction = null) => {
  return Product.create(productData, {
    transaction,
  });
};

// Update a product.
const update = async (product, productData, transaction = null) => {
  return product.update(productData, {
    transaction,
  });
};

// Soft delete a product.
// const softDelete = async (product, transaction = null) => {
//   return product.update(
//     {
//       isActive: false,
//     },
//     {
//       transaction,
//     }
//   );
// };

// Find one active product with its category.
const findActiveById = async (id) => {
  return Product.findOne({
    where: {
      id,
      isActive: true,
    },
    include: [
      {
        association: "category",
        attributes: ["id", "name", "slug"],
      },
    ],
  });
};

// Cursor-paginated product listing.
const findAllPaginated = async ({
  limit,
  cursor,
  search,
  categoryId,
}) => {
  const where = {
    isActive: true,
  };

  // Cursor pagination.
  if (cursor) {
    where.id = {
      [Op.gt]: cursor,
    };
  }

  // Search by product name.
  if (search) {
    where.name = {
      [Op.iLike]: `%${search}%`,
    };
  }

  // Filter by category.
  if (categoryId) {
    where.categoryId = categoryId;
  }

  const products = await Product.findAll({
    where,
    include: [
      {
        association: "category",
        attributes: ["id", "name", "slug"],
      },
    ],
    order: [["id", "ASC"]],
    limit: limit + 1,
  });

  return products;
};

export default {
  findById,
  findBySlug,
  findBySku,
  create,
  update,
  softDelete,
  findActiveById,
  findAllPaginated,
};
