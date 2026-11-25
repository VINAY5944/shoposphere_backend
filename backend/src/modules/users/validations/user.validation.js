
import { z } from "zod";

export const registerUserSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must contain at least 2 characters")
    .max(100, "Name cannot exceed 100 characters"),

  email: z
    .string()
    .trim()
    .email("Please provide a valid email")
    .transform((value) => value.toLowerCase()),

  password: z
    .string()
    .min(8, "Password must contain at least 8 characters")
    .refine(
      (value) => Buffer.byteLength(value, "utf8") <= 72,
      "Password cannot exceed 72 bytes"
    ),
});

export const customerIdSchema = z
    .string()
    .uuid("Customer ID must be a UUID");

export const updateCustomerStatusSchema = z
    .object({
      isActive: z.boolean(),
    })
    .strict();
