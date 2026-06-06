import { createHash } from "node:crypto";

// Admin credentials from environment variables (not hardcoded)
export const DEFAULT_ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@example.com";
export const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "ChangeMe@123";

export function hashPassword(password: string) {
  return createHash("sha256").update(password).digest("hex");
}

export const DEFAULT_ADMIN_PASSWORD_HASH = hashPassword(DEFAULT_ADMIN_PASSWORD);
