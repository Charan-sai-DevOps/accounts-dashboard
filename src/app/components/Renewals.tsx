import { useMemo, useState } from "react";
import { Bell, CheckCircle, AlertTriangle, Clock, MoreVertical } from "lucide-react";
import { Subscription, getDaysUntilExpiry, getClearbitLogoUrl } from "../data/subscriptions";

interface RenewalsProps {
  subscriptions: Subscription[];
  onEdit?: (id: string, sub: Omit<Subscription, "id">) => void;
}

export function Renewals({ subscriptions, onEdit }: RenewalsProps) {
  const [view, setView] = useState<"upcoming" | "history">("upcoming");
  const [failedLogos, setFailedLogos] = useState<Set<string>>(new Set());
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);

  const handleLogoError = (subscriptionId: string) => {
    setFailedLogos((prev) => new Set(prev).add(subscriptionId));
  };

  const sorted = useMemo(
    () => [...subscriptions].sort((a, b) => getDaysUntilExpiry(a.expiryDate) - getDaysUntilExpiry(b.expiryDate)),
    [subscriptions]
  );

  const historyItems = useMemo(
    () => sorted.filter((s) => getDaysUntilExpiry(s.expiryDate) < 0 || s.renewalStatus === "Paid" || s.renewalStatus === "Failed" || s.renewalStatus === "Cancelled"),
    [sorted]
  );

  const groups = useMemo(() => {
    return {
      overdue: sorted.filter((s) => getDaysUntilExpiry(s.expiryDate) < 0 && s.renewalStatus !== "Paid" && s.renewalStatus !== "Cancelled"),
      today: sorted.filter((s) => getDaysUntilExpiry(s.expiryDate) === 0 && s.renewalStatus !== "Paid" && s.renewalStatus !== "Cancelled"),
      week: sorted.filter((s) => getDaysUntilExpiry(s.expiryDate) > 0 && getDaysUntilExpiry(s.expiryDate) <= 7 && s.renewalStatus !== "Paid" && s.renewalStatus !== "Cancelled"),
      month: sorted.filter((s) => getDaysUntilExpiry(s.expiryDate) > 7 && getDaysUntilExpiry(s.expiryDate) <= 30 && s.renewalStatus !== "Paid" && s.renewalStatus !== "Cancelled"),
      future: sorted.filter((s) => getDaysUntilExpiry(s.expiryDate) > 30 && s.renewalStatus !== "Paid" && s.renewalStatus !== "Cancelled"),
    };
  }, [sorted]);

  const [historyFilter, setHistoryFilter] = useState<"All" | "Paid" | "Failed" | "Cancelled">("All");

  const totalRenewingThisMonth = useMemo(
    () => [...groups.today, ...groups.week, ...groups.month]
      .filter((s) => s.renewalStatus !== "Cancelled" && s.renewalStatus !== "Paid")
      .reduce((sum, s) => sum + s.cost, 0),
    [groups]
  );

  const totalHistoryPaid = useMemo(
    () => historyItems
      .filter((s) => (s.renewalStatus || "Paid") === "Paid")
      .reduce((sum, s) => sum + s.cost, 0),
    [historyItems]
  );

  const handleStatusSelect = (sub: Subscription, status: "Paid" | "Failed" | "Cancelled") => {
    if (!onEdit) return;

    let updatedExpiryDate = sub.expiryDate;
    let updatedPurchaseDate = sub.purchaseDate;

    if (status === "Paid") {
      const currentDate = new Date(sub.expiryDate);
      if (sub.cycle === "Monthly") {
        currentDate.setMonth(currentDate.getMonth() + 1);
      } else if (sub.cycle === "Quarterly") {
        currentDate.setMonth(currentDate.getMonth() + 3);
      } else if (sub.cycle === "Annual") {
        currentDate.setFullYear(currentDate.getFullYear() + 1);
      }
      updatedExpiryDate = currentDate.toISOString().split("T")[0];
      updatedPurchaseDate = sub.expiryDate; // transaction date is the renewal date
    }

    const { id, ...subWithoutId } = sub;
    const updatedSub: Omit<Subscription, "id"> = {
      ...subWithoutId,
      renewalStatus: status,
      expiryDate: updatedExpiryDate,
      purchaseDate: updatedPurchaseDate,
    };

    onEdit(sub.id, updatedSub);

    setView("history");
    setHistoryFilter(status);
  };

  const filteredHistoryItems = useMemo(() => {
    if (historyFilter === "All") return historyItems;
    return historyItems.filter((s) => (s.renewalStatus || "Paid") === historyFilter);
  }, [historyItems, historyFilter]);

  const summaryCards = view === "upcoming"
    ? [
        { label: "Overdue", count: groups.overdue.length, color: "#ef4444", bg: "rgba(239,68,68,0.08)", icon: <AlertTriangle size={18} /> },
        { label: "Due Today", count: groups.today.length, color: "#f59e0b", bg: "rgba(245,158,11,0.08)", icon: <Bell size={18} /> },
        { label: "This Week", count: groups.week.length, color: "#f97316", bg: "rgba(249,115,22,0.08)", icon: <Clock size={18} /> },
        { label: "This Month", count: groups.month.length, color: "#10b981", bg: "rgba(16,185,129,0.08)", icon: <CheckCircle size={18} /> },
      ]
    : [
        { label: "Total Renewals", count: historyItems.length, color: "#6366f1", bg: "rgba(99,102,241,0.08)", icon: <Bell size={18} /> },
        { label: "Successful", count: historyItems.filter((s) => (s.renewalStatus || "Paid") === "Paid").length, color: "#10b981", bg: "rgba(16,185,129,0.08)", icon: <CheckCircle size={18} /> },
        { label: "Failed", count: historyItems.filter((s) => s.renewalStatus === "Failed").length, color: "#ef4444", bg: "rgba(239,68,68,0.08)", icon: <AlertTriangle size={18} /> },
        { label: "Cancelled", count: historyItems.filter((s) => s.renewalStatus === "Cancelled").length, color: "#64748b", bg: "rgba(148,163,184,0.08)", icon: <Clock size={18} /> },
      ];

  const RenewalCard = ({ sub }: { sub: Subscription }) => {
    const days = getDaysUntilExpiry(sub.expiryDate);
    const urgent = days <= 7 && days >= 0;
    const overdue = days < 0;
    const isDropdownOpen = activeDropdownId === sub.id;

    return (
      <div
        className="flex items-center justify-between p-4 rounded-[16px] transition-all"
        style={{
          background: overdue ? "rgba(239,68,68,0.04)" : urgent ? "rgba(245,158,11,0.04)" : "white",
          border: `1px solid ${overdue ? "rgba(239,68,68,0.2)" : urgent ? "rgba(245,158,11,0.2)" : "#e2e8f0"}`,
        }}
      >
        <div className="flex items-center gap-4">
          <div
            className="w-11 h-11 rounded-[16px] flex items-center justify-center text-white relative flex-shrink-0"
            style={{
              background: failedLogos.has(sub.id) ? sub.color : "white",
              backgroundImage: !failedLogos.has(sub.id) ? `url('${getClearbitLogoUrl(sub.platform)}')` : "none",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            {failedLogos.has(sub.id) ? (
              <span style={{ fontSize: "10px", fontWeight: 700 }}>{sub.logo}</span>
            ) : (
              <img
                src={getClearbitLogoUrl(sub.platform)}
                alt={sub.platform}
                className="w-full h-full object-contain rounded-[16px]"
                style={{ padding: "1px" }}
                onError={() => handleLogoError(sub.id)}
              />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a" }}>{sub.platform}</p>
              <span className="px-2 py-0.5 rounded-md" style={{ fontSize: "10px", fontWeight: 600, background: "#f1f5f9", color: "#64748b" }}>{sub.plan}</span>
            </div>
            <div className="flex items-center gap-3 mt-1">
              <span style={{ fontSize: "12px", color: "#94a3b8" }}>{sub.cycle}</span>
              <span style={{ fontSize: "12px", color: "#94a3b8" }}>·</span>
              <span style={{ fontSize: "12px", color: "#94a3b8" }}>{sub.paymentMode}</span>
              <span style={{ fontSize: "12px", color: "#94a3b8" }}>·</span>
              <span style={{ fontSize: "12px", color: "#94a3b8" }}>Buyer: {sub.buyer}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 relative">
          <div className="text-right">
            <p style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a" }}>${sub.cost.toFixed(2)}</p>
            <p style={{ fontSize: "11px", color: "#94a3b8" }}>{sub.expiryDate}</p>
          </div>
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[16px]"
            style={{
              background: overdue ? "rgba(239,68,68,0.12)" : urgent ? "rgba(245,158,11,0.12)" : "rgba(16,185,129,0.12)",
              color: overdue ? "#ef4444" : urgent ? "#f59e0b" : "#10b981",
              fontSize: "12px",
              fontWeight: 600,
              minWidth: "80px",
              justifyContent: "center",
            }}
          >
            {overdue ? <AlertTriangle size={12} /> : urgent ? <Clock size={12} /> : <CheckCircle size={12} />}
            {overdue ? `${Math.abs(days)}d ago` : days === 0 ? "Today" : `${days}d left`}
          </div>

          {/* Three dots Settings Option */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveDropdownId(isDropdownOpen ? null : sub.id);
              }}
              className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600 cursor-pointer"
              title="Settings"
            >
              <MoreVertical size={16} />
            </button>
            
            {isDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveDropdownId(null);
                  }}
                />
                <div
                  className="absolute right-0 mt-1 w-32 rounded-xl bg-white border border-slate-200 shadow-xl z-50 py-1"
                  style={{
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)"
                  }}
                >
                  {[
                    { value: "Paid" as const, label: "Paid", color: "#10b981" },
                    { value: "Failed" as const, label: "Failed", color: "#ef4444" },
                    { value: "Cancelled" as const, label: "Cancelled", color: "#64748b" }
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStatusSelect(sub, opt.value);
                        setActiveDropdownId(null);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-slate-50 transition-colors text-xs font-semibold flex items-center gap-2 cursor-pointer"
                      style={{ color: opt.color }}
                    >
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: opt.color }} />
                      {opt.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  const Section = ({ title, items, accent }: { title: string; items: Subscription[]; accent: string }) => {
    if (items.length === 0) return null;
    return (
      <div>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-2 h-2 rounded-full" style={{ background: accent }} />
          <h3 style={{ color: "#0f172a" }}>{title}</h3>
          <span className="px-2 py-0.5 rounded-full" style={{ fontSize: "11px", fontWeight: 600, background: accent + "22", color: accent }}>
            {items.length}
          </span>
        </div>
        <div className="flex flex-col gap-3">
          {items.map((sub) => <RenewalCard key={sub.id} sub={sub} />)}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6 p-6 min-h-full" style={{ background: "#f8fafc" }}>
      {/* Header */}
      <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
        <div className="max-w-2xl">
          <h1 style={{ color: "#0f172a", marginBottom: "4px" }}>Renewals</h1>
          <p style={{ color: "#64748b", fontSize: "14px" }}>Track upcoming and past renewal activity</p>
          <div className="mt-5 inline-flex items-center gap-3 rounded-[16px] bg-slate-100 p-1">
            {[
              { value: "upcoming", label: "Upcoming" },
              { value: "history", label: "History" },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setView(tab.value as "upcoming" | "history")}
                className="px-4 py-2 rounded-[16px] transition-all"
                style={{
                  fontSize: "13px",
                  fontWeight: view === tab.value ? 700 : 500,
                  background: view === tab.value ? "white" : "transparent",
                  color: view === tab.value ? "#0f172a" : "#64748b",
                  border: view === tab.value ? "1px solid #e2e8f0" : "1px solid transparent",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        <div className="rounded-[12px] border border-slate-200 bg-white px-3 py-2 shadow-sm self-start">
          <p style={{ fontSize: "12px", color: "#94a3b8" }}>
            {view === "history" ? "Total paid (history)" : "Due this month"}
          </p>
          <p style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a" }}>
            ${view === "history" ? totalHistoryPaid.toFixed(2) : totalRenewingThisMonth.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((item) => (
          <div key={item.label} className="rounded-[16px] border border-slate-200 bg-white p-5 shadow-sm flex items-center gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-[16px]" style={{ background: item.bg, color: item.color }}>
              {item.icon}
            </div>
            <div>
              <p style={{ fontSize: "22px", fontWeight: 700, color: "#0f172a" }}>{item.count}</p>
              <p style={{ fontSize: "13px", color: "#64748b", marginTop: "4px" }}>{item.label}</p>
            </div>
          </div>
        ))}
      </div>

      {view === "history" && (
        <div className="rounded-[16px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="inline-flex items-center gap-3 text-sm text-slate-600">
              <span className="font-medium">Filter:</span>
              <div className="inline-flex items-center gap-2 rounded-[16px] bg-slate-100 p-1">
                {["All", "Paid", "Failed", "Cancelled"].map((status) => (
                  <button
                    key={status}
                    onClick={() => setHistoryFilter(status as "All" | "Paid" | "Failed" | "Cancelled")}
                    className="px-4 py-2 rounded-[16px] transition-all"
                    style={{
                      fontSize: "12px",
                      fontWeight: historyFilter === status ? 700 : 500,
                      background: historyFilter === status ? "white" : "transparent",
                      color: historyFilter === status ? "#0f172a" : "#64748b",
                    }}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
            <span className="text-sm text-black">{filteredHistoryItems.length} records</span>
          </div>
        </div>
      )}

      <div className="rounded-[16px] overflow-hidden bg-white border border-slate-200 shadow-sm">
        {view === "upcoming" ? (
          <div className="p-6">
            <div className="flex flex-col gap-6 mt-6">
              <Section title="Overdue" items={groups.overdue} accent="#ef4444" />
              <Section title="Due Today" items={groups.today} accent="#f59e0b" />
              <Section title="Due This Week" items={groups.week} accent="#f97316" />
              <Section title="Due This Month" items={groups.month} accent="#10b981" />
              <Section title="Upcoming (30+ days)" items={groups.future} accent="#6366f1" />
            </div>
          </div>
        ) : (
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full" style={{ borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #f1f5f9", background: "#f8fafc" }}>
                    {['Platform', 'Plan', 'Amount', 'Cycle', 'Renewed On', 'Next Due', 'Payment', 'Buyer', 'Status'].map((h) => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#000000', letterSpacing: '0.05em' }}>
                        {h.toUpperCase()}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredHistoryItems.length === 0 ? (
                    <tr>
                      <td colSpan={9} style={{ padding: '48px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
                        No renewal history available
                      </td>
                    </tr>
                  ) : filteredHistoryItems.map((sub) => (
                    <tr key={sub.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '14px 16px', fontSize: '13px', color: '#0f172a' }}>{sub.platform}</td>
                      <td style={{ padding: '14px 16px', fontSize: '13px', color: '#0f172a' }}>{sub.plan}</td>
                      <td style={{ padding: '14px 16px', fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>${sub.cost.toFixed(2)}</td>
                      <td style={{ padding: '14px 16px', fontSize: '13px', color: '#64748b' }}>{sub.cycle}</td>
                      <td style={{ padding: '14px 16px', fontSize: '13px', color: '#64748b' }}>{sub.purchaseDate}</td>
                      <td style={{ padding: '14px 16px', fontSize: '13px', color: '#64748b' }}>{sub.expiryDate}</td>
                      <td style={{ padding: '14px 16px', fontSize: '13px', color: '#64748b' }}>{sub.paymentMode}</td>
                      <td style={{ padding: '14px 16px', fontSize: '13px', color: '#0f172a' }}>{sub.buyer}</td>
                      <td style={{ padding: '14px 16px', fontSize: '13px', color: sub.renewalStatus === 'Failed' ? '#ef4444' : sub.renewalStatus === 'Cancelled' ? '#64748b' : '#10b981' }}>
                        {sub.renewalStatus || 'Paid'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
