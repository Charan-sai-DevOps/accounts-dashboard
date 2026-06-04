import { createHash } from "node:crypto";

export const DEFAULT_ADMIN_EMAIL = "charan.sai@webomindapps.com";
export const DEFAULT_ADMIN_PASSWORD = "Charan@Webomindapps";

export function hashPassword(password: string) {
  return createHash("sha256").update(password).digest("hex");
}

export const DEFAULT_ADMIN_PASSWORD_HASH = hashPassword(DEFAULT_ADMIN_PASSWORD);
