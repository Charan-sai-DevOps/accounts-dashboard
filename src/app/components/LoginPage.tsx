import { useState, type FormEvent } from "react";
import { Lock, Mail, LogIn, Eye, EyeOff, ArrowRight, Shield } from "lucide-react";

interface LoginPageProps {
  onLogin: (email: string, password: string, prefetched?: { role: string; user?: { name?: string; email?: string } }) => Promise<void>;
}

const autofillStyle = `
  input:-webkit-autofill,
  input:-webkit-autofill:hover,
  input:-webkit-autofill:focus,
  input:-webkit-autofill:active {
    -webkit-box-shadow: 0 0 0 1000px #ffffff inset !important;
    -webkit-text-fill-color: #1a1f3a !important;
    caret-color: #2563eb;
    transition: background-color 5000s ease-in-out 0s;
  }
  input:-webkit-autofill::first-line {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
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
      <div className="min-h-screen flex items-center justify-center px-4 py-8" style={{ background: "#f8fafc" }}>
        <style>{autofillStyle}</style>
        <div className="w-full max-w-md">
          {/* Header with logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl mb-4" style={{ background: "linear-gradient(135deg, #2563eb, #1d4ed8)" }}>
              <Shield size={28} style={{ color: "#ffffff" }} />
            </div>
            <h1 style={{ color: "#1a1f3a", fontSize: "28px", fontWeight: 700, marginBottom: "8px" }}>Verify OTP</h1>
            <p style={{ color: "#64748b", fontSize: "14px", lineHeight: "1.5" }}>Enter the verification code sent to your email</p>
          </div>

          {/* Form Card */}
          <div style={{
            background: "#ffffff",
            borderRadius: "12px",
            padding: "32px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.05)",
            border: "1px solid #e2e8f0"
          }}>
            <form onSubmit={handleOtpSubmit} className="flex flex-col gap-5">
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: "#1a1f3a" }}>6-Digit Code</label>
                <input
                  value={otp}
                  onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
                  type="text"
                  className="w-full px-4 py-3 rounded-lg text-center tracking-widest text-xl font-semibold transition-all"
                  placeholder="000000"
                  autoComplete="off"
                  maxLength={6}
                  style={{
                    color: "#1a1f3a",
                    border: "2px solid #e2e8f0",
                    fontSize: "24px",
                    letterSpacing: "0.25em"
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = "#2563eb"}
                  onBlur={(e) => e.currentTarget.style.borderColor = "#e2e8f0"}
                />
                <p style={{ fontSize: "12px", color: "#64748b", marginTop: "8px" }}>Code sent to {email}</p>
              </div>

              {error && (
                <div className="rounded-lg px-4 py-3 text-sm" style={{ background: "#fee2e2", color: "#dc2626", border: "1px solid #fecaca" }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={otpLoading || otp.length < 6}
                className="w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2"
                style={{
                  background: otpLoading || otp.length < 6 ? "#cbd5e1" : "linear-gradient(135deg, #2563eb, #1d4ed8)",
                  color: "#ffffff",
                  cursor: otpLoading || otp.length < 6 ? "not-allowed" : "pointer",
                  boxShadow: otpLoading || otp.length < 6 ? "none" : "0 4px 12px rgba(37, 99, 235, 0.3)"
                }}
              >
                <Shield size={18} />
                {otpLoading ? "Verifying..." : "Verify Code"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowOtpVerification(false);
                  setOtp("");
                  setError(null);
                }}
                className="text-center text-sm transition-colors font-medium"
                style={{ color: "#2563eb", textDecoration: "none" }}
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
    <div className="min-h-screen flex" style={{ background: "#f8fafc" }}>
      <style>{autofillStyle}</style>

      {/* Left Side - Hero Section */}
      <div className="hidden lg:flex flex-col justify-center px-12 py-12 flex-1" style={{
        background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
      }}>
        <div style={{ maxWidth: "450px" }}>
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-8" style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(10px)" }}>
            <LogIn size={32} style={{ color: "#ffffff" }} />
          </div>

          <h2 style={{ color: "#ffffff", fontSize: "36px", fontWeight: 700, marginBottom: "16px", lineHeight: 1.2 }}>
            Manage Your Subscriptions with Ease
          </h2>

          <p style={{ color: "rgba(255,255,255,0.9)", fontSize: "16px", lineHeight: 1.6, marginBottom: "32px" }}>
            Track, organize, and optimize all your subscription billing in one centralized dashboard. Never miss a renewal date again.
          </p>

          <div className="space-y-4">
            {[
              "Real-time subscription tracking",
              "Automated renewal reminders",
              "Comprehensive cost analytics"
            ].map((feature, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  <ArrowRight size={18} style={{ color: "#ffffff" }} />
                </div>
                <p style={{ color: "rgba(255,255,255,0.95)", fontSize: "14px" }}>{feature}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-[500px] flex flex-col justify-center px-6 sm:px-8 lg:px-12 py-8 sm:py-12">
        <div style={{ maxWidth: "400px", margin: "0 auto", width: "100%" }}>
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl mb-4" style={{ background: "linear-gradient(135deg, #2563eb, #1d4ed8)" }}>
              <LogIn size={28} style={{ color: "#ffffff" }} />
            </div>
            <h1 style={{ color: "#1a1f3a", fontSize: "24px", fontWeight: 700 }}>Subscription Dashboard</h1>
          </div>

          {/* Login Header */}
          <div className="mb-8">
            <h2 style={{ color: "#1a1f3a", fontSize: "28px", fontWeight: 700, marginBottom: "8px" }}>Welcome Back</h2>
            <p style={{ color: "#64748b", fontSize: "14px" }}>Sign in to your account to continue</p>
          </div>

          {/* Form Card */}
          <div style={{
            background: "#ffffff",
            borderRadius: "12px",
            padding: "32px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.05)",
            border: "1px solid #e2e8f0"
          }}>
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              {/* Email Field */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: "#1a1f3a" }}>Email Address</label>
                <div className="flex items-center gap-3 px-4 py-3 rounded-lg transition-all" style={{
                  border: "2px solid #e2e8f0",
                  background: "#f8fafc"
                }}
                  onFocus={() => {
                    const parent = (event?.currentTarget as HTMLElement)?.parentElement;
                    if (parent) {
                      parent.style.borderColor = "#2563eb";
                      parent.style.background = "#ffffff";
                    }
                  }}
                >
                  <Mail size={18} style={{ color: "#64748b", flexShrink: 0 }} />
                  <input
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    type="email"
                    className="w-full bg-transparent outline-none text-base"
                    placeholder="your.email@company.com"
                    style={{ color: "#1a1f3a" }}
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: "#1a1f3a" }}>Password</label>
                <div className="flex items-center gap-3 px-4 py-3 rounded-lg transition-all" style={{
                  border: "2px solid #e2e8f0",
                  background: "#f8fafc"
                }}
                  onFocus={() => {
                    const parent = (event?.currentTarget as HTMLElement)?.parentElement;
                    if (parent) {
                      parent.style.borderColor = "#2563eb";
                      parent.style.background = "#ffffff";
                    }
                  }}
                >
                  <Lock size={18} style={{ color: "#64748b", flexShrink: 0 }} />
                  <input
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    type={passwordVisible ? "text" : "password"}
                    className="w-full bg-transparent outline-none text-base"
                    placeholder="Enter your password"
                    style={{ color: "#1a1f3a" }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setPasswordVisible(!passwordVisible)}
                    className="flex-shrink-0 transition-colors hover:opacity-70"
                    style={{ color: "#64748b" }}
                  >
                    {passwordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="rounded-lg px-4 py-3 text-sm" style={{
                  background: "#fee2e2",
                  color: "#dc2626",
                  border: "1px solid #fecaca",
                  lineHeight: 1.5
                }}>
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !email || !password}
                className="w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2"
                style={{
                  background: loading || !email || !password ? "#cbd5e1" : "linear-gradient(135deg, #2563eb, #1d4ed8)",
                  color: "#ffffff",
                  cursor: loading || !email || !password ? "not-allowed" : "pointer",
                  boxShadow: loading || !email || !password ? "none" : "0 4px 12px rgba(37, 99, 235, 0.3)"
                }}
              >
                {loading ? (
                  <>
                    <span className="inline-block animate-spin"></span>
                    Signing in...
                  </>
                ) : (
                  <>
                    <LogIn size={18} />
                    Sign In
                  </>
                )}
              </button>

              {/* Footer Text */}
              <p style={{ textAlign: "center", fontSize: "13px", color: "#64748b" }}>
                Secure login powered by end-to-end encryption
              </p>
            </form>
          </div>

          {/* Security Badge */}
          <div className="mt-6 flex items-center justify-center gap-2" style={{ color: "#64748b", fontSize: "13px" }}>
            <Shield size={16} />
            <span>Enterprise-grade security</span>
          </div>
        </div>
      </div>
    </div>
  );
}
