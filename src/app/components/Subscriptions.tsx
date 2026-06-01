import { useState } from "react";
import { Plus, Search, Edit2, Trash2, Download, Filter } from "lucide-react";
import { Subscription, getDaysUntilExpiry, getMonthlyCost } from "../data/subscriptions";
import { AddEditModal } from "./AddEditModal";

interface SubscriptionsProps {
  subscriptions: Subscription[];
  onAdd: (sub: Omit<Subscription, "id">) => void;
  onEdit: (id: string, sub: Omit<Subscription, "id">) => void;
  onDelete: (id: string) => void;
}

export function Subscriptions({ subscriptions, onAdd, onEdit, onDelete }: SubscriptionsProps) {
  const [search, setSearch] = useState("");
  const [filterCycle, setFilterCycle] = useState("All");
  const [purchaseFrom, setPurchaseFrom] = useState("");
  const [purchaseTo, setPurchaseTo] = useState("");
  const [showDateFilters, setShowDateFilters] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Subscription | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const filtered = subscriptions.filter((s) => {
    const term = search.toLowerCase();
    const matchSearch =
      s.platform.toLowerCase().includes(term) ||
      s.plan.toLowerCase().includes(term) ||
      s.buyer.toLowerCase().includes(term) ||
      s.accountHolder?.toLowerCase().includes(term) ||
      s.accountEmail?.toLowerCase().includes(term) ||
      (s.invoiceFileName || "").toLowerCase().includes(term);

    const daysUntilExpiry = getDaysUntilExpiry(s.expiryDate);
    const matchCycle =
      filterCycle === "All"
        ? true
        : filterCycle === "Expired"
        ? daysUntilExpiry < 0
        : s.cycle === filterCycle;

    const fromOk = !purchaseFrom || new Date(s.purchaseDate) >= new Date(purchaseFrom);
    const toOk = !purchaseTo || new Date(s.purchaseDate) <= new Date(purchaseTo);

    return matchSearch && matchCycle && fromOk && toOk;
  });

  const handleSave = (sub: Omit<Subscription, "id">) => {
    if (editTarget) {
      onEdit(editTarget.id, sub);
    } else {
      onAdd(sub);
    }
    setModalOpen(false);
    setEditTarget(null);
  };

  const handleEdit = (sub: Subscription) => {
    setEditTarget(sub);
    setModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (deleteConfirm === id) {
      onDelete(id);
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(id);
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  const downloadCSV = () => {
    const headers = ["Platform", "Plan", "Cost", "Cycle", "Monthly Cost", "Purchase Date", "Expiry Date", "Payment Mode", "Buyer", "Account Holder", "Account Email", "Invoice", "Category"];
    const rows = subscriptions.map((s) => [
      s.platform, s.plan, s.cost, s.cycle, getMonthlyCost(s).toFixed(2),
      s.purchaseDate, s.expiryDate, s.paymentMode, s.buyer, s.accountHolder, s.accountEmail, s.invoiceFileName || "", s.category,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "subscriptions.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-6 p-6 min-h-full" style={{ background: "#f8fafc" }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ color: "#0f172a", marginBottom: "4px" }}>Subscriptions</h1>
          <p style={{ color: "#64748b", fontSize: "14px" }}>{subscriptions.length} active subscriptions</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowDateFilters((prev) => !prev)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl transition-colors"
            style={{ border: "1.5px solid #e2e8f0", fontSize: "13px", color: "#64748b", background: "white" }}
          >
            <Filter size={15} />
            Date Filter
          </button>
          <button
            onClick={downloadCSV}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl transition-colors"
            style={{ border: "1.5px solid #e2e8f0", fontSize: "13px", color: "#64748b", fontWeight: 500, background: "white" }}
          >
            <Download size={15} />
            Export CSV
          </button>
          <button
            onClick={() => { setEditTarget(null); setModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white transition-all"
            style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", fontSize: "13px", fontWeight: 600, boxShadow: "0 4px 15px rgba(99,102,241,0.35)" }}
          >
            <Plus size={16} />
            Add Subscription
          </button>
        </div>
      </div>

      {/* Filters */}
<div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#94a3b8" }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search platform, plan, buyer..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl outline-none"
                style={{ border: "1.5px solid #e2e8f0", fontSize: "13px", color: "#0f172a", background: "white" }}
                onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
                onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
              />
            </div>
            <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: "#f1f5f9", border: "1px solid #e2e8f0" }}>
              {["All", "Monthly", "Quarterly", "Annual", "Expired"].map((cycle) => (
                <button
                  key={cycle}
                  onClick={() => setFilterCycle(cycle)}
                  className="px-3 py-1.5 rounded-lg transition-all"
                  style={{
                    fontSize: "12px",
                    fontWeight: filterCycle === cycle ? 600 : 400,
                    background: filterCycle === cycle ? "white" : "transparent",
                    color: filterCycle === cycle ? "#0f172a" : "#64748b",
                    boxShadow: filterCycle === cycle ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                  }}
                >
                  {cycle}
                </button>
              ))}
            </div>
          </div>
          {showDateFilters && (
            <div className="grid grid-cols-2 gap-4 max-w-2xl">
              <div>
                <p style={{ fontSize: "12px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>Purchase Date From</p>
                <input
                  type="date"
                  value={purchaseFrom}
                  onChange={(e) => setPurchaseFrom(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl outline-none"
                  style={{ border: "1.5px solid #e2e8f0", fontSize: "13px", color: "#0f172a", background: "white" }}
                  onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
                  onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
                />
              </div>
              <div>
                <p style={{ fontSize: "12px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>Purchase Date To</p>
                <input
                  type="date"
                  value={purchaseTo}
                  onChange={(e) => setPurchaseTo(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl outline-none"
                  style={{ border: "1.5px solid #e2e8f0", fontSize: "13px", color: "#0f172a", background: "white" }}
                  onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
                  onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
                />
              </div>
            </div>
          )}
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "white", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
        <table className="w-full" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #f1f5f9", background: "#f8fafc" }}>
              {["Platform", "Plan", "Cost", "Cycle", "Purchase Date", "Expiry", "Payment", "Buyer", "Account Holder", "Account Email", "Invoice", "Status", "Actions"].map((h) => (
                <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", fontWeight: 600, color: "#94a3b8", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>
                  {h.toUpperCase()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((sub, i) => {
              const days = getDaysUntilExpiry(sub.expiryDate);
              const urgent = days <= 7;
              const warning = days <= 14;
              return (
                <tr
                  key={sub.id}
                  style={{ borderBottom: i < filtered.length - 1 ? "1px solid #f1f5f9" : "none" }}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td style={{ padding: "14px 16px" }}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white flex-shrink-0" style={{ background: sub.color, fontSize: "9px", fontWeight: 700 }}>
                        {sub.logo}
                      </div>
                      <span style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a" }}>{sub.platform}</span>
                    </div>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <span className="px-2 py-0.5 rounded-md" style={{ fontSize: "12px", background: "#f1f5f9", color: "#475569" }}>{sub.plan}</span>
                  </td>
                  <td style={{ padding: "14px 16px", fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>
                    ${sub.cost.toFixed(2)}
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <span className="px-2 py-0.5 rounded-md" style={{
                      fontSize: "11px", fontWeight: 600,
                      background: sub.cycle === "Annual" ? "rgba(99,102,241,0.1)" : sub.cycle === "Quarterly" ? "rgba(245,158,11,0.1)" : "rgba(16,185,129,0.1)",
                      color: sub.cycle === "Annual" ? "#6366f1" : sub.cycle === "Quarterly" ? "#f59e0b" : "#10b981",
                    }}>
                      {sub.cycle}
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px", fontSize: "12px", color: "#64748b" }}>{sub.purchaseDate}</td>
                  <td style={{ padding: "14px 16px", fontSize: "12px", color: "#64748b" }}>{sub.expiryDate}</td>
                  <td style={{ padding: "14px 16px", fontSize: "12px", color: "#64748b" }}>{sub.paymentMode}</td>
                  <td style={{ padding: "14px 16px", fontSize: "13px", color: "#0f172a" }}>{sub.buyer}</td>
                  <td style={{ padding: "14px 16px", fontSize: "13px", color: "#0f172a" }}>{sub.accountHolder || "—"}</td>
                  <td style={{ padding: "14px 16px", fontSize: "13px", color: "#0f172a" }}>{sub.accountEmail || "—"}</td>
                  <td style={{ padding: "14px 16px", fontSize: "13px", color: "#64748b" }}>{sub.invoiceFileName || "No invoice"}</td>
                  <td style={{ padding: "14px 16px" }}>
                    <span className="px-2 py-1 rounded-lg" style={{
                      fontSize: "11px", fontWeight: 600,
                      background: urgent ? "rgba(239,68,68,0.1)" : warning ? "rgba(245,158,11,0.1)" : "rgba(16,185,129,0.1)",
                      color: urgent ? "#ef4444" : warning ? "#f59e0b" : "#10b981",
                    }}>
                      {days < 0 ? "Expired" : days === 0 ? "Today" : `${days}d left`}
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(sub)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                        style={{ background: "rgba(99,102,241,0.08)", color: "#6366f1" }}
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => handleDelete(sub.id)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                        style={{ background: deleteConfirm === sub.id ? "rgba(239,68,68,0.15)" : "rgba(239,68,68,0.08)", color: "#ef4444" }}
                        title={deleteConfirm === sub.id ? "Click again to confirm" : "Delete"}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={13} style={{ padding: "48px", textAlign: "center", color: "#94a3b8", fontSize: "14px" }}>
                  No subscriptions found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <AddEditModal
          subscription={editTarget}
          onSave={handleSave}
          onClose={() => { setModalOpen(false); setEditTarget(null); }}
        />
      )}
    </div>
  );
}
