import { firestore } from "./_firebaseAdmin.js";
import { DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_NAME, DEFAULT_ADMIN_PASSWORD_HASH, hashPassword } from "./_auth.js";

const SETTINGS_DOC_ID = "app";
const SETTINGS_COLLECTION = "settings";

const defaultAppSettings = {
  email: "",
  fullName: "",
  company: "",
  profile: {
    username: DEFAULT_ADMIN_NAME,
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
  notificationSettings: {
    sevenDay: true,
    threeDayBefore: true,
    dayOf: false,
    monthlySummary: true,
    newSub: false,
  },
};

// Build the admin user entry derived from current auth config.
// This is always injected at read time — never stored in Firestore —
// so it stays in sync with credential changes automatically.
function buildAdminUserEntry(authEmail: string, authName: string) {
  return {
    id: "admin",
    name: authName,
    email: authEmail,
    role: "Admin" as const,
    lastLogin: "—",
    avatar: authName[0]?.toUpperCase() ?? "A",
  };
}

function normalizeSettings(data: any) {
  const profileSource = data?.profile ?? {};
  const username = typeof profileSource?.username === "string" && profileSource.username
    ? profileSource.username
    : typeof data?.fullName === "string" && data.fullName
    ? data.fullName
    : DEFAULT_ADMIN_NAME;
  const companyName = typeof profileSource?.companyName === "string" ? profileSource.companyName : typeof data?.company === "string" ? data.company : defaultAppSettings.profile.companyName;
  const role = typeof profileSource?.role === "string" ? profileSource.role : defaultAppSettings.profile.role;
  const email = typeof profileSource?.email === "string" && profileSource.email
    ? profileSource.email
    : typeof data?.email === "string" && data.email
    ? data.email
    : DEFAULT_ADMIN_EMAIL;
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
      const adminUser = buildAdminUserEntry(DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_NAME);
      return res.status(200).json({ ...defaultAppSettings, appUsers: [adminUser], customCategories: [], customTeams: [] });
    }

    const data = doc.data() as any;
    const settings = normalizeSettings(data);

    // Resolve current admin identity (may have been updated via auth.PUT)
    const authEmail: string = typeof data?.auth?.email === "string" ? data.auth.email : DEFAULT_ADMIN_EMAIL;
    // Use profile username as admin display name if set, otherwise fallback
    const authName: string =
      typeof data?.profile?.username === "string" && data.profile.username
        ? data.profile.username
        : DEFAULT_ADMIN_NAME;

    const adminUser = buildAdminUserEntry(authEmail, authName);

    // Stored non-admin users (Member / Viewer) — strip passwordHash before sending to client
    const storedUsers = (data?.appUsers ?? []).map((u: any) => ({
      id: u.id ?? "",
      name: u.name ?? "",
      email: u.email ?? "",
      role: u.role ?? "Member",
      lastLogin: u.lastLogin ?? "Never",
      avatar: u.avatar ?? "",
    }));

    // Admin is always first; stored users follow
    return res.status(200).json({
      ...settings,
      appUsers: [adminUser, ...storedUsers],
      customCategories: Array.isArray(data?.customCategories) ? data.customCategories : [],
      customTeams: Array.isArray(data?.customTeams) ? data.customTeams : [],
    });
  }

  if (req.method === "PUT") {
    const payload = req.body;
    const existingDoc = await docRef.get();
    const existingData = (existingDoc.exists ? existingDoc.data() : {}) as any;

    if (payload.appUsers !== undefined) {
      const existingUsers: any[] = existingData?.appUsers ?? [];
      // Filter out only the injected virtual admin entry (id === "admin") —
      // real Admin users created via User Management ARE stored in Firestore
      const usersToStore = (payload.appUsers as any[])
        .filter((u: any) => u.id !== "admin")
        .map((u: any) => {
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

    if (payload.customCategories !== undefined || payload.customTeams !== undefined) {
      const update: any = {};
      if (payload.customCategories !== undefined) update.customCategories = payload.customCategories;
      if (payload.customTeams !== undefined) update.customTeams = payload.customTeams;
      await docRef.set(update, { merge: true });
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
