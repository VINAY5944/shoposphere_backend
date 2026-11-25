
import { Op } from "sequelize";

import Category from "../models/Category.js";

// IMPORTANT: Register Category self-associations.
import "../models/associations.js";

// Find category by primary key.
const findById = async (id, transaction = null) => {
  return Category.findByPk(id, {
    transaction,
  });
};

// Find category by slug.
const findBySlug = async (slug, transaction = null) => {
  return Category.findOne({
    where: { slug },
    transaction,
  });
};

// Find categories using cursor pagination and filters.
const findAllPaginated = async ({
  limit,
  cursor,
  isActive,
  search,
}) => {
  const where = {};

  // Cursor pagination: fetch IDs greater than the previous page's ID.
  if (cursor) {
    where.id = {
      [Op.gt]: cursor,
    };
  }

  // Filter active or inactive categories.
  if (isActive !== undefined) {
    where.isActive = isActive;
  }

  // Search categories by name.
  if (search) {
    where.name = {
      [Op.iLike]: `%${search}%`,
    };
  }

  const categories = await Category.findAll({
    where,

    // Load the parent category.
    include: [
      {
        model: Category,
        as: "parent",
        attributes: ["id", "name", "slug"],
      },
    ],

    order: [["id", "ASC"]],

    // Fetch one extra record to determine whether another page exists.
    limit: limit + 1,
  });

  return categories;
};

// Create a category.
const create = async (categoryData, transaction = null) => {
  return Category.create(categoryData, {
    transaction,
  });
};

// Update a category.
const update = async (category, categoryData, transaction = null) => {
  return category.update(categoryData, {
    transaction,
  });
};

// Find direct child categories.
const findChildren = async (parentId, transaction = null) => {
  return Category.findAll({
    where: { parentId },
    transaction,
  });
};

// Find a category with its direct children.
const findByIdWithChildren = async (id) => {
  return Category.findByPk(id, {
    include: [
      {
        model: Category,
        as: "children",
      },
    ],
  });
};

export default {
  findById,
  findBySlug,
  findAllPaginated,
  create,
  update,
  findChildren,
  findByIdWithChildren,
};
