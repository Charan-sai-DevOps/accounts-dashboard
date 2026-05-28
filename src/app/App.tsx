import { useState, useEffect } from "react";
import { Sidebar } from "./components/Sidebar";
import { Dashboard } from "./components/Dashboard";
import { Subscriptions } from "./components/Subscriptions";
import { Reports } from "./components/Reports";
import { Renewals } from "./components/Renewals";
import { SettingsPage } from "./components/SettingsPage";
import { Subscription } from "./data/subscriptions";
// import { db } from "../firebase";
// import { collection, doc, onSnapshot, addDoc, setDoc, deleteDoc } from "firebase/firestore";

type Page = "dashboard" | "subscriptions" | "reports" | "renewals" | "settings";

export default function App() {
  const [page, setPage] = useState<Page>("dashboard");
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSubscriptions = async () => {
      try {
        const response = await fetch("/api/subscriptions");
        if (!response.ok) {
          throw new Error(`Failed to fetch subscriptions: ${response.status}`);
        }
        const data = (await response.json()) as Subscription[];
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
  }, []);

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
      setSubscriptions((prev) => [...prev, { ...sub, id: data.id }]);
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
      setSubscriptions((prev) => prev.map((s) => (s.id === id ? { ...sub, id } : s)));
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

  return (
    <div className="flex h-screen overflow-hidden" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      <Sidebar activePage={page} onNavigate={setPage} />
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
          />
        )}
        {page === "reports" && <Reports subscriptions={subscriptions} />}
        {page === "renewals" && <Renewals subscriptions={subscriptions} />}
        {page === "settings" && <SettingsPage />}
      </main>
    </div>
  );
}
