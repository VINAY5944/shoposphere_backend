
import { z } from "zod";

// Product IDs are BIGINT values in PostgreSQL.
// Accept strings to avoid JavaScript precision issues.
const productIdSchema = z
  .string()
  .regex(/^[1-9]\d*$/, "Invalid product ID")
  .or(
    z.number()
      .int()
      .positive()
      .safe()
      .transform(String)
  );

const checkoutItemSchema = z.object({
  productId: productIdSchema,
  quantity: z.number().int().positive().max(10000),
});

const paymentPasswordSchema = z
  .string()
  .min(1, "Payment password is required")
  .max(100, "Payment password is too long");

const cartItemIdSchema = z
  .string()
  .regex(/^[1-9]\d*$/, "Invalid cart item ID")
  .refine(
    (value) => BigInt(value) <= 9223372036854775807n,
    "Cart item ID exceeds the maximum allowed value"
  );

// Buy Now validation.
export const checkoutNowSchema = z.object({
  body: z.object({
    items: z
      .array(checkoutItemSchema)
      .min(1, "At least one product is required")
      .max(100, "Maximum 100 products are allowed"),

    paymentPassword: paymentPasswordSchema,
  }),
});

// Cart Checkout validation.
export const checkoutCartSchema = z.object({
  body: z.object({
    cartItemIds: z
      .array(cartItemIdSchema)
      .min(1, "Select at least one cart item")
      .max(100, "You can check out at most 100 cart items at once")
      .refine(
        (ids) => new Set(ids).size === ids.length,
        "Cart item IDs must be unique"
      ),
    paymentPassword: paymentPasswordSchema,
  }),
});
