import { useState, useEffect, memo } from "react";
import {
  Users, Bell, DollarSign, Shield,
  Plus, Trash2, X, Check, UserCheck,
  Clock, Mail, Smartphone, ChevronRight,
  Search, Edit2, AlertTriangle, Layers,
  Eye, EyeOff,
} from "lucide-react";
import { Subscription, getDaysUntilExpiry, Category, Team, categoryColors, getTeamIdentity } from "../data/subscriptions";

type SettingsSection = "profile" | "users" | "notifications" | "currency" | "2fa" | "categories" | "teams";

interface SettingsPageProps {
  subscriptions: Subscription[];
  categories: Category[];
  onCreateCategory: (category: string) => void;
  teams: Team[];
  onCreateTeam: (team: string) => void;
  section?: SettingsSection;
  onSectionChange?: (section: SettingsSection) => void;
  profile?: {
    username: string;
    companyName: string;
    role: string;
    email: string;
  };
  onUpdateProfile?: (profile: {
    username: string;
    companyName: string;
    role: string;
    email: string;
  }) => void;
}

interface AppUser {
  id: string;
  name: string;
  email: string;
  role: "Admin" | "Member" | "Viewer";
  password: string;
  lastLogin: string;
  avatar: string;
}

interface CustomNotification {
  id: string;
  email: string;
  platform: string;
  reminder: string;
}


const REMINDER_OPTIONS = [
  "7 days before",
  "5 days before",
  "3 days before",
  "2 days before",
  "1 day before",
  "Day of renewal",
];

const ROLE_COLORS: Record<string, { bg: string; color: string }> = {
  Admin: { bg: "rgba(99,102,241,0.12)", color: "#6366f1" },
  Member: { bg: "rgba(16,185,129,0.12)", color: "#10b981" },
  Viewer: { bg: "rgba(148,163,184,0.12)", color: "#64748b" },
};

const settingsNav: { id: SettingsSection; label: string; icon: React.ReactNode; desc: string }[] = [
  { id: "profile", label: "Profile", icon: <UserCheck size={17} />, desc: "Account profile and settings" },
  { id: "users", label: "User Management", icon: <Users size={17} />, desc: "Manage team members & roles" },
  { id: "categories", label: "Categories", icon: <Layers size={17} />, desc: "Subscription category groups" },
  { id: "teams", label: "Teams", icon: <Users size={17} />, desc: "Manage subscription teams" },
  { id: "notifications", label: "Notifications", icon: <Bell size={17} />, desc: "Renewal alerts & reminders" },
  { id: "currency", label: "Currency Display", icon: <DollarSign size={17} />, desc: "Set your preferred currency" },
  { id: "2fa", label: "Two-Factor Auth", icon: <Shield size={17} />, desc: "Secure your account" },
];

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className="relative flex-shrink-0"
      style={{ width: "44px", height: "24px" }}
    >
      <div
        className="w-full h-full rounded-full transition-colors duration-200"
        style={{ background: value ? "#6366f1" : "#e2e8f0" }}
      />
      <div
        className="absolute top-0.5 rounded-full bg-white transition-all duration-200"
        style={{
          width: "20px",
          height: "20px",
          left: value ? "22px" : "2px",
          boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
        }}
      />
    </button>
  );
}

