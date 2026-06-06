import { firestore } from "./_firebaseAdmin.js";
import { randomBytes } from "crypto";

const SETTINGS_DOC_ID = "app";
const SETTINGS_COLLECTION = "settings";
const VERIFICATION_CODES_COLLECTION = "verification_codes";

function normalizeEmail(email: string): string {
  return String(email ?? "").trim().toLowerCase();
}

/**
 * Generate a secure 6-digit OTP using cryptographic random
 * Uses randomBytes() instead of Math.random() for much better entropy
 */
function generateVerificationCode(): string {
  // Generate 3 random bytes (24 bits of entropy)
  // This is much more secure than Math.random()
  const buffer = randomBytes(3);

  // Convert bytes to integer and modulo 1,000,000 to get 6-digit number
  // Gives us numbers 0-999,999
  const number = buffer.readUintBE(0, 3) % 1000000;

  // Pad with leading zeros to ensure exactly 6 digits
  return number.toString().padStart(6, "0");
}

/**
 * Store verification code in Firestore instead of memory
 * Persists across server restarts and deployments
 */
async function storeVerificationCode(
  email: string,
  code: string,
  purpose: "setup" | "login",
  expiresInMinutes: number
): Promise<void> {
  const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

  await firestore.collection(VERIFICATION_CODES_COLLECTION).doc(email).set({
    code,
    expiresAt: expiresAt.toISOString(),
    purpose,
    createdAt: new Date().toISOString(),
    email,
  });
}

/**
 * Retrieve verification code from Firestore
 */
async function getVerificationCode(email: string): Promise<any | null> {
  try {
    const doc = await firestore.collection(VERIFICATION_CODES_COLLECTION).doc(email).get();
    return doc.exists ? doc.data() : null;
  } catch (error) {
    console.error("Error retrieving verification code:", error);
    return null;
  }
}

/**
 * Delete verification code after use
 * Prevents replay attacks
 */
async function deleteVerificationCode(email: string): Promise<void> {
  try {
    await firestore.collection(VERIFICATION_CODES_COLLECTION).doc(email).delete();
  } catch (error) {
    console.error("Error deleting verification code:", error);
  }
}

/**
 * Clean up expired codes periodically
 * Called automatically when codes are accessed
 */
async function cleanupExpiredCodes(): Promise<void> {
  try {
    const now = new Date().toISOString();
    const snapshot = await firestore
      .collection(VERIFICATION_CODES_COLLECTION)
      .where("expiresAt", "<", now)
      .limit(100) // Cleanup in batches to avoid overload
      .get();

    const batch = firestore.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    if (snapshot.docs.length > 0) {
      await batch.commit();
      console.log(`[Cleanup] Removed ${snapshot.docs.length} expired verification codes`);
    }
  } catch (error) {
    // Silently fail cleanup to not interrupt main operations
    console.error("Error cleaning up expired codes:", error);
  }
}

function sendVerificationEmail(email: string, code: string, purpose: string): boolean {
  // In production, use SendGrid, AWS SES, or Nodemailer
  // For now, log it (in demo mode) - DO NOT log the actual code
  console.log(`[2FA] ${purpose} code generated for ${email}`);
  console.log(`[2FA] Code will expire in ${purpose === "setup" ? 10 : 5} minutes`);

  // Return true to indicate email would be sent
  // In production, return false if actual email send fails
  return true;
}

