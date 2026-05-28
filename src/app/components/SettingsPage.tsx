import { Bell, CreditCard, Shield, Palette, User } from "lucide-react";

export function SettingsPage() {
  return (
    <div className="flex flex-col gap-6 p-6 min-h-full" style={{ background: "#f8fafc" }}>
      <div>
        <h1 style={{ color: "#0f172a", marginBottom: "4px" }}>Settings</h1>
        <p style={{ color: "#64748b", fontSize: "14px" }}>Manage your preferences and account settings</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Profile */}
        <div className="rounded-2xl p-6" style={{ background: "white", border: "1px solid #e2e8f0" }}>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(99,102,241,0.1)", color: "#6366f1" }}>
              <User size={18} />
            </div>
            <h3 style={{ color: "#0f172a" }}>Profile</h3>
          </div>
          <div className="flex flex-col gap-4">
            {[{ label: "Full Name", value: "Alex Johnson" }, { label: "Email", value: "alex@example.com" }, { label: "Company", value: "Acme Corp" }].map((f) => (
              <div key={f.label}>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px" }}>{f.label}</label>
                <input
                  defaultValue={f.value}
                  className="w-full px-3 py-2.5 rounded-xl outline-none"
                  style={{ border: "1.5px solid #e2e8f0", fontSize: "13px", color: "#0f172a" }}
                  onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
                  onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
                />
              </div>
            ))}
            <button className="px-4 py-2.5 rounded-xl text-white" style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", fontSize: "13px", fontWeight: 600, marginTop: "4px" }}>
              Save Profile
            </button>
          </div>
        </div>

        {/* Notifications */}
        <div className="rounded-2xl p-6" style={{ background: "white", border: "1px solid #e2e8f0" }}>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(245,158,11,0.1)", color: "#f59e0b" }}>
              <Bell size={18} />
            </div>
            <h3 style={{ color: "#0f172a" }}>Notifications</h3>
          </div>
          <div className="flex flex-col gap-4">
            {[
              { label: "Renewal reminders (7 days before)", defaultChecked: true },
              { label: "Renewal reminders (3 days before)", defaultChecked: true },
              { label: "Renewal reminders (day of)", defaultChecked: false },
              { label: "Monthly spend summary", defaultChecked: true },
              { label: "New subscription added", defaultChecked: false },
            ].map((item) => (
              <label key={item.label} className="flex items-center justify-between cursor-pointer">
                <span style={{ fontSize: "13px", color: "#374151" }}>{item.label}</span>
                <div className="relative">
                  <input type="checkbox" defaultChecked={item.defaultChecked} className="sr-only peer" />
                  <div className="w-10 h-5 rounded-full peer-checked:bg-indigo-500 transition-colors" style={{ background: "#e2e8f0" }} />
                  <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-all peer-checked:translate-x-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Currency & Display */}
        <div className="rounded-2xl p-6" style={{ background: "white", border: "1px solid #e2e8f0" }}>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(16,185,129,0.1)", color: "#10b981" }}>
              <Palette size={18} />
            </div>
            <h3 style={{ color: "#0f172a" }}>Display</h3>
          </div>
          <div className="flex flex-col gap-4">
            {[
              { label: "Currency", options: ["USD ($)", "EUR (€)", "GBP (£)", "JPY (¥)"] },
              { label: "Date Format", options: ["YYYY-MM-DD", "MM/DD/YYYY", "DD/MM/YYYY"] },
              { label: "Default View", options: ["Dashboard", "Subscriptions", "Renewals"] },
            ].map((item) => (
              <div key={item.label}>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px" }}>{item.label}</label>
                <select className="w-full px-3 py-2.5 rounded-xl outline-none" style={{ border: "1.5px solid #e2e8f0", fontSize: "13px", color: "#0f172a" }}>
                  {item.options.map((o) => <option key={o}>{o}</option>)}
                </select>
              </div>
            ))}
          </div>
        </div>

        {/* Security */}
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
              <input type="password" placeholder="••••••••" className="w-full px-3 py-2.5 rounded-xl outline-none" style={{ border: "1.5px solid #e2e8f0", fontSize: "13px" }}
                onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
                onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")} />
            </div>
            <div>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px" }}>New Password</label>
              <input type="password" placeholder="••••••••" className="w-full px-3 py-2.5 rounded-xl outline-none" style={{ border: "1.5px solid #e2e8f0", fontSize: "13px" }}
                onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
                onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")} />
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
