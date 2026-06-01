import { useMemo, useState } from "react";
import { Bell, CheckCircle, AlertTriangle, Clock } from "lucide-react";
import { Subscription, getDaysUntilExpiry } from "../data/subscriptions";

interface RenewalsProps {
  subscriptions: Subscription[];
}

export function Renewals({ subscriptions }: RenewalsProps) {
  const [view, setView] = useState<"upcoming" | "history">("upcoming");

  const sorted = useMemo(
    () => [...subscriptions].sort((a, b) => getDaysUntilExpiry(a.expiryDate) - getDaysUntilExpiry(b.expiryDate)),
    [subscriptions]
  );

  const historyItems = useMemo(
    () => sorted.filter((s) => getDaysUntilExpiry(s.expiryDate) < 0),
    [sorted]
  );

  const groups = useMemo(() => {
    return {
      overdue: sorted.filter((s) => getDaysUntilExpiry(s.expiryDate) < 0),
      today: sorted.filter((s) => getDaysUntilExpiry(s.expiryDate) === 0),
      week: sorted.filter((s) => getDaysUntilExpiry(s.expiryDate) > 0 && getDaysUntilExpiry(s.expiryDate) <= 7),
      month: sorted.filter((s) => getDaysUntilExpiry(s.expiryDate) > 7 && getDaysUntilExpiry(s.expiryDate) <= 30),
      future: sorted.filter((s) => getDaysUntilExpiry(s.expiryDate) > 30),
    };
  }, [sorted]);

  const totalRenewingThisMonth = useMemo(
    () => [...groups.today, ...groups.week, ...groups.month].reduce((sum, s) => sum + s.cost, 0),
    [groups]
  );

  const RenewalCard = ({ sub }: { sub: Subscription }) => {
    const days = getDaysUntilExpiry(sub.expiryDate);
    const urgent = days <= 7 && days >= 0;
    const overdue = days < 0;
    return (
      <div
        className="flex items-center justify-between p-4 rounded-2xl transition-all"
        style={{
          background: overdue ? "rgba(239,68,68,0.04)" : urgent ? "rgba(245,158,11,0.04)" : "white",
          border: `1px solid ${overdue ? "rgba(239,68,68,0.2)" : urgent ? "rgba(245,158,11,0.2)" : "#e2e8f0"}`,
        }}
      >
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white" style={{ background: sub.color, fontSize: "11px", fontWeight: 700 }}>
            {sub.logo}
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
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a" }}>${sub.cost.toFixed(2)}</p>
            <p style={{ fontSize: "11px", color: "#94a3b8" }}>{sub.expiryDate}</p>
          </div>
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
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
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 style={{ color: "#0f172a", marginBottom: "4px" }}>Renewals</h1>
          <p style={{ color: "#64748b", fontSize: "14px" }}>Track upcoming and past renewal activity</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {[
            { value: "upcoming", label: "Upcoming" },
            { value: "history", label: "History" },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setView(tab.value as "upcoming" | "history")}
              className="px-4 py-2 rounded-2xl transition-all"
              style={{
                fontSize: "13px",
                fontWeight: view === tab.value ? 700 : 500,
                background: view === tab.value ? "white" : "rgba(241,245,249,0.8)",
                color: view === tab.value ? "#0f172a" : "#64748b",
                border: view === tab.value ? "1px solid #e2e8f0" : "1px solid transparent",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="px-4 py-2.5 rounded-xl" style={{ background: "white", border: "1px solid #e2e8f0" }}>
          <p style={{ fontSize: "11px", color: "#94a3b8" }}>Due this month</p>
          <p style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a" }}>${totalRenewingThisMonth.toFixed(2)}</p>
        </div>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: "white", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
        {view === "upcoming" ? (
          <div className="p-6">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { label: "Overdue", count: groups.overdue.length, color: "#ef4444", bg: "rgba(239,68,68,0.08)", icon: <AlertTriangle size={16} /> },
                { label: "Due Today", count: groups.today.length, color: "#f59e0b", bg: "rgba(245,158,11,0.08)", icon: <Bell size={16} /> },
                { label: "This Week", count: groups.week.length, color: "#f97316", bg: "rgba(249,115,22,0.08)", icon: <Clock size={16} /> },
                { label: "This Month", count: groups.month.length, color: "#10b981", bg: "rgba(16,185,129,0.08)", icon: <CheckCircle size={16} /> },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl p-4 flex items-center gap-4" style={{ background: "white", border: "1px solid #e2e8f0" }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: item.bg, color: item.color }}>
                    {item.icon}
                  </div>
                  <div>
                    <p style={{ fontSize: "22px", fontWeight: 700, color: "#0f172a", lineHeight: 1 }}>{item.count}</p>
                    <p style={{ fontSize: "12px", color: "#94a3b8", marginTop: "2px" }}>{item.label}</p>
                  </div>
                </div>
              ))}
            </div>

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
            <div className="grid grid-cols-1 gap-3 mb-6 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { label: "Total Renewals", count: historyItems.length, color: "#6366f1", bg: "rgba(99,102,241,0.08)", icon: <Bell size={16} /> },
                { label: "Paid", count: historyItems.filter((s) => (s.renewalStatus || "Paid") === "Paid").length, color: "#10b981", bg: "rgba(16,185,129,0.08)", icon: <CheckCircle size={16} /> },
                { label: "Failed", count: historyItems.filter((s) => s.renewalStatus === "Failed").length, color: "#ef4444", bg: "rgba(239,68,68,0.08)", icon: <AlertTriangle size={16} /> },
                { label: "Cancelled", count: historyItems.filter((s) => s.renewalStatus === "Cancelled").length, color: "#64748b", bg: "rgba(148,163,184,0.08)", icon: <Clock size={16} /> },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl p-4 flex items-center gap-4" style={{ background: "white", border: "1px solid #e2e8f0" }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: item.bg, color: item.color }}>
                    {item.icon}
                  </div>
                  <div>
                    <p style={{ fontSize: "22px", fontWeight: 700, color: "#0f172a", lineHeight: 1 }}>{item.count}</p>
                    <p style={{ fontSize: "12px", color: "#94a3b8", marginTop: "2px" }}>{item.label}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full" style={{ borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #f1f5f9", background: "#f8fafc" }}>
                    {['Platform', 'Plan', 'Amount', 'Cycle', 'Renewed On', 'Next Due', 'Payment', 'Buyer', 'Status'].map((h) => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#94a3b8', letterSpacing: '0.05em' }}>
                        {h.toUpperCase()}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {historyItems.length === 0 ? (
                    <tr>
                      <td colSpan={9} style={{ padding: '48px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
                        No renewal history available
                      </td>
                    </tr>
                  ) : historyItems.map((sub) => (
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
