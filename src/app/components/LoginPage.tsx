import { useState, type FormEvent } from "react";
import { Lock, Mail, LogIn, Eye, EyeOff } from "lucide-react";

interface LoginPageProps {
  onLogin: (email: string, password: string) => Promise<void>;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState("charan.sai@webomindapps.com");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await onLogin(email.trim(), password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to log in.");
    } finally {
      setLoading(false);
    }
  };

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
