
import { z } from "zod";

// PostgreSQL BIGINT IDs are sent as strings in JSON.
const bigIntIdSchema = z
  .string()
  .regex(/^[1-9]\d*$/, "ID must be a positive integer")
  .refine(
    (value) => BigInt(value) <= 9223372036854775807n,
    "ID exceeds the maximum allowed value"
  );

const quantitySchema = z
  .number()
  .int("Quantity must be an integer")
  .min(1, "Quantity must be at least 1");

// POST /cart/items
export const addItemsSchema = z.object({
  body: z.object({
    items: z
      .array(
        z.object({
          productId: bigIntIdSchema,
          quantity: quantitySchema,
        })
      )
      .min(1, "At least one product is required")
      .max(100, "You can add at most 100 products at once"),
  }),
});

// PATCH /cart/items/:itemId
export const updateItemSchema = z.object({
  params: z.object({
    itemId: bigIntIdSchema,
  }),
  body: z.object({
    quantity: quantitySchema,
  }),
});

// DELETE /cart/items
export const removeItemsSchema = z.object({
  body: z.object({
    itemIds: z
      .array(bigIntIdSchema)
      .min(1, "At least one item ID is required")
      .max(100, "You can delete at most 100 items at once"),
  }),
});
