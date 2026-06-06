import { createHash } from "node:crypto";

// Admin credentials from environment variables
// Set ADMIN_EMAIL and ADMIN_PASSWORD in your .env file to override defaults
export const DEFAULT_ADMIN_EMAIL = process.env.ADMIN_EMAIL || "charan@webomindapps.com";
export const DEFAULT_ADMIN_NAME = process.env.ADMIN_NAME || "Charan";
export const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Charan@webomindapps3";

export function hashPassword(password: string) {
  return createHash("sha256").update(password).digest("hex");
}

export const DEFAULT_ADMIN_PASSWORD_HASH = hashPassword(DEFAULT_ADMIN_PASSWORD);
