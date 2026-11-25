
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
    paymentPassword: paymentPasswordSchema,
  }),
});
