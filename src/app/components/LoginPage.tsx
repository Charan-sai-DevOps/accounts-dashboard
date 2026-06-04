import { useState, type FormEvent } from "react";
import { Lock, Mail, LogIn, Eye, EyeOff } from "lucide-react";

interface LoginPageProps {
  onLogin: (email: string, password: string) => Promise<void>;
}

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

      // Check if 2FA is required
      if (data.requires2FA) {
        // Send OTP to email
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
        // No 2FA required, proceed with login
        await onLogin(email.trim(), password);
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

      // OTP verified, complete login
      await onLogin(email.trim(), password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to verify OTP.");
    } finally {
      setOtpLoading(false);
    }
  };

  if (showOtpVerification) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "linear-gradient(180deg, #0f172a 0%, #1e1b4b 100%)" }}>
        <div className="w-full max-w-md rounded-3xl p-8 shadow-2xl" style={{ background: "rgba(15, 23, 42, 0.92)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
              <Mail size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-white text-2xl font-semibold">Verify OTP</h1>
              <p style={{ color: "#94a3b8", fontSize: "13px" }}>Enter the code sent to your email</p>
            </div>
          </div>

          <form onSubmit={handleOtpSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "#cbd5e1" }}>Enter 6-Digit OTP</label>
              <div className="flex items-center gap-3 rounded-2xl px-4 py-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(148,163,184,0.18)" }}>
                <input
                  value={otp}
                  onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
                  type="text"
                  className="w-full bg-transparent outline-none text-white placeholder:text-slate-500 tracking-widest text-xl"
                  placeholder="000000"
                  autoComplete="off"
                />
              </div>
              <p style={{ fontSize: "12px", color: "#94a3b8", marginTop: "8px" }}>OTP sent to {email}</p>
            </div>

            {error && (
              <div className="rounded-2xl px-4 py-3 text-sm" style={{ background: "rgba(239,68,68,0.12)", color: "#fca5a5", border: "1px solid rgba(239,68,68,0.25)" }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={otpLoading || otp.length < 6}
              className="mt-2 flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-white font-semibold transition-all disabled:opacity-70"
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", boxShadow: "0 10px 25px rgba(99,102,241,0.35)" }}
            >
              <LogIn size={16} />
              {otpLoading ? "Verifying..." : "Verify OTP"}
            </button>

            <button
              type="button"
              onClick={() => {
                setShowOtpVerification(false);
                setOtp("");
                setError(null);
              }}
              className="text-center text-xs transition-colors"
              style={{ color: "#94a3b8", textDecoration: "none" }}
            >
              Back to login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "linear-gradient(180deg, #0f172a 0%, #1e1b4b 100%)" }}>
      <div className="w-full max-w-md rounded-3xl p-8 shadow-2xl" style={{ background: "rgba(15, 23, 42, 0.92)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
            <LogIn size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-white text-2xl font-semibold">Sign in</h1>
            <p style={{ color: "#94a3b8", fontSize: "13px" }}>Access your subscription dashboard</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "#cbd5e1" }}>Email ID</label>
            <div className="flex items-center gap-3 rounded-2xl px-4 py-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(148,163,184,0.18)" }}>
              <Mail size={16} style={{ color: "#94a3b8" }} />
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                className="w-full bg-transparent outline-none text-white placeholder:text-slate-500"
                placeholder="Enter email id"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "#cbd5e1" }}>Password</label>
            <div className="flex items-center gap-3 rounded-2xl px-4 py-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(148,163,184,0.18)" }}>
              <Lock size={16} style={{ color: "#94a3b8" }} />
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type={passwordVisible ? "text" : "password"}
                className="w-full bg-transparent outline-none text-white placeholder:text-slate-500"
                placeholder="Enter password"
              />
              <button
                type="button"
                onClick={() => setPasswordVisible((current) => !current)}
                className="flex-shrink-0 transition-colors"
                style={{ color: "#94a3b8" }}
                aria-label={passwordVisible ? "Hide password" : "Show password"}
              >
                {passwordVisible ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-2xl px-4 py-3 text-sm" style={{ background: "rgba(239,68,68,0.12)", color: "#fca5a5", border: "1px solid rgba(239,68,68,0.25)" }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-white font-semibold transition-all disabled:opacity-70"
            style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", boxShadow: "0 10px 25px rgba(99,102,241,0.35)" }}
          >
            <LogIn size={16} />
            {loading ? "Signing in..." : "Login"}
          </button>

          <p className="text-center text-xs" style={{ color: "#94a3b8" }}>
            Use your admin credentials to continue.
          </p>
        </form>
      </div>
    </div>
  );
}
