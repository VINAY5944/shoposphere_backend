import { z } from "zod";

const orderIdSchema = z
  .string()
  .regex(/^[1-9]\d*$/, "Order ID must be a positive integer")
  .refine(
    (value) => BigInt(value) <= 9223372036854775807n,
    "Order ID exceeds the maximum allowed value"
  );

export const getOrderSchema = z.object({
  params: z.object({
    orderId: orderIdSchema,
  }),
});
