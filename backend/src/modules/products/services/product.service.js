
import productRepository from "../repositories/product.repository.js";
import categoryRepository from "../repositories/category.repository.js";
import sequelize from "../../../config/database.js";

import inventoryRepository from "../../inventory/repositories/inventory.repository.js";
import {
  deleteUploadedFile,
} from "../../../utils/fileSystem.utils.js";

// Generate a URL-friendly slug.
const generateSlug = (value) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

// Create application errors.
const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

// Convert uploaded file information into a public URL.
const getImageUrl = (file) => {
  if (!file) return null;

  return `/uploads/products/${file.filename}`;
};

// Safely delete an uploaded image.
const safelyDeleteImage = async (imageUrl) => {
  if (!imageUrl) return;

  try {
    await deleteUploadedFile(imageUrl);
  } catch (error) {
    console.error("Image cleanup failed:", error.message);
  }
};

// Encode cursor.
const encodeCursor = (id) =>
  Buffer.from(String(id)).toString("base64");

// Decode cursor.
const decodeCursor = (cursor) => {
  try {
    const decoded = Buffer.from(cursor, "base64").toString("utf8");

    if (!/^[1-9]\d*$/.test(decoded)) {
      throw new Error("Invalid cursor");
    }

    if (encodeCursor(decoded) !== cursor) {
      throw new Error("Invalid cursor");
    }

    return decoded;
  } catch {
    throw createError("Invalid pagination cursor", 400);
  }
};

// Validate category.
const validateCategory = async (categoryId) => {
  const category = await categoryRepository.findById(categoryId);

  if (!category) {
    throw createError("Category not found", 404);
  }

  if (!category.isActive) {
    throw createError(
      "Cannot assign product to inactive category",
      400
    );
  }

  return category;
};

// Check slug uniqueness.
const checkSlugAvailability = async (
  slug,
  currentProductId = null
) => {
  const existingProduct = await productRepository.findBySlug(slug);

  if (
    existingProduct &&
    String(existingProduct.id) !== String(currentProductId)
  ) {
    throw createError("Product slug already exists", 409);
  }
};

// Check SKU uniqueness.
const checkSkuAvailability = async (
  sku,
  currentProductId = null
) => {
  const existingProduct = await productRepository.findBySku(sku);

  if (
    existingProduct &&
    String(existingProduct.id) !== String(currentProductId)
  ) {
    throw createError("Product SKU already exists", 409);
  }
};

// CREATE PRODUCT.

const createProduct = async ({
  categoryId,
  name,
  slug,
  sku,
  description,
  price,
  compareAtPrice,
  imageFile,
}) => {
  const imageUrl = getImageUrl(imageFile);

  try {
    await validateCategory(categoryId);

    const normalizedSlug = generateSlug(slug || name);

    if (!normalizedSlug) {
      throw createError("A valid product slug is required", 400);
    }

    const normalizedSku = sku.trim().toUpperCase();

    await checkSlugAvailability(normalizedSlug);
    await checkSkuAvailability(normalizedSku);

    if (
      compareAtPrice != null &&
      Number(compareAtPrice) <= Number(price)
    ) {
      throw createError(
        "Compare-at price must be greater than selling price",
        400
      );
    }

    // Create product and inventory atomically.
    const product = await sequelize.transaction(
      async (transaction) => {
        // 1. Create the product.
        const createdProduct = await productRepository.create(
          {
            categoryId,
            name: name.trim(),
            slug: normalizedSlug,
            sku: normalizedSku,
            description: description || null,
            price,
            compareAtPrice: compareAtPrice ?? null,
            imageUrl,
          },
          transaction
        );

        // 2. Create its inventory record.
        await inventoryRepository.create(
          {
            productId: createdProduct.id,
            quantity: 0,
          },
          transaction
        );

        return createdProduct;
      }
    );

    return product;
  } catch (error) {
    // Remove uploaded image if database creation fails.
    await safelyDeleteImage(imageUrl);

    throw error;
  }
};


