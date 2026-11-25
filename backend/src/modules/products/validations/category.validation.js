
import { z } from "zod";

const idSchema = z
  .string()
  .regex(/^[1-9]\d*$/, "ID must be a positive integer");

const nameSchema = z
  .string()
  .trim()
  .min(2, "Category name must contain at least 2 characters")
  .max(100, "Category name cannot exceed 100 characters");

const slugSchema = z
  .string()
  .trim()
  .min(1, "Slug cannot be empty")
  .max(120, "Slug cannot exceed 120 characters");

const descriptionSchema = z
  .string()
  .max(2000, "Description cannot exceed 2000 characters")
  .nullable();

// CREATE CATEGORY
export const createCategorySchema = z
  .object({
    name: nameSchema,
    slug: slugSchema.optional(),
    description: descriptionSchema.optional(),
    parentId: idSchema.nullable().optional(),
  })
  .strict();

// UPDATE CATEGORY
export const updateCategorySchema = z
  .object({
    name: nameSchema.optional(),
    slug: slugSchema.optional(),
    description: descriptionSchema.optional(),
    parentId: idSchema.nullable().optional(),
  })
  .strict()
  .refine(
    (data) => Object.keys(data).length > 0,
    "At least one field is required"
  );

// CATEGORY ID PARAMETER
export const categoryIdSchema = z.object({
  categoryId: idSchema,
});