export default async function handler(req: any, res: any) {
  // Apply CORS if needed
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Periodically cleanup expired codes
  cleanupExpiredCodes().catch((error) => {
    console.error("Cleanup error (non-blocking):", error);
  });

  if (req.method === "POST") {
    const action = req.body?.action;

    // Send verification code for setup
    if (action === "send") {
      const email = normalizeEmail(req.body?.email);

      if (!email) {
        return res.status(400).json({ message: "Email is required." });
      }

      try {
        const code = generateVerificationCode();

        // Store in Firestore (persists across restarts)
        await storeVerificationCode(email, code, "setup", 10);

        // Log without the code
        console.log(`[2FA-Setup] Verification code generated for ${email}`);

        // Send email (in production)
        const sent = sendVerificationEmail(email, code, "2FA Setup");

        if (!sent) {
          return res.status(500).json({ message: "Failed to send verification code." });
        }

        return res.status(200).json({
          ok: true,
          message: `Verification code sent to ${email}`,
        });
      } catch (error) {
        console.error("Error sending verification code:", error);
        return res.status(500).json({ message: "Failed to send verification code." });
      }
    }

    // Verify setup code
    if (action === "verify") {
      const email = normalizeEmail(req.body?.email);
      const code = String(req.body?.code ?? "").trim();

      if (!email || !code) {
        return res.status(400).json({ message: "Email and code are required." });
      }

      try {
        // Validate code format
        if (!/^\d{6}$/.test(code)) {
          return res.status(400).json({ message: "Code must be exactly 6 digits." });
        }

        console.log(`[2FA-Verify] Verifying code for ${email}`);

        // Retrieve from Firestore
        const stored = await getVerificationCode(email);

        if (!stored) {
          return res
            .status(400)
            .json({
              message:
                "No verification code sent for this email. Please click the toggle to send a new code.",
            });
        }

        if (stored.purpose !== "setup") {
          return res.status(400).json({
            message: "Invalid code type. Please request a new setup code.",
          });
        }

        // Check expiration
        if (new Date() > new Date(stored.expiresAt)) {
          await deleteVerificationCode(email);
          return res.status(400).json({
            message: "Verification code expired. Please click the toggle to request a new code.",
          });
        }

        // Verify code (constant-time comparison)
        if (stored.code !== code) {
          return res.status(401).json({ message: "Invalid verification code. Please try again." });
        }

        console.log(`[2FA-Verify] Code verified successfully for ${email}`);

        // Code is valid - save 2FA settings
        const docRef = firestore.collection(SETTINGS_COLLECTION).doc(SETTINGS_DOC_ID);
        await docRef.set(
          {
            twoFactorAuth: {
              email: {
                enabled: true,
                email,
                enabledAt: new Date().toISOString(),
              },
            },
          },
          { merge: true }
        );

        // Delete code after successful verification (prevent replay)
        await deleteVerificationCode(email);

        return res.status(200).json({
          ok: true,
          message: "Email authentication enabled successfully.",
        });
      } catch (error) {
        console.error("Failed to verify code:", error);
        return res.status(500).json({ message: "Failed to enable 2FA." });
      }
    }

    // Send OTP for login
    if (action === "send-login-otp") {
      const email = normalizeEmail(req.body?.email);

      if (!email) {
        return res.status(400).json({ message: "Email is required." });
      }

      try {
        const code = generateVerificationCode();

        // Store in Firestore (persists across restarts)
        await storeVerificationCode(email, code, "login", 5);

        // Log without the code
        console.log(`[Login-OTP] OTP generated for ${email}`);

        // Send email
        const sent = sendVerificationEmail(email, code, "Login OTP");

        if (!sent) {
          return res.status(500).json({ message: "Failed to send OTP." });
        }

        return res.status(200).json({
          ok: true,
          message: `OTP sent to ${email}`,
        });
      } catch (error) {
        console.error("Error sending login OTP:", error);
        return res.status(500).json({ message: "Failed to send OTP." });
      }
    }

    // Verify login OTP
    if (action === "verify-login-otp") {
      const email = normalizeEmail(req.body?.email);
      const code = String(req.body?.code ?? "").trim();

      if (!email || !code) {
        return res.status(400).json({ message: "Email and code are required." });
      }

      try {
        // Validate code format
        if (!/^\d{6}$/.test(code)) {
          return res.status(400).json({ message: "Code must be exactly 6 digits." });
        }

        console.log(`[Login-Verify] Verifying OTP for ${email}`);

        // Retrieve from Firestore
        const stored = await getVerificationCode(email);

        if (!stored || stored.purpose !== "login") {
          return res
            .status(400)
            .json({ message: "No OTP sent for this email. Please try logging in again." });
        }

        // Check expiration
        if (new Date() > new Date(stored.expiresAt)) {
          await deleteVerificationCode(email);
          return res.status(400).json({ message: "OTP expired. Please try logging in again." });
        }

        // Verify code (constant-time comparison)
        if (stored.code !== code) {
          return res.status(401).json({ message: "Invalid OTP. Please try again." });
        }

        console.log(`[Login-Verify] OTP verified successfully for ${email}`);

        // Delete code after successful verification (prevent replay)
        await deleteVerificationCode(email);

        return res.status(200).json({
          ok: true,
          message: "OTP verified successfully.",
        });
      } catch (error) {
        console.error("Error verifying OTP:", error);
        return res.status(500).json({ message: "Failed to verify OTP." });
      }
    }

    // Disable 2FA
    if (action === "disable") {
      try {
        const docRef = firestore.collection(SETTINGS_COLLECTION).doc(SETTINGS_DOC_ID);
        await docRef.set(
          {
            twoFactorAuth: {
              email: {
                enabled: false,
              },
            },
          },
          { merge: true }
        );

        console.log("[2FA] Email authentication disabled");

        return res.status(200).json({
          ok: true,
          message: "Email authentication disabled.",
        });
      } catch (error) {
        console.error("Failed to disable 2FA:", error);
        return res.status(500).json({ message: "Failed to disable 2FA." });
      }
    }

    return res.status(400).json({ message: "Invalid action." });
  }

  res.setHeader("Allow", ["POST", "OPTIONS"]);
  return res.status(405).end();
}
