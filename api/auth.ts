import { firestore } from "./_firebaseAdmin.js";
import { DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_PASSWORD_HASH, hashPassword, verifyPassword } from "./_auth.js";

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

// Log audit event for authentication attempts
async function logAuthEvent(
  email: string,
  action: "LOGIN_SUCCESS" | "LOGIN_FAILURE" | "PASSWORD_CHANGE",
  ipAddress?: string
) {
  try {
    await firestore.collection("audit_logs").add({
      timestamp: new Date().toISOString(),
      action,
      email,
      ipAddress: ipAddress || "unknown",
    });
  } catch (error) {
    console.error("Failed to log auth event:", error);
  }
}

export default async function handler(req: any, res: any) {
  if (req.method === "POST") {
    const email = String(req.body?.email ?? "").trim().toLowerCase();
    const password = String(req.body?.password ?? "");
    const ipAddress = req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown";

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    try {
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
          await logAuthEvent(email, "LOGIN_SUCCESS", ipAddress as string);
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
        await logAuthEvent(email, "LOGIN_SUCCESS", ipAddress as string);
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

      await logAuthEvent(email, "LOGIN_FAILURE", ipAddress as string);
      return res.status(401).json({ message: "Invalid email or password." });
    } catch (error) {
      console.error("Login handler error:", error);
      return res.status(500).json({ message: "Authentication failed. Please try again." });
    }
  }

  if (req.method === "PUT") {
    const currentPassword = String(req.body?.currentPassword ?? "");
    const newPassword = String(req.body?.newPassword ?? "");
    const ipAddress = req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown";

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current and new passwords are required." });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: "New password must be at least 8 characters." });
    }

    try {
      const { docRef, auth } = await getAuthRecord();

      const passwordMatch = await verifyPassword(currentPassword, auth.passwordHash);
      if (!passwordMatch) {
        await logAuthEvent(auth.email, "LOGIN_FAILURE", ipAddress as string);
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

      await logAuthEvent(auth.email, "PASSWORD_CHANGE", ipAddress as string);
      return res.status(200).json({ ok: true, message: "Password changed successfully." });
    } catch (error) {
      console.error("Password change error:", error);
      return res.status(500).json({ message: "Failed to change password. Please try again." });
    }
  }

  res.setHeader("Allow", ["POST", "PUT"]);
  return res.status(405).end();
}
