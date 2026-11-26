
import categoryRepository from "../repositories/category.repository.js";
import createError from "../../../shared/utils/error.js";
// Convert a name into a URL-friendly slug.
const generateSlug = (value) => {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

// Create an error with an HTTP status code.

// Encode the last category ID into a Base64 cursor.
const encodeCursor = (id) => {
  return Buffer.from(String(id)).toString("base64");
};

// Decode and validate a pagination cursor.
const decodeCursor = (cursor) => {
  try {
    const decoded = Buffer.from(cursor, "base64").toString("utf8");

    // Only allow positive integer IDs.
    if (!/^[1-9]\d*$/.test(decoded)) {
      throw new Error("Invalid cursor");
    }

    // Ensure the cursor is in canonical Base64 format.
    if (encodeCursor(decoded) !== cursor) {
      throw new Error("Invalid cursor");
    }

    return decoded;
  } catch {
    throw createError("Invalid pagination cursor", 400);
  }
};

// Check whether a slug is already being used.
const checkSlugAvailability = async (slug, currentCategoryId = null) => {
  const existingCategory = await categoryRepository.findBySlug(slug);

  if (
    existingCategory &&
    String(existingCategory.id) !== String(currentCategoryId)
  ) {
    throw createError("Category slug already exists", 409);
  }
};

// Validate the parent category and prevent circular relationships.
const validateParentCategory = async (
  parentId,
  currentCategoryId = null
) => {
  if (parentId === null || parentId === undefined) {
    return;
  }

  let currentParentId = String(parentId);
  const visited = new Set();

  while (currentParentId) {
    // Prevent a category from becoming its own parent or descendant.
    if (currentParentId === String(currentCategoryId)) {
      throw createError(
        "A category cannot be its own parent or descendant",
        400
      );
    }

    // Protect against an already existing circular hierarchy.
    if (visited.has(currentParentId)) {
      throw createError("Invalid circular category hierarchy", 400);
    }

    visited.add(currentParentId);

    const parent = await categoryRepository.findById(currentParentId);

    if (!parent) {
      throw createError("Parent category not found", 404);
    }

    if (!parent.isActive) {
      throw createError("Parent category is inactive", 400);
    }

    currentParentId = parent.parentId
      ? String(parent.parentId)
      : null;
  }
};

// CREATE CATEGORY
const createCategory = async ({
  name,
  slug,
  description,
  parentId = null,
}) => {
  const normalizedSlug = generateSlug(slug || name);

  if (!normalizedSlug) {
    throw createError("A valid category slug is required", 400);
  }

  await checkSlugAvailability(normalizedSlug);

  await validateParentCategory(parentId);

  const category = await categoryRepository.create({
    name: name.trim(),
    slug: normalizedSlug,
    description: description || null,
    parentId,
  });

  return category;
};

// GET CATEGORY BY ID
const getCategoryById = async (categoryId) => {
  const category = await categoryRepository.findById(categoryId);

  if (!category) {
    throw createError("Category not found", 404);
  }

  return category;
};

// UPDATE CATEGORY
const updateCategory = async (categoryId, updateData) => {
  const category = await categoryRepository.findById(categoryId);

  if (!category) {
    throw createError("Category not found", 404);
  }

  const data = {};

  if (updateData.name !== undefined) {
    data.name = updateData.name.trim();
  }

  if (updateData.description !== undefined) {
    data.description = updateData.description;
  }

  if (updateData.slug !== undefined) {
    const normalizedSlug = generateSlug(updateData.slug);

    if (!normalizedSlug) {
      throw createError("A valid category slug is required", 400);
    }

    await checkSlugAvailability(normalizedSlug, category.id);

    data.slug = normalizedSlug;
  }

  if (updateData.parentId !== undefined) {
    await validateParentCategory(updateData.parentId, category.id);

    data.parentId = updateData.parentId;
  }

  if (Object.keys(data).length === 0) {
    throw createError("No fields provided for update", 400);
  }

  const updatedCategory = await categoryRepository.update(category, data);

  return updatedCategory;
};

// LIST CATEGORIES WITH CURSOR PAGINATION
const listCategories = async ({
  limit = 10,
  cursor,
  isActive,
  search,
}) => {
  const pageSize = Number(limit);

  if (
    !Number.isInteger(pageSize) ||
    pageSize < 1 ||
    pageSize > 100
  ) {
    throw createError("Limit must be between 1 and 100", 400);
  }

  // Decode the cursor received from the client.
  const decodedCursor = cursor ? decodeCursor(cursor) : null;

  const normalizedSearch = search?.trim();

  // Fetch one extra record to determine whether another page exists.
  const categories = await categoryRepository.findAllPaginated({
    limit: pageSize,
    cursor: decodedCursor,
    isActive,
    search: normalizedSearch || undefined,
  });

  const hasNextPage = categories.length > pageSize;

  if (hasNextPage) {
    categories.pop();
  }

  // Generate the next cursor from the last returned category.
  const nextCursor =
    hasNextPage && categories.length > 0
      ? encodeCursor(categories[categories.length - 1].id)
      : null;

  return {
    data: categories,
    pagination: {
      limit: pageSize,
      hasNextPage,
      nextCursor,
    },
  };
};

// SHARED CATEGORY LISTING: ONLY ACTIVE CATEGORIES
const listActiveCategories = async (query) => {
  return listCategories({
    ...query,
    isActive: true,
  });
};

export default {
  createCategory,
  getCategoryById,
  updateCategory,
  listCategories,
  listActiveCategories,
};
