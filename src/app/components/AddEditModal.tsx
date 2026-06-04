import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Subscription, BillingCycle, PaymentMode, Category, Currency, Team, getPlatformIdentity } from "../data/subscriptions";

interface AddEditModalProps {
  subscription?: Subscription | null;
  onSave: (sub: Omit<Subscription, "id">) => void;
  onClose: () => void;
  categories: Category[];
  teams: Team[];
}

const CYCLES: BillingCycle[] = ["Monthly", "Quarterly", "Annual"];
const PAYMENT_MODES: PaymentMode[] = ["Card", "UPI"];
const CURRENCIES: Currency[] = ["INR", "USD"];

export function AddEditModal({ subscription, onSave, onClose, categories, teams }: AddEditModalProps) {
  const [form, setForm] = useState({
    platform: "",
    plan: "",
    cost: "",
    currency: "INR" as Currency,
    purchaseDate: new Date().toISOString().split("T")[0],
    expiryDate: "",
    cycle: "Monthly" as BillingCycle,
    paymentMode: "Card" as PaymentMode,
    buyer: "",
    accountHolder: "",
    accountEmail: "",
    accountPassword: "",
    invoiceFileName: "",
    category: "Productivity" as Category,
    team: "Development" as Team,
    autoPay: false,
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
        currency: subscription.currency || "INR",
        purchaseDate: subscription.purchaseDate,
        expiryDate: subscription.expiryDate,
        cycle: subscription.cycle,
        paymentMode: subscription.paymentMode,
        buyer: subscription.buyer,
        accountHolder: subscription.accountHolder,
        accountEmail: subscription.accountEmail,
        accountPassword: subscription.accountPassword,
        invoiceFileName: subscription.invoiceFileName || "",
        category: subscription.category,
        team: subscription.team || "Development",
        autoPay: subscription.autoPay ?? false,
        color: subscription.color,
        logo: subscription.logo,
        active: subscription.active,
      });
    }
  }, [subscription]);

  const handlePlatformChange = (val: string) => {
    const identity = getPlatformIdentity(val);
    setForm((f) => ({ ...f, platform: val, color: identity.color, logo: identity.logo }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.platform || !form.cost || !form.expiryDate || !form.accountHolder || !form.accountEmail) return;
    onSave({
      ...form,
      cost: parseFloat(form.cost),
      logo: form.logo || getPlatformIdentity(form.platform).logo,
    });
  };

  const fieldStyle = { border: "1.5px solid #e2e8f0", fontSize: "13px", color: "#0f172a" };
  const labelStyle: React.CSSProperties = { fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px" };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}>
      <div className="w-full max-w-lg rounded-2xl overflow-hidden" style={{ background: "white", boxShadow: "0 25px 50px rgba(0,0,0,0.15)", maxHeight: "90vh" }}>
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
        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4 overflow-y-auto" style={{ maxHeight: "calc(90vh - 96px)" }}>

          {/* Platform + Plan */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={labelStyle}>Platform *</label>
              <input
                required
                value={form.platform}
                onChange={(e) => handlePlatformChange(e.target.value)}
                placeholder="e.g. Netflix"
                className="w-full px-3 py-2.5 rounded-xl outline-none transition-all"
                style={fieldStyle}
                onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
                onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
              />
            </div>
            <div>
              <label style={labelStyle}>Plan *</label>
              <input
                required
                value={form.plan}
                onChange={(e) => setForm((f) => ({ ...f, plan: e.target.value }))}
                placeholder="e.g. Premium"
                className="w-full px-3 py-2.5 rounded-xl outline-none transition-all"
                style={fieldStyle}
                onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
                onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
              />
            </div>
          </div>

          {/* Cost + Currency */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={labelStyle}>Cost ({form.currency === "USD" ? "$" : "₹"}) *</label>
              <input
                required
                type="number"
                min="0"
                step="0.01"
                value={form.cost}
                onChange={(e) => setForm((f) => ({ ...f, cost: e.target.value }))}
                placeholder="0.00"
                className="w-full px-3 py-2.5 rounded-xl outline-none transition-all"
                style={fieldStyle}
                onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
                onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
              />
            </div>
            <div>
              <label style={labelStyle}>Currency</label>
              <select
                value={form.currency}
                onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value as Currency }))}
                className="w-full px-3 py-2.5 rounded-xl outline-none transition-all"
                style={fieldStyle}
              >
                {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Billing Cycle + Purchase Date + Expiry Date */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label style={labelStyle}>Billing Cycle</label>
              <select
                value={form.cycle}
                onChange={(e) => setForm((f) => ({ ...f, cycle: e.target.value as BillingCycle }))}
                className="w-full px-3 py-2.5 rounded-xl outline-none transition-all"
                style={fieldStyle}
              >
                {CYCLES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Purchase Date</label>
              <input
                type="date"
                value={form.purchaseDate}
                onChange={(e) => setForm((f) => ({ ...f, purchaseDate: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl outline-none transition-all"
                style={fieldStyle}
                onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
                onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
              />
            </div>
            <div>
              <label style={labelStyle}>Expiry Date *</label>
              <input
                required
                type="date"
                value={form.expiryDate}
                onChange={(e) => setForm((f) => ({ ...f, expiryDate: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl outline-none transition-all"
                style={fieldStyle}
                onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
                onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
              />
            </div>
          </div>

          {/* Team + Payment Mode */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={labelStyle}>Team</label>
              <select
                value={form.team}
                onChange={(e) => setForm((f) => ({ ...f, team: e.target.value as Team }))}
                className="w-full px-3 py-2.5 rounded-xl outline-none transition-all"
                style={fieldStyle}
              >
                {teams.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Payment Mode</label>
              <select
                value={form.paymentMode}
                onChange={(e) => setForm((f) => ({ ...f, paymentMode: e.target.value as PaymentMode }))}
                className="w-full px-3 py-2.5 rounded-xl outline-none transition-all"
                style={fieldStyle}
              >
                {PAYMENT_MODES.map((m) => <option key={m}>{m}</option>)}
              </select>
            </div>
          </div>

          {/* Category */}
          <div>
            <label style={labelStyle}>Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as Category }))}
              className="w-full px-3 py-2.5 rounded-xl outline-none transition-all"
              style={fieldStyle}
            >
              {categories.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>

          {/* Account Holder + Email */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={labelStyle}>Account Holder *</label>
              <input
                required
                value={form.accountHolder}
                onChange={(e) => setForm((f) => ({ ...f, accountHolder: e.target.value }))}
                placeholder="e.g. Alex Johnson"
                className="w-full px-3 py-2.5 rounded-xl outline-none transition-all"
                style={fieldStyle}
                onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
                onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
              />
            </div>
            <div>
              <label style={labelStyle}>Account Email/Username *</label>
              <input
                required
                value={form.accountEmail}
                onChange={(e) => setForm((f) => ({ ...f, accountEmail: e.target.value }))}
                placeholder="email or username"
                className="w-full px-3 py-2.5 rounded-xl outline-none transition-all"
                style={fieldStyle}
                onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
                onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label style={labelStyle}>Account Password</label>
            <input
              value={form.accountPassword}
              onChange={(e) => setForm((f) => ({ ...f, accountPassword: e.target.value }))}
              placeholder="Optional - store if needed"
              className="w-full px-3 py-2.5 rounded-xl outline-none transition-all"
              style={fieldStyle}
              onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
              onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
            />
          </div>

          {/* Auto Pay toggle */}
          <div className="flex items-center justify-between px-4 py-3 rounded-xl" style={{ border: "1.5px solid #e2e8f0", background: "#fafafa" }}>
            <div>
              <p style={{ fontSize: "13px", fontWeight: 600, color: "#374151" }}>Auto Pay</p>
              <p style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>Automatically process payment on renewal</p>
            </div>
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, autoPay: !f.autoPay }))}
              className="relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors duration-200"
              style={{ background: form.autoPay ? "#6366f1" : "#e2e8f0" }}
              role="switch"
              aria-checked={form.autoPay}
            >
              <span
                className="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200"
                style={{ transform: form.autoPay ? "translateX(22px)" : "translateX(2px)" }}
              />
            </button>
          </div>

          {/* Invoice upload */}
          <div>
            <label style={labelStyle}>Invoice Upload</label>
            <div className="flex items-center gap-3">
              <label
                htmlFor="invoice-upload"
                className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm font-semibold text-white"
                style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", cursor: "pointer" }}
              >
                Upload Invoice
              </label>
              <span style={{ fontSize: "12px", color: "#64748b" }}>
                {form.invoiceFileName || "PDF, PNG, JPG up to 10 MB"}
              </span>
            </div>
            <input
              id="invoice-upload"
              type="file"
              accept=".pdf,image/png,image/jpeg"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) setForm((f) => ({ ...f, invoiceFileName: file.name }));
              }}
            />
          </div>

          {/* Buyer */}
          <div>
            <label style={labelStyle}>Buyer</label>
            <input
              value={form.buyer}
              onChange={(e) => setForm((f) => ({ ...f, buyer: e.target.value }))}
              placeholder="e.g. Alex"
              className="w-full px-3 py-2.5 rounded-xl outline-none transition-all"
              style={fieldStyle}
              onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
              onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
            />
          </div>

          {/* Actions */}
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
