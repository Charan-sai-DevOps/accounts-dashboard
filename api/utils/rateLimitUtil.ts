import { firestore } from "../_firebaseAdmin.js";

const RATE_LIMIT_COLLECTION = "rate_limits";

interface RateLimitEntry {
  key: string;
  attempts: number;
  resetAt: string;
  action: string;
}

/**
 * Check if a request should be rate limited
 * Uses Firestore for persistence across serverless instances
 */
export async function checkRateLimit(
  key: string,
  action: string,
  maxAttempts: number,
  windowMinutes: number
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  const now = new Date();
  const docRef = firestore.collection(RATE_LIMIT_COLLECTION).doc(`${action}:${key}`);

  try {
    const doc = await docRef.get();
    const data = doc.data() as RateLimitEntry | undefined;

    // If no record exists, create one and allow the request
    if (!data) {
      const resetAt = new Date(now.getTime() + windowMinutes * 60 * 1000);
      await docRef.set({
        key,
        attempts: 1,
        resetAt: resetAt.toISOString(),
        action,
      });
      return {
        allowed: true,
        remaining: maxAttempts - 1,
        resetAt,
      };
    }

    // Check if the window has expired
    const resetAt = new Date(data.resetAt);
    if (now > resetAt) {
      // Window expired, reset counter
      const newResetAt = new Date(now.getTime() + windowMinutes * 60 * 1000);
      await docRef.set({
        key,
        attempts: 1,
        resetAt: newResetAt.toISOString(),
        action,
      });
      return {
        allowed: true,
        remaining: maxAttempts - 1,
        resetAt: newResetAt,
      };
    }

    // Window still active, check if limit exceeded
    const newAttempts = data.attempts + 1;

    if (newAttempts > maxAttempts) {
      // Limit exceeded, don't increment
      return {
        allowed: false,
        remaining: 0,
        resetAt,
      };
    }

    // Increment attempt counter
    await docRef.update({
      attempts: newAttempts,
    });

    return {
      allowed: true,
      remaining: maxAttempts - newAttempts,
      resetAt,
    };
  } catch (error) {
    console.error("Rate limit check error:", error);
    // On error, allow the request (fail open)
    return {
      allowed: true,
      remaining: maxAttempts,
      resetAt: new Date(now.getTime() + windowMinutes * 60 * 1000),
    };
  }
}

/**
 * Reset rate limit for a specific action/key combination
 * Useful for successful authentication
 */
export async function resetRateLimit(key: string, action: string): Promise<void> {
  try {
    const docRef = firestore
      .collection(RATE_LIMIT_COLLECTION)
      .doc(`${action}:${key}`);
    await docRef.delete();
  } catch (error) {
    console.error("Error resetting rate limit:", error);
  }
}

/**
 * Clean up old rate limit entries periodically
 */
export async function cleanupOldRateLimits(): Promise<void> {
  try {
    const now = new Date();
    const snapshot = await firestore
      .collection(RATE_LIMIT_COLLECTION)
      .where("resetAt", "<", now.toISOString())
      .limit(100)
      .get();

    if (snapshot.docs.length === 0) return;

    const batch = firestore.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();
    console.log(`[Rate Limit] Cleaned up ${snapshot.docs.length} old entries`);
  } catch (error) {
    console.error("Error cleaning up rate limits:", error);
  }
}
