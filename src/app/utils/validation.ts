import { z } from 'zod';

/**
 * User management validation schemas
 */

export const userSchema = z.object({
  id: z.string().optional(),
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters')
    .trim(),
  email: z.string()
    .email('Invalid email format')
    .max(254, 'Email must be less than 254 characters')
    .toLowerCase()
    .trim(),
  role: z.enum(['Admin', 'Member', 'Viewer'], {
    errorMap: () => ({ message: 'Role must be Admin, Member, or Viewer' }),
  }),
  lastLogin: z.string().optional(),
  avatar: z.string().optional(),
});

export const userArraySchema = userSchema.array()
  .min(1, 'At least one user is required')
  .max(100, 'Cannot have more than 100 users');

export type User = z.infer<typeof userSchema>;
export type UserArray = z.infer<typeof userArraySchema>;

/**
 * Notification validation schemas
 */

export const notificationSchema = z.object({
  id: z.string().optional(),
  email: z.string()
    .email('Invalid email format')
    .toLowerCase()
    .trim(),
  platform: z.string()
    .min(1, 'Platform is required')
    .max(100, 'Platform must be less than 100 characters'),
  reminder: z.string()
    .min(1, 'Reminder is required')
    .max(50, 'Reminder must be less than 50 characters'),
});

export type Notification = z.infer<typeof notificationSchema>;

/**
 * Settings validation schemas
 */

export const settingsUpdateSchema = z.object({
  appUsers: userArraySchema.optional(),
  notificationSettings: z.object({
    sevenDay: z.boolean(),
    threeDayBefore: z.boolean(),
    dayOf: z.boolean(),
    monthlySummary: z.boolean(),
    newSub: z.boolean(),
  }).optional(),
});

export type SettingsUpdate = z.infer<typeof settingsUpdateSchema>;

/**
 * Validate and sanitize user input
 * Throws ZodError if validation fails
 *
 * @param data - Data to validate
 * @param schema - Zod schema to use
 * @returns Validated data
 * @throws ZodError if validation fails
 */
export function validateData<T>(data: unknown, schema: z.ZodSchema<T>): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.issues
        .map(issue => `${issue.path.join('.')}: ${issue.message}`)
        .join('\n');
      throw new Error(`Validation error:\n${messages}`);
    }
    throw error;
  }
}

/**
 * Safely parse and validate data without throwing
 *
 * @param data - Data to validate
 * @param schema - Zod schema to use
 * @returns { success: true, data } or { success: false, errors, error }
 */
export function safeParse<T>(data: unknown, schema: z.ZodSchema<T>) {
  const result = schema.safeParse(data);

  if (result.success) {
    return {
      success: true as const,
      data: result.data,
      errors: {},
    };
  }

  const errors = result.error.issues.reduce(
    (acc, issue) => {
      const path = issue.path.join('.');
      acc[path] = issue.message;
      return acc;
    },
    {} as Record<string, string>
  );

  return {
    success: false as const,
    data: null,
    errors,
    error: new Error(`Validation failed: ${Object.values(errors).join(', ')}`),
  };
}

/**
 * Format validation errors for display in UI
 *
 * @param errors - Validation errors object
 * @returns Formatted error message
 */
export function formatValidationErrors(errors: Record<string, string>): string {
  return Object.entries(errors)
    .map(([field, message]) => `${field}: ${message}`)
    .join('\n');
}
