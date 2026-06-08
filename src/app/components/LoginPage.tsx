import { useState, type FormEvent } from "react";
import { Eye, EyeOff, ArrowRight, Shield, Zap, CreditCard, BarChart2, Bell } from "lucide-react";

interface LoginPageProps {
  onLogin: (email: string, password: string, prefetched?: { role: string; user?: { name?: string; email?: string } }) => Promise<void>;
}

const features = [
  { icon: <CreditCard size={16} />, text: "Track all subscriptions in one place" },
  { icon: <BarChart2 size={16} />, text: "Spending analytics & visual reports" },
  { icon: <Bell size={16} />, text: "Smart renewal reminders & alerts" },
];


const autofillStyle = `
  input:-webkit-autofill,
  input:-webkit-autofill:hover,
  input:-webkit-autofill:focus,
  input:-webkit-autofill:active {
    -webkit-box-shadow: 0 0 0 1000px #ffffff inset !important;
    -webkit-text-fill-color: #0f172a !important;
    caret-color: #f97316;
    transition: background-color 5000s ease-in-out 0s;
  }
  input:-webkit-autofill::first-line {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  }

  @keyframes slideInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes pulse-glow {
    0%, 100% { box-shadow: 0 0 20px rgba(249, 115, 22, 0.3); }
    50% { box-shadow: 0 0 30px rgba(249, 115, 22, 0.5); }
  }

  .animate-slide-up {
    animation: slideInUp 0.6s ease-out forwards;
  }

  .animate-fade-in {
    animation: fadeIn 0.8s ease-out;
  }

  .animate-pulse-glow {
    animation: pulse-glow 2s ease-in-out infinite;
  }

  .input-focus-glow:focus-within {
    box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.1), 0 8px 16px rgba(0, 0, 0, 0.1);
  }
`;

