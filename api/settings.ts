import { firestore } from "./_firebaseAdmin.js";

const SETTINGS_DOC_ID = "app";
const SETTINGS_COLLECTION = "settings";

const defaultAppSettings = {
  email: "",
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
  return {
    email: typeof data?.email === "string" ? data.email : "",
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
    const settings = normalizeSettings(payload);
    await docRef.set(settings, { merge: true });
    return res.status(200).json(settings);
  }

  res.setHeader("Allow", ["GET", "PUT"]);
  return res.status(405).end();
}
