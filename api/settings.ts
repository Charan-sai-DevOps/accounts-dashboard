import { firestore } from "./_firebaseAdmin.js";
import { DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_PASSWORD_HASH } from "./_auth.js";

const SETTINGS_DOC_ID = "app";
const SETTINGS_COLLECTION = "settings";

const defaultAppSettings = {
  email: "",
  fullName: "",
  company: "",
  profile: {
    username: "Charan Sai",
    companyName: "Webomind Apps",
    role: "Admin",
    email: DEFAULT_ADMIN_EMAIL,
  },
  auth: {
    email: DEFAULT_ADMIN_EMAIL,
    passwordHash: DEFAULT_ADMIN_PASSWORD_HASH,
  },
  reminders: {
    before7Days: true,
    before3Days: true,
    onDay: false,
  },
  notifications: {
    monthlySpendSummary: true,
    newSubscriptionAdded: false,
  },
};

function normalizeSettings(data: any) {
  const profileSource = data?.profile ?? {};
  const username = typeof profileSource?.username === "string" ? profileSource.username : typeof data?.fullName === "string" ? data.fullName : defaultAppSettings.profile.username;
  const companyName = typeof profileSource?.companyName === "string" ? profileSource.companyName : typeof data?.company === "string" ? data.company : defaultAppSettings.profile.companyName;
  const role = typeof profileSource?.role === "string" ? profileSource.role : defaultAppSettings.profile.role;
  const email = typeof profileSource?.email === "string" ? profileSource.email : typeof data?.email === "string" ? data.email : defaultAppSettings.profile.email;
  const authSource = data?.auth ?? {};

  return {
    email,
    fullName: username,
    company: companyName,
    profile: {
      username,
      companyName,
      role,
      email,
    },
    auth: {
      email: typeof authSource?.email === "string" ? authSource.email : email,
      passwordHash:
        typeof authSource?.passwordHash === "string"
          ? authSource.passwordHash
          : defaultAppSettings.auth.passwordHash,
    },
    reminders: {
      before7Days: Boolean(data?.reminders?.before7Days ?? true),
      before3Days: Boolean(data?.reminders?.before3Days ?? true),
      onDay: Boolean(data?.reminders?.onDay ?? false),
    },
    notifications: {
      monthlySpendSummary: Boolean(data?.notifications?.monthlySpendSummary ?? true),
      newSubscriptionAdded: Boolean(data?.notifications?.newSubscriptionAdded ?? false),
    },
  };
}

export default async function handler(req: any, res: any) {
  const docRef = firestore.collection(SETTINGS_COLLECTION).doc(SETTINGS_DOC_ID);

  if (req.method === "GET") {
    const doc = await docRef.get();
    if (!doc.exists) {
      return res.status(200).json(defaultAppSettings);
    }

    const settings = normalizeSettings(doc.data());
    return res.status(200).json(settings);
  }

  if (req.method === "PUT") {
    const payload = req.body;
    const existingDoc = await docRef.get();
    const existingData = existingDoc.exists ? existingDoc.data() : {};
    const settings = normalizeSettings({
      ...existingData,
      ...payload,
      profile: {
        ...(existingData as any)?.profile,
        ...(payload?.profile ?? {}),
      },
      auth: {
        ...(existingData as any)?.auth,
        ...(payload?.auth ?? {}),
      },
    });
    await docRef.set(settings, { merge: true });
    return res.status(200).json(settings);
  }

  res.setHeader("Allow", ["GET", "PUT"]);
  return res.status(405).end();
}
