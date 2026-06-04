import { useState, useEffect, useRef } from "react";
import { Sidebar } from "./components/Sidebar";
import { Dashboard } from "./components/Dashboard";
import { Subscriptions } from "./components/Subscriptions";
import { Reports } from "./components/Reports";
import { Renewals } from "./components/Renewals";
import { SettingsPage } from "./components/SettingsPage";
import { LoginPage } from "./components/LoginPage";
import { Subscription, getDaysUntilExpiry, getNextExpiryDate, DEFAULT_CATEGORIES, DEFAULT_TEAMS, Category, Team, sanitizeSubscriptions } from "./data/subscriptions";
// import { db } from "../firebase";
// import { collection, doc, onSnapshot, addDoc, setDoc, deleteDoc } from "firebase/firestore";

type Page = "dashboard" | "subscriptions" | "reports" | "renewals" | "settings";
const AUTH_STORAGE_KEY = "subscription-dashboard-auth";

export default function App() {
  const [page, setPage] = useState<Page>("dashboard");
  const [settingsSection, setSettingsSection] = useState<any>("users");
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      return localStorage.getItem(AUTH_STORAGE_KEY) === "true";
    } catch (error) {
      return false;
    }
  });
  const [profile, setProfile] = useState({
    username: "Charan Sai",
    companyName: "Webomind Apps",
    role: "Admin",
    email: "charan.sai@webomindapps.com"
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

    const loadSubscriptions = async () => {
      try {
        const response = await fetch("/api/subscriptions");
        if (!response.ok) {
          throw new Error(`Failed to fetch subscriptions: ${response.status}`);
        }
        const data = sanitizeSubscriptions(await response.json());
        setSubscriptions(data);
        setError(null);
      } catch (err) {
        console.error("Failed to load subscriptions:", err);
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    };

    loadSubscriptions();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const loadSettings = async () => {
      try {
        const response = await fetch("/api/settings");
        if (!response.ok) return;
        const data = await response.json();
        if (data?.profile) {
          setProfile(data.profile);
        }
      } catch (err) {
        console.warn("Failed to load settings:", err);
      }
    };

    void loadSettings();
  }, [isAuthenticated]);

  const handleLogin = async (email: string, password: string) => {
    const response = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      throw new Error(data?.message || "Unable to log in.");
    }

    try {
      localStorage.setItem(AUTH_STORAGE_KEY, "true");
    } catch (error) {
      console.warn("Failed to persist auth state:", error);
    }

    setIsAuthenticated(true);
    setPage("dashboard");
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (error) {
      console.warn("Failed to clear auth state:", error);
    }
    setIsAuthenticated(false);
    setPage("dashboard");
    setSettingsSection("users");
  };

  const handleAdd = async (sub: Omit<Subscription, "id">) => {
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
      setSubscriptions((prev) => sanitizeSubscriptions([...prev, { ...sub, id: data.id }]));
      setError(null);
    } catch (err) {
      console.error("Failed to add subscription:", err);
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleEdit = async (id: string, sub: Omit<Subscription, "id">) => {
    try {
      const response = await fetch(`/api/subscriptions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub),
      });
      if (!response.ok) {
        throw new Error(`Failed to update subscription: ${response.status}`);
      }
      setSubscriptions((prev) => sanitizeSubscriptions(prev.map((s) => (s.id === id ? { ...sub, id } : s))));
      setError(null);
    } catch (err) {
      console.error("Failed to update subscription:", err);
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/subscriptions/${id}`, {
        method: "DELETE",
      });
      if (!response.ok && response.status !== 204) {
        throw new Error(`Failed to delete subscription: ${response.status}`);
      }
      setSubscriptions((prev) => prev.filter((s) => s.id !== id));
      setError(null);
    } catch (err) {
      console.error("Failed to delete subscription:", err);
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleCreateCategory = (category: string) => {
    const trimmed = category.trim();
    if (!trimmed) return;
    setCategories((prev) => {
      if (prev.includes(trimmed as Category)) return prev;
      const next = [...prev, trimmed as Category];
      localStorage.setItem("customCategories", JSON.stringify(next.filter((item) => !DEFAULT_CATEGORIES.includes(item))));
      return next;
    });
  };

  const handleCreateTeam = (team: string) => {
    const trimmed = team.trim();
    if (!trimmed) return;
    setTeams((prev) => {
      if (prev.includes(trimmed)) return prev;
      const next = [...prev, trimmed];
      localStorage.setItem("customTeams", JSON.stringify(next.filter((item) => !DEFAULT_TEAMS.includes(item))));
      return next;
    });
  };

  const handleUpdateProfile = async (updatedProfile: typeof profile) => {
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
  };

  useEffect(() => {
    if (loading || autopayProcessingRef.current || subscriptions.length === 0) return;

    const dueAutopaySubscriptions = subscriptions.filter(
      (sub) => sub.autoPay && sub.renewalStatus !== "Cancelled" && getDaysUntilExpiry(sub.expiryDate) <= 0
    );

    if (dueAutopaySubscriptions.length === 0) return;

    autopayProcessingRef.current = true;

    const processAutopayRenewals = async () => {
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

    void processAutopayRenewals();
  }, [loading, subscriptions]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      if (autopayProcessingRef.current) return;
      const dueAutopaySubscriptions = subscriptions.filter(
        (sub) => sub.autoPay && sub.renewalStatus !== "Cancelled" && getDaysUntilExpiry(sub.expiryDate) <= 0
      );
      if (dueAutopaySubscriptions.length === 0) return;

      autopayProcessingRef.current = true;
      void (async () => {
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
      })();
    }, 5 * 60 * 1000);

    return () => window.clearInterval(intervalId);
  }, [subscriptions]);

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      <Sidebar
        activePage={page}
        onNavigate={setPage}
        onNavigateToProfile={() => {
          setPage("settings");
          setSettingsSection("profile");
        }}
        onNavigateToSettings={() => {
          setPage("settings");
          setSettingsSection("users");
        }}
        onNavigateToNotifications={() => {
          setPage("settings");
          setSettingsSection("notifications");
        }}
        onLogout={handleLogout}
        profile={profile}
      />
      <main className="flex-1 overflow-y-auto">
        {page === "dashboard" && (
          <Dashboard
            subscriptions={subscriptions}
            onNavigate={(p) => setPage(p)}
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
          />
        )}
        {page === "reports" && <Reports subscriptions={subscriptions} />}
        {page === "renewals" && <Renewals subscriptions={subscriptions} onEdit={handleEdit} />}
        {page === "settings" && (
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
      </main>
    </div>
  );
}
