
import { z } from "zod";

// PostgreSQL BIGINT IDs are accepted as strings
// to avoid JavaScript number precision problems.
const idSchema = z
  .string()
  .regex(/^[1-9]\d*$/, "ID must be a positive integer");

// Product name.
const nameSchema = z
  .string()
  .trim()
  .min(2, "Product name must contain at least 2 characters")
  .max(150, "Product name cannot exceed 150 characters");

// Product slug.
const slugSchema = z
  .string()
  .trim()
  .min(1, "Slug cannot be empty")
  .max(180, "Slug cannot exceed 180 characters");

// SKU.
const skuSchema = z
  .string()
  .trim()
  .min(2, "SKU must contain at least 2 characters")
  .max(100, "SKU cannot exceed 100 characters");

// Product description.
const descriptionSchema = z
  .string()
  .max(10000, "Description cannot exceed 10000 characters")
  .nullable();

// Product price.
const priceSchema = z.coerce
  .number()
  .finite()
  .positive("Price must be greater than zero");

const compareAtPriceSchema = z.coerce
  .number()
  .finite()
  .positive("Compare-at price must be greater than zero")
  .nullable();

// CREATE PRODUCT
export const createProductSchema = z
  .object({
    categoryId: idSchema,
    name: nameSchema,
    slug: slugSchema.optional(),
    sku: skuSchema,
    description: descriptionSchema.optional(),
    price: priceSchema,
    compareAtPrice: compareAtPriceSchema.optional(),
  })
  .strict()
  .refine(
    (data) =>
      data.compareAtPrice == null ||
      data.compareAtPrice > data.price,
    {
      message: "Compare-at price must be greater than selling price",
      path: ["compareAtPrice"],
    }
  );

// UPDATE PRODUCT
export const updateProductSchema = z
  .object({
    categoryId: idSchema.optional(),
    name: nameSchema.optional(),
    slug: slugSchema.optional(),
    sku: skuSchema.optional(),
    description: descriptionSchema.optional(),
    price: priceSchema.optional(),
    compareAtPrice: compareAtPriceSchema.optional(),
    removeImage: z.union([z.literal("true"), z.literal(true)]).optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required for update",
  });

// PRODUCT ID PARAMETER
export const productIdSchema = z.object({
  productId: idSchema,
});
