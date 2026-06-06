import { firestore } from "./_firebaseAdmin.js";
import { DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_PASSWORD_HASH, hashPassword, verifyPassword } from "./_auth.js";
import { checkRateLimit, resetRateLimit, cleanupOldRateLimits } from "./utils/rateLimitUtil.js";
import { loginSchema, passwordChangeSchema, formatValidationError } from "./schemas/validation.js";
import { logAuthSuccess, logAuthFailure, logPasswordChange, logRateLimited } from "./utils/auditLog.js";

const SETTINGS_DOC_ID = "app";
const SETTINGS_COLLECTION = "settings";

async function getAuthRecord() {
  const docRef = firestore.collection(SETTINGS_COLLECTION).doc(SETTINGS_DOC_ID);
  const doc = await docRef.get();

  if (!doc.exists) {
    return {
      docRef,
      auth: {
        email: DEFAULT_ADMIN_EMAIL,
        passwordHash: DEFAULT_ADMIN_PASSWORD_HASH,
      },
    };
  }

  const data = doc.data() as any;
  return {
    docRef,
    auth: {
      email: typeof data?.auth?.email === "string" ? data.auth.email : DEFAULT_ADMIN_EMAIL,
      passwordHash:
        typeof data?.auth?.passwordHash === "string"
          ? data.auth.passwordHash
          : DEFAULT_ADMIN_PASSWORD_HASH,
    },
  };
}

// Note: Using imported audit logging functions from auditLog.ts
// See imports above for enhanced logging

export default async function handler(req: any, res: any) {
  // Cleanup old rate limit entries periodically
  cleanupOldRateLimits().catch((error) => {
    console.error("Cleanup error (non-blocking):", error);
  });

  if (req.method === "POST") {
    const ipAddress = req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown";
    const userAgent = req.headers["user-agent"];

    try {
      // Input validation using Zod schemas
      const validationResult = loginSchema.safeParse(req.body);

      if (!validationResult.success) {
        const errors = formatValidationError(validationResult.error);
        await logAuthFailure(
          req.body?.email || "unknown",
          "Invalid input format",
          ipAddress as string,
          userAgent as string
        );
        return res.status(400).json(errors);
      }

      const { email, password } = validationResult.data;

      // Rate limiting: 5 attempts per 15 minutes per email
      const rateLimitCheck = await checkRateLimit(email, "login", 5, 15);

      if (!rateLimitCheck.allowed) {
        await logRateLimited("LOGIN_RATE_LIMITED", email, ipAddress as string, userAgent as string);
        const resetTime = new Date(rateLimitCheck.resetAt).toLocaleTimeString();
        return res.status(429).json({
          message: `Too many login attempts. Please try again after ${resetTime}.`,
          retryAfter: Math.ceil((rateLimitCheck.resetAt.getTime() - Date.now()) / 1000),
        });
      }
      // Single Firestore read for all auth data
      const { auth } = await getAuthRecord();
      const settingsDoc = await firestore.collection(SETTINGS_COLLECTION).doc(SETTINGS_DOC_ID).get();
      const settingsData = settingsDoc.exists ? (settingsDoc.data() as any) : {};
      const twoFactorAuth = settingsData?.twoFactorAuth;
      const has2FA = twoFactorAuth?.email?.enabled === true;

      // Admin check with bcrypt password verification
      if (email === auth.email.trim().toLowerCase()) {
        const passwordMatch = await verifyPassword(password, auth.passwordHash);
        if (passwordMatch) {
          await logAuthSuccess(email, ipAddress as string, userAgent as string);
          // Reset rate limit on successful login
          await resetRateLimit(email, "login");
          return res.status(200).json({
            ok: true,
            role: "Admin",
            user: { email: auth.email },
            requires2FA: has2FA,
          });
        }
      }

      // Member / Viewer / secondary Admin check — look up appUsers stored in Firestore
      const appUsers: any[] = settingsData?.appUsers ?? [];
      let matchedUser = null;

      for (const user of appUsers) {
        if (
          typeof user.email === "string" &&
          user.email.trim().toLowerCase() === email &&
          typeof user.passwordHash === "string"
        ) {
          const passwordMatch = await verifyPassword(password, user.passwordHash);
          if (passwordMatch) {
            matchedUser = user;
            break;
          }
        }
      }

      if (matchedUser) {
        const role = ["Admin", "Member", "Viewer"].includes(matchedUser.role)
          ? matchedUser.role
          : "Member";
        await logAuthSuccess(email, ipAddress as string, userAgent as string);
        // Reset rate limit on successful login
        await resetRateLimit(email, "login");
        return res.status(200).json({
          ok: true,
          role,
          user: {
            name: typeof matchedUser.name === "string" ? matchedUser.name : "",
            email: typeof matchedUser.email === "string" ? matchedUser.email : "",
            role,
          },
          requires2FA: has2FA,
        });
      }

      await logAuthFailure(email, "Invalid credentials", ipAddress as string, userAgent as string);
      return res.status(401).json({ message: "Invalid email or password." });
    } catch (error) {
      console.error("Login handler error:", error);
      return res.status(500).json({ message: "Authentication failed. Please try again." });
    }
  }

  if (req.method === "PUT") {
    const ipAddress = req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown";
    const userAgent = req.headers["user-agent"];

    try {
      // Input validation using Zod schemas
      const validationResult = passwordChangeSchema.safeParse(req.body);

      if (!validationResult.success) {
        const errors = formatValidationError(validationResult.error);
        await logPasswordChange(
          "unknown@example.com",
          false,
          ipAddress as string,
          userAgent as string,
          "Validation failed"
        );
        return res.status(400).json(errors);
      }

      const { currentPassword, newPassword } = validationResult.data;

      // Rate limiting: 3 attempts per hour per IP
      const rateLimitCheck = await checkRateLimit(
        ipAddress as string,
        "password_change",
        3,
        60
      );

      if (!rateLimitCheck.allowed) {
        await logRateLimited(
          "PASSWORD_CHANGE_RATE_LIMITED",
          ipAddress as string,
          ipAddress as string,
          userAgent as string
        );
        const resetTime = new Date(rateLimitCheck.resetAt).toLocaleTimeString();
        return res.status(429).json({
          message: `Too many password change attempts. Please try again after ${resetTime}.`,
          retryAfter: Math.ceil((rateLimitCheck.resetAt.getTime() - Date.now()) / 1000),
        });
      }

      const { docRef, auth } = await getAuthRecord();

      const passwordMatch = await verifyPassword(currentPassword, auth.passwordHash);
      if (!passwordMatch) {
        await logPasswordChange(
          auth.email,
          false,
          ipAddress as string,
          userAgent as string,
          "Current password incorrect"
        );
        return res.status(401).json({ message: "Current password is incorrect." });
      }

      const newPasswordHash = await hashPassword(newPassword);
      const updatedAuth = {
        ...auth,
        passwordHash: newPasswordHash,
      };

      await docRef.set(
        {
          auth: updatedAuth,
        },
        { merge: true }
      );

      await logPasswordChange(
        auth.email,
        true,
        ipAddress as string,
        userAgent as string
      );
      return res.status(200).json({ ok: true, message: "Password changed successfully." });
    } catch (error) {
      console.error("Password change error:", error);
      return res.status(500).json({ message: "Failed to change password. Please try again." });
    }
  }

  res.setHeader("Allow", ["POST", "PUT"]);
  return res.status(405).end();
}