// UPDATE PRODUCT.
const updateProduct = async (
  productId,
  updateData,
  imageFile = null
) => {
  const newImageUrl = getImageUrl(imageFile);
  const removeImage =
    updateData.removeImage === "true" || updateData.removeImage === true;

  try {
    const product = await productRepository.findById(productId);

    if (!product) {
      throw createError("Product not found", 404);
    }

    if (!product.isActive) {
      throw createError(
        "Cannot update an inactive product",
        400
      );
    }

    const data = {};

    if (updateData.categoryId !== undefined) {
      await validateCategory(updateData.categoryId);
      data.categoryId = updateData.categoryId;
    }

    if (updateData.name !== undefined) {
      data.name = updateData.name.trim();
    }

    if (updateData.slug !== undefined) {
      const normalizedSlug = generateSlug(updateData.slug);

      if (!normalizedSlug) {
        throw createError("A valid product slug is required", 400);
      }

      await checkSlugAvailability(normalizedSlug, product.id);

      data.slug = normalizedSlug;
    }

    if (updateData.sku !== undefined) {
      const normalizedSku = updateData.sku.trim().toUpperCase();

      await checkSkuAvailability(normalizedSku, product.id);

      data.sku = normalizedSku;
    }

    if (updateData.description !== undefined) {
      data.description = updateData.description;
    }

    if (updateData.price !== undefined) {
      data.price = updateData.price;
    }

    if (updateData.compareAtPrice !== undefined) {
      data.compareAtPrice = updateData.compareAtPrice;
    }

    // Use the new image if uploaded.
    if (imageFile) {
      data.imageUrl = newImageUrl;
    } else if (removeImage) {
      data.imageUrl = null;
    }

    if (Object.keys(data).length === 0) {
      throw createError("No fields provided for update", 400);
    }

    const finalPrice = Number(data.price ?? product.price);

    const finalCompareAtPrice =
      data.compareAtPrice !== undefined
        ? data.compareAtPrice
        : product.compareAtPrice;

    if (
      finalCompareAtPrice != null &&
      Number(finalCompareAtPrice) <= finalPrice
    ) {
      throw createError(
        "Compare-at price must be greater than selling price",
        400
      );
    }

    const oldImageUrl = product.imageUrl;

    const updatedProduct = await productRepository.update(
      product,
      data
    );

    // Delete old image only after DB update succeeds.
    if ((imageFile || removeImage) && oldImageUrl) {
      await safelyDeleteImage(oldImageUrl);
    }

    return updatedProduct;
  } catch (error) {
    // If update fails, remove the newly uploaded image.
    await safelyDeleteImage(newImageUrl);

    throw error;
  }
};

// SOFT DELETE PRODUCT.
const deleteProduct = async (productId) => {
  const product = await productRepository.findById(productId);

  if (!product) {
    throw createError("Product not found", 404);
  }

  if (!product.isActive) {
    throw createError("Product is already inactive", 400);
  }

  const oldImageUrl = product.imageUrl;

  await productRepository.softDelete(product);

  // Delete image after soft deletion succeeds.
  await safelyDeleteImage(oldImageUrl);

  return {
    message: "Product deleted successfully",
  };
};

// GET ONE ACTIVE PRODUCT.
const getProductById = async (productId) => {
  const product = await productRepository.findActiveById(productId);

  if (!product) {
    throw createError("Product not found", 404);
  }

  return product;
};

const getProductDetailsById = async (productId) => {
  const product = await getProductById(productId);
  const inventory = await inventoryRepository.findByProductId(
    productId
  );

  if (!inventory) {
    throw createError("Inventory record not found", 404);
  }

  return {
    ...product.toJSON(),
    stockQuantity: inventory.quantity,
  };
};

// GET ACTIVE PRODUCTS WITH CURSOR PAGINATION.
const listProducts = async ({
  limit = 10,
  cursor,
  search,
  categoryId,
}) => {
  const pageSize = Number(limit);

  if (
    !Number.isInteger(pageSize) ||
    pageSize < 1 ||
    pageSize > 100
  ) {
    throw createError("Limit must be between 1 and 100", 400);
  }

  const decodedCursor = cursor ? decodeCursor(cursor) : null;

  const normalizedSearch = search?.trim();

  const products = await productRepository.findAllPaginated({
    limit: pageSize,
    cursor: decodedCursor,
    search: normalizedSearch || undefined,
    categoryId,
  });

  const hasNextPage = products.length > pageSize;

  if (hasNextPage) {
    products.pop();
  }

  const nextCursor =
    hasNextPage && products.length > 0
      ? encodeCursor(products[products.length - 1].id)
      : null;

  return {
    data: products,
    pagination: {
      limit: pageSize,
      hasNextPage,
      nextCursor,
    },
  };
};

export default {
  createProduct,
  updateProduct,
  deleteProduct,
  getProductById,
  getProductDetailsById,
  listProducts,
};
