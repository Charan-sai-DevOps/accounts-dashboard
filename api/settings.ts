import { firestore } from "./_firebaseAdmin.js";
import { DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_PASSWORD_HASH, hashPassword } from "./_auth.js";

const SETTINGS_DOC_ID = "app";
const SETTINGS_COLLECTION = "settings";

const defaultAppSettings = {
  email: "",
  fullName: "",
  company: "",
  profile: {
    username: "",
    companyName: "",
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
  notificationSettings: {
    sevenDay: true,
    threeDayBefore: true,
    dayOf: false,
    monthlySummary: true,
    newSub: false,
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
    notificationSettings: {
      sevenDay: Boolean(data?.notificationSettings?.sevenDay ?? true),
      threeDayBefore: Boolean(data?.notificationSettings?.threeDayBefore ?? true),
      dayOf: Boolean(data?.notificationSettings?.dayOf ?? false),
      monthlySummary: Boolean(data?.notificationSettings?.monthlySummary ?? true),
      newSub: Boolean(data?.notificationSettings?.newSub ?? false),
    },
  };
}

export default async function handler(req: any, res: any) {
  const docRef = firestore.collection(SETTINGS_COLLECTION).doc(SETTINGS_DOC_ID);

  if (req.method === "GET") {
    const doc = await docRef.get();
    if (!doc.exists) {
      return res.status(200).json({ ...defaultAppSettings, appUsers: [] });
    }

    const data = doc.data() as any;
    const settings = normalizeSettings(data);
    const appUsers = (data?.appUsers ?? []).map((u: any) => ({
      id: u.id ?? "",
      name: u.name ?? "",
      email: u.email ?? "",
      role: u.role ?? "Member",
      lastLogin: u.lastLogin ?? "Never",
      avatar: u.avatar ?? "",
    }));
    return res.status(200).json({ ...settings, appUsers });
  }

  if (req.method === "PUT") {
    const payload = req.body;
    const existingDoc = await docRef.get();
    const existingData = (existingDoc.exists ? existingDoc.data() : {}) as any;

    if (payload.appUsers !== undefined) {
      const existingUsers: any[] = existingData?.appUsers ?? [];
      const usersToStore = (payload.appUsers as any[]).map((u: any) => {
        const existing = existingUsers.find((e: any) => e.id === u.id);
        return {
          id: u.id ?? String(Date.now()),
          name: u.name ?? "",
          email: u.email ?? "",
          role: u.role ?? "Member",
          passwordHash: u.password
            ? hashPassword(u.password)
            : (existing?.passwordHash ?? ""),
          lastLogin: u.lastLogin ?? "Never",
          avatar: u.avatar ?? (u.name ? String(u.name)[0].toUpperCase() : "?"),
        };
      });
      await docRef.set({ appUsers: usersToStore }, { merge: true });
      return res.status(200).json({ ok: true });
    }

    if (payload.notificationSettings !== undefined) {
      await docRef.set({ notificationSettings: payload.notificationSettings }, { merge: true });
      return res.status(200).json({ ok: true });
    }

    const settings = normalizeSettings({
      ...existingData,
      ...payload,
      profile: { ...existingData?.profile, ...(payload?.profile ?? {}) },
      auth: { ...existingData?.auth, ...(payload?.auth ?? {}) },
    });
    await docRef.set(settings, { merge: true });
    return res.status(200).json(settings);
  }

  res.setHeader("Allow", ["GET", "PUT"]);
  return res.status(405).end();
}
