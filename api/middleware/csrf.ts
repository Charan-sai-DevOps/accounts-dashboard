import { randomBytes } from 'crypto';

/**
 * CSRF token storage with expiration
 * Production: Use Redis or database instead of memory
 */
const csrfTokens = new Map<string, { token: string; expires: number }>();

const CSRF_TOKEN_EXPIRY = 3600000; // 1 hour in milliseconds

/**
 * Generate a cryptographically secure CSRF token
 * @returns Secure CSRF token (hex string)
 */
export function generateCsrfToken(): string {
  const token = randomBytes(32).toString('hex');
  csrfTokens.set(token, {
    token,
    expires: Date.now() + CSRF_TOKEN_EXPIRY,
  });

  // Cleanup old tokens every hour
  if (csrfTokens.size > 10000) {
    cleanupExpiredTokens();
  }

  return token;
}

/**
 * Verify CSRF token and invalidate it (one-time use)
 * @param token - Token to verify
 * @returns true if valid, false otherwise
 */
export function verifyCsrfToken(token: string | undefined): boolean {
  if (!token) {
    return false;
  }

  const stored = csrfTokens.get(token);

  if (!stored) {
    return false; // Token doesn't exist
  }

  if (stored.expires < Date.now()) {
    csrfTokens.delete(token); // Expired
    return false;
  }

  // Token is valid - delete it (one-time use)
  csrfTokens.delete(token);
  return true;
}

/**
 * Clean up expired tokens
 * Should be called periodically in production
 */
function cleanupExpiredTokens(): void {
  const now = Date.now();
  let count = 0;

  for (const [token, data] of csrfTokens.entries()) {
    if (data.expires < now) {
      csrfTokens.delete(token);
      count++;
    }
  }

  if (count > 0) {
    console.log(`[CSRF] Cleaned up ${count} expired tokens`);
  }
}

/**
 * CSRF protection middleware for API handlers
 * Call this in handlers that modify state (PUT, POST, DELETE)
 * @param req - Request object
 * @throws Error if CSRF token is invalid
 */
export function requireValidCsrfToken(req: any): void {
  if (!isStateChangingMethod(req.method)) {
    return; // No CSRF check needed for GET/HEAD/OPTIONS
  }

  const token = req.headers['x-csrf-token'] as string | undefined;

  if (!verifyCsrfToken(token)) {
    throw new Error('CSRF token invalid or expired');
  }
}

/**
 * Check if HTTP method changes server state
 * @param method - HTTP method
 * @returns true if method modifies state
 */
function isStateChangingMethod(method: string): boolean {
  return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase());
}

/**
 * Get CSRF token from request headers
 * @param req - Request object
 * @returns CSRF token or undefined
 */
export function getCsrfTokenFromRequest(req: any): string | undefined {
  return req.headers['x-csrf-token'] as string | undefined;
}

/**
 * Format CSRF token for response headers
 * @param token - Token to format
 * @returns Object with proper header
 */
export function csrfTokenToHeader(token: string) {
  return {
    'X-CSRF-Token': token,
  };
}

/**
 * Get all active CSRF tokens count (for monitoring)
 * @returns Number of active tokens
 */
export function getActiveTokenCount(): number {
  return csrfTokens.size;
}

/**
 * Manual token cleanup (call periodically in production)
 * @returns Number of tokens cleaned
 */
export function performTokenCleanup(): number {
  const before = csrfTokens.size;
  cleanupExpiredTokens();
  return before - csrfTokens.size;
}
