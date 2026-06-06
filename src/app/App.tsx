import { useState, useEffect, useRef, useCallback } from "react";
import { Menu } from "lucide-react";
import { Sidebar } from "./components/Sidebar";
import { Dashboard } from "./components/Dashboard";
import { Subscriptions } from "./components/Subscriptions";
import { Reports } from "./components/Reports";
import { Renewals } from "./components/Renewals";
import { SettingsPage } from "./components/SettingsPage";
import { LoginPage } from "./components/LoginPage";
import { Toaster } from "./components/ui/sonner";
import { toast } from "sonner";
import { Subscription, getDaysUntilExpiry, getNextExpiryDate, DEFAULT_CATEGORIES, DEFAULT_TEAMS, Category, Team, sanitizeSubscriptions } from "./data/subscriptions";
// import { db } from "../firebase";
// import { collection, doc, onSnapshot, addDoc, setDoc, deleteDoc } from "firebase/firestore";

type Page = "dashboard" | "subscriptions" | "reports" | "renewals" | "settings";
type UserRole = "Admin" | "Member" | "Viewer";
const AUTH_STORAGE_KEY = "subscription-dashboard-auth";
const USER_ROLE_KEY = "subscription-dashboard-user-role";

// Settings cache with 5-minute TTL to prevent redundant Firestore reads
let settingsCache: any = null;
let settingsCacheTime = 0;
const SETTINGS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export default function App() {
  const [page, setPage] = useState<Page>("dashboard");
  const [settingsSection, setSettingsSection] = useState<any>("users");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      return localStorage.getItem(AUTH_STORAGE_KEY) === "true";
    } catch (error) {
      return false;
    }
  });
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>(() => {
    try {
      const role = localStorage.getItem(USER_ROLE_KEY);
      if (role === "Admin" || role === "Member" || role === "Viewer") return role;
    } catch {}
    return "Admin";
  });
  const [profile, setProfile] = useState({
    username: "",
    companyName: "",
    role: "",
    email: ""
  });
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [categories, setCategories] = useState<Category[]>(() => {
    try {
      const stored = localStorage.getItem("customCategories");
      if (stored) {
        const parsed = JSON.parse(stored) as Category[];
        const merged = Array.from(new Set([...DEFAULT_CATEGORIES, ...parsed]));
        return merged as Category[];
      }
    } catch (error) {
      console.warn("Failed to load saved categories:", error);
    }
    return DEFAULT_CATEGORIES;
  });
  const [teams, setTeams] = useState<Team[]>(() => {
    try {
      const stored = localStorage.getItem("customTeams");
      if (stored) {
        const parsed = JSON.parse(stored) as Team[];
        return Array.from(new Set([...DEFAULT_TEAMS, ...parsed]));
      }
    } catch (error) {
      console.warn("Failed to load saved teams:", error);
    }
    return DEFAULT_TEAMS;
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const autopayProcessingRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    const loadData = async () => {
      try {
        const subsResponse = await fetch("/api/subscriptions", { signal: controller.signal });

        if (!subsResponse.ok) {
          throw new Error(`Failed to fetch subscriptions: ${subsResponse.status}`);
        }
        const data = sanitizeSubscriptions(await subsResponse.json());
        setSubscriptions(data);
        setError(null);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          console.error("Failed to load data:", err);
          setError(err instanceof Error ? err.message : String(err));
        }
      } finally {
        setLoading(false);
      }
    };

    void loadData();

    return () => controller.abort();
  }, [isAuthenticated, currentUserRole]);

  useEffect(() => {
    if (!isAuthenticated || currentUserRole !== "Admin" || page !== "settings") return;

    const controller = new AbortController();

    const loadSettings = async () => {
      try {
        // Check if cache is still valid (within 5 minutes)
        if (settingsCache && Date.now() - settingsCacheTime < SETTINGS_CACHE_TTL) {
          if (settingsCache.profile) {
            setProfile(settingsCache.profile);
          }
          return;
        }

        const response = await fetch("/api/settings", { signal: controller.signal });
        if (response.ok) {
          const settingsData = await response.json();
          // Update cache
          settingsCache = settingsData;
          settingsCacheTime = Date.now();
          if (settingsData?.profile) {
            setProfile(settingsData.profile);
          }
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          console.error("Failed to load settings:", err);
        }
      }
    };

    void loadSettings();

    return () => controller.abort();
  }, [isAuthenticated, currentUserRole, page]);

  const handleLogin = async (email: string, password: string, prefetched?: { role: string; user?: { name?: string; email?: string } }) => {
    let role: UserRole;
    let userData: { name?: string; email?: string } | undefined;

    if (prefetched) {
      // Auth already verified by LoginPage — use prefetched result, no redundant API call
      role = prefetched.role === "Member" || prefetched.role === "Viewer" ? prefetched.role : "Admin";
      userData = prefetched.user;
    } else {
      // Fallback: fetch auth (used by OTP flow where LoginPage doesn't prefetch)
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.message || "Invalid email or password.");
      }

      const data = await response.json();
      role = data.role === "Member" || data.role === "Viewer" ? data.role : "Admin";
      userData = data.user;
    }

    try {
      localStorage.setItem(AUTH_STORAGE_KEY, "true");
      localStorage.setItem(USER_ROLE_KEY, role);
    } catch {}

    setCurrentUserRole(role);

    if (role !== "Admin" && userData) {
      const userName = (userData.name || "").trim() || email.split("@")[0];
      setProfile({
        username: userName,
        companyName: "",
        role,
        email: userData.email ?? email,
      });
    }

    // Reset loading to true so Dashboard shows skeleton while data loads
    setLoading(true);
    setIsAuthenticated(true);
    setPage("dashboard");
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem(USER_ROLE_KEY);
    } catch (error) {
      console.warn("Failed to clear auth state:", error);
    }
    setCurrentUserRole("Admin");
    setIsAuthenticated(false);
    setPage("dashboard");
    setSettingsSection("users");
  };

  const handleAdd = useCallback(async (sub: Omit<Subscription, "id">) => {
    const tempId = `temp-${Date.now()}`;
    const tempSubscription = sanitizeSubscriptions([{ ...sub, id: tempId }])[0];

    if (!tempSubscription) return;

    // Optimistic: instantly add to UI with temp ID — only sanitize the new item, not the whole list
    setSubscriptions((prev) => [...prev, tempSubscription]);

    try {
      const response = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub),
      });
      if (!response.ok) {
        throw new Error(`Failed to add subscription: ${response.status}`);
      }
      const data = await response.json();
      // Replace temp ID with real Firestore ID — no need to re-sanitize the whole list
      setSubscriptions((prev) =>
        prev.map((s) => (s.id === tempId ? { ...s, id: data.id } : s))
      );
      setError(null);
    } catch (err) {
      console.error("Failed to add subscription:", err);
      setError(err instanceof Error ? err.message : String(err));
      // Rollback: remove the temp subscription
      setSubscriptions((prev) => prev.filter((s) => s.id !== tempId));
      toast.error("Failed to add subscription. Please try again.");
    }
  }, []);

  const handleEdit = useCallback(async (id: string, sub: Omit<Subscription, "id">) => {
    let originalSubscription: Subscription | undefined;
    const sanitized = sanitizeSubscriptions([{ ...sub, id }])[0];

    // Optimistic: instantly apply edits to UI — only sanitize the edited item
    setSubscriptions((prev) => {
      originalSubscription = prev.find((s) => s.id === id);
      if (!sanitized) return prev;
      return prev.map((s) => (s.id === id ? sanitized : s));
    });

    try {
      const response = await fetch(`/api/subscriptions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub),
      });
      if (!response.ok) {
        throw new Error(`Failed to update subscription: ${response.status}`);
      }
      setError(null);
    } catch (err) {
      console.error("Failed to update subscription:", err);
      setError(err instanceof Error ? err.message : String(err));
      // Rollback to original
      if (originalSubscription) {
        setSubscriptions((prev) =>
          prev.map((s) => (s.id === id ? originalSubscription! : s))
        );
      }
      toast.error("Failed to update subscription. Please try again.");
    }
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    let deletedSubscription: Subscription | undefined;
    setSubscriptions((prev) => {
      deletedSubscription = prev.find((s) => s.id === id);
      return prev.filter((s) => s.id !== id);
    });

    try {
      const response = await fetch(`/api/subscriptions/${id}`, {
        method: "DELETE",
      });
      if (!response.ok && response.status !== 204) {
        throw new Error(`Failed to delete subscription: ${response.status}`);
      }
      setError(null);
    } catch (err) {
      console.error("Failed to delete subscription:", err);
      setError(err instanceof Error ? err.message : String(err));
      if (deletedSubscription) {
        setSubscriptions((prev) => {
          if (prev.some((s) => s.id === id)) return prev;
          return [...prev, deletedSubscription!];
        });
      }
      toast.error("Failed to delete subscription. Please try again.");
    }
  }, []);

  const handleCreateCategory = useCallback((category: string) => {
    const trimmed = category.trim();
    if (!trimmed) return;
    setCategories((prev) => {
      if (prev.includes(trimmed as Category)) return prev;
      const next = [...prev, trimmed as Category];
      localStorage.setItem("customCategories", JSON.stringify(next.filter((item) => !DEFAULT_CATEGORIES.includes(item))));
      return next;
    });
  }, []);

  const handleCreateTeam = useCallback((team: string) => {
    const trimmed = team.trim();
    if (!trimmed) return;
    setTeams((prev) => {
      if (prev.includes(trimmed)) return prev;
      const next = [...prev, trimmed];
      localStorage.setItem("customTeams", JSON.stringify(next.filter((item) => !DEFAULT_TEAMS.includes(item))));
      return next;
    });
  }, []);

  const handleUpdateProfile = useCallback(async (updatedProfile: typeof profile) => {
    setProfile(updatedProfile);

    try {
      await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: updatedProfile }),
      });
    } catch (error) {
      console.warn("Failed to persist profile settings:", error);
    }
  }, []);

  const handleNavigate = useCallback((p: Page) => {
    setPage(p);
    setSidebarOpen(false);
  }, []);

  const handleNavigateToProfile = useCallback(() => {
    setPage("settings");
    setSettingsSection("profile");
    setSidebarOpen(false);
  }, []);

  const handleNavigateToSettings = useCallback(() => {
    setPage("settings");
    setSettingsSection("users");
    setSidebarOpen(false);
  }, []);

  const handleNavigateToNotifications = useCallback(() => {
    setPage("settings");
    setSettingsSection("notifications");
    setSidebarOpen(false);
  }, []);

  const handleCloseSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  const processAutopayRenewals = async () => {
    if (autopayProcessingRef.current || subscriptions.length === 0) return;

    const dueAutopaySubscriptions = subscriptions.filter(
      (sub) => sub.autoPay && sub.renewalStatus !== "Cancelled" && getDaysUntilExpiry(sub.expiryDate) <= 0
    );

    if (dueAutopaySubscriptions.length === 0) return;

    autopayProcessingRef.current = true;
    try {
      for (const sub of dueAutopaySubscriptions) {
        await handleEdit(sub.id, {
          ...sub,
          renewalStatus: "Paid",
          purchaseDate: sub.expiryDate,
          expiryDate: getNextExpiryDate(sub),
        });
      }
    } finally {
      autopayProcessingRef.current = false;
    }
  };

  useEffect(() => {
    if (loading) return;
    void processAutopayRenewals();
  }, [loading, subscriptions]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void processAutopayRenewals();
    }, 5 * 60 * 1000);

    return () => window.clearInterval(intervalId);
  }, [subscriptions]);

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen overflow-hidden [&_button]:cursor-pointer" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <Sidebar
        activePage={page}
        onNavigate={handleNavigate}
        onNavigateToProfile={handleNavigateToProfile}
        onNavigateToSettings={handleNavigateToSettings}
        onNavigateToNotifications={handleNavigateToNotifications}
        onLogout={handleLogout}
        profile={profile}
        isOpen={sidebarOpen}
        onClose={handleCloseSidebar}
        currentUserRole={currentUserRole}
      />
      <main className="flex-1 overflow-y-auto min-w-0">
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-200 sticky top-0 z-20">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl hover:bg-slate-100 transition-colors"
            style={{ color: "#0f172a" }}
          >
            <Menu size={20} />
          </button>
          <span style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a" }}>Tracker</span>
        </div>
        {page === "dashboard" && (
          <Dashboard
            loading={loading}
            subscriptions={subscriptions}
            onNavigate={setPage}
          />
        )}
        {page === "subscriptions" && (
          <Subscriptions
            subscriptions={subscriptions}
            onAdd={handleAdd}
            onEdit={handleEdit}
            onDelete={handleDelete}
            categories={categories}
            teams={teams}
            currentUserRole={currentUserRole}
          />
        )}
        {page === "reports" && <Reports subscriptions={subscriptions} />}
        {page === "renewals" && <Renewals subscriptions={subscriptions} onEdit={handleEdit} />}
        {page === "settings" && currentUserRole === "Admin" && (
          <SettingsPage
            subscriptions={subscriptions}
            section={settingsSection}
            onSectionChange={setSettingsSection}
            profile={profile}
            onUpdateProfile={handleUpdateProfile}
            categories={categories}
            onCreateCategory={handleCreateCategory}
            teams={teams}
            onCreateTeam={handleCreateTeam}
          />
        )}
        {page === "settings" && currentUserRole !== "Admin" && (
          <Dashboard
            loading={loading}
            subscriptions={subscriptions}
            onNavigate={(p) => setPage(p)}
          />
        )}
      </main>
      <Toaster />
    </div>
  );
}