export function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showOtpVerification, setShowOtpVerification] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpFocused, setOtpFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.message || "Invalid email or password.");
      }

      const data = await response.json();

      if (data.requires2FA) {
        const otpResponse = await fetch("/api/2fa", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "send-login-otp", email: email.trim() }),
        });

        if (!otpResponse.ok) {
          throw new Error("Failed to send OTP. Please try again.");
        }

        setShowOtpVerification(true);
        setError(null);
      } else {
        await onLogin(email.trim(), password, { role: data.role, user: data.user });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to log in.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setOtpLoading(true);
    setError(null);

    try {
      if (!otp || otp.length < 6) {
        throw new Error("Please enter a valid 6-digit OTP.");
      }

      const response = await fetch("/api/2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify-login-otp", email: email.trim(), code: otp }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.message || "Invalid OTP. Please try again.");
      }

      await onLogin(email.trim(), password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to verify OTP.");
    } finally {
      setOtpLoading(false);
    }
  };

  if (showOtpVerification) {
    return (
      <div className="flex h-screen" style={{ background: "#f8fafc" }}>
        <style>{autofillStyle}</style>

        {/* OTP verification modal overlay */}
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div style={{
            background: "#ffffff",
            borderRadius: "16px",
            padding: "36px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 20px 50px rgba(0,0,0,0.2)",
            border: "1px solid #e0e7ff",
            maxWidth: "400px",
            width: "100%"
          }}>
            {/* Header with logo */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl mb-4" style={{
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)"
              }}>
                <Shield size={28} style={{ color: "#ffffff" }} />
              </div>
              <h1 style={{ color: "#0f172a", fontSize: "28px", fontWeight: 800, marginBottom: "8px" }}>Verify OTP</h1>
              <p style={{ color: "#64748b", fontSize: "14px", fontWeight: 500 }}>Enter the code sent to your email</p>
            </div>

            <form onSubmit={handleOtpSubmit} className="flex flex-col gap-6">
              <div>
                <label className="block text-sm font-semibold mb-2.5" style={{ color: "#0f172a" }}>6-Digit Code</label>
                <input
                  value={otp}
                  onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
                  type="text"
                  className="w-full px-4 py-3 rounded-lg text-center tracking-widest text-xl font-bold transition-all duration-300"
                  placeholder="000000"
                  autoComplete="off"
                  maxLength={6}
                  style={{
                    color: "#0f172a",
                    border: `2px solid ${otpFocused ? "#6366f1" : "#e5e7eb"}`,
                    background: otpFocused ? "#f5f3ff" : "#fafafa",
                    letterSpacing: "0.3em"
                  }}
                  onFocus={() => setOtpFocused(true)}
                  onBlur={() => setOtpFocused(false)}
                />
                <p style={{ fontSize: "12px", color: "#94a3b8", marginTop: "8px", fontWeight: 500 }}>Code sent to <span style={{ color: "#0f172a", fontWeight: 600 }}>{email}</span></p>
              </div>

              {error && (
                <div className="rounded-lg px-4 py-3 text-sm" style={{
                  background: "#fee2e2",
                  color: "#991b1b",
                  border: "1px solid #fecaca",
                  fontWeight: 500
                }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={otpLoading || otp.length < 6}
                className="w-full py-3 px-4 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2"
                style={{
                  background: otpLoading || otp.length < 6 ? "#cbd5e1" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  color: "#ffffff",
                  cursor: otpLoading || otp.length < 6 ? "not-allowed" : "pointer",
                  boxShadow: otpLoading || otp.length < 6 ? "none" : "0 4px 15px rgba(99, 102, 241, 0.3)",
                  opacity: otpLoading || otp.length < 6 ? 0.6 : 1
                }}
              >
                {otpLoading ? (
                  <>
                    <span className="inline-block animate-spin" style={{
                      width: "16px",
                      height: "16px",
                      border: "2px solid rgba(255,255,255,0.3)",
                      borderTop: "2px solid #ffffff",
                      borderRadius: "50%"
                    }} />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Shield size={18} />
                    Verify Code
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowOtpVerification(false);
                  setOtp("");
                  setError(null);
                }}
                className="text-center text-sm font-semibold py-2 transition-all duration-300"
                style={{ color: "#6366f1", background: "none", border: "none", cursor: "pointer" }}
              >
                ← Back to login
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen" style={{ background: "#f8fafc" }}>
      <style>{autofillStyle}</style>

      {/* Left panel - hidden on mobile */}
      <div
        className="hidden lg:flex flex-col justify-between w-1/2 flex-shrink-0 p-10 relative overflow-hidden"
        style={{ background: "linear-gradient(160deg, #0f172a 0%, #1e1b4b 55%, #312e81 100%)" }}
      >
        {/* Background decoration */}
        <div style={{ position: "absolute", top: "-80px", right: "-80px", width: "300px", height: "300px", borderRadius: "50%", background: "rgba(99,102,241,0.12)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "60px", left: "-60px", width: "200px", height: "200px", borderRadius: "50%", background: "rgba(139,92,246,0.1)", pointerEvents: "none" }} />

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

        {/* Middle content - hero text and features */}
        <div className="relative z-10 flex-1 flex flex-col justify-center">
          {/* <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5" style={{ background: "rgba(99,102,241,0.2)", border: "1px solid rgba(99,102,241,0.3)", width: "fit-content" }}>
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#818cf8" }} />
            <span style={{ fontSize: "12px", color: "#a5b4fc", fontWeight: 600 }}>Trusted by 2,000+ teams</span>
          </div> */}
          <h1 style={{ fontSize: "32px", fontWeight: 800, color: "white", lineHeight: 1.15, marginBottom: "12px" }}>
            Take control of every subscription
          </h1>
          <p style={{ fontSize: "18px", color: "#94a3b8", lineHeight: 1.6, marginBottom: "40px" }}>
            One dashboard to manage billing, track renewals, and eliminate surprise charges across all your platforms.
          </p>

          {/* Feature list */}
          <div className="flex flex-col gap-2.5 mb-8">
            {features.map((f) => (
              <div key={f.text} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(99,102,241,0.25)", color: "#818cf8" }}>
                  {f.icon}
                </div>
                <span style={{ fontSize: "18px", color: "#cbd5e1" }}>{f.text}</span>
              </div>
            ))}
          </div>

        </div>

        {/* Bottom stat row */}
        <div className="flex items-center gap-8 relative z-10">
          {[
            { value: "14+", label: "Platforms" },
            { value: "10+", label: "Categories" },
            { value: "100%", label: "Visibility" },
          ].map((s) => (
            <div key={s.label}>
              <p style={{ fontSize: "24px", fontWeight: 800, color: "white" }}>{s.value}</p>
              <p style={{ fontSize: "18px", color: "#64748b" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel - form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 sm:px-8 lg:px-12 relative overflow-auto">
        <div style={{ maxWidth: "400px", margin: "0 auto", width: "100%", position: "relative", zIndex: 10 }}>
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
              <Zap size={18} className="text-white" />
            </div>
            <p style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a" }}>Tracker</p>
          </div>

          {/* Login Header */}
          <div className="mb-8">
            <h2 style={{ fontSize: "34px", fontWeight: 800, color: "#0f172a", marginBottom: "8px" }}>
              Welcome back 👋
            </h2>
            <p style={{ fontSize: "18px", color: "#64748b" }}>Sign in to your account to continue</p>
          </div>

          {/* Form Card */}
          <div style={{
            background: "#ffffff",
            borderRadius: "16px",
            padding: "32px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 10px 30px rgba(0,0,0,0.1)",
            border: "1px solid #e0e7ff"
          }}>
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              {/* Email */}
              <div>
                <label style={{ fontSize: "16px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "8px" }}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 rounded-xl outline-none transition-all"
                  style={{
                    border: `1.5px solid ${emailFocused ? "#6366f1" : "#e2e8f0"}`,
                    fontSize: "16px",
                    color: "#0f172a",
                    background: "white",
                  }}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                />
              </div>

              {/* Password */}
              <div>
                <label style={{ fontSize: "16px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "8px" }}>Password</label>
                <div className="relative">
                  <input
                    type={passwordVisible ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••"
                    className="w-full pl-4 pr-11 py-3 rounded-xl outline-none transition-all"
                    style={{
                      border: `1.5px solid ${passwordFocused ? "#6366f1" : "#e2e8f0"}`,
                      fontSize: "16px",
                      color: "#0f172a",
                      background: "white",
                    }}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                  />
                  <button
                    type="button"
                    onClick={() => setPasswordVisible((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
                    style={{ color: "#94a3b8", background: "transparent" }}
                  >
                    {passwordVisible ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

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
                className="w-full py-3 rounded-xl text-white flex items-center justify-center gap-2 transition-all"
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

          </div>
        </div>
      </div>
    </div>
  );
}