function SettingsPageComponent({
  subscriptions,
  categories,
  onCreateCategory,
  teams,
  onCreateTeam,
  section: propSection,
  onSectionChange,
  profile: propProfile,
  onUpdateProfile,
}: SettingsPageProps) {
  const [localSection, setLocalSection] = useState<SettingsSection>("users");
  const section = propSection !== undefined ? propSection : localSection;
  const setSection = (s: SettingsSection) => {
    if (onSectionChange) {
      onSectionChange(s);
    } else {
      setLocalSection(s);
    }
  };

  const [users, setUsers] = useState<AppUser[]>(() => {
    try {
      const stored = localStorage.getItem("appUsers");
      if (stored) return JSON.parse(stored) as AppUser[];
    } catch {}
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem("appUsers", JSON.stringify(users));
    } catch {}
  }, [users]);

  useEffect(() => {
    const loadUsersFromAPI = async () => {
      try {
        const response = await fetch("/api/settings");
        if (!response.ok) return;
        const data = await response.json();
        if (Array.isArray(data.appUsers) && data.appUsers.length > 0) {
          setUsers(data.appUsers);
          localStorage.setItem("appUsers", JSON.stringify(data.appUsers));
        }
      } catch {}
    };
    void loadUsersFromAPI();
  }, []);

  const saveUsersToAPI = async (usersToSave: AppUser[]) => {
    try {
      await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appUsers: usersToSave }),
      });
    } catch {}
  };

  const [userSearch, setUserSearch] = useState("");
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deleteTargetName, setDeleteTargetName] = useState<string | null>(null);
  const [editUserId, setEditUserId] = useState<string | null>(null);
  const [newUser, setNewUser] = useState({ name: "", email: "", role: "Member" as AppUser["role"], password: "" });
  const [showNewUserPassword, setShowNewUserPassword] = useState(false);
  const [showCreateCategory, setShowCreateCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  const [localProfile, setLocalProfile] = useState({
    username: "Charan Sai",
    companyName: "Webomind Apps",
    role: "Admin",
    email: "charan.sai@webomindapps.com",
  });
  const profile = propProfile !== undefined ? propProfile : localProfile;
  const setProfile = (newProfile: any) => {
    if (typeof newProfile === "function") {
      if (onUpdateProfile) {
        onUpdateProfile(newProfile(profile));
      } else {
        setLocalProfile(newProfile);
      }
    } else {
      if (onUpdateProfile) {
        onUpdateProfile(newProfile);
      } else {
        setLocalProfile(newProfile);
      }
    }
  };

  const [isEditing, setIsEditing] = useState(false);
  const [passwordData, setPasswordData] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [profileSaveMessage, setProfileSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [reminderLog, setReminderLog] = useState<string[]>([]);

  const [builtInNotifs, setBuiltInNotifs] = useState({
    sevenDay: true,
    threeDayBefore: true,
    dayOf: false,
    monthlySummary: true,
    newSub: false,
  });

  useEffect(() => {
    const loadNotificationSettings = async () => {
      try {
        const response = await fetch("/api/settings");
        if (!response.ok) return;
        const data = await response.json();
        if (data.notificationSettings) {
          setBuiltInNotifs(data.notificationSettings);
        }
      } catch {}
    };
    void loadNotificationSettings();
  }, []);

  const saveNotificationSettings = async (settings: typeof builtInNotifs) => {
    try {
      await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationSettings: settings }),
      });
    } catch {}
  };

  const [customNotifs, setCustomNotifs] = useState<CustomNotification[]>([]);
  const [showAddNotif, setShowAddNotif] = useState(false);
  const [notifForm, setNotifForm] = useState({ email: "", platform: "", reminder: REMINDER_OPTIONS[0] });
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");

  const [primaryCurrency, setPrimaryCurrency] = useState<"INR" | "USD">("INR");

  const [emailAuth, setEmailAuth] = useState(false);
  const [emailAuthLoading, setEmailAuthLoading] = useState(false);
  const [emailAuthMessage, setEmailAuthMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [emailVerificationCode, setEmailVerificationCode] = useState("");
  const [emailUsedForVerification, setEmailUsedForVerification] = useState<string>("");
  const [googleAuth, setGoogleAuth] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [verifyCode, setVerifyCode] = useState("");
  const [verifySuccess, setVerifySuccess] = useState(false);

  const handleCreateUser = () => {
    if (!newUser.name || !newUser.email) return;
    if (!editUserId && newUser.role !== "Admin" && !newUser.password) return;

    let updatedUsers: AppUser[];

    if (editUserId) {
      updatedUsers = users.map((user) =>
        user.id === editUserId
          ? {
              ...user,
              name: newUser.name,
              email: newUser.email,
              role: newUser.role,
              ...(newUser.password ? { password: newUser.password } : {}),
            }
          : user
      );
    } else {
      const id = String(Date.now());
      updatedUsers = [
        ...users,
        {
          id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          password: newUser.password,
          lastLogin: "Never",
          avatar: newUser.name[0].toUpperCase(),
        },
      ];
    }

    setUsers(updatedUsers);
    try {
      localStorage.setItem("appUsers", JSON.stringify(updatedUsers));
    } catch {}
    void saveUsersToAPI(updatedUsers);

    setNewUser({ name: "", email: "", role: "Member", password: "" });
    setEditUserId(null);
    setShowCreateUser(false);
  };

  const startEditUser = (user: AppUser) => {
    setEditUserId(user.id);
    setNewUser({ name: user.name, email: user.email, role: user.role, password: "" });
    setShowCreateUser(true);
  };

  const requestDeleteUser = (user: AppUser) => {
    setPendingDeleteId(user.id);
    setDeleteTargetName(user.name);
  };

  const confirmDeleteUser = () => {
    if (!pendingDeleteId) return;
    const updatedUsers = users.filter((user) => user.id !== pendingDeleteId);
    setUsers(updatedUsers);
    try {
      localStorage.setItem("appUsers", JSON.stringify(updatedUsers));
    } catch {}
    void saveUsersToAPI(updatedUsers);
    setPendingDeleteId(null);
    setDeleteTargetName(null);
  };

  const cancelDelete = () => {
    setPendingDeleteId(null);
    setDeleteTargetName(null);
  };

  const handleAddNotif = () => {
    if (!notifForm.email || !notifForm.platform) return;
    setCustomNotifs((prev) => [...prev, { id: String(Date.now()), ...notifForm }]);
    setNotifForm({ email: "", platform: "", reminder: REMINDER_OPTIONS[0] });
    setShowAddNotif(false);
  };

  const REMINDER_DAYS: Record<string, number> = {
    "7 days before": 7,
    "5 days before": 5,
    "3 days before": 3,
    "2 days before": 2,
    "1 day before": 1,
    "Day of renewal": 0,
  };

  const formatReminderMessage = (days: number) => {
    if (days === 0) return "Day of renewal";
    return `${days} day${days === 1 ? "" : "s"} before`;
  };

  const getPlatformEmail = (sub: Subscription) => {
    return sub.accountEmail || `${sub.platform.toLowerCase().replace(/\s+/g, "")}@example.com`;
  };

  const collectDueReminders = () => {
    const messages: string[] = [];
    const adminEmail = profile.email || "admin@webomindapps.com";

    subscriptions.forEach((sub) => {
      const days = getDaysUntilExpiry(sub.expiryDate);
      if (days < 0) return;

      const platformEmail = getPlatformEmail(sub);

      if (days === 7 && builtInNotifs.sevenDay) {
        messages.push(`📧 7-day reminder for ${sub.platform}\n   Recipient: ${platformEmail}\n   Expiry: ${sub.expiryDate}`);
      }
      if (days === 3 && builtInNotifs.threeDayBefore) {
        messages.push(`📧 3-day reminder for ${sub.platform}\n   Recipient: ${platformEmail}\n   Expiry: ${sub.expiryDate}`);
      }
      if (days === 0 && builtInNotifs.dayOf) {
        messages.push(`📧 Day-of renewal reminder for ${sub.platform}\n   Recipient: ${platformEmail}\n   Expiry: ${sub.expiryDate}`);
      }
    });

    if (builtInNotifs.monthlySummary) {
      messages.push(` Monthly spend summary\n   Recipient: ${adminEmail}\n   Contains: Cost breakdown for all active subscriptions`);
    }

    if (builtInNotifs.newSub) {
      messages.push(` New subscription alerts\n   Recipient: ${adminEmail}\n   Triggered when new subscription is added`);
    }

    customNotifs.forEach((notif) => {
      const requiredDays = REMINDER_DAYS[notif.reminder];
      subscriptions.filter((sub) => sub.platform === notif.platform).forEach((sub) => {
        const days = getDaysUntilExpiry(sub.expiryDate);
        if (days === requiredDays) {
          messages.push(`in Custom reminder for ${sub.platform}\n   Recipient: ${notif.email}\n   Timing: ${notif.reminder}\n   Expiry: ${sub.expiryDate}`);
        }
      });
    });

    return messages;
  };

  const runReminderCheck = () => {
    const messages = collectDueReminders();
    if (messages.length === 0) {
      setReminderLog([`No scheduled reminders are due right now.`]);
    } else {
      setReminderLog(messages);
    }
  };

  const handleDeleteNotif = (id: string) => {
    setCustomNotifs((prev) => prev.filter((n) => n.id !== id));
  };

  const handleCreateCategory = () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;
    onCreateCategory(trimmed);
    setNewCategoryName("");
    setShowCreateCategory(false);
  };

  const handleCreateTeam = () => {
    const trimmed = newTeamName.trim();
    if (!trimmed) return;
    onCreateTeam(trimmed);
    setNewTeamName("");
    setShowCreateTeam(false);
  };

  const handleSaveProfile = async () => {
    setProfileSaveMessage(null);

    const hasPasswordChange =
      passwordData.currentPassword.length > 0 ||
      passwordData.newPassword.length > 0 ||
      passwordData.confirmPassword.length > 0;

    if (hasPasswordChange && passwordData.newPassword !== passwordData.confirmPassword) {
      setProfileSaveMessage({ type: "error", text: "New password and confirm password do not match." });
      return;
    }

    if (hasPasswordChange && (!passwordData.currentPassword || !passwordData.newPassword)) {
      setProfileSaveMessage({ type: "error", text: "Please enter your current password and a new password." });
      return;
    }

    try {
      if (onUpdateProfile) {
        await onUpdateProfile(profile);
      }

      if (hasPasswordChange) {
        const response = await fetch("/api/auth", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            currentPassword: passwordData.currentPassword,
            newPassword: passwordData.newPassword,
          }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => null);
          throw new Error(data?.message || "Unable to update password.");
        }
      }

      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setIsEditing(false);
      setProfileSaveMessage({ type: "success", text: "Profile updated successfully." });
    } catch (error) {
      setProfileSaveMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Unable to save profile.",
      });
    }
  };

  const handleVerifyCode = () => {
    if (verifyCode.length === 6) {
      setVerifySuccess(true);
      setGoogleAuth(true);
      setTimeout(() => {
        setShowQR(false);
        setVerifySuccess(false);
        setVerifyCode("");
      }, 2000);
    }
  };

  const handleEmailAuthToggle = async (enabled: boolean) => {
    if (!enabled) {
      // Disable email auth
      setEmailAuthLoading(true);
      setEmailAuthMessage(null);
      try {
        const response = await fetch("/api/2fa", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "disable" }),
        });
        if (!response.ok) throw new Error("Failed to disable email authentication");
        setEmailAuth(false);
        setShowEmailVerification(false);
        setEmailVerificationCode("");
        setEmailUsedForVerification("");
        setEmailAuthMessage({ type: "success", text: "Email authentication disabled." });
      } catch (error) {
        setEmailAuthMessage({
          type: "error",
          text: error instanceof Error ? error.message : "Failed to disable email authentication.",
        });
      } finally {
        setEmailAuthLoading(false);
      }
      return;
    }

    // Enable email auth - send verification code
    setEmailAuthLoading(true);
    setEmailAuthMessage(null);
    try {
      const emailToUse = profile.email.trim().toLowerCase();

      if (!emailToUse) {
        throw new Error("Email address is not set in your profile.");
      }

      const response = await fetch("/api/2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send", email: emailToUse }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.message || "Failed to send verification code");
      }

      setShowEmailVerification(true);
      setEmailVerificationCode("");
      setEmailUsedForVerification(emailToUse);
      setEmailAuthMessage({
        type: "info",
        text: `Verification code sent to ${emailToUse}. Please check your email and enter the code below.`,
      });
    } catch (error) {
      setEmailAuthMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to send verification code.",
      });
      setShowEmailVerification(false);
    } finally {
      setEmailAuthLoading(false);
    }
  };

  const handleEmailVerificationSubmit = async () => {
    if (!emailVerificationCode || emailVerificationCode.length < 6) {
      setEmailAuthMessage({
        type: "error",
        text: "Please enter a valid 6-digit code.",
      });
      return;
    }

    if (!emailUsedForVerification) {
      setEmailAuthMessage({
        type: "error",
        text: "Email for verification not set. Please try again.",
      });
      return;
    }

    setEmailAuthLoading(true);
    try {
      const response = await fetch("/api/2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "verify",
          email: emailUsedForVerification,
          code: emailVerificationCode,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.message || "Invalid verification code. Please try again.");
      }

      setEmailAuth(true);
      setShowEmailVerification(false);
      setEmailVerificationCode("");
      setEmailUsedForVerification("");
      setEmailAuthMessage({ type: "success", text: "✅ Email authentication enabled successfully!" });
      setTimeout(() => setEmailAuthMessage(null), 3000);
    } catch (error) {
      setEmailAuthMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to verify code. Please try again.",
      });
    } finally {
      setEmailAuthLoading(false);
    }
  };

  const filteredUsers = users.filter(
    (u) => u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  const categoryOrder: Category[] = categories;
  const categoryPlatforms = categoryOrder.reduce<Record<Category, string[]>>((acc, category) => {
    acc[category] = [];
    return acc;
  }, {} as Record<Category, string[]>);

  subscriptions.forEach((sub) => {
    if (!categoryPlatforms[sub.category]) {
      categoryPlatforms[sub.category] = [];
    }
    if (!categoryPlatforms[sub.category].includes(sub.platform)) {
      categoryPlatforms[sub.category].push(sub.platform);
    }
  });

  const platformOptions = Array.from(new Set(subscriptions.map((s) => s.platform)));

  return (
    <div className="flex flex-col lg:flex-row min-h-full [&_button]:cursor-pointer" style={{ background: "#f8fafc" }}>

      {/* Mobile: horizontal scrollable tab strip */}
      <div className="lg:hidden bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="px-4 pt-4 pb-1">
          <h2 style={{ color: "#0f172a", fontSize: "16px", fontWeight: 700, marginBottom: "2px" }}>Settings</h2>
          <p style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "10px" }}>Manage your account</p>
        </div>
        <div className="flex overflow-x-auto gap-1 px-3 pb-3 scrollbar-none" style={{ WebkitOverflowScrolling: "touch" }}>
          {settingsNav.map((item) => {
            const active = section === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setSection(item.id)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl flex-shrink-0 transition-all"
                style={{
                  background: active ? "rgba(99,102,241,0.1)" : "#f8fafc",
                  border: active ? "1px solid rgba(99,102,241,0.25)" : "1px solid #e2e8f0",
                  color: active ? "#6366f1" : "#64748b",
                  fontSize: "12px",
                  fontWeight: active ? 700 : 500,
                  whiteSpace: "nowrap",
                }}
              >
                <span style={{ color: active ? "#6366f1" : "#94a3b8" }}>{item.icon}</span>
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Desktop: left sidebar */}
      <div className="hidden lg:flex w-64 flex-shrink-0 p-5 flex-col gap-2" style={{ background: "white", borderRight: "1px solid #e2e8f0", minHeight: "100%" }}>
        <div className="mb-4">
          <h2 style={{ color: "#0f172a", marginBottom: "4px" }}>Settings</h2>
          <p style={{ fontSize: "12px", color: "#94a3b8" }}>Manage your account</p>
        </div>
        {settingsNav.map((item) => {
          const active = section === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setSection(item.id)}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all text-left"
              style={{
                background: active ? "rgba(99,102,241,0.08)" : "transparent",
                border: active ? "1px solid rgba(99,102,241,0.2)" : "1px solid transparent",
              }}
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: active ? "rgba(99,102,241,0.15)" : "#f1f5f9", color: active ? "#6366f1" : "#64748b" }}>
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p style={{ fontSize: "13px", fontWeight: active ? 600 : 500, color: active ? "#0f172a" : "#374151" }}>{item.label}</p>
                <p style={{ fontSize: "11px", color: "#94a3b8", marginTop: "1px" }}>{item.desc}</p>
              </div>
              {active && <ChevronRight size={14} style={{ color: "#6366f1", flexShrink: 0 }} />}
            </button>
          );
        })}
      </div>

      <div className="flex-1 p-4 lg:p-8">
        {section === "users" && (
          <div className="flex flex-col gap-6 max-w-4xl">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 style={{ color: "#0f172a", marginBottom: "4px" }}>User Management</h1>
                <p style={{ fontSize: "14px", color: "#64748b" }}>Manage team members, roles, and access</p>
              </div>
              <button
                onClick={() => setShowCreateUser(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", fontSize: "13px", fontWeight: 600, boxShadow: "0 4px 15px rgba(99,102,241,0.3)" }}
              >
                <Plus size={15} />
                Create User
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {[
                { label: "Total Users", value: users.length, color: "#6366f1", bg: "rgba(99,102,241,0.08)" },
                { label: "Admins", value: users.filter((u) => u.role === "Admin").length, color: "#f59e0b", bg: "rgba(245,158,11,0.08)" },
                { label: "Active Today", value: users.filter((u) => u.lastLogin.startsWith("2026-06-01")).length, color: "#10b981", bg: "rgba(16,185,129,0.08)" },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl p-5 flex items-center gap-4" style={{ background: "white", border: "1px solid #e2e8f0" }}>
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: s.bg }}>
                    <Users size={20} style={{ color: s.color }} />
                  </div>
                  <div>
                    <p style={{ fontSize: "24px", fontWeight: 700, color: "#0f172a", lineHeight: 1 }}>{s.value}</p>
                    <p style={{ fontSize: "12px", color: "#94a3b8", marginTop: "4px" }}>{s.label}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="relative max-w-xs">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#94a3b8" }} />
              <input
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search users..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl outline-none"
                style={{ border: "1.5px solid #e2e8f0", fontSize: "13px", color: "#0f172a", background: "white" }}
                onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
                onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
              />
            </div>

            <div className="rounded-2xl overflow-hidden" style={{ background: "white", border: "1px solid #e2e8f0" }}>
              <div className="overflow-x-auto">
              <table className="w-full" style={{ borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "1px solid #f1f5f9" }}>
                    {['User', 'Email', 'Role', 'Last Login', 'Actions'].map((h) => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#94a3b8', letterSpacing: '0.05em' }}>
                        {h.toUpperCase()}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user, i) => (
                    <tr key={user.id} style={{ borderBottom: i < filteredUsers.length - 1 ? '1px solid #f1f5f9' : 'none' }} className="hover:bg-slate-50 transition-colors">
                      <td style={{ padding: '14px 16px' }}>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white flex-shrink-0" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', fontSize: '13px', fontWeight: 700 }}>
                            {user.avatar}
                          </div>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{user.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '13px', color: '#64748b' }}>{user.email}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <span className="px-2.5 py-1 rounded-lg" style={{ fontSize: '11px', fontWeight: 600, ...ROLE_COLORS[user.role] }}>
                          {user.role}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div className="flex items-center gap-2">
                          <Clock size={12} style={{ color: '#94a3b8' }} />
                          <span style={{ fontSize: '12px', color: '#64748b' }}>{user.lastLogin}</span>
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => startEditUser(user)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center"
                            style={{ background: 'rgba(99,102,241,0.08)', color: '#6366f1' }}
                            title="Edit user"
                          >
                            <Edit2 size={13} />
                          </button>
                          {user.role !== 'Admin' && (
                            <button
                              onClick={() => requestDeleteUser(user)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                              style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444' }}
                              title="Delete user"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr><td colSpan={5} style={{ padding: '48px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>No users found</td></tr>
                  )}
                </tbody>
              </table>
              </div>
            </div>

            <div className="rounded-2xl p-5" style={{ background: 'white', border: '1px solid #e2e8f0' }}>
              <div className="flex items-center gap-2 mb-4">
                <UserCheck size={16} style={{ color: '#6366f1' }} />
                <h3 style={{ color: '#0f172a' }}>Last Login Activity</h3>
              </div>
              <div className="flex flex-col gap-3">
                {[...users].sort((a, b) => b.lastLogin.localeCompare(a.lastLogin)).map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 rounded-xl" style={{ background: '#f8fafc' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', fontSize: '11px', fontWeight: 700 }}>
                        {user.avatar}
                      </div>
                      <div>
                        <p style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{user.name}</p>
                        <p style={{ fontSize: '11px', color: '#94a3b8' }}>{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md" style={{ fontSize: '11px', fontWeight: 600, ...ROLE_COLORS[user.role] }}>{user.role}</span>
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg" style={{ background: user.lastLogin === 'Never' ? 'rgba(148,163,184,0.1)' : 'rgba(16,185,129,0.08)' }}>
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: user.lastLogin === 'Never' ? '#94a3b8' : '#10b981' }} />
                        <span style={{ fontSize: '11px', color: user.lastLogin === 'Never' ? '#94a3b8' : '#10b981', fontWeight: 600 }}>{user.lastLogin}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {section === "profile" && (
          <div className="flex flex-col gap-6 max-w-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h1 style={{ color: "#0f172a", marginBottom: "4px" }}>Profile</h1>
                <p style={{ fontSize: "14px", color: "#64748b" }}>Manage your account details and password</p>
              </div>
            </div>

            <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid #e2e8f0" }}>
              {/* Profile Card Header with Avatar and Pencil Edit Icon */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-5 mb-5">
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                    style={{
                      background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                      fontSize: "18px",
                    }}
                  >
                    {profile.username ? profile.username[0].toUpperCase() : "C"}
                  </div>
                  <div>
                    <h3 style={{ fontSize: "15px", fontWeight: 600, color: "#0f172a" }}>{profile.username}</h3>
                    <p style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>{profile.email}</p>
                  </div>
                </div>
                {!isEditing && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
                    title="Edit Profile"
                  >
                    <Edit2 size={15} style={{ color: "#64748b" }} />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px" }}>Username</label>
                  <input
                    value={profile.username}
                    onChange={(e) => setProfile((p: any) => ({ ...p, username: e.target.value }))}
                    disabled={!isEditing}
                    className="w-full px-3 py-2.5 rounded-xl outline-none"
                    style={{
                      border: "1.5px solid #e2e8f0",
                      fontSize: "13px",
                      color: !isEditing ? "#64748b" : "#0f172a",
                      background: !isEditing ? "#f8fafc" : "white",
                      cursor: !isEditing ? "not-allowed" : "text",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
                    onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px" }}>Company Name</label>
                  <input
                    value={profile.companyName}
                    onChange={(e) => setProfile((p: any) => ({ ...p, companyName: e.target.value }))}
                    disabled={!isEditing}
                    className="w-full px-3 py-2.5 rounded-xl outline-none"
                    style={{
                      border: "1.5px solid #e2e8f0",
                      fontSize: "13px",
                      color: !isEditing ? "#64748b" : "#0f172a",
                      background: !isEditing ? "#f8fafc" : "white",
                      cursor: !isEditing ? "not-allowed" : "text",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
                    onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px" }}>Role</label>
                  <input
                    value={profile.role}
                    readOnly
                    disabled={true}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 outline-none"
                    style={{
                      border: "1.5px solid #e2e8f0",
                      fontSize: "13px",
                      color: "#64748b",
                      background: "#f8fafc",
                      cursor: "not-allowed",
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px" }}>Email ID</label>
                  <input
                    value={profile.email}
                    onChange={(e) => setProfile((p: any) => ({ ...p, email: e.target.value }))}
                    disabled={!isEditing}
                    className="w-full px-3 py-2.5 rounded-xl outline-none"
                    style={{
                      border: "1.5px solid #e2e8f0",
                      fontSize: "13px",
                      color: !isEditing ? "#64748b" : "#0f172a",
                      background: !isEditing ? "#f8fafc" : "white",
                      cursor: !isEditing ? "not-allowed" : "text",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
                    onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
                  />
                </div>
              </div>
            </div>

            <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid #e2e8f0" }}>
              <h3 style={{ color: "#0f172a", marginBottom: "12px" }}>Change Password</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px" }}>Current Password</label>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData((p) => ({ ...p, currentPassword: e.target.value }))}
                    disabled={!isEditing}
                    className="w-full px-3 py-2.5 rounded-xl outline-none"
                    style={{
                      border: "1.5px solid #e2e8f0",
                      fontSize: "13px",
                      color: !isEditing ? "#64748b" : "#0f172a",
                      background: !isEditing ? "#f8fafc" : "white",
                      cursor: !isEditing ? "not-allowed" : "text",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
                    onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px" }}>New Password</label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData((p) => ({ ...p, newPassword: e.target.value }))}
                    disabled={!isEditing}
                    className="w-full px-3 py-2.5 rounded-xl outline-none"
                    style={{
                      border: "1.5px solid #e2e8f0",
                      fontSize: "13px",
                      color: !isEditing ? "#64748b" : "#0f172a",
                      background: !isEditing ? "#f8fafc" : "white",
                      cursor: !isEditing ? "not-allowed" : "text",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
                    onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px" }}>Confirm Password</label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData((p) => ({ ...p, confirmPassword: e.target.value }))}
                    disabled={!isEditing}
                    className="w-full px-3 py-2.5 rounded-xl outline-none"
                    style={{
                      border: "1.5px solid #e2e8f0",
                      fontSize: "13px",
                      color: !isEditing ? "#64748b" : "#0f172a",
                      background: !isEditing ? "#f8fafc" : "white",
                      cursor: !isEditing ? "not-allowed" : "text",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
                    onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
                  />
                </div>
              </div>
            </div>

            {isEditing && (
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
                  }}
                  className="px-4 py-2 rounded-xl"
                  style={{ border: "1.5px solid #e2e8f0", background: "white", color: "#64748b", fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void handleSaveProfile();
                  }}
                  className="px-4 py-2 rounded-xl text-white"
                  style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", fontWeight: 600 }}
                >
                  Save Profile
                </button>
              </div>
            )}
            {profileSaveMessage && (
              <div
                className="rounded-2xl px-4 py-3 text-sm"
                style={{
                  background: profileSaveMessage.type === "success" ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)",
                  color: profileSaveMessage.type === "success" ? "#10b981" : "#ef4444",
                  border: `1px solid ${profileSaveMessage.type === "success" ? "rgba(16,185,129,0.18)" : "rgba(239,68,68,0.18)"}`,
                }}
              >
                {profileSaveMessage.text}
              </div>
            )}
          </div>
        )}

        {section === "categories" && (
          <div className="flex flex-col gap-6 max-w-3xl">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 style={{ color: "#0f172a", marginBottom: "4px" }}>Categories</h1>
                <p style={{ fontSize: "14px", color: "#64748b" }}>View all categories and associated platforms</p>
              </div>
              <button
                onClick={() => setShowCreateCategory(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", fontSize: "13px", fontWeight: 600, boxShadow: "0 4px 15px rgba(99,102,241,0.3)" }}
              >
                <Plus size={15} />
                Create Category
              </button>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {categoryOrder.map((category) => (
                <div key={category} className="rounded-2xl p-5" style={{ background: "white", border: "1px solid #e2e8f0" }}>
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div>
                      <p style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a" }}>{category}</p>
                      <p style={{ fontSize: "12px", color: "#94a3b8", marginTop: "4px" }}>{categoryPlatforms[category]?.length || 0} platform{categoryPlatforms[category]?.length === 1 ? "" : "s"}</p>
                    </div>
                  <div className="px-3 py-1 rounded-full" style={{ background: `${categoryColors[category] || "#6366f1"}22`, color: categoryColors[category] || "#6366f1", fontWeight: 700, fontSize: "12px" }}>
                    {category}
                  </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {categoryPlatforms[category]?.length ? (
                      categoryPlatforms[category].map((platform) => (
                        <span key={platform} className="px-3 py-1 rounded-full" style={{ background: "#f8fafc", color: "#334155", fontSize: "12px" }}>
                          {platform}
                        </span>
                      ))
                    ) : (
                      <p style={{ fontSize: "13px", color: "#94a3b8" }}>No platforms assigned.</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {section === "teams" && (
          <div className="flex flex-col gap-6 max-w-3xl">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 style={{ color: "#0f172a", marginBottom: "4px" }}>Teams</h1>
                <p style={{ fontSize: "14px", color: "#64748b" }}>View and manage the teams used in subscriptions</p>
              </div>
              <button
                onClick={() => setShowCreateTeam(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", fontSize: "13px", fontWeight: 600, boxShadow: "0 4px 15px rgba(99,102,241,0.3)" }}
              >
                <Plus size={15} />
                Add Team
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {teams.map((team) => {
                const identity = getTeamIdentity(team);
                return (
                  <div key={team} className="rounded-2xl p-5" style={{ background: "white", border: "1px solid #e2e8f0" }}>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a" }}>{team}</p>
                        <p style={{ fontSize: "12px", color: "#94a3b8", marginTop: "4px" }}>Available for subscription assignments</p>
                      </div>
                      <span className="px-3 py-1 rounded-full" style={{ background: identity.light, color: identity.color, fontWeight: 700, fontSize: "12px" }}>
                        Team
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {section === "notifications" && (
          <div className="flex flex-col gap-6 max-w-2xl">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 style={{ color: "#0f172a", marginBottom: "4px" }}>Notifications</h1>
                <p style={{ fontSize: "14px", color: "#64748b" }}>Configure renewal reminders and alerts</p>
              </div>
              <button
                onClick={() => setShowAddNotif(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", fontSize: "13px", fontWeight: 600, boxShadow: "0 4px 15px rgba(99,102,241,0.3)" }}
              >
                <Plus size={15} />
                Add Notification
              </button>
            </div>

            <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid #e2e8f0" }}>
              <div className="flex items-center gap-2 mb-5">
                <Bell size={16} style={{ color: "#6366f1" }} />
                <h3 style={{ color: "#0f172a" }}>Default Reminders</h3>
              </div>
              <div className="flex flex-col gap-4">
                {[
                  { key: "sevenDay" as const, label: "7 days before renewal", sub: "Get notified a week in advance" },
                  { key: "threeDayBefore" as const, label: "3 days before renewal", sub: "Final reminder before billing" },
                  { key: "dayOf" as const, label: "Day of renewal", sub: "Notified on the billing day" },
                  { key: "monthlySummary" as const, label: "Monthly spend summary", sub: "Recap of all charges this month" },
                  { key: "newSub" as const, label: "New subscription added", sub: "Alert when a new plan is created" },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between py-3" style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <div>
                      <p style={{ fontSize: "14px", fontWeight: 500, color: "#0f172a" }}>{item.label}</p>
                      <p style={{ fontSize: "12px", color: "#94a3b8", marginTop: "2px" }}>{item.sub}</p>
                    </div>
                    <Toggle value={builtInNotifs[item.key]} onChange={(v) => {
                      const updated = { ...builtInNotifs, [item.key]: v };
                      setBuiltInNotifs(updated);
                      void saveNotificationSettings(updated);
                    }} />
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid #e2e8f0" }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Bell size={16} style={{ color: "#6366f1" }} />
                  <h3 style={{ color: "#0f172a" }}>Reminder Runner</h3>
                </div>
                <button
                  onClick={runReminderCheck}
                  className="px-4 py-2 rounded-xl text-white"
                  style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", fontSize: "13px", fontWeight: 600 }}
                >
                  Run reminder check
                </button>
              </div>
              <div className="flex flex-col gap-3">
                {reminderLog.length === 0 ? (
                  <p style={{ color: "#64748b", fontSize: "13px" }}>Run the reminder check to preview which emails would be sent based on expiry dates and reminder intervals.</p>
                ) : (
                  reminderLog.map((message, index) => (
                    <div key={index} className="rounded-2xl p-3" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                      <p style={{ fontSize: "13px", color: "#0f172a" }}>{message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {customNotifs.length > 0 && (
              <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid #e2e8f0" }}>
                <div className="flex items-center gap-2 mb-4">
                  <Bell size={16} style={{ color: "#10b981" }} />
                  <h3 style={{ color: "#0f172a" }}>Custom Notifications</h3>
                  <span className="px-2 py-0.5 rounded-full" style={{ fontSize: "11px", fontWeight: 700, background: "rgba(99,102,241,0.1)", color: "#6366f1" }}>{customNotifs.length}</span>
                </div>
                <div className="flex flex-col gap-3">
                  {customNotifs.map((notif) => (
                    <div key={notif.id} className="flex items-center justify-between p-4 rounded-xl" style={{ background: "#f8fafc", border: "1px solid #f1f5f9" }}>
                      <div className="flex items-center gap-4">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(99,102,241,0.1)", color: "#6366f1" }}>
                          <Mail size={16} />
                        </div>
                        <div>
                          <p style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a" }}>{notif.email}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span style={{ fontSize: "12px", color: "#94a3b8" }}>{notif.platform}</span>
                            <span style={{ fontSize: "12px", color: "#cbd5e1" }}>â€¢</span>
                            <span style={{ fontSize: "12px", color: "#94a3b8" }}>{notif.reminder}</span>
                          </div>
                        </div>
                      </div>
                      <button onClick={() => handleDeleteNotif(notif.id)} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(239,68,68,0.08)", color: "#ef4444" }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {section === "currency" && (
          <div className="flex flex-col gap-6 max-w-xl">
            <div>
              <h1 style={{ color: "#0f172a", marginBottom: "4px" }}>Currency Display</h1>
              <p style={{ fontSize: "14px", color: "#64748b" }}>Choose your primary and additional display currency</p>
            </div>

            <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid #e2e8f0" }}>
              <h3 style={{ color: "#0f172a", marginBottom: "4px" }}>Primary Currency</h3>
              <p style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "16px" }}>All amounts will be displayed in this currency</p>
              <div className="grid grid-cols-2 gap-3">
                {([
                  { code: "INR", name: "Indian Rupee", symbol: "₹", flag: "🇮🇳" },
                  { code: "USD", name: "US Dollar", symbol: "$", flag: "🇺🇸" },
                ] as const).map((c) => (
                  <button
                    key={c.code}
                    onClick={() => setPrimaryCurrency(c.code)}
                    className="flex items-center gap-4 p-4 rounded-xl transition-all text-left"
                    style={{
                      border: `2px solid ${primaryCurrency === c.code ? "#6366f1" : "#e2e8f0"}`,
                      background: primaryCurrency === c.code ? "rgba(99,102,241,0.04)" : "white",
                    }}
                  >
                    <span style={{ fontSize: "28px" }}>{c.flag}</span>
                    <div>
                      <p style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a" }}>{c.symbol} {c.code}</p>
                      <p style={{ fontSize: "12px", color: "#94a3b8" }}>{c.name}</p>
                    </div>
                    {primaryCurrency === c.code && (
                      <div className="ml-auto w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "#6366f1" }}>
                        <Check size={13} className="text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {section === "2fa" && (
          <div className="flex flex-col gap-6 max-w-xl">
            <div>
              <h1 style={{ color: "#0f172a", marginBottom: "4px" }}>Two-Factor Authentication</h1>
              <p style={{ fontSize: "14px", color: "#64748b" }}>Add an extra layer of security to your account</p>
            </div>

            <div className="rounded-2xl p-4 flex items-center gap-3"
              style={{ background: emailAuth || googleAuth ? "rgba(16,185,129,0.08)" : "rgba(245,158,11,0.08)", border: `1px solid ${emailAuth || googleAuth ? "rgba(16,185,129,0.25)" : "rgba(245,158,11,0.25)"}` }}>
              {emailAuth || googleAuth ? <Check size={16} style={{ color: "#10b981" }} /> : <AlertTriangle size={16} style={{ color: "#f59e0b" }} />}
              <p style={{ fontSize: "13px", fontWeight: 500, color: emailAuth || googleAuth ? "#10b981" : "#f59e0b" }}>
                {emailAuth || googleAuth ? "Two-factor authentication is active on your account." : "Your account is not protected with 2FA. Enable it below."}
              </p>
            </div>

            <div className="rounded-2xl p-6" style={{ background: "white", border: "1px solid #e2e8f0" }}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: emailAuth ? "rgba(16,185,129,0.12)" : "rgba(99,102,241,0.08)", color: emailAuth ? "#10b981" : "#6366f1" }}>
                    <Mail size={22} />
                  </div>
                  <div>
                    <p style={{ fontSize: "15px", fontWeight: 600, color: "#0f172a" }}>Email Authentication</p>
                    <p style={{ fontSize: "13px", color: "#64748b", marginTop: "4px", maxWidth: "320px" }}>
                      A one-time code will be sent to {profile.email} each time you log in.
                    </p>
                    {emailAuth && (
                      <div className="flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-lg self-start" style={{ background: "rgba(16,185,129,0.1)", display: "inline-flex" }}>
                        <Check size={12} style={{ color: "#10b981" }} />
                        <span style={{ fontSize: "12px", color: "#10b981", fontWeight: 600 }}>Enabled {profile.email}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0" style={{ opacity: emailAuthLoading ? 0.5 : 1, pointerEvents: emailAuthLoading ? "none" : "auto" }}>
                  <span style={{ fontSize: "12px", color: emailAuth ? "#10b981" : "#94a3b8", fontWeight: 600 }}>{emailAuth ? "ON" : "OFF"}</span>
                  <Toggle value={emailAuth} onChange={(v) => void handleEmailAuthToggle(v)} />
                </div>
              </div>

              {emailAuthMessage && (
                <div
                  className="mt-4 rounded-2xl px-4 py-3 text-sm"
                  style={{
                    background:
                      emailAuthMessage.type === "success"
                        ? "rgba(16,185,129,0.08)"
                        : emailAuthMessage.type === "error"
                        ? "rgba(239,68,68,0.08)"
                        : "rgba(59,130,246,0.08)",
                    color:
                      emailAuthMessage.type === "success"
                        ? "#10b981"
                        : emailAuthMessage.type === "error"
                        ? "#ef4444"
                        : "#0ea5e9",
                    border: `1px solid ${
                      emailAuthMessage.type === "success"
                        ? "rgba(16,185,129,0.18)"
                        : emailAuthMessage.type === "error"
                        ? "rgba(239,68,68,0.18)"
                        : "rgba(59,130,246,0.18)"
                    }`,
                  }}
                >
                  {emailAuthMessage.text}
                </div>
              )}

              {showEmailVerification && !emailAuth && (
                <div className="mt-5 pt-5" style={{ borderTop: "1px solid #f1f5f9" }}>
                  <p style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a", marginBottom: "12px" }}>Verify Your Email</p>
                  <div className="flex flex-col gap-3">
                    <p style={{ fontSize: "12px", color: "#64748b" }}>
                      Enter the 6-digit verification code sent to <strong>{emailUsedForVerification || profile.email}</strong>
                    </p>
                    <div className="flex gap-2">
                      <input
                        value={emailVerificationCode}
                        onChange={(e) => setEmailVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        placeholder="000000"
                        className="flex-1 px-3 py-2.5 rounded-xl outline-none"
                        style={{ border: "1.5px solid #e2e8f0", fontSize: "13px", letterSpacing: "0.2em", textAlign: "center" }}
                        onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
                        onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
                        maxLength={6}
                        autoComplete="off"
                      />
                      <button
                        onClick={() => void handleEmailVerificationSubmit()}
                        disabled={emailAuthLoading || emailVerificationCode.length < 6}
                        className="px-4 py-2.5 rounded-xl text-white transition-all"
                        style={{
                          background: emailVerificationCode.length === 6 && !emailAuthLoading ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : "#cbd5e1",
                          fontWeight: 600,
                          fontSize: "13px",
                          cursor: emailVerificationCode.length === 6 && !emailAuthLoading ? "pointer" : "not-allowed",
                          opacity: emailAuthLoading ? 0.7 : 1,
                        }}
                      >
                        {emailAuthLoading ? "Verifying..." : "Verify"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-2xl p-6" style={{ background: "white", border: "1px solid #e2e8f0" }}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: googleAuth ? "rgba(16,185,129,0.12)" : "rgba(234,88,12,0.08)", color: googleAuth ? "#10b981" : "#ea580c" }}>
                    <Smartphone size={22} />
                  </div>
                  <div>
                    <p style={{ fontSize: "15px", fontWeight: 600, color: "#0f172a" }}>Google Authenticator</p>
                    <p style={{ fontSize: "13px", color: "#64748b", marginTop: "4px", maxWidth: "320px" }}>
                      Use the Google Authenticator app to generate time-based one-time passwords (TOTP).
                    </p>
                    {googleAuth && (
                      <div className="flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-lg self-start" style={{ background: "rgba(16,185,129,0.1)", display: "inline-flex" }}>
                        <Check size={12} style={{ color: "#10b981" }} />
                        <span style={{ fontSize: "12px", color: "#10b981", fontWeight: 600 }}>Enabled & Verified</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span style={{ fontSize: "12px", color: googleAuth ? "#10b981" : "#94a3b8", fontWeight: 600 }}>{googleAuth ? "ON" : "OFF"}</span>
                  <Toggle
                    value={googleAuth}
                    onChange={(v) => {
                      if (v) {
                        setShowQR(true);
                      } else {
                        setGoogleAuth(false);
                        setShowQR(false);
                      }
                    }}
                  />
                </div>
              </div>

              {showQR && !googleAuth && (
                <div className="mt-5 pt-5" style={{ borderTop: "1px solid #f1f5f9" }}>
                  <p style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a", marginBottom: "12px" }}>Setup Google Authenticator</p>
                  <div className="flex gap-6 items-start">
                    <div className="flex-shrink-0">
                      <div className="w-32 h-32 rounded-xl flex items-center justify-center" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                        <svg width="100" height="100" viewBox="0 0 100 100">
                          {[0,1,2,3,4,5,6].map((r) =>
                            [0,1,2,3,4,5,6].map((c) => {
                              const inTopLeft = r < 3 && c < 3;
                              const inTopRight = r < 3 && c > 3;
                              const inBottomLeft = r > 3 && c < 3;
                              const fill = (inTopLeft || inTopRight || inBottomLeft || Math.random() > 0.5) ? "#0f172a" : "transparent";
                              return <rect key={`${r}-${c}`} x={c*13+5} y={r*13+5} width={11} height={11} fill={fill} rx={1} />;
                            })
                          )}
                        </svg>
                      </div>
                      <p style={{ fontSize: "10px", color: "#94a3b8", textAlign: "center", marginTop: "6px" }}>Scan with app</p>
                    </div>
                    <div className="flex flex-col gap-3 flex-1">
                      <p style={{ fontSize: "12px", color: "#64748b" }}>
                        1. Install <strong>Google Authenticator</strong> on your phone<br />
                        2. Scan the QR code or enter the key manually<br />
                        3. Enter the 6-digit code to verify
                      </p>
                      <div className="p-2 rounded-lg" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                        <p style={{ fontSize: "10px", color: "#94a3b8", marginBottom: "2px" }}>Manual key</p>
                        <p style={{ fontSize: "12px", fontWeight: 700, color: "#0f172a", letterSpacing: "0.15em" }}>JBSW Y3DP EHPK 3PXP</p>
                      </div>
                      <div className="flex gap-2">
                        <input
                          value={verifyCode}
                          onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                          placeholder="Enter 6-digit code"
                          className="flex-1 px-3 py-2 rounded-xl outline-none"
                          style={{ border: "1.5px solid #e2e8f0", fontSize: "13px", letterSpacing: "0.2em" }}
                          onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
                          onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
                          maxLength={6}
                        />
                        <button
                          onClick={handleVerifyCode}
                          className="px-4 py-2 rounded-xl text-white"
                          style={{ background: verifySuccess ? "#10b981" : "linear-gradient(135deg,#6366f1,#8b5cf6)", fontSize: "13px", fontWeight: 600, minWidth: "80px" }}
                        >
                          {verifySuccess ? <Check size={16} className="mx-auto" /> : "Verify"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {showCreateUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}>
          <div className="w-full max-w-md rounded-2xl overflow-hidden" style={{ background: "white", boxShadow: "0 25px 50px rgba(0,0,0,0.15)", maxHeight: "90vh" }}>
            <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: "1px solid #e2e8f0" }}>
              <h2 style={{ color: "#0f172a" }}>{editUserId ? "Edit User" : "Create New User"}</h2>
              <button
                onClick={() => {
                  setShowCreateUser(false);
                  setEditUserId(null);
                  setNewUser({ name: "", email: "", role: "Member", password: "" });
                  setShowNewUserPassword(false);
                }}
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: "#f1f5f9", color: "#64748b" }}
              >
                <X size={16} />
              </button>
            </div>
            <div className="px-6 py-5 flex flex-col gap-4 overflow-y-auto" style={{ maxHeight: "calc(90vh - 82px)" }}>
              {[
                { label: "Full Name *", key: "name" as const, placeholder: "e.g. Jamie Rivera" },
                { label: "Email Address *", key: "email" as const, placeholder: "e.g. jamie@example.com" },
              ].map((f) => (
                <div key={f.key}>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px" }}>{f.label}</label>
                  <input
                    value={newUser[f.key]}
                    onChange={(e) => setNewUser((p) => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="w-full px-3 py-2.5 rounded-xl outline-none"
                    style={{ border: "1.5px solid #e2e8f0", fontSize: "13px", color: "#0f172a" }}
                    onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
                    onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
                  />
                </div>
              ))}
              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px" }}>Role</label>
                <div className="flex gap-2">
                  {(["Admin", "Member", "Viewer"] as AppUser["role"][]).map((role) => (
                    <button
                      key={role}
                      onClick={() => setNewUser((p) => ({ ...p, role, ...(role === "Admin" ? { password: "" } : {}) }))}
                      className="flex-1 py-2 rounded-xl transition-all"
                      style={{
                        border: `1.5px solid ${newUser.role === role ? "#6366f1" : "#e2e8f0"}`,
                        fontSize: "13px",
                        fontWeight: newUser.role === role ? 600 : 400,
                        background: newUser.role === role ? "rgba(99,102,241,0.08)" : "white",
                        color: newUser.role === role ? "#6366f1" : "#64748b",
                      }}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>
              {newUser.role !== "Admin" && (
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px" }}>
                    Password {editUserId ? "(leave blank to keep current)" : "*"}
                  </label>
                  <div className="relative">
                    <input
                      type={showNewUserPassword ? "text" : "password"}
                      value={newUser.password}
                      onChange={(e) => setNewUser((p) => ({ ...p, password: e.target.value }))}
                      placeholder={editUserId ? "Leave blank to keep current" : "Set a login password"}
                      autoComplete="new-password"
                      className="w-full px-3 py-2.5 pr-10 rounded-xl outline-none"
                      style={{ border: "1.5px solid #e2e8f0", fontSize: "13px", color: "#0f172a" }}
                      onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
                      onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewUserPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      style={{ color: "#94a3b8" }}
                      tabIndex={-1}
                    >
                      {showNewUserPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
              )}
              <div className="flex gap-3 mt-2">
                <button
                  onClick={() => {
                    setShowCreateUser(false);
                    setEditUserId(null);
                    setNewUser({ name: "", email: "", role: "Member", password: "" });
                    setShowNewUserPassword(false);
                  }}
                  className="flex-1 py-2.5 rounded-xl"
                  style={{ border: "1.5px solid #e2e8f0", fontSize: "14px", color: "#64748b", background: "white" }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => { handleCreateUser(); setShowNewUserPassword(false); }}
                  className="flex-1 py-2.5 rounded-xl text-white"
                  style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", fontSize: "14px", fontWeight: 600 }}
                >
                  {editUserId ? "Save Changes" : "Create User"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddNotif && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}>
          <div className="w-full max-w-md rounded-2xl overflow-hidden" style={{ background: "white", boxShadow: "0 25px 50px rgba(0,0,0,0.15)", maxHeight: "90vh" }}>
            <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: "1px solid #e2e8f0" }}>
              <div>
                <h2 style={{ color: "#0f172a" }}>Add Notification</h2>
                <p style={{ fontSize: "13px", color: "#94a3b8" }}>Set a custom renewal alert</p>
              </div>
              <button onClick={() => setShowAddNotif(false)} className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "#f1f5f9", color: "#64748b" }}>
                <X size={16} />
              </button>
            </div>
            <div className="px-6 py-5 flex flex-col gap-4 overflow-y-auto" style={{ maxHeight: "calc(90vh - 82px)" }}>
              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px" }}>Email Address *</label>
                <input
                  value={notifForm.email}
                  onChange={(e) => setNotifForm((p) => ({ ...p, email: e.target.value }))}
                  placeholder="e.g. you@example.com"
                  type="email"
                  className="w-full px-3 py-2.5 rounded-xl outline-none"
                  style={{ border: "1.5px solid #e2e8f0", fontSize: "13px", color: "#0f172a" }}
                  onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
                  onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
                />
              </div>
              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px" }}>Platform *</label>
                <select
                  value={notifForm.platform}
                  onChange={(e) => setNotifForm((p) => ({ ...p, platform: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl outline-none"
                  style={{ border: "1.5px solid #e2e8f0", fontSize: "13px", color: notifForm.platform ? "#0f172a" : "#94a3b8" }}
                >
                  <option value="">Select platformï¿½</option>
                  {platformOptions.map((pl) => <option key={pl} value={pl}>{pl}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px" }}>Reminder Duration</label>
                <div className="flex flex-col gap-2">
                  {REMINDER_OPTIONS.map((opt) => (
                    <label key={opt} className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all"
                      style={{ border: `1.5px solid ${notifForm.reminder === opt ? "#6366f1" : "#f1f5f9"}`, background: notifForm.reminder === opt ? "rgba(99,102,241,0.04)" : "#fafafa" }}>
                      <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ border: `2px solid ${notifForm.reminder === opt ? "#6366f1" : "#cbd5e1"}`, background: notifForm.reminder === opt ? "#6366f1" : "transparent" }}>
                        {notifForm.reminder === opt && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <input type="radio" className="hidden" checked={notifForm.reminder === opt} onChange={() => setNotifForm((p) => ({ ...p, reminder: opt }))} />
                      <span style={{ fontSize: "13px", fontWeight: notifForm.reminder === opt ? 600 : 400, color: notifForm.reminder === opt ? "#0f172a" : "#64748b" }}>{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 mt-2">
                <button onClick={() => setShowAddNotif(false)} className="flex-1 py-2.5 rounded-xl" style={{ border: "1.5px solid #e2e8f0", fontSize: "14px", color: "#64748b", background: "white" }}>
                  Cancel
                </button>
                <button onClick={handleAddNotif} className="flex-1 py-2.5 rounded-xl text-white" style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", fontSize: "14px", fontWeight: 600 }}>
                  Add Notification
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showCreateCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}>
          <div className="w-full max-w-md rounded-2xl overflow-hidden" style={{ background: "white", boxShadow: "0 25px 50px rgba(0,0,0,0.15)" }}>
            <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: "1px solid #e2e8f0" }}>
              <div>
                <h2 style={{ color: "#0f172a" }}>Create Category</h2>
                <p style={{ fontSize: "13px", color: "#94a3b8" }}>Add a new category for subscriptions</p>
              </div>
              <button
                onClick={() => {
                  setShowCreateCategory(false);
                  setNewCategoryName("");
                }}
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: "#f1f5f9", color: "#64748b" }}
              >
                <X size={16} />
              </button>
            </div>
            <div className="px-6 py-5 flex flex-col gap-4">
              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px" }}>
                  Enter New Category
                </label>
                <input
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="e.g. Marketing Tools"
                  className="w-full px-3 py-2.5 rounded-xl outline-none"
                  style={{ border: "1.5px solid #e2e8f0", fontSize: "13px", color: "#0f172a" }}
                  onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
                  onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowCreateCategory(false);
                    setNewCategoryName("");
                  }}
                  className="flex-1 py-2.5 rounded-xl"
                  style={{ border: "1.5px solid #e2e8f0", fontSize: "14px", color: "#64748b", background: "white" }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateCategory}
                  className="flex-1 py-2.5 rounded-xl text-white"
                  style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", fontSize: "14px", fontWeight: 600 }}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showCreateTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}>
          <div className="w-full max-w-md rounded-2xl overflow-hidden" style={{ background: "white", boxShadow: "0 25px 50px rgba(0,0,0,0.15)" }}>
            <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: "1px solid #e2e8f0" }}>
              <div>
                <h2 style={{ color: "#0f172a" }}>Add Team</h2>
                <p style={{ fontSize: "13px", color: "#94a3b8" }}>Create a new team for subscriptions</p>
              </div>
              <button
                onClick={() => {
                  setShowCreateTeam(false);
                  setNewTeamName("");
                }}
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: "#f1f5f9", color: "#64748b" }}
              >
                <X size={16} />
              </button>
            </div>
            <div className="px-6 py-5 flex flex-col gap-4">
              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px" }}>
                  Enter Team
                </label>
                <input
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="e.g. Finance"
                  className="w-full px-3 py-2.5 rounded-xl outline-none"
                  style={{ border: "1.5px solid #e2e8f0", fontSize: "13px", color: "#0f172a" }}
                  onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
                  onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowCreateTeam(false);
                    setNewTeamName("");
                  }}
                  className="flex-1 py-2.5 rounded-xl"
                  style={{ border: "1.5px solid #e2e8f0", fontSize: "14px", color: "#64748b", background: "white" }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateTeam}
                  className="flex-1 py-2.5 rounded-xl text-white"
                  style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", fontSize: "14px", fontWeight: 600 }}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {pendingDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(4px)" }}>
          <div className="w-full max-w-sm rounded-3xl overflow-hidden" style={{ background: "white", boxShadow: "0 25px 50px rgba(0,0,0,0.18)" }}>
            <div className="p-6 text-center">
              <div className="mx-auto mb-4 w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "rgba(248,113,113,0.14)" }}>
                <AlertTriangle size={28} style={{ color: "#ef4444" }} />
              </div>
              <h2 style={{ color: "#0f172a", fontSize: "22px", marginBottom: "8px" }}>Delete?</h2>
              <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "24px" }}>
                Are you sure you want to DELETE USER {deleteTargetName ? `"${deleteTargetName}"` : "this user"}?
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={cancelDelete}
                  className="flex-1 py-3 rounded-xl"
                  style={{ border: "1px solid #e2e8f0", background: "white", color: "#64748b", fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteUser}
                  className="flex-1 py-3 rounded-xl text-white"
                  style={{ background: "#ef4444", fontWeight: 600 }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export const SettingsPage = memo(SettingsPageComponent);
