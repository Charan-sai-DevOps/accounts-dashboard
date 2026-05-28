import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Subscription, BillingCycle, PaymentMode, Category } from "../data/subscriptions";

interface AddEditModalProps {
  subscription?: Subscription | null;
  onSave: (sub: Omit<Subscription, "id">) => void;
  onClose: () => void;
}

const CYCLES: BillingCycle[] = ["Monthly", "Quarterly", "Annual"];
const PAYMENT_MODES: PaymentMode[] = ["Card", "PayPal", "Bank Transfer", "Crypto"];
const CATEGORIES: Category[] = ["Entertainment", "Productivity", "Dev Tools", "Cloud", "Design", "AI", "Communication", "Storage"];

const PLATFORM_COLORS: Record<string, string> = {
  Netflix: "#E50914", Spotify: "#1DB954", Adobe: "#FF0000", GitHub: "#24292E",
  AWS: "#FF9900", Slack: "#4A154B", Zoom: "#2D8CFF", Figma: "#F24E1E",
  Notion: "#000000", Linear: "#5E6AD2", ChatGPT: "#10A37F", Dropbox: "#0061FF",
};

export function AddEditModal({ subscription, onSave, onClose }: AddEditModalProps) {
  const [form, setForm] = useState({
    platform: "",
    plan: "",
    cost: "",
    purchaseDate: new Date().toISOString().split("T")[0],
    expiryDate: "",
    cycle: "Monthly" as BillingCycle,
    paymentMode: "Card" as PaymentMode,
    buyer: "",
    category: "Productivity" as Category,
    color: "#6366f1",
    logo: "",
    active: true,
  });

  useEffect(() => {
    if (subscription) {
      setForm({
        platform: subscription.platform,
        plan: subscription.plan,
        cost: subscription.cost.toString(),
        purchaseDate: subscription.purchaseDate,
        expiryDate: subscription.expiryDate,
        cycle: subscription.cycle,
        paymentMode: subscription.paymentMode,
        buyer: subscription.buyer,
        category: subscription.category,
        color: subscription.color,
        logo: subscription.logo,
        active: subscription.active,
      });
    }
  }, [subscription]);

  const handlePlatformChange = (val: string) => {
    const color = Object.entries(PLATFORM_COLORS).find(([k]) => val.toLowerCase().includes(k.toLowerCase()))?.[1] || "#6366f1";
    const logo = val.slice(0, 2).toUpperCase();
    setForm((f) => ({ ...f, platform: val, color, logo }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.platform || !form.cost || !form.expiryDate) return;
    onSave({
      ...form,
      cost: parseFloat(form.cost),
      logo: form.logo || form.platform.slice(0, 2).toUpperCase(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}>
      <div className="w-full max-w-lg rounded-2xl overflow-hidden" style={{ background: "white", boxShadow: "0 25px 50px rgba(0,0,0,0.15)" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: "1px solid #e2e8f0" }}>
          <div>
            <h2 style={{ color: "#0f172a", marginBottom: "2px" }}>
              {subscription ? "Edit Subscription" : "Add Subscription"}
            </h2>
            <p style={{ fontSize: "13px", color: "#94a3b8" }}>Fill in the subscription details below</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors"
            style={{ background: "#f1f5f9", color: "#64748b" }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px" }}>Platform *</label>
              <input
                required
                value={form.platform}
                onChange={(e) => handlePlatformChange(e.target.value)}
                placeholder="e.g. Netflix"
                className="w-full px-3 py-2.5 rounded-xl outline-none transition-all"
                style={{ border: "1.5px solid #e2e8f0", fontSize: "13px", color: "#0f172a" }}
                onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
                onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
              />
            </div>
            <div>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px" }}>Plan *</label>
              <input
                required
                value={form.plan}
                onChange={(e) => setForm((f) => ({ ...f, plan: e.target.value }))}
                placeholder="e.g. Premium"
                className="w-full px-3 py-2.5 rounded-xl outline-none transition-all"
                style={{ border: "1.5px solid #e2e8f0", fontSize: "13px", color: "#0f172a" }}
                onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
                onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px" }}>Cost ($) *</label>
              <input
                required
                type="number"
                min="0"
                step="0.01"
                value={form.cost}
                onChange={(e) => setForm((f) => ({ ...f, cost: e.target.value }))}
                placeholder="0.00"
                className="w-full px-3 py-2.5 rounded-xl outline-none transition-all"
                style={{ border: "1.5px solid #e2e8f0", fontSize: "13px", color: "#0f172a" }}
                onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
                onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
              />
            </div>
            <div>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px" }}>Billing Cycle</label>
              <select
                value={form.cycle}
                onChange={(e) => setForm((f) => ({ ...f, cycle: e.target.value as BillingCycle }))}
                className="w-full px-3 py-2.5 rounded-xl outline-none transition-all"
                style={{ border: "1.5px solid #e2e8f0", fontSize: "13px", color: "#0f172a" }}
              >
                {CYCLES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px" }}>Purchase Date</label>
              <input
                type="date"
                value={form.purchaseDate}
                onChange={(e) => setForm((f) => ({ ...f, purchaseDate: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl outline-none transition-all"
                style={{ border: "1.5px solid #e2e8f0", fontSize: "13px", color: "#0f172a" }}
                onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
                onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
              />
            </div>
            <div>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px" }}>Expiry Date *</label>
              <input
                required
                type="date"
                value={form.expiryDate}
                onChange={(e) => setForm((f) => ({ ...f, expiryDate: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl outline-none transition-all"
                style={{ border: "1.5px solid #e2e8f0", fontSize: "13px", color: "#0f172a" }}
                onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
                onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px" }}>Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as Category }))}
                className="w-full px-3 py-2.5 rounded-xl outline-none transition-all"
                style={{ border: "1.5px solid #e2e8f0", fontSize: "13px", color: "#0f172a" }}
              >
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px" }}>Payment Mode</label>
              <select
                value={form.paymentMode}
                onChange={(e) => setForm((f) => ({ ...f, paymentMode: e.target.value as PaymentMode }))}
                className="w-full px-3 py-2.5 rounded-xl outline-none transition-all"
                style={{ border: "1.5px solid #e2e8f0", fontSize: "13px", color: "#0f172a" }}
              >
                {PAYMENT_MODES.map((m) => <option key={m}>{m}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px" }}>Buyer</label>
            <input
              value={form.buyer}
              onChange={(e) => setForm((f) => ({ ...f, buyer: e.target.value }))}
              placeholder="e.g. Alex"
              className="w-full px-3 py-2.5 rounded-xl outline-none transition-all"
              style={{ border: "1.5px solid #e2e8f0", fontSize: "13px", color: "#0f172a" }}
              onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
              onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
            />
          </div>

          <div className="flex gap-3 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl transition-colors"
              style={{ border: "1.5px solid #e2e8f0", fontSize: "14px", color: "#64748b", fontWeight: 500, background: "white" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl text-white transition-all"
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", fontSize: "14px", fontWeight: 600 }}
            >
              {subscription ? "Save Changes" : "Add Subscription"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
