import { useState, useMemo, memo } from "react";
import { Plus, Search, Edit2, Trash2, Download, Filter, Eye, EyeOff, Copy, Check, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Subscription,
  getDaysUntilExpiry,
  getMonthlyCost,
  USD_TO_INR,
  teamColors,
  Team,
  Category,
  getTeamIdentity,
} from "../data/subscriptions";
import { AddEditModal } from "./AddEditModal";
import { usePlatformLogo } from "../hooks/usePlatformLogo";
import { useDebounce } from "../hooks/useDebounce";

interface SubscriptionsProps {
  subscriptions: Subscription[];
  onAdd: (sub: Omit<Subscription, "id">) => void;
  onEdit: (id: string, sub: Omit<Subscription, "id">) => void;
  onDelete: (id: string) => void;
  categories: Category[];
  teams: Team[];
  currentUserRole?: "Admin" | "Member" | "Viewer";
}

function SubscriptionsComponent({ subscriptions, onAdd, onEdit, onDelete, categories, teams, currentUserRole = "Admin" }: SubscriptionsProps) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [filterCycle, setFilterCycle] = useState("All");
  const [purchaseFrom, setPurchaseFrom] = useState("");
  const [purchaseTo, setPurchaseTo] = useState("");
  const [showDateFilters, setShowDateFilters] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Subscription | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailTarget, setDetailTarget] = useState<Subscription | null>(null);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [copiedField, setCopiedField] = useState<"username" | "password" | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deleteTargetName, setDeleteTargetName] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [addTeamContext, setAddTeamContext] = useState<Team | null>(null);
  const [showRowsMenu, setShowRowsMenu] = useState(false);
  const { getActiveLogoSrc, handleLogoError } = usePlatformLogo();

  const filtered = useMemo(() => {
    if (!subscriptions.length) return [];

    const term = debouncedSearch.toLowerCase();
    const hasDateFilter = purchaseFrom || purchaseTo;
    const purchaseFromDate = purchaseFrom ? new Date(purchaseFrom).getTime() : 0;
    const purchaseToDate = purchaseTo ? new Date(purchaseTo).getTime() : 0;

    return subscriptions.filter((s) => {
      // Fast exit: check cycle filter first (single property check)
      if (filterCycle !== "All") {
        if (filterCycle === "Expired") {
          if (getDaysUntilExpiry(s.expiryDate) >= 0) return false;
        } else if (s.cycle !== filterCycle) {
          return false;
        }
      }

      // Check date filters (cheaper than string search)
      if (hasDateFilter) {
        const purchaseTime = new Date(s.purchaseDate).getTime();
        if (purchaseFromDate && purchaseTime < purchaseFromDate) return false;
        if (purchaseToDate && purchaseTime > purchaseToDate) return false;
      }

      // Only do expensive string operations if other filters pass
      if (!term) return true;

      return (
        s.platform.toLowerCase().includes(term) ||
        s.plan.toLowerCase().includes(term) ||
        s.buyer.toLowerCase().includes(term) ||
        s.accountHolder?.toLowerCase().includes(term) ||
        s.accountEmail?.toLowerCase().includes(term) ||
        (s.invoiceFileName || "").toLowerCase().includes(term)
      );
    });
  }, [subscriptions, debouncedSearch, filterCycle, purchaseFrom, purchaseTo]);

  const activeSubscriptions = useMemo(
    () => subscriptions.filter((subscription) => subscription.active && subscription.renewalStatus !== "Cancelled"),
    [subscriptions]
  );
  const uniquePlatformCount = useMemo(
    () => new Set(
      activeSubscriptions.map((subscription) => subscription.platform.trim().toLowerCase()).filter(Boolean)
    ).size,
    [activeSubscriptions]
  );

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedFiltered = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    return filtered.slice(startIdx, startIdx + itemsPerPage);
  }, [filtered, currentPage, itemsPerPage]);

  const orderedTeams = useMemo(
    () => teams.filter((team) =>
      paginatedFiltered.some((s) => s.team === team)
    ),
    [teams, paginatedFiltered]
  );

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

  const requestDelete = (sub: Subscription) => {
    setPendingDeleteId(sub.id);
    setDeleteTargetName(sub.platform);
  };

  const confirmDelete = () => {
    if (!pendingDeleteId) return;
    onDelete(pendingDeleteId);
    setPendingDeleteId(null);
    setDeleteTargetName(null);
  };

  const cancelDelete = () => {
    setPendingDeleteId(null);
    setDeleteTargetName(null);
  };

  const resetToFirstPage = () => {
    setCurrentPage(1);
  };

  const downloadCSV = () => {
    const headers = ["Platform", "Plan", "Team", "Currency", "Cost (INR)", "Cost (USD)", "Cycle", "Monthly Cost (INR)", "Expiry Date", "Buyer", "Account Holder", "Invoice", "Category", "Auto Pay"];
    const rows = subscriptions.map((s) => {
      const inrCost = s.currency === "USD" ? (s.cost * USD_TO_INR).toFixed(0) : s.cost.toFixed(2);
      const usdCost = s.currency === "USD" ? s.cost.toFixed(2) : "";
      const monthlyINR = s.currency === "USD" ? (getMonthlyCost(s) * USD_TO_INR).toFixed(0) : getMonthlyCost(s).toFixed(2);
      return [s.platform, s.plan, s.team || "", s.currency, inrCost, usdCost, s.cycle, monthlyINR, s.expiryDate, s.buyer, s.accountHolder || "", s.invoiceFileName || "", s.category, s.autoPay ? "Yes" : "No"];
    });
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "subscriptions.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadInvoice = (subscription: Subscription) => {
    if (!subscription.invoiceFileName) return;
    const content = `Invoice for ${subscription.platform}\nFile: ${subscription.invoiceFileName}`;
    const blob = new Blob([content], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = subscription.invoiceFileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const openDetail = (subscription: Subscription) => {
    setDetailTarget(subscription);
    setPasswordVisible(false);
    setCopiedField(null);
    setDetailOpen(true);
  };

  const copyToClipboard = async (value: string, field: "username" | "password") => {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1500);
  };



  const canWrite = currentUserRole === "Admin" || currentUserRole === "Member";
  const canDelete = currentUserRole === "Admin";

  return (
    <div className="flex flex-col gap-6 p-6 min-h-full [&_button]:cursor-pointer" style={{ background: "#f8fafc" }}>
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 style={{ color: "#0f172a", marginBottom: "4px", fontWeight: 700 }}>Subscriptions</h1>
          <p style={{ color: "#64748b", fontSize: "14px" }}>
            {activeSubscriptions.length} active subscriptions across {uniquePlatformCount} platforms
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={downloadCSV}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl transition-colors"
            style={{ border: "1.5px solid #e2e8f0", fontSize: "13px", color: "#64748b", fontWeight: 500, background: "white" }}
          >
            <Download size={15} />
            Export CSV
          </button>
          {canWrite && (
            <button
              onClick={() => { setEditTarget(null); setAddTeamContext(null); setModalOpen(true); }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white transition-all"
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", fontSize: "13px", fontWeight: 600, boxShadow: "0 4px 15px rgba(99,102,241,0.35)" }}
            >
              <Plus size={16} />
              Add Subscription
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative flex-1 min-w-0 max-w-xl">
          <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: "#94a3b8" }} />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              resetToFirstPage();
            }}
            placeholder="Search platform, plan, buyer..."
            className="w-full pl-12 pr-4 py-3 rounded-2xl outline-none"
            style={{ border: "1.5px solid #e2e8f0", fontSize: "13px", color: "#0f172a", background: "white" }}
            onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
            onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-slate-100 p-2 border border-slate-200">
          {["All", "Monthly", "Quarterly", "Annual", "Expired"].map((cycle) => (
            <button
              key={cycle}
              onClick={() => {
                setFilterCycle(cycle);
                resetToFirstPage();
              }}
              className="px-4 py-2 rounded-2xl transition-all"
              style={{
                fontSize: "12px",
                fontWeight: filterCycle === cycle ? 700 : 500,
                background: filterCycle === cycle ? "white" : "transparent",
                color: filterCycle === cycle ? "#0f172a" : "#64748b",
                boxShadow: filterCycle === cycle ? "0 1px 2px rgba(0,0,0,0.08)" : "none",
              }}
            >
              {cycle}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowDateFilters((prev) => !prev)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl transition-colors"
          style={{ border: "1.5px solid #e2e8f0", fontSize: "13px", color: "#64748b", background: "white" }}
        >
          <Filter size={15} />
          Date Filter
        </button>
      </div>
      {showDateFilters && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 max-w-2xl">
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

      {/* Table */}
      <div className="rounded-[28px] overflow-hidden border border-slate-200 shadow-sm" style={{ background: "white" }}>
        <div className="overflow-x-auto">
        <table className="w-full" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #f1f5f9", background: "#f8fafc" }}>
              {["Platform", "Plan", "Account Holder", "INR", "USD", "Cycle", "Expiry", "Buyer", "Invoice", "Actions"].map((h) => (
                <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", fontWeight: 600, color: "#000000", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>
                  {h.toUpperCase()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ padding: "48px", textAlign: "center", color: "#94a3b8", fontSize: "14px" }}>
                  No subscriptions found
                </td>
              </tr>
            ) : (
              orderedTeams.flatMap((team: Team) => {
                const teamSubs = paginatedFiltered.filter((s) => s.team === team);
                if (teamSubs.length === 0) return [];
                const tc = teamColors[team] || getTeamIdentity(team);
                const teamINRTotal = teamSubs
                  .filter((sub) => sub.currency === "INR")
                  .reduce((sum, sub) => sum + sub.cost, 0);
                const teamUSDTotal = teamSubs
                  .filter((sub) => sub.currency === "USD")
                  .reduce((sum, sub) => sum + sub.cost, 0);
                return [
                  // Team header row
                  <tr key={`header-${team}`} style={{ background: tc.bg, borderTop: "2px solid #e2e8f0" }}>
                    <td colSpan={10} style={{ padding: "9px 16px" }}>
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <span
                            className="px-2.5 py-0.5 rounded-full"
                            style={{ fontSize: "11px", fontWeight: 700, background: tc.light, color: tc.color }}
                          >
                            {team}
                          </span>
                          <span style={{ fontSize: "11px", color: "#94a3b8" }}>
                            {teamSubs.length} subscription{teamSubs.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap justify-end">
                          {teamINRTotal > 0 && (
                            <span className="px-2.5 py-0.5 rounded-full" style={{ fontSize: "11px", fontWeight: 700, background: "rgba(16,185,129,0.12)", color: "#10b981" }}>
                              ₹{teamINRTotal.toFixed(0)}
                            </span>
                          )}
                          {teamUSDTotal > 0 && (
                            <span className="px-2.5 py-0.5 rounded-full" style={{ fontSize: "11px", fontWeight: 700, background: "rgba(99,102,241,0.12)", color: "#6366f1" }}>
                              ${teamUSDTotal.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>,
                  // Subscription rows for this team
                  ...teamSubs.map((sub, i) => (
                    <tr
                      key={sub.id}
                      style={{ borderBottom: i < teamSubs.length - 1 ? "1px solid #f1f5f9" : "none" }}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td style={{ padding: "14px 16px" }}>
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0 relative"
                            style={{
                              background: "white",
                              color: "inherit",
                            }}
                          >
                            {getActiveLogoSrc(sub) ? (
                              <img
                                src={getActiveLogoSrc(sub)}
                                alt={sub.platform}
                                className="w-full h-full object-contain rounded-xl"
                                style={{ padding: "1px" }}
                                onError={() => handleLogoError(sub.id, sub.platform, sub.logoDomain)}
                              />
                            ) : (
                              <span style={{ fontSize: "9px", fontWeight: 700 }}>{sub.logo}</span>
                            )}
                          </div>
                          <span style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a" }}>{sub.platform}</span>
                        </div>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <span className="px-2 py-0.5 rounded-md" style={{ fontSize: "12px", background: "#f1f5f9", color: "#475569" }}>{sub.plan}</span>
                      </td>
                      <td style={{ padding: "14px 16px", fontSize: "13px", color: "#0f172a" }}>{sub.accountHolder}</td>
                      <td style={{ padding: "14px 16px", fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>
                        ₹{(sub.currency === "USD" ? sub.cost * USD_TO_INR : sub.cost).toFixed(0)}
                      </td>
                      <td style={{ padding: "14px 16px", fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>
                        {sub.currency === "USD" ? `$${sub.cost.toFixed(2)}` : "—"}
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
                      <td style={{ padding: "14px 16px", fontSize: "12px", color: "#64748b" }}>{sub.expiryDate}</td>
                      <td style={{ padding: "14px 16px", fontSize: "13px", color: "#0f172a" }}>{sub.buyer}</td>
                      <td style={{ padding: "14px 16px", fontSize: "13px", color: "#64748b" }}>
                        {sub.invoiceFileName ? (
                          <button
                            onClick={() => downloadInvoice(sub)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                            style={{ background: "rgba(59,130,246,0.08)", color: "#2563eb" }}
                            title="Download invoice"
                          >
                            <Download size={14} />
                          </button>
                        ) : (
                          <span>—</span>
                        )}
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <div className="flex items-center gap-2">
                          {(() => {
                            const isTemp = sub.id.startsWith("temp-");
                            return (
                              <>
                                <button
                                  onClick={() => openDetail(sub)}
                                  className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                                  style={{ background: "rgba(14,165,233,0.08)", color: "#0ea5e9" }}
                                  title="View details"
                                >
                                  <Eye size={13} />
                                </button>
                                {canWrite && (
                                  <button
                                    onClick={() => handleEdit(sub)}
                                    disabled={isTemp}
                                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                                    style={{ background: "rgba(99,102,241,0.08)", color: "#6366f1", opacity: isTemp ? 0.4 : 1, cursor: isTemp ? "not-allowed" : "pointer" }}
                                    title={isTemp ? "Saving..." : "Edit"}
                                  >
                                    <Edit2 size={13} />
                                  </button>
                                )}
                                {canDelete && (
                                  <button
                                    onClick={() => requestDelete(sub)}
                                    disabled={isTemp}
                                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                                    style={{ background: "rgba(239,68,68,0.08)", color: "#ef4444", opacity: isTemp ? 0.4 : 1, cursor: isTemp ? "not-allowed" : "pointer" }}
                                    title={isTemp ? "Saving..." : "Delete"}
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      </td>
                    </tr>
                  )),
                ];
              })
            )}
          </tbody>
        </table>
        </div>

        {filtered.length > 0 && (
          <div className="flex flex-col gap-4 px-6 py-4 border-t border-slate-200" style={{ background: "#f8fafc" }}>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-3">
                <span style={{ fontSize: "13px", color: "#64748b" }}>Rows per page</span>
                <div className="relative">
                  <button
                    onClick={() => setShowRowsMenu(!showRowsMenu)}
                    className="px-3 py-1.5 rounded-lg transition-all flex items-center gap-2"
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      background: "white",
                      border: "1px solid #e2e8f0",
                      color: "#0f172a",
                      cursor: "pointer",
                    }}
                  >
                    {itemsPerPage}
                    <ChevronRight size={14} style={{ transform: showRowsMenu ? "rotate(90deg)" : "rotate(270deg)", transition: "transform 0.2s" }} />
                  </button>
                  {showRowsMenu && (
                    <div
                      className="absolute bottom-full left-0 mb-2 bg-white rounded-lg shadow-lg border border-slate-200 z-10"
                      style={{ minWidth: "100px" }}
                    >
                      {[20, 50, 100].map((size) => (
                        <button
                          key={size}
                          onClick={() => {
                            setItemsPerPage(size);
                            setCurrentPage(1);
                            setShowRowsMenu(false);
                          }}
                          className="w-full px-4 py-2.5 text-left transition-colors hover:bg-slate-50 first:rounded-t-lg last:rounded-b-lg"
                          style={{
                            fontSize: "13px",
                            color: itemsPerPage === size ? "#6366f1" : "#0f172a",
                            fontWeight: itemsPerPage === size ? 600 : 500,
                            background: itemsPerPage === size ? "#f0f4ff" : "transparent",
                            borderBottom: size !== 100 ? "1px solid #f1f5f9" : "none",
                          }}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div style={{ fontSize: "13px", color: "#64748b" }}>
                {Math.min((currentPage - 1) * itemsPerPage + 1, filtered.length)} - {Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length}
              </div>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <div style={{ fontSize: "13px", color: "#0f172a", fontWeight: 600 }}>
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                    style={{
                      border: "1px solid #e2e8f0",
                      color: currentPage === 1 ? "#cbd5e1" : "#64748b",
                      background: "white",
                      cursor: currentPage === 1 ? "not-allowed" : "pointer",
                    }}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <input
                    type="number"
                    min="1"
                    max={totalPages}
                    value={currentPage}
                    onChange={(e) => {
                      const page = parseInt(e.target.value, 10);
                      if (!isNaN(page) && page >= 1 && page <= totalPages) {
                        setCurrentPage(page);
                      }
                    }}
                    className="w-12 px-2 py-1.5 rounded-lg text-center outline-none transition-all"
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      border: "1px solid #e2e8f0",
                      color: "#0f172a",
                      background: "white",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
                    onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
                  />
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                    style={{
                      border: "1px solid #e2e8f0",
                      color: currentPage === totalPages ? "#cbd5e1" : "#64748b",
                      background: "white",
                      cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                    }}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {detailOpen && detailTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-6">
          <div className="w-full max-w-2xl overflow-hidden rounded-[28px] bg-white shadow-2xl max-h-[85vh]">
            <div className="flex items-center justify-between gap-4 border-b border-slate-200 bg-slate-50 px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-slate-950">Subscription details</h2>
                <p className="text-sm text-slate-500">Key information for the selected platform</p>
              </div>
              <button
                onClick={() => {
                  setDetailOpen(false);
                  setDetailTarget(null);
                  setPasswordVisible(false);
                  setCopiedField(null);
                }}
                className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                aria-label="Close details"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 px-6 py-6 overflow-y-auto max-h-[72vh]">
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  ["Platform", detailTarget.platform || "Not available"],
                  ["Plan", detailTarget.plan || "Not available"],
                  ["Cost", detailTarget.currency === "USD" ? `$${detailTarget.cost.toFixed(2)}` : `₹${detailTarget.cost.toFixed(2)}`],
                  ["Billing cycle", detailTarget.cycle || "Not available"],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 mb-1.5">{label}</p>
                    <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="text-sm font-semibold text-slate-950">{value}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  ["Purchase date", detailTarget.purchaseDate || "Not available"],
                  ["Expiry date", detailTarget.expiryDate || "Not available"],
                  ["Payment mode", detailTarget.paymentMode || "Not available"],
                  ["Category", detailTarget.category || "Not available"],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 mb-1.5">{label}</p>
                    <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="text-sm font-semibold text-slate-950">{value}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  ["Buyer", detailTarget.buyer || "Not available"],
                  ["Account holder", detailTarget.accountHolder || "Not available"],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 mb-1.5">{label}</p>
                    <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="text-sm font-semibold text-slate-950">{value}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 mb-1.5">Team</p>
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3">
                    {detailTarget.team ? (
                      <span
                        className="px-2.5 py-0.5 rounded-full text-xs font-bold"
                        style={{
                          background: getTeamIdentity(detailTarget.team).light,
                          color: getTeamIdentity(detailTarget.team).color,
                        }}
                      >
                        {detailTarget.team}
                      </span>
                    ) : (
                      <p className="text-sm font-semibold text-slate-950">Not available</p>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 mb-1.5">Auto Pay</p>
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 flex items-center gap-2">
                    <span
                      className="inline-block w-2.5 h-2.5 rounded-full"
                      style={{ background: detailTarget.autoPay ? "#10b981" : "#94a3b8" }}
                    />
                    <p className="text-sm font-semibold text-slate-950">{detailTarget.autoPay ? "Enabled" : "Disabled"}</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 mb-1.5">Username / Email</p>
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 flex items-center justify-between gap-4">
                    <p className="text-sm font-semibold text-slate-950">{detailTarget.accountEmail || "Not available"}</p>
                    <button
                      onClick={() => copyToClipboard(detailTarget.accountEmail ?? "", "username")}
                      className="inline-flex h-8 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700 transition hover:border-slate-300 flex-shrink-0"
                      title="Copy username"
                    >
                      {copiedField === "username" ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 mb-1.5">Password</p>
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 flex items-center justify-between gap-4">
                    <p className="text-sm font-semibold text-slate-950">
                      {passwordVisible ? detailTarget.accountPassword || "Not available" : detailTarget.accountPassword ? detailTarget.accountPassword.replace(/./g, "•") : "Not available"}
                    </p>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => setPasswordVisible((current) => !current)}
                        className="inline-flex h-8 items-center justify-center rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700 transition hover:border-slate-300"
                        title={passwordVisible ? "Hide password" : "Show password"}
                      >
                        {passwordVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                      <button
                        onClick={() => copyToClipboard(detailTarget.accountPassword || "", "password")}
                        className="inline-flex h-8 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700 transition hover:border-slate-300"
                        title="Copy password"
                      >
                        {copiedField === "password" ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 mb-1.5">Invoice</p>
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 flex items-center justify-between gap-4">
                    <p className="text-sm font-semibold text-slate-950">{detailTarget.invoiceFileName || "Not available"}</p>
                    {detailTarget.invoiceFileName ? (
                      <button
                        onClick={() => downloadInvoice(detailTarget)}
                        className="inline-flex h-8 items-center justify-center rounded-2xl bg-slate-900 px-3 text-sm font-semibold text-white transition hover:bg-slate-800 flex-shrink-0"
                      >
                        <Download size={14} />
                      </button>
                    ) : null}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 mb-1.5">Status</p>
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-sm font-semibold text-slate-950">
                      {getDaysUntilExpiry(detailTarget.expiryDate) < 0
                        ? "Expired"
                        : getDaysUntilExpiry(detailTarget.expiryDate) === 0
                        ? "Today"
                        : `${getDaysUntilExpiry(detailTarget.expiryDate)} days left`}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {modalOpen && (
          <AddEditModal
          subscription={editTarget}
          onSave={handleSave}
          onClose={() => { setModalOpen(false); setEditTarget(null); setAddTeamContext(null); }}
          categories={categories}
          teams={teams}
          defaultTeam={addTeamContext || undefined}
        />
      )}

      {pendingDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(4px)" }}>
          <div className="w-full max-w-sm rounded-3xl overflow-hidden" style={{ background: "white", boxShadow: "0 25px 50px rgba(0,0,0,0.18)" }}>
            <div className="p-6 text-center">
              <div className="mx-auto mb-4 w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "rgba(248,113,113,0.14)" }}>
                <AlertTriangle size={28} style={{ color: "#ef4444" }} />
              </div>
              <h2 style={{ color: "#0f172a", fontSize: "22px", marginBottom: "8px", fontWeight: 700 }}>Delete?</h2>
              <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "24px" }}>
                Are you sure you want to DELETE {deleteTargetName ? `"${deleteTargetName}"` : "this subscription"}?
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={cancelDelete}
                  className="flex-1 py-3 rounded-xl"
                  style={{ border: "1px solid #e2e8f0", background: "white", color: "#64748b", fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 py-3 rounded-xl text-white"
                  style={{ background: "#ef4444", fontWeight: 600 }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export const Subscriptions = memo(SubscriptionsComponent);
