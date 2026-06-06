import bcrypt from "bcrypt";

const BCRYPT_ROUNDS = 12; // Computational cost factor for password hashing

// Admin credentials from environment variables (required, no defaults)
export const DEFAULT_ADMIN_EMAIL = process.env.ADMIN_EMAIL;
export const DEFAULT_ADMIN_NAME = process.env.ADMIN_NAME;
export const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

// Validate that admin credentials are set
if (!DEFAULT_ADMIN_EMAIL || !DEFAULT_ADMIN_PASSWORD) {
  throw new Error(
    "CRITICAL: Admin credentials not configured. Set ADMIN_EMAIL and ADMIN_PASSWORD in environment variables."
  );
}

// Hash the default admin password (runs once at startup)
let DEFAULT_ADMIN_PASSWORD_HASH: string;

async function initializePasswordHash() {
  DEFAULT_ADMIN_PASSWORD_HASH = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD!, BCRYPT_ROUNDS);
}

// Initialize password hash immediately
initializePasswordHash().catch((error) => {
  console.error("Failed to initialize password hash:", error);
  process.exit(1);
});

// Async password hashing with bcrypt
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

// Constant-time password comparison
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export { DEFAULT_ADMIN_PASSWORD_HASH };
