import { z } from "zod";

// Customer contact validation schema
export const customerInfoSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, "Full name is required")
    .max(100, "Full name must be less than 100 characters")
    .regex(/^[a-zA-Z\s\-'.]+$/, "Full name can only contain letters, spaces, hyphens, apostrophes, and periods"),
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .max(255, "Email must be less than 255 characters")
    .email("Please enter a valid email address"),
  whatsappNumber: z
    .string()
    .trim()
    .min(1, "WhatsApp number is required")
    .max(20, "WhatsApp number must be less than 20 characters")
    .regex(/^[\d\s\+\-()]+$/, "WhatsApp number can only contain digits, spaces, +, -, and parentheses"),
});

// Order notes validation
export const orderNotesSchema = z
  .string()
  .trim()
  .max(1000, "Notes must be less than 1000 characters")
  .optional()
  .nullable();

// Custom request validation
export const customRequestSchema = z
  .string()
  .trim()
  .max(2000, "Custom request must be less than 2000 characters")
  .optional()
  .nullable();

// Admin response validation
export const adminResponseSchema = z
  .string()
  .trim()
  .max(2000, "Response must be less than 2000 characters")
  .optional()
  .nullable();

// Custom price validation
export const customPriceSchema = z
  .string()
  .optional()
  .refine(
    (val) => !val || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0),
    "Price must be a valid positive number"
  );

// Delivery time validation
export const deliveryTimeSchema = z
  .string()
  .trim()
  .max(100, "Delivery time must be less than 100 characters")
  .optional()
  .nullable();

// Chat message validation
export const chatMessageSchema = z.object({
  message: z
    .string()
    .trim()
    .max(5000, "Message must be less than 5000 characters")
    .optional()
    .nullable(),
  image_url: z
    .string()
    .url("Invalid image URL")
    .max(2048, "Image URL must be less than 2048 characters")
    .optional()
    .nullable(),
}).refine(
  (data) => data.message || data.image_url,
  "Either a message or image is required"
);

// Type exports
export type CustomerInfo = z.infer<typeof customerInfoSchema>;
export type ChatMessage = z.infer<typeof chatMessageSchema>;

// Validation result types
type ValidationSuccess<T> = { success: true; data: T };
type ValidationError = { success: false; error: string };
type ValidationResult<T> = ValidationSuccess<T> | ValidationError;

// Validation helper function with proper discriminated union
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): ValidationResult<T> {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error.errors[0]?.message || "Validation failed" };
}
