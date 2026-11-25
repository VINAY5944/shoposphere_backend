
import { z } from "zod";

const bigIntIdSchema = z
  .string()
  .regex(/^[1-9]\d*$/, "Product ID must be a positive integer")
  .refine(
    (value) => BigInt(value) <= 9223372036854775807n,
    "Product ID is too large"
  );

const quantitySchema = z
  .number()
  .int("Quantity must be an integer")
  .min(1, "Quantity must be at least 1")
  .max(2147483647, "Quantity is too large");

// GET /inventory/:productId
export const getInventorySchema = z.object({
  params: z.object({
    productId: bigIntIdSchema,
  }),
});

export const getInventoryHistorySchema = z.object({
  params: z.object({
    productId: bigIntIdSchema,
  }),
  query: z.object({
    limit: z.coerce.number().int().min(1).max(100).optional(),
    cursor: z.string().optional(),
  }),
});

// PATCH /inventory/:productId/restock
export const restockSchema = z.object({
  params: z.object({
    productId: bigIntIdSchema,
  }),
  body: z.object({
    quantity: quantitySchema,
  }),
});
