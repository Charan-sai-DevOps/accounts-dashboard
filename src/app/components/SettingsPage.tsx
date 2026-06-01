import { useEffect, useState } from "react";
import { Bell, CreditCard, Shield, Palette, User } from "lucide-react";
import { AppSettings, defaultAppSettings } from "../data/settings";

export function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>(defaultAppSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingMail, setTestingMail] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadSettings() {
      try {
        const response = await fetch("/api/settings");
        if (!response.ok) {
          throw new Error("Unable to load settings.");
        }
        const data = (await response.json()) as AppSettings;
        setSettings(data);
      } catch (error) {
        console.error(error);
        setStatusMessage("Failed to load settings.");
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, []);

  const handleToggle = (path: keyof AppSettings["reminders"] | keyof AppSettings["notifications"], value: boolean) => {
    if (path in settings.reminders) {
      setSettings((prev) => ({
        ...prev,
        reminders: {
          ...prev.reminders,
          [path]: value,
        },
      }));
    } else {
      setSettings((prev) => ({
        ...prev,
        notifications: {
          ...prev.notifications,
          [path]: value,
        },
      }));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setStatusMessage(null);

    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!response.ok) {
        throw new Error("Unable to save settings.");
      }
      setStatusMessage("Settings saved successfully.");
    } catch (error) {
      console.error(error);
      setStatusMessage("Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleSendTestMail = async () => {
    setTestingMail(true);
    setStatusMessage(null);

    try {
      const response = await fetch("/api/mail/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: settings.email }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to send test email.");
      }

      setStatusMessage("Test email sent successfully!");
    } catch (error) {
      console.error(error);
      setStatusMessage(error instanceof Error ? error.message : "Failed to send test email.");
    } finally {
      setTestingMail(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6 min-h-full" style={{ background: "#f8fafc" }}>
      <div>
        <h1 style={{ color: "#0f172a", marginBottom: "4px" }}>Settings</h1>
        <p style={{ color: "#64748b", fontSize: "14px" }}>Manage your preferences and account settings</p>
      </div>

      {statusMessage ? (
        <div className="rounded-2xl p-4 text-sm" style={{ background: "#eef2ff", color: "#3730a3" }}>
          {statusMessage}
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl p-6" style={{ background: "white", border: "1px solid #e2e8f0" }}>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(99,102,241,0.1)", color: "#6366f1" }}>
              <User size={18} />
            </div>
            <h3 style={{ color: "#0f172a" }}>Profile</h3>
          </div>
          <div className="flex flex-col gap-4">
            <div>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px" }}>
                Full Name
              </label>
              <input
                value={settings.fullName}
                onChange={(event) => setSettings((prev) => ({ ...prev, fullName: event.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl outline-none"
                style={{ border: "1.5px solid #e2e8f0", fontSize: "13px", color: "#0f172a" }}
                onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
                onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
              />
            </div>
            <div>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px" }}>
                Email Address
              </label>
              <input
                value={settings.email}
                onChange={(event) => setSettings((prev) => ({ ...prev, email: event.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl outline-none"
                style={{ border: "1.5px solid #e2e8f0", fontSize: "13px", color: "#0f172a" }}
                onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
                onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
              />
            </div>
            <div>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px" }}>
                Company
              </label>
              <input
                value={settings.company}
                onChange={(event) => setSettings((prev) => ({ ...prev, company: event.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl outline-none"
                style={{ border: "1.5px solid #e2e8f0", fontSize: "13px", color: "#0f172a" }}
                onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
                onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
              />
            </div>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || loading}
              className="px-4 py-2.5 rounded-xl text-white"
              style={{
                background: saving ? "#8b5cf6" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
                fontSize: "13px",
                fontWeight: 600,
                marginTop: "4px",
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? "Saving..." : "Save Profile"}
            </button>
          </div>
        </div>

        <div className="rounded-2xl p-6" style={{ background: "white", border: "1px solid #e2e8f0" }}>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(245,158,11,0.1)", color: "#f59e0b" }}>
              <Bell size={18} />
            </div>
            <h3 style={{ color: "#0f172a" }}>Notifications</h3>
          </div>
          <div className="flex flex-col gap-4">
            {[
              { label: "Renewal reminders (7 days before)", field: "before7Days" },
              { label: "Renewal reminders (3 days before)", field: "before3Days" },
              { label: "Renewal reminders (day of)", field: "onDay" },
              { label: "Monthly spend summary", field: "monthlySpendSummary" },
              { label: "New subscription added", field: "newSubscriptionAdded" },
            ].map((item) => {
              const checked =
                item.field === "monthlySpendSummary" || item.field === "newSubscriptionAdded"
                  ? settings.notifications[item.field as keyof typeof settings.notifications]
                  : settings.reminders[item.field as keyof typeof settings.reminders];

              return (
                <label key={item.label} className="flex items-center justify-between cursor-pointer">
                  <span style={{ fontSize: "13px", color: "#374151" }}>{item.label}</span>
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(event) => handleToggle(item.field as any, event.target.checked)}
                      className="sr-only peer"
                    />
                    <div
                      className="w-10 h-5 rounded-full transition-colors"
                      style={{ background: checked ? "#10b981" : "#e2e8f0" }}
                    />
                    <div
                      className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-all"
                      style={{
                        transform: checked ? "translateX(1.25rem)" : "translateX(0)",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                      }}
                    />
                  </div>
                </label>
              );
            })}
            <button
              type="button"
              onClick={handleSendTestMail}
              disabled={testingMail || !settings.email}
              className="px-4 py-2.5 rounded-xl text-white"
              style={{
                background: testingMail ? "#94a3b8" : "linear-gradient(135deg, #f59e0b, #f97316)",
                fontSize: "13px",
                fontWeight: 600,
                marginTop: "4px",
                opacity: testingMail || !settings.email ? 0.6 : 1,
              }}
            >
              {testingMail ? "Sending..." : "Send Test Mail"}
            </button>
          </div>
        </div>

        <div className="rounded-2xl p-6" style={{ background: "white", border: "1px solid #e2e8f0" }}>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(16,185,129,0.1)", color: "#10b981" }}>
              <Palette size={18} />
            </div>
            <h3 style={{ color: "#0f172a" }}>Display</h3>
          </div>
          <div className="flex flex-col gap-4">
            {[
              { label: "Currency", options: ["USD ($)", "EUR (€)", "GBP (£)", "JPY (¥)", "INR (₹)"] },
              { label: "Date Format", options: ["YYYY-MM-DD", "MM/DD/YYYY", "DD/MM/YYYY"] },
              { label: "Default View", options: ["Dashboard", "Subscriptions", "Renewals"] },
            ].map((item) => (
              <div key={item.label}>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px" }}>{item.label}</label>
                <select className="w-full px-3 py-2.5 rounded-xl outline-none" style={{ border: "1.5px solid #e2e8f0", fontSize: "13px", color: "#0f172a" }}>
                  {item.options.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl p-6" style={{ background: "white", border: "1px solid #e2e8f0" }}>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(236,72,153,0.1)", color: "#ec4899" }}>
              <Shield size={18} />
            </div>
            <h3 style={{ color: "#0f172a" }}>Security</h3>
          </div>
          <div className="flex flex-col gap-4">
            <div>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px" }}>Current Password</label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full px-3 py-2.5 rounded-xl outline-none"
                style={{ border: "1.5px solid #e2e8f0", fontSize: "13px" }}
                onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
                onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
              />
            </div>
            <div>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px" }}>New Password</label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full px-3 py-2.5 rounded-xl outline-none"
                style={{ border: "1.5px solid #e2e8f0", fontSize: "13px" }}
                onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
                onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
              />
            </div>
            <label className="flex items-center justify-between cursor-pointer">
              <span style={{ fontSize: "13px", color: "#374151" }}>Two-factor authentication</span>
              <div className="relative">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-10 h-5 rounded-full peer-checked:bg-indigo-500 transition-colors" style={{ background: "#e2e8f0" }} />
                <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-all peer-checked:translate-x-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
              </div>
            </label>
            <button className="px-4 py-2.5 rounded-xl text-white" style={{ background: "linear-gradient(135deg, #ec4899, #f43f5e)", fontSize: "13px", fontWeight: 600, marginTop: "4px" }}>
              Update Password
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
