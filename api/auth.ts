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
    const { auth } = await getAuthRecord();

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    if (email !== auth.email.trim().toLowerCase() || hashPassword(password) !== auth.passwordHash) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    return res.status(200).json({
      ok: true,
      user: {
        email: auth.email,
      },
    });
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
