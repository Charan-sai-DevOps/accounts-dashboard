import { firestore } from "./_firebaseAdmin.js";

const SETTINGS_DOC_ID = "app";
const SETTINGS_COLLECTION = "settings";

// In-memory store for verification codes with normalized keys
const verificationCodes: Record<string, { code: string; expiresAt: number; email: string; purpose: string }> = {};

function normalizeEmail(email: string): string {
  return String(email ?? "").trim().toLowerCase();
}

function generateVerificationCode(): string {
  return Math.random().toString().slice(2, 8);
}

function sendVerificationEmail(email: string, code: string, purpose: string): boolean {
  // In production, use a service like SendGrid, AWS SES, or Nodemailer
  console.log(`[2FA] ${purpose} code for ${email}: ${code}`);
  // For now, just log it (in demo mode)
  return true;
}

export default async function handler(req: any, res: any) {
  if (req.method === "POST") {
    const action = req.body?.action;

    // Send verification code for setup
    if (action === "send") {
      const email = normalizeEmail(req.body?.email);

      if (!email) {
        return res.status(400).json({ message: "Email is required." });
      }

      const code = generateVerificationCode();
      const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

      verificationCodes[email] = { code, expiresAt, email, purpose: "setup" };

      console.log(`[2FA-Setup] Code stored for ${email}: ${code}`);

      // Send email (in production)
      const sent = sendVerificationEmail(email, code, "2FA Setup");

      if (!sent) {
        return res.status(500).json({ message: "Failed to send verification code." });
      }

      return res.status(200).json({
        ok: true,
        message: `Verification code sent to ${email}`,
      });
    }

    // Verify setup code
    if (action === "verify") {
      const email = normalizeEmail(req.body?.email);
      const code = String(req.body?.code ?? "").trim();

      if (!email || !code) {
        return res.status(400).json({ message: "Email and code are required." });
      }

      console.log(`[2FA-Verify] Attempting to verify code for ${email}. Code: ${code}`);
      console.log(`[2FA-Verify] Stored codes: ${Object.keys(verificationCodes).join(", ")}`);

      const stored = verificationCodes[email];

      if (!stored) {
        return res.status(400).json({ message: "No verification code sent for this email. Please click the toggle to send a new code." });
      }

      if (Date.now() > stored.expiresAt) {
        delete verificationCodes[email];
        return res.status(400).json({ message: "Verification code expired. Please click the toggle to request a new code." });
      }

      if (stored.code !== code) {
        console.log(`[2FA-Verify] Code mismatch! Expected: ${stored.code}, Got: ${code}`);
        return res.status(401).json({ message: `Invalid verification code. Expected ${stored.code}, got ${code}. Please try again.` });
      }

      console.log(`[2FA-Verify] Code verified successfully for ${email}`);

      // Code is valid - save 2FA settings
      try {
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

        delete verificationCodes[email];

        return res.status(200).json({
          ok: true,
          message: "Email authentication enabled successfully.",
        });
      } catch (error) {
        console.error("Failed to save 2FA settings:", error);
        return res.status(500).json({ message: "Failed to enable 2FA." });
      }
    }

    // Send OTP for login
    if (action === "send-login-otp") {
      const email = normalizeEmail(req.body?.email);

      if (!email) {
        return res.status(400).json({ message: "Email is required." });
      }

      const code = generateVerificationCode();
      const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes for login

      verificationCodes[email] = { code, expiresAt, email, purpose: "login" };

      console.log(`[Login-OTP] Code stored for ${email}: ${code}`);

      // Send email
      const sent = sendVerificationEmail(email, code, "Login OTP");

      if (!sent) {
        return res.status(500).json({ message: "Failed to send OTP." });
      }

      return res.status(200).json({
        ok: true,
        message: `OTP sent to ${email}`,
      });
    }

    // Verify login OTP
    if (action === "verify-login-otp") {
      const email = normalizeEmail(req.body?.email);
      const code = String(req.body?.code ?? "").trim();

      if (!email || !code) {
        return res.status(400).json({ message: "Email and code are required." });
      }

      console.log(`[Login-Verify] Attempting to verify OTP for ${email}. Code: ${code}`);

      const stored = verificationCodes[email];

      if (!stored || stored.purpose !== "login") {
        return res.status(400).json({ message: "No OTP sent for this email. Please try logging in again." });
      }

      if (Date.now() > stored.expiresAt) {
        delete verificationCodes[email];
        return res.status(400).json({ message: "OTP expired. Please try logging in again." });
      }

      if (stored.code !== code) {
        console.log(`[Login-Verify] OTP mismatch! Expected: ${stored.code}, Got: ${code}`);
        return res.status(401).json({ message: "Invalid OTP. Please try again." });
      }

      delete verificationCodes[email];

      return res.status(200).json({
        ok: true,
        message: "OTP verified successfully.",
      });
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

  res.setHeader("Allow", ["POST"]);
  return res.status(405).end();
}
