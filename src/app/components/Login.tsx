import { useState } from "react";
import { Eye, EyeOff, Zap, ArrowRight, Check, CreditCard, BarChart2, Bell } from "lucide-react";

interface LoginPageProps {
  onLogin: () => void;
}

const features = [
  { icon: <CreditCard size={16} />, text: "Track all subscriptions in one place" },
  { icon: <BarChart2 size={16} />, text: "Spending analytics & visual reports" },
  { icon: <Bell size={16} />, text: "Smart renewal reminders & alerts" },
];


export function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState("Charan@webomindapps.com");
  const [password, setPassword] = useState("password123");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [forgotSent, setForgotSent] = useState(false);
  const [view, setView] = useState<"login" | "forgot">("login");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onLogin();
    }, 1400);
  };

  const handleForgot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { setError("Enter your email to reset your password."); return; }
    setForgotSent(true);
    setTimeout(() => { setView("login"); setForgotSent(false); setError(""); }, 3000);
  };

  return (
    <div className="flex min-h-screen" style={{ background: "#f8fafc" }}>

      {/* ── Left panel ──────────────────────────────────────── */}
      <div
        className="hidden lg:flex flex-col justify-between w-[480px] flex-shrink-0 p-10"
        style={{ background: "linear-gradient(160deg, #0f172a 0%, #1e1b4b 55%, #312e81 100%)", position: "relative", overflow: "hidden" }}
      >
        {/* Background decoration */}
        <div style={{ position: "absolute", top: "-80px", right: "-80px", width: "320px", height: "320px", borderRadius: "50%", background: "rgba(99,102,241,0.12)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "60px", left: "-60px", width: "220px", height: "220px", borderRadius: "50%", background: "rgba(139,92,246,0.1)", pointerEvents: "none" }} />

        {/* Logo */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
            <Zap size={20} className="text-white" />
          </div>
          <div>
            <p className="text-white" style={{ fontSize: "18px", fontWeight: 700, lineHeight: 1.2 }}>Tracker</p>
            <p style={{ fontSize: "12px", color: "#94a3b8", lineHeight: 1.2 }}>Subscription Manager</p>
          </div>
        </div>

        {/* Hero text */}
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6" style={{ background: "rgba(99,102,241,0.2)", border: "1px solid rgba(99,102,241,0.3)" }}>
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#818cf8" }} />
            <span style={{ fontSize: "12px", color: "#a5b4fc", fontWeight: 600 }}>Trusted by 2,000+ teams</span>
          </div>
          <h1 style={{ fontSize: "36px", fontWeight: 800, color: "white", lineHeight: 1.15, marginBottom: "16px" }}>
            Take control of every subscription
          </h1>
          <p style={{ fontSize: "15px", color: "#94a3b8", lineHeight: 1.7, marginBottom: "36px" }}>
            One dashboard to manage billing, track renewals, and eliminate surprise charges across all your platforms.
          </p>

          {/* Feature list */}
          <div className="flex flex-col gap-3 mb-10">
            {features.map((f) => (
              <div key={f.text} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(99,102,241,0.25)", color: "#818cf8" }}>
                  {f.icon}
                </div>
                <span style={{ fontSize: "14px", color: "#cbd5e1" }}>{f.text}</span>
              </div>
            ))}
          </div>

          {/* Testimonials */}
          <div className="flex flex-col gap-3">
            {testimonials.map((t) => (
              <div key={t.name} className="p-4 rounded-2xl" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <p style={{ fontSize: "13px", color: "#94a3b8", lineHeight: 1.6, marginBottom: "10px" }}>"{t.quote}"</p>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-white" style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", fontSize: "11px", fontWeight: 700 }}>
                    {t.avatar}
                  </div>
                  <div>
                    <p style={{ fontSize: "12px", fontWeight: 600, color: "#e2e8f0" }}>{t.name}</p>
                    <p style={{ fontSize: "11px", color: "#64748b" }}>{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom stat row */}
        <div className="flex items-center gap-6 relative z-10">
          {[
            { value: "14+", label: "Platforms" },
            { value: "$0", label: "Hidden charges" },
            { value: "100%", label: "Visibility" },
          ].map((s) => (
            <div key={s.label}>
              <p style={{ fontSize: "22px", fontWeight: 800, color: "white" }}>{s.value}</p>
              <p style={{ fontSize: "11px", color: "#64748b" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right panel (form) ───────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-[420px]">

          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
              <Zap size={18} className="text-white" />
            </div>
            <p style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a" }}>Tracker</p>
          </div>

          {/* ── LOGIN form ── */}
          {view === "login" && (
            <>
              <div className="mb-8">
                <h2 style={{ fontSize: "28px", fontWeight: 800, color: "#0f172a", marginBottom: "8px" }}>
                  Welcome back 👋
                </h2>
                <p style={{ fontSize: "15px", color: "#64748b" }}>Sign in to your account to continue</p>
              </div>

              <form onSubmit={handleLogin} className="flex flex-col gap-5">
                {/* Email */}
                <div>
                  <label style={{ fontSize: "13px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "8px" }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 rounded-xl outline-none transition-all"
                    style={{
                      border: "1.5px solid #e2e8f0",
                      fontSize: "14px",
                      color: "#0f172a",
                      background: "white",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
                    onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
                  />
                </div>

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label style={{ fontSize: "13px", fontWeight: 600, color: "#374151" }}>Password</label>
                    <button
                      type="button"
                      onClick={() => setView("forgot")}
                      style={{ fontSize: "13px", color: "#6366f1", fontWeight: 500, background: "none", border: "none", cursor: "pointer" }}
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••"
                      className="w-full pl-4 pr-11 py-3 rounded-xl outline-none transition-all"
                      style={{
                        border: "1.5px solid #e2e8f0",
                        fontSize: "14px",
                        color: "#0f172a",
                        background: "white",
                      }}
                      onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
                      onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
                      style={{ color: "#94a3b8", background: "transparent" }}
                    >
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </div>

                {/* Remember me */}
                <label className="flex items-center gap-3 cursor-pointer">
                  <button
                    type="button"
                    onClick={() => setRemember((v) => !v)}
                    className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-all"
                    style={{
                      border: `2px solid ${remember ? "#6366f1" : "#d1d5db"}`,
                      background: remember ? "#6366f1" : "white",
                    }}
                  >
                    {remember && <Check size={11} className="text-white" strokeWidth={3} />}
                  </button>
                  <span style={{ fontSize: "14px", color: "#374151" }}>Remember me for 30 days</span>
                </label>

                {/* Error */}
                {error && (
                  <div className="px-4 py-3 rounded-xl" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                    <p style={{ fontSize: "13px", color: "#ef4444" }}>{error}</p>
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl text-white flex items-center justify-center gap-2 transition-all"
                  style={{
                    background: loading ? "#a5b4fc" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
                    fontSize: "15px",
                    fontWeight: 600,
                    boxShadow: loading ? "none" : "0 4px 20px rgba(99,102,241,0.4)",
                    cursor: loading ? "not-allowed" : "pointer",
                  }}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
                        <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round" />
                      </svg>
                      Signing in…
                    </>
                  ) : (
                    <>
                      Sign In
                      <ArrowRight size={17} />
                    </>
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="flex items-center gap-4 my-6">
                <div className="flex-1 h-px" style={{ background: "#e2e8f0" }} />
                <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 500 }}>or continue with</span>
                <div className="flex-1 h-px" style={{ background: "#e2e8f0" }} />
              </div>

              {/* Social buttons */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    label: "Google",
                    icon: (
                      <svg width="18" height="18" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                      </svg>
                    ),
                  },
                  {
                    label: "Microsoft",
                    icon: (
                      <svg width="18" height="18" viewBox="0 0 24 24">
                        <path d="M11.4 2H2v9.4h9.4V2z" fill="#F25022" />
                        <path d="M22 2h-9.4v9.4H22V2z" fill="#7FBA00" />
                        <path d="M11.4 12.6H2V22h9.4v-9.4z" fill="#00A4EF" />
                        <path d="M22 12.6h-9.4V22H22v-9.4z" fill="#FFB900" />
                      </svg>
                    ),
                  },
                ].map((s) => (
                  <button
                    key={s.label}
                    type="button"
                    className="flex items-center justify-center gap-2.5 py-3 rounded-xl transition-all"
                    style={{ border: "1.5px solid #e2e8f0", background: "white", fontSize: "14px", color: "#374151", fontWeight: 500 }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#d1d5db")}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#e2e8f0")}
                  >
                    {s.icon}
                    {s.label}
                  </button>
                ))}
              </div>

              <p style={{ textAlign: "center", fontSize: "13px", color: "#94a3b8", marginTop: "24px" }}>
                Don't have an account?{" "}
                <button type="button" style={{ color: "#6366f1", fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}>
                  Request access
                </button>
              </p>
            </>
          )}

          {/* ── FORGOT PASSWORD view ── */}
          {view === "forgot" && (
            <>
              <button
                type="button"
                onClick={() => { setView("login"); setError(""); setForgotSent(false); }}
                className="flex items-center gap-1.5 mb-8"
                style={{ fontSize: "13px", color: "#64748b", fontWeight: 500, background: "none", border: "none", cursor: "pointer" }}
              >
                <ArrowRight size={14} style={{ transform: "rotate(180deg)" }} />
                Back to login
              </button>

              {forgotSent ? (
                <div className="flex flex-col items-center text-center gap-4 py-8">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "rgba(16,185,129,0.12)" }}>
                    <Check size={30} style={{ color: "#10b981" }} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#0f172a", marginBottom: "8px" }}>Email sent!</h2>
                    <p style={{ fontSize: "14px", color: "#64748b" }}>Check your inbox for a password reset link. Redirecting you back…</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="mb-8">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5" style={{ background: "rgba(99,102,241,0.1)" }}>
                      <Zap size={26} style={{ color: "#6366f1" }} />
                    </div>
                    <h2 style={{ fontSize: "26px", fontWeight: 800, color: "#0f172a", marginBottom: "8px" }}>Reset your password</h2>
                    <p style={{ fontSize: "14px", color: "#64748b", lineHeight: 1.6 }}>
                      Enter the email address associated with your account and we'll send you a link to reset your password.
                    </p>
                  </div>

                  <form onSubmit={handleForgot} className="flex flex-col gap-4">
                    <div>
                      <label style={{ fontSize: "13px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "8px" }}>Email Address</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full px-4 py-3 rounded-xl outline-none transition-all"
                        style={{ border: "1.5px solid #e2e8f0", fontSize: "14px", color: "#0f172a", background: "white" }}
                        onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
                        onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
                      />
                    </div>

                    {error && (
                      <div className="px-4 py-3 rounded-xl" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                        <p style={{ fontSize: "13px", color: "#ef4444" }}>{error}</p>
                      </div>
                    )}

                    <button
                      type="submit"
                      className="w-full py-3.5 rounded-xl text-white flex items-center justify-center gap-2 mt-2"
                      style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", fontSize: "15px", fontWeight: 600, boxShadow: "0 4px 20px rgba(99,102,241,0.35)" }}
                    >
                      Send Reset Link
                      <ArrowRight size={17} />
                    </button>
                  </form>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
