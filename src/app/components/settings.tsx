import { useState } from "react";
import {
  Users, Bell, DollarSign, Shield,
  Plus, Trash2, X, Check, UserCheck,
  Clock, Mail, Smartphone, ChevronRight,
  Search, Edit2, AlertTriangle,
} from "lucide-react";
import { Subscription } from "../data/subscriptions";

type SettingsSection = "users" | "notifications" | "currency" | "2fa";

interface SettingsPageProps {
  subscriptions: Subscription[];
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface AppUser {
  id: string;
  name: string;
  email: string;
  role: "Admin" | "Member" | "Viewer";
  lastLogin: string;
  avatar: string;
}

interface CustomNotification {
  id: string;
  email: string;
  platform: string;
  reminder: string;
}

// ─── Initial data ─────────────────────────────────────────────────────────────

const initialUsers: AppUser[] = [
  { id: "1", name: "Charan Sai", email: "Charan@webomindapps.com", role: "Admin", lastLogin: "2026-06-01 09:14", avatar: "C" },
  { id: "2", name: "Alex Johnson", email: "alex@example.com", role: "Member", lastLogin: "2026-05-31 16:42", avatar: "A" },
  { id: "3", name: "Jordan Lee", email: "jordan@example.com", role: "Member", lastLogin: "2026-05-30 11:05", avatar: "J" },
  { id: "4", name: "Taylor Smith", email: "taylor@example.com", role: "Viewer", lastLogin: "2026-05-28 14:20", avatar: "T" },
];

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

// ─── Submenu nav items ────────────────────────────────────────────────────────

const settingsNav: { id: SettingsSection; label: string; icon: React.ReactNode; desc: string }[] = [
  { id: "users", label: "User Management", icon: <Users size={17} />, desc: "Manage team members & roles" },
  { id: "notifications", label: "Notifications", icon: <Bell size={17} />, desc: "Renewal alerts & reminders" },
  { id: "currency", label: "Currency Display", icon: <DollarSign size={17} />, desc: "Set your preferred currency" },
  { id: "2fa", label: "Two-Factor Auth", icon: <Shield size={17} />, desc: "Secure your account" },
];

// ─── Shared toggle component ──────────────────────────────────────────────────

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

// ─── Main component ───────────────────────────────────────────────────────────

export function SettingsPage({ subscriptions }: SettingsPageProps) {
  const [section, setSection] = useState<SettingsSection>("users");

  // ── User Management state ──
  const [users, setUsers] = useState<AppUser[]>(initialUsers);
  const [userSearch, setUserSearch] = useState("");
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [newUser, setNewUser] = useState({ name: "", email: "", role: "Member" as AppUser["role"] });

  // ── Notification state ──
  const [builtInNotifs, setBuiltInNotifs] = useState({
    sevenDay: true,
    threeDayBefore: true,
    dayOf: false,
    monthlySummary: true,
    newSub: false,
  });
  const [customNotifs, setCustomNotifs] = useState<CustomNotification[]>([]);
  const [showAddNotif, setShowAddNotif] = useState(false);
  const [notifForm, setNotifForm] = useState({ email: "", platform: "", reminder: REMINDER_OPTIONS[0] });

  // ── Currency state ──
  const [primaryCurrency, setPrimaryCurrency] = useState<"INR" | "USD">("INR");
  const [additionalCurrency, setAdditionalCurrency] = useState<"USD" | "INR" | "EUR" | "None">("USD");
  const [exchangeRates] = useState({ INR: 83.5, USD: 1, EUR: 0.92 });

  // ── 2FA state ──
  const [emailAuth, setEmailAuth] = useState(false);
  const [googleAuth, setGoogleAuth] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [verifyCode, setVerifyCode] = useState("");
  const [verifySuccess, setVerifySuccess] = useState(false);

  // ── Handlers ──

  const handleCreateUser = () => {
    if (!newUser.name || !newUser.email) return;
    const id = String(Date.now());
    setUsers((prev) => [...prev, {
      id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      lastLogin: "Never",
      avatar: newUser.name[0].toUpperCase(),
    }]);
    setNewUser({ name: "", email: "", role: "Member" });
    setShowCreateUser(false);
  };

  const handleDeleteUser = (id: string) => {
    if (deleteConfirm === id) {
      setUsers((prev) => prev.filter((u) => u.id !== id));
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(id);
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  const handleAddNotif = () => {
    if (!notifForm.email || !notifForm.platform) return;
    setCustomNotifs((prev) => [...prev, { id: String(Date.now()), ...notifForm }]);
    setNotifForm({ email: "", platform: "", reminder: REMINDER_OPTIONS[0] });
    setShowAddNotif(false);
  };

  const handleDeleteNotif = (id: string) => {
    setCustomNotifs((prev) => prev.filter((n) => n.id !== id));
  };

  const handleVerifyCode = () => {
    if (verifyCode.length === 6) {
      setVerifySuccess(true);
      setGoogleAuth(true);
      setTimeout(() => { setShowQR(false); setVerifySuccess(false); setVerifyCode(""); }, 2000);
    }
  };

  const filteredUsers = users.filter(
    (u) => u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  const platformOptions = Array.from(new Set(subscriptions.map((s) => s.platform)));

  // ── Currency helper ──
  const currencySymbol = (c: string) => c === "INR" ? "₹" : c === "USD" ? "$" : c === "EUR" ? "€" : "";
  const currencyLabel = (c: string) => `${currencySymbol(c)} ${c}`;

  return (
    <div className="flex h-full min-h-screen" style={{ background: "#f8fafc" }}>
      {/* Settings submenu */}
      <div className="w-64 flex-shrink-0 p-5 flex flex-col gap-2" style={{ background: "white", borderRight: "1px solid #e2e8f0", minHeight: "100vh" }}>
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

      {/* Section content */}
      <div className="flex-1 p-8 overflow-y-auto">

        {/* ── USER MANAGEMENT ── */}
        {section === "users" && (
          <div className="flex flex-col gap-6 max-w-4xl">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 style={{ color: "#0f172a", marginBottom: "4px" }}>User Management</h1>
                <p style={{ fontSize: "14px", color: "#64748b" }}>Manage team members, roles, and access</p>
              </div>
              <button
                onClick={() => setShowCreateUser(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white"
                style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", fontSize: "13px", fontWeight: 600, boxShadow: "0 4px 15px rgba(99,102,241,0.3)" }}
              >
                <Plus size={15} />
                Create User
              </button>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-3 gap-4">
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

            {/* Search */}
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

            {/* Users table */}
            <div className="rounded-2xl overflow-hidden" style={{ background: "white", border: "1px solid #e2e8f0" }}>
              <table className="w-full" style={{ borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "1px solid #f1f5f9" }}>
                    {["User", "Email", "Role", "Last Login", "Actions"].map((h) => (
                      <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", fontWeight: 600, color: "#94a3b8", letterSpacing: "0.05em" }}>
                        {h.toUpperCase()}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user, i) => (
                    <tr key={user.id} style={{ borderBottom: i < filteredUsers.length - 1 ? "1px solid #f1f5f9" : "none" }} className="hover:bg-slate-50 transition-colors">
                      <td style={{ padding: "14px 16px" }}>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white flex-shrink-0"
                            style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", fontSize: "13px", fontWeight: 700 }}>
                            {user.avatar}
                          </div>
                          <span style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a" }}>{user.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: "14px 16px", fontSize: "13px", color: "#64748b" }}>{user.email}</td>
                      <td style={{ padding: "14px 16px" }}>
                        <span className="px-2.5 py-1 rounded-lg" style={{ fontSize: "11px", fontWeight: 600, ...ROLE_COLORS[user.role] }}>
                          {user.role}
                        </span>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <div className="flex items-center gap-2">
                          <Clock size={12} style={{ color: "#94a3b8" }} />
                          <span style={{ fontSize: "12px", color: "#64748b" }}>{user.lastLogin}</span>
                        </div>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <div className="flex items-center gap-2">
                          <button className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(99,102,241,0.08)", color: "#6366f1" }}>
                            <Edit2 size={13} />
                          </button>
                          {user.role !== "Admin" && (
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                              style={{ background: deleteConfirm === user.id ? "rgba(239,68,68,0.18)" : "rgba(239,68,68,0.08)", color: "#ef4444" }}
                              title={deleteConfirm === user.id ? "Click again to confirm delete" : "Delete user"}
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr><td colSpan={5} style={{ padding: "48px", textAlign: "center", color: "#94a3b8", fontSize: "14px" }}>No users found</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Last Login Activity */}
            <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid #e2e8f0" }}>
              <div className="flex items-center gap-2 mb-4">
                <UserCheck size={16} style={{ color: "#6366f1" }} />
                <h3 style={{ color: "#0f172a" }}>Last Login Activity</h3>
              </div>
              <div className="flex flex-col gap-3">
                {[...users].sort((a, b) => b.lastLogin.localeCompare(a.lastLogin)).map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 rounded-xl" style={{ background: "#f8fafc" }}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white" style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", fontSize: "11px", fontWeight: 700 }}>
                        {user.avatar}
                      </div>
                      <div>
                        <p style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a" }}>{user.name}</p>
                        <p style={{ fontSize: "11px", color: "#94a3b8" }}>{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md" style={{ fontSize: "11px", fontWeight: 600, ...ROLE_COLORS[user.role] }}>{user.role}</span>
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg" style={{ background: user.lastLogin === "Never" ? "rgba(148,163,184,0.1)" : "rgba(16,185,129,0.08)" }}>
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: user.lastLogin === "Never" ? "#94a3b8" : "#10b981" }} />
                        <span style={{ fontSize: "11px", color: user.lastLogin === "Never" ? "#94a3b8" : "#10b981", fontWeight: 600 }}>{user.lastLogin}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── NOTIFICATIONS ── */}
        {section === "notifications" && (
          <div className="flex flex-col gap-6 max-w-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h1 style={{ color: "#0f172a", marginBottom: "4px" }}>Notifications</h1>
                <p style={{ fontSize: "14px", color: "#64748b" }}>Configure renewal reminders and alerts</p>
              </div>
              <button
                onClick={() => setShowAddNotif(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white"
                style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", fontSize: "13px", fontWeight: 600, boxShadow: "0 4px 15px rgba(99,102,241,0.3)" }}
              >
                <Plus size={15} />
                Add Notification
              </button>
            </div>

            {/* Built-in reminders */}
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
                    <Toggle value={builtInNotifs[item.key]} onChange={(v) => setBuiltInNotifs((p) => ({ ...p, [item.key]: v }))} />
                  </div>
                ))}
              </div>
            </div>

            {/* Custom notifications */}
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
                            <span style={{ fontSize: "12px", color: "#cbd5e1" }}>·</span>
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

        {/* ── CURRENCY DISPLAY ── */}
        {section === "currency" && (
          <div className="flex flex-col gap-6 max-w-xl">
            <div>
              <h1 style={{ color: "#0f172a", marginBottom: "4px" }}>Currency Display</h1>
              <p style={{ fontSize: "14px", color: "#64748b" }}>Choose your primary and additional display currency</p>
            </div>

            {/* Primary currency */}
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

            {/* Additional currency */}
            <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid #e2e8f0" }}>
              <h3 style={{ color: "#0f172a", marginBottom: "4px" }}>Additional Currency</h3>
              <p style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "16px" }}>Show a secondary currency alongside the primary</p>
              <div className="grid grid-cols-2 gap-3">
                {([
                  { code: "USD", name: "US Dollar", symbol: "$", flag: "🇺🇸" },
                  { code: "EUR", name: "Euro", symbol: "€", flag: "🇪🇺" },
                  { code: "INR", name: "Indian Rupee", symbol: "₹", flag: "🇮🇳" },
                  { code: "None", name: "No additional", symbol: "—", flag: "🚫" },
                ] as const).map((c) => (
                  <button
                    key={c.code}
                    onClick={() => setAdditionalCurrency(c.code)}
                    className="flex items-center gap-3 p-3 rounded-xl transition-all text-left"
                    style={{
                      border: `2px solid ${additionalCurrency === c.code ? "#8b5cf6" : "#e2e8f0"}`,
                      background: additionalCurrency === c.code ? "rgba(139,92,246,0.04)" : "white",
                      opacity: c.code === primaryCurrency ? 0.4 : 1,
                      pointerEvents: c.code === primaryCurrency ? "none" : "auto",
                    }}
                  >
                    <span style={{ fontSize: "22px" }}>{c.flag}</span>
                    <div>
                      <p style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a" }}>{c.code}</p>
                      <p style={{ fontSize: "11px", color: "#94a3b8" }}>{c.name}</p>
                    </div>
                    {additionalCurrency === c.code && (
                      <div className="ml-auto w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "#8b5cf6" }}>
                        <Check size={11} className="text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Live exchange preview */}
            {additionalCurrency !== "None" && (
              <div className="rounded-2xl p-5" style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.08))", border: "1px solid rgba(99,102,241,0.2)" }}>
                <p style={{ fontSize: "13px", fontWeight: 600, color: "#6366f1", marginBottom: "12px" }}>Exchange Rate Preview</p>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p style={{ fontSize: "28px", fontWeight: 700, color: "#0f172a" }}>{currencySymbol(primaryCurrency)}100</p>
                    <p style={{ fontSize: "12px", color: "#64748b" }}>{primaryCurrency}</p>
                  </div>
                  <div style={{ flex: 1, height: "1px", background: "rgba(99,102,241,0.3)" }} />
                  <div className="text-center">
                    <p style={{ fontSize: "28px", fontWeight: 700, color: "#6366f1" }}>
                      {currencySymbol(additionalCurrency)}
                      {primaryCurrency === "INR" && additionalCurrency === "USD" ? (100 / exchangeRates.INR).toFixed(2) :
                        primaryCurrency === "USD" && additionalCurrency === "INR" ? (100 * exchangeRates.INR).toFixed(2) :
                          primaryCurrency === "USD" && additionalCurrency === "EUR" ? (100 * exchangeRates.EUR).toFixed(2) :
                            "—"}
                    </p>
                    <p style={{ fontSize: "12px", color: "#64748b" }}>{additionalCurrency}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TWO-FACTOR AUTH ── */}
        {section === "2fa" && (
          <div className="flex flex-col gap-6 max-w-xl">
            <div>
              <h1 style={{ color: "#0f172a", marginBottom: "4px" }}>Two-Factor Authentication</h1>
              <p style={{ fontSize: "14px", color: "#64748b" }}>Add an extra layer of security to your account</p>
            </div>

            {/* Status banner */}
            <div className="rounded-2xl p-4 flex items-center gap-3"
              style={{ background: emailAuth || googleAuth ? "rgba(16,185,129,0.08)" : "rgba(245,158,11,0.08)", border: `1px solid ${emailAuth || googleAuth ? "rgba(16,185,129,0.25)" : "rgba(245,158,11,0.25)"}` }}>
              {emailAuth || googleAuth ? <Check size={16} style={{ color: "#10b981" }} /> : <AlertTriangle size={16} style={{ color: "#f59e0b" }} />}
              <p style={{ fontSize: "13px", fontWeight: 500, color: emailAuth || googleAuth ? "#10b981" : "#f59e0b" }}>
                {emailAuth || googleAuth ? "Two-factor authentication is active on your account." : "Your account is not protected with 2FA. Enable it below."}
              </p>
            </div>

            {/* Email 2FA */}
            <div className="rounded-2xl p-6" style={{ background: "white", border: "1px solid #e2e8f0" }}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: emailAuth ? "rgba(16,185,129,0.12)" : "rgba(99,102,241,0.08)", color: emailAuth ? "#10b981" : "#6366f1" }}>
                    <Mail size={22} />
                  </div>
                  <div>
                    <p style={{ fontSize: "15px", fontWeight: 600, color: "#0f172a" }}>Email Authentication</p>
                    <p style={{ fontSize: "13px", color: "#64748b", marginTop: "4px", maxWidth: "320px" }}>
                      A one-time code will be sent to your registered email address each time you log in.
                    </p>
                    {emailAuth && (
                      <div className="flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-lg self-start" style={{ background: "rgba(16,185,129,0.1)", display: "inline-flex" }}>
                        <Check size={12} style={{ color: "#10b981" }} />
                        <span style={{ fontSize: "12px", color: "#10b981", fontWeight: 600 }}>Enabled — Charan@webomindapps.com</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span style={{ fontSize: "12px", color: emailAuth ? "#10b981" : "#94a3b8", fontWeight: 600 }}>{emailAuth ? "ON" : "OFF"}</span>
                  <Toggle value={emailAuth} onChange={setEmailAuth} />
                </div>
              </div>
            </div>

            {/* Google Authenticator 2FA */}
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
                      if (v) { setShowQR(true); }
                      else { setGoogleAuth(false); setShowQR(false); }
                    }}
                  />
                </div>
              </div>

              {/* QR setup flow */}
              {showQR && !googleAuth && (
                <div className="mt-5 pt-5" style={{ borderTop: "1px solid #f1f5f9" }}>
                  <p style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a", marginBottom: "12px" }}>Setup Google Authenticator</p>
                  <div className="flex gap-6 items-start">
                    {/* QR placeholder */}
                    <div className="flex-shrink-0">
                      <div className="w-32 h-32 rounded-xl flex items-center justify-center" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                        <svg width="100" height="100" viewBox="0 0 100 100">
                          {/* Simulated QR code pattern */}
                          {[0,1,2,3,4,5,6].map(r => [0,1,2,3,4,5,6].map(c => {
                            const inTopLeft = r < 3 && c < 3;
                            const inTopRight = r < 3 && c > 3;
                            const inBottomLeft = r > 3 && c < 3;
                            const fill = (inTopLeft || inTopRight || inBottomLeft || Math.random() > 0.5) ? "#0f172a" : "transparent";
                            return <rect key={`${r}-${c}`} x={c*13+5} y={r*13+5} width={11} height={11} fill={fill} rx={1} />;
                          }))}
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

      {/* ── Create User Modal ── */}
      {showCreateUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}>
          <div className="w-full max-w-md rounded-2xl overflow-hidden" style={{ background: "white", boxShadow: "0 25px 50px rgba(0,0,0,0.15)" }}>
            <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: "1px solid #e2e8f0" }}>
              <h2 style={{ color: "#0f172a" }}>Create New User</h2>
              <button onClick={() => setShowCreateUser(false)} className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "#f1f5f9", color: "#64748b" }}>
                <X size={16} />
              </button>
            </div>
            <div className="px-6 py-5 flex flex-col gap-4">
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
                      onClick={() => setNewUser((p) => ({ ...p, role }))}
                      className="flex-1 py-2 rounded-xl transition-all"
                      style={{
                        border: `1.5px solid ${newUser.role === role ? "#6366f1" : "#e2e8f0"}`,
                        fontSize: "13px", fontWeight: newUser.role === role ? 600 : 400,
                        background: newUser.role === role ? "rgba(99,102,241,0.08)" : "white",
                        color: newUser.role === role ? "#6366f1" : "#64748b",
                      }}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 mt-2">
                <button onClick={() => setShowCreateUser(false)} className="flex-1 py-2.5 rounded-xl" style={{ border: "1.5px solid #e2e8f0", fontSize: "14px", color: "#64748b", background: "white" }}>
                  Cancel
                </button>
                <button onClick={handleCreateUser} className="flex-1 py-2.5 rounded-xl text-white" style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", fontSize: "14px", fontWeight: 600 }}>
                  Create User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Notification Modal ── */}
      {showAddNotif && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}>
          <div className="w-full max-w-md rounded-2xl overflow-hidden" style={{ background: "white", boxShadow: "0 25px 50px rgba(0,0,0,0.15)" }}>
            <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: "1px solid #e2e8f0" }}>
              <div>
                <h2 style={{ color: "#0f172a" }}>Add Notification</h2>
                <p style={{ fontSize: "13px", color: "#94a3b8" }}>Set a custom renewal alert</p>
              </div>
              <button onClick={() => setShowAddNotif(false)} className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "#f1f5f9", color: "#64748b" }}>
                <X size={16} />
              </button>
            </div>
            <div className="px-6 py-5 flex flex-col gap-4">
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
                  <option value="">Select platform…</option>
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
    </div>
  );
}
