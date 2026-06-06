import { firestore } from "./_firebaseAdmin.js";
import { DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_PASSWORD_HASH, hashPassword } from "./_auth.js";

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

export default async function handler(req: any, res: any) {
  if (req.method === "POST") {
    const email = String(req.body?.email ?? "").trim().toLowerCase();
    const password = String(req.body?.password ?? "");

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    // Single Firestore read for all auth data
    const { auth } = await getAuthRecord();
    const settingsDoc = await firestore.collection(SETTINGS_COLLECTION).doc(SETTINGS_DOC_ID).get();
    const settingsData = settingsDoc.exists ? (settingsDoc.data() as any) : {};
    const twoFactorAuth = settingsData?.twoFactorAuth;
    const has2FA = twoFactorAuth?.email?.enabled === true;

    // Admin check
    if (email === auth.email.trim().toLowerCase() && hashPassword(password) === auth.passwordHash) {
      return res.status(200).json({
        ok: true,
        role: "Admin",
        user: { email: auth.email },
        requires2FA: has2FA,
      });
    }

    // Member / Viewer check — look up appUsers stored in Firestore
    try {
      const appUsers: any[] = settingsData?.appUsers ?? [];
      const matched = appUsers.find(
        (u: any) =>
          typeof u.email === "string" &&
          u.email.trim().toLowerCase() === email &&
          typeof u.passwordHash === "string" &&
          u.passwordHash === hashPassword(password) &&
          (u.role === "Member" || u.role === "Viewer")
      );
      if (matched) {
        return res.status(200).json({
          ok: true,
          role: matched.role,
          user: {
            name: typeof matched.name === "string" ? matched.name : "",
            email: typeof matched.email === "string" ? matched.email : "",
            role: matched.role,
          },
          requires2FA: has2FA,
        });
      }
    } catch {}

    return res.status(401).json({ message: "Invalid email or password." });
  }

  if (req.method === "PUT") {
    const currentPassword = String(req.body?.currentPassword ?? "");
    const newPassword = String(req.body?.newPassword ?? "");
    const { docRef, auth } = await getAuthRecord();

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current and new passwords are required." });
    }

    if (hashPassword(currentPassword) !== auth.passwordHash) {
      return res.status(401).json({ message: "Current password is incorrect." });
    }

    const updatedAuth = {
      ...auth,
      passwordHash: hashPassword(newPassword),
    };

    await docRef.set(
      {
        auth: updatedAuth,
      },
      { merge: true }
    );

    return res.status(200).json({ ok: true });
  }

  res.setHeader("Allow", ["POST", "PUT"]);
  return res.status(405).end();
}
