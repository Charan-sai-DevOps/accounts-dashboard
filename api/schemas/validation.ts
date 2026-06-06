import { z } from "zod";

/**
 * Authentication & Login Validation
 */
export const loginSchema = z.object({
  email: z
    .string("Email is required")
    .email("Invalid email address")
    .toLowerCase()
    .min(3, "Email must be at least 3 characters")
    .max(254, "Email exceeds maximum length"),
  password: z
    .string("Password is required")
    .min(1, "Password is required")
    .max(256, "Password exceeds maximum length"),
});

export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Password Change Validation
 */
export const passwordChangeSchema = z
  .object({
    currentPassword: z
      .string("Current password is required")
      .min(1, "Current password is required")
      .max(256, "Password exceeds maximum length"),
    newPassword: z
      .string("New password is required")
      .min(8, "New password must be at least 8 characters")
      .max(256, "New password exceeds maximum length"),
    confirmPassword: z
      .string("Password confirmation is required")
      .min(8, "Password must be at least 8 characters")
      .max(256, "Password exceeds maximum length"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different from current password",
    path: ["newPassword"],
  });

export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>;

/**
 * Two-Factor Authentication (2FA) Validation
 */
export const twoFASchema = z
  .object({
    action: z
      .enum(["send", "verify", "send-login-otp", "verify-login-otp", "disable"])
      .describe("The 2FA action to perform"),
    email: z
      .string("Email is required for 2FA actions")
      .email("Invalid email address")
      .toLowerCase()
      .optional(),
    code: z
      .string("Verification code")
      .regex(/^\d{6}$/, "Code must be exactly 6 digits")
      .optional(),
  })
  .refine(
    (data) => {
      // Email is required for send, verify, send-login-otp, verify-login-otp
      if (["send", "verify", "send-login-otp", "verify-login-otp"].includes(data.action)) {
        return !!data.email;
      }
      return true;
    },
    {
      message: "Email is required for this action",
      path: ["email"],
    }
  )
  .refine(
    (data) => {
      // Code is required for verify and verify-login-otp
      if (["verify", "verify-login-otp"].includes(data.action)) {
        return !!data.code;
      }
      return true;
    },
    {
      message: "Verification code is required for this action",
      path: ["code"],
    }
  );

export type TwoFAInput = z.infer<typeof twoFASchema>;

/**
 * User Creation/Update Validation
 */
export const userSchema = z.object({
  name: z
    .string("Name is required")
    .min(1, "Name is required")
    .max(100, "Name exceeds maximum length")
    .regex(/^[a-zA-Z\s'-]+$/, "Name contains invalid characters"),
  email: z
    .string("Email is required")
    .email("Invalid email address")
    .toLowerCase()
    .max(254, "Email exceeds maximum length"),
  role: z.enum(["Admin", "Member", "Viewer"]).default("Member"),
});

export type UserInput = z.infer<typeof userSchema>;

/**
 * Settings/Configuration Validation
 */
export const settingsSchema = z.object({
  appName: z
    .string("App name is required")
    .min(1, "App name is required")
    .max(100, "App name exceeds maximum length")
    .optional(),
  theme: z.enum(["light", "dark"]).optional(),
  language: z.enum(["en", "es", "fr", "de"]).optional(),
  timezone: z
    .string("Timezone must be valid")
    .regex(/^[A-Z][a-zA-Z0-9_\/]+$/, "Invalid timezone format")
    .optional(),
});

export type SettingsInput = z.infer<typeof settingsSchema>;

/**
 * Subscription Data Validation
 */
export const subscriptionSchema = z.object({
  name: z
    .string("Subscription name is required")
    .min(1, "Name is required")
    .max(200, "Name exceeds maximum length"),
  vendor: z
    .string("Vendor is required")
    .min(1, "Vendor is required")
    .max(100, "Vendor exceeds maximum length"),
  cost: z
    .number("Cost must be a valid number")
    .min(0, "Cost cannot be negative")
    .max(1000000, "Cost exceeds maximum allowed value"),
  currency: z
    .string("Currency is required")
    .length(3, "Currency code must be exactly 3 characters (ISO 4217)")
    .toUpperCase(),
  billingCycle: z.enum(["monthly", "quarterly", "semi-annual", "annual", "custom"]),
  renewalDate: z
    .string("Renewal date is required")
    .refine((date) => !isNaN(Date.parse(date)), "Invalid date format"),
  category: z
    .string("Category is required")
    .min(1, "Category is required")
    .max(50, "Category exceeds maximum length")
    .optional(),
  notes: z
    .string("Notes")
    .max(1000, "Notes exceed maximum length")
    .optional(),
  status: z.enum(["active", "inactive", "cancelled"]).default("active"),
});

export type SubscriptionInput = z.infer<typeof subscriptionSchema>;

/**
 * Validation error formatter
 * Converts Zod validation errors into user-friendly messages
 */
export function formatValidationError(error: z.ZodError): {
  message: string;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};

  error.errors.forEach((err) => {
    const path = err.path.join(".");
    errors[path] = err.message;
  });

  return {
    message: "Validation failed",
    errors,
  };
}

/**
 * Safe validation function
 * Returns null if validation fails, otherwise returns parsed data
 */
export function validateSafe<T>(schema: z.ZodSchema<T>, data: unknown): T | null {
  const result = schema.safeParse(data);
  return result.success ? result.data : null;
}
