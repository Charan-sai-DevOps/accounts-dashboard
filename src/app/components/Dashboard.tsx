import { useMemo } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { TrendingUp, CreditCard, AlertTriangle, DollarSign, ArrowUpRight } from "lucide-react";
import { Subscription, getMonthlyCost, getAnnualCost, getDaysUntilExpiry, categoryColors } from "../data/subscriptions";

interface DashboardProps {
  subscriptions: Subscriptions[];
  onNavigate: (page: "subscriptions" | "renewals") => void;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function Dashboard({ subscriptions, onNavigate }: DashboardProps) {
  const totalMonthly = useMemo(
    () => subscriptions.reduce((sum, s) => sum + getMonthlyCost(s), 0),
    [subscriptions]
  );
  const totalAnnual = useMemo(
    () => subscriptions.reduce((sum, s) => sum + getAnnualCost(s), 0),
    [subscriptions]
  );
  const upcomingCount = useMemo(
    () => subscriptions.filter((s) => getDaysUntilExpiry(s.expiryDate) <= 30).length,
    [subscriptions]
  );

  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    subscriptions.forEach((s) => {
      map[s.category] = (map[s.category] || 0) + getMonthlyCost(s);
    });
    return Object.entries(map).map(([name, value]) => ({ name, value: parseFloat(value.toFixed(2)) }));
  }, [subscriptions]);

  const monthlySpendData = useMemo(() => {
    const today = new Date();
    const currentMonth = today.getMonth();
    return MONTHS.map((month, i) => {
      const diff = (i - currentMonth + 12) % 12;
      const factor = diff === 0 ? 1 : diff <= 3 ? 0.95 + Math.random() * 0.1 : 0.85 + Math.random() * 0.2;
      return { month, spend: parseFloat((totalMonthly * factor).toFixed(2)) };
    });
  }, [totalMonthly]);

  const upcomingRenewals = useMemo(
    () =>
      [...subscriptions]
        .filter((s) => getDaysUntilExpiry(s.expiryDate) >= 0)
        .sort((a, b) => getDaysUntilExpiry(a.expiryDate) - getDaysUntilExpiry(b.expiryDate))
        .slice(0, 5),
    [subscriptions]
  );

  const stats = [
    {
      label: "Monthly Spend",
      value: `$${totalMonthly.toFixed(2)}`,
      sub: `$${totalAnnual.toFixed(0)}/year`,
      icon: <DollarSign size={20} />,
      color: "#6366f1",
      bg: "rgba(99,102,241,0.12)",
    },
    {
      label: "Active Subscriptions",
      value: `${subscriptions.length}`,
      sub: "Across all platforms",
      icon: <CreditCard size={20} />,
      color: "#10b981",
      bg: "rgba(16,185,129,0.12)",
    },
    {
      label: "Renewing Soon",
      value: `${upcomingCount}`,
      sub: "Within 30 days",
      icon: <AlertTriangle size={20} />,
      color: "#f59e0b",
      bg: "rgba(245,158,11,0.12)",
    },
    {
      label: "Annual Spend",
      value: `$${totalAnnual.toFixed(0)}`,
      sub: `Avg $${(totalAnnual / 12).toFixed(0)}/mo`,
      icon: <TrendingUp size={20} />,
      color: "#ec4899",
      bg: "rgba(236,72,153,0.12)",
    },
  ];

  return (
    <div className="flex flex-col gap-6 p-6 min-h-full" style={{ background: "#f8fafc" }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ color: "#0f172a", marginBottom: "4px" }}>Overview</h1>
          <p style={{ color: "#64748b", fontSize: "14px" }}>Track all your subscriptions in one place</p>
        </div>
        <div className="px-4 py-2 rounded-xl" style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "white", fontSize: "13px", fontWeight: 600 }}>
          May 2026
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl p-5" style={{ background: "white", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            <div className="flex items-center justify-between mb-4">
              <span style={{ fontSize: "13px", color: "#64748b", fontWeight: 500 }}>{s.label}</span>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: s.bg, color: s.color }}>
                {s.icon}
              </div>
            </div>
            <p style={{ fontSize: "26px", fontWeight: 700, color: "#0f172a", lineHeight: 1 }}>{s.value}</p>
            <p style={{ fontSize: "12px", color: "#94a3b8", marginTop: "6px" }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-3 gap-4">
        {/* Area chart - monthly spend */}
        <div className="col-span-2 rounded-2xl p-5" style={{ background: "white", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 style={{ color: "#0f172a", marginBottom: "2px" }}>Monthly Spending</h3>
              <p style={{ fontSize: "12px", color: "#94a3b8" }}>Estimated spend per month</p>
            </div>
            <div className="flex items-center gap-1 px-3 py-1 rounded-lg" style={{ background: "rgba(16,185,129,0.1)", color: "#10b981", fontSize: "12px", fontWeight: 600 }}>
              <ArrowUpRight size={12} />
              +2.4%
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={monthlySpendData}>
              <defs>
                <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
              <Tooltip
                formatter={(v: number) => [`$${v.toFixed(2)}`, "Spend"]}
                contentStyle={{ borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: "12px" }}
              />
              <Area type="monotone" dataKey="spend" stroke="#6366f1" strokeWidth={2.5} fill="url(#spendGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart - category breakdown */}
        <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <h3 style={{ color: "#0f172a", marginBottom: "2px" }}>By Category</h3>
          <p style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "12px" }}>Monthly cost breakdown</p>
          <ResponsiveContainer width="100%" height={150}>
            <PieChart>
              <Pie data={categoryData} cx="50%" cy="50%" innerRadius={42} outerRadius={68} paddingAngle={3} dataKey="value">
                {categoryData.map((entry) => (
                  <Cell key={entry.name} fill={categoryColors[entry.name as keyof typeof categoryColors] || "#6366f1"} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => [`$${v.toFixed(2)}`, ""]} contentStyle={{ borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: "12px" }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-col gap-1.5 mt-2">
            {categoryData.slice(0, 4).map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: categoryColors[item.name as keyof typeof categoryColors] || "#6366f1" }} />
                  <span style={{ fontSize: "11px", color: "#64748b" }}>{item.name}</span>
                </div>
                <span style={{ fontSize: "11px", fontWeight: 600, color: "#0f172a" }}>${item.value.toFixed(0)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-3 gap-4">
        {/* Upcoming renewals */}
        <div className="col-span-2 rounded-2xl p-5" style={{ background: "white", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <div className="flex items-center justify-between mb-4">
            <h3 style={{ color: "#0f172a" }}>Upcoming Renewals</h3>
            <button
              onClick={() => onNavigate("renewals")}
              className="px-3 py-1 rounded-lg transition-colors"
              style={{ fontSize: "12px", color: "#6366f1", fontWeight: 600, background: "rgba(99,102,241,0.08)" }}
            >
              View all
            </button>
          </div>
          <div className="flex flex-col gap-3">
            {upcomingRenewals.map((sub) => {
              const days = getDaysUntilExpiry(sub.expiryDate);
              const urgent = days <= 7;
              const warning = days <= 14;
              return (
                <div key={sub.id} className="flex items-center justify-between p-3 rounded-xl" style={{ background: "#f8fafc", border: "1px solid #f1f5f9" }}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white" style={{ background: sub.color, fontSize: "10px", fontWeight: 700 }}>
                      {sub.logo}
                    </div>
                    <div>
                      <p style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a" }}>{sub.platform}</p>
                      <p style={{ fontSize: "11px", color: "#94a3b8" }}>{sub.plan} · {sub.cycle}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <p style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>${sub.cost.toFixed(2)}</p>
                    <div
                      className="px-2.5 py-1 rounded-lg"
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        background: urgent ? "rgba(239,68,68,0.1)" : warning ? "rgba(245,158,11,0.1)" : "rgba(16,185,129,0.1)",
                        color: urgent ? "#ef4444" : warning ? "#f59e0b" : "#10b981",
                      }}
                    >
                      {days === 0 ? "Today" : `${days}d`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bar chart - top spends */}
        <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <h3 style={{ color: "#0f172a", marginBottom: "2px" }}>Top Spends</h3>
          <p style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "12px" }}>Highest monthly cost</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              layout="vertical"
              data={[...subscriptions]
                .sort((a, b) => getMonthlyCost(b) - getMonthlyCost(a))
                .slice(0, 5)
                .map((s) => ({ name: s.platform, cost: parseFloat(getMonthlyCost(s).toFixed(2)) }))}
              margin={{ left: 0, right: 16 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} width={60} />
              <Tooltip formatter={(v: number) => [`$${v.toFixed(2)}`, "Monthly"]} contentStyle={{ borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: "12px" }} />
              <Bar dataKey="cost" fill="#6366f1" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
