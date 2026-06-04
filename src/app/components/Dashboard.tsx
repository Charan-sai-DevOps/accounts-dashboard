import { useMemo, useState } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { TrendingUp, CreditCard, AlertTriangle, DollarSign, IndianRupee } from "lucide-react";
import {
  Subscription,
  getUSDMonthlyCost,
  getUSDAnnualCost,
  getINRMonthlyCost,
  getINRAnnualCost,
  getDaysUntilExpiry,
  categoryColors,
  getClearbitLogoUrl,
  USD_TO_INR,
} from "../data/subscriptions";

interface DashboardProps {
  subscriptions: Subscription[];
  loading?: boolean;
  onNavigate: (page: "subscriptions" | "renewals") => void;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function monthKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}`;
}

function addCycleDate(baseDate: Date, cycle: Subscription["cycle"]) {
  const next = new Date(baseDate);
  if (cycle === "Monthly") next.setMonth(next.getMonth() + 1);
  if (cycle === "Quarterly") next.setMonth(next.getMonth() + 3);
  if (cycle === "Annual") next.setFullYear(next.getFullYear() + 1);
  return next;
}

function formatOriginalAmount(subscription: Subscription) {
  return subscription.currency === "USD"
    ? `$${subscription.cost.toFixed(2)}`
    : `Rs. ${subscription.cost.toFixed(0)}`;
}

export function Dashboard({ subscriptions, loading = false, onNavigate }: DashboardProps) {
  const [failedLogos, setFailedLogos] = useState<Set<string>>(new Set());

  const activeSubscriptions = useMemo(
    () => subscriptions.filter((sub) => sub.active && sub.renewalStatus !== "Cancelled"),
    [subscriptions]
  );

  const handleLogoError = (subscriptionId: string) => {
    setFailedLogos((prev) => new Set(prev).add(subscriptionId));
  };

  const totalMonthly = useMemo(
    () => activeSubscriptions.reduce((sum, sub) => sum + getUSDMonthlyCost(sub), 0),
    [activeSubscriptions]
  );

  const totalAnnual = useMemo(
    () => activeSubscriptions.reduce((sum, sub) => sum + getUSDAnnualCost(sub), 0),
    [activeSubscriptions]
  );

  const totalMonthlyINR = useMemo(
    () => activeSubscriptions.reduce((sum, sub) => sum + getINRMonthlyCost(sub), 0),
    [activeSubscriptions]
  );

  const totalAnnualINR = useMemo(
    () => activeSubscriptions.reduce((sum, sub) => sum + getINRAnnualCost(sub), 0),
    [activeSubscriptions]
  );

  const upcomingCount = useMemo(
    () => activeSubscriptions.filter((sub) => {
      const days = getDaysUntilExpiry(sub.expiryDate);
      return days >= 0 && days <= 30;
    }).length,
    [activeSubscriptions]
  );

  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    activeSubscriptions.forEach((sub) => {
      map[sub.category] = (map[sub.category] || 0) + getINRMonthlyCost(sub);
    });

    return Object.entries(map)
      .map(([name, value]) => ({ name, value: parseFloat(value.toFixed(2)) }))
      .sort((a, b) => b.value - a.value);
  }, [activeSubscriptions]);

  const monthlySpendData = useMemo(() => {
    const today = new Date();
    const startBoundary = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthsToShow = Array.from({ length: 6 }, (_, index) => {
      const current = new Date(today.getFullYear(), today.getMonth() + index, 1);
      return {
        key: monthKey(current),
        month: `${MONTHS[current.getMonth()]} ${String(current.getFullYear()).slice(-2)}`,
      };
    });

    const spendByMonth = new Map(monthsToShow.map((item) => [item.key, 0]));

    activeSubscriptions.forEach((sub) => {
      let billingDate = new Date(sub.expiryDate);
      if (Number.isNaN(billingDate.getTime())) return;

      while (billingDate < startBoundary) {
        billingDate = addCycleDate(billingDate, sub.cycle);
      }

      while (spendByMonth.has(monthKey(billingDate))) {
        const key = monthKey(billingDate);
        const renewalCost = sub.currency === "USD" ? sub.cost * USD_TO_INR : sub.cost;
        spendByMonth.set(key, (spendByMonth.get(key) || 0) + renewalCost);
        billingDate = addCycleDate(billingDate, sub.cycle);
      }
    });

    return monthsToShow.map((item) => ({
      month: item.month,
      spend: parseFloat((spendByMonth.get(item.key) || 0).toFixed(2)),
    }));
  }, [activeSubscriptions]);

  const upcomingRenewals = useMemo(
    () =>
      [...activeSubscriptions]
        .filter((sub) => getDaysUntilExpiry(sub.expiryDate) >= 0)
        .sort((a, b) => getDaysUntilExpiry(a.expiryDate) - getDaysUntilExpiry(b.expiryDate))
        .slice(0, 5),
    [activeSubscriptions]
  );

  const topSpends = useMemo(
    () =>
      [...activeSubscriptions]
        .sort((a, b) => getINRMonthlyCost(b) - getINRMonthlyCost(a))
        .slice(0, 5)
        .map((sub) => ({ name: sub.platform, cost: parseFloat(getINRMonthlyCost(sub).toFixed(2)) })),
    [activeSubscriptions]
  );

  const today = new Date();
  const currentMonthYear = `${MONTHS[today.getMonth()]} ${today.getFullYear()}`;

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
      label: "Monthly Spend (INR)",
      value: `Rs. ${totalMonthlyINR.toFixed(0)}`,
      sub: `Rs. ${totalAnnualINR.toFixed(0)}/year`,
      icon: <IndianRupee size={20} />,
      color: "#0ea5e9",
      bg: "rgba(14,165,233,0.12)",
    },
    {
      label: "Active Subscriptions",
      value: `${activeSubscriptions.length}`,
      sub: "Valid active records",
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
      value: `$${totalAnnual.toFixed(2)}`,
      sub: `Rs. ${totalAnnualINR.toFixed(0)} total`,
      icon: <TrendingUp size={20} />,
      color: "#ec4899",
      bg: "rgba(236,72,153,0.12)",
    },
  ];

  if (loading) {
    return (
      <div className="flex flex-col gap-6 p-6 min-h-full" style={{ background: "#f8fafc" }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 style={{ color: "#0f172a", marginBottom: "4px" }}>Overview</h1>
            <p style={{ color: "#64748b", fontSize: "14px" }}>Loading your subscriptions...</p>
          </div>
          <div className="px-4 py-2 rounded-xl" style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "white", fontSize: "13px", fontWeight: 600 }}>
            {currentMonthYear}
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          {Array.from({ length: 5 }, (_, index) => (
            <div
              key={index}
              className="rounded-2xl p-5 animate-pulse"
              style={{ background: "white", border: "1px solid #e2e8f0", minHeight: "132px" }}
            />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <div className="xl:col-span-2 rounded-2xl animate-pulse" style={{ background: "white", border: "1px solid #e2e8f0", minHeight: "292px" }} />
          <div className="rounded-2xl animate-pulse" style={{ background: "white", border: "1px solid #e2e8f0", minHeight: "292px" }} />
        </div>
      </div>
    );
  }

  if (activeSubscriptions.length === 0) {
    return (
      <div className="flex flex-col gap-6 p-6 min-h-full" style={{ background: "#f8fafc" }}>
        <div>
          <h1 style={{ color: "#0f172a", marginBottom: "4px" }}>Overview</h1>
          <p style={{ color: "#64748b", fontSize: "14px" }}>No active subscriptions available yet</p>
        </div>
        <div className="rounded-2xl p-10 text-center" style={{ background: "white", border: "1px solid #e2e8f0" }}>
          <p style={{ color: "#0f172a", fontSize: "18px", fontWeight: 600 }}>No subscriptions found</p>
          <p style={{ color: "#64748b", fontSize: "14px", marginTop: "8px" }}>
            Add subscriptions from the subscriptions page and the dashboard will populate automatically.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6 min-h-full" style={{ background: "#f8fafc" }}>
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ color: "#0f172a", marginBottom: "4px" }}>Overview</h1>
          <p style={{ color: "#64748b", fontSize: "14px" }}>Track all your subscriptions in one place</p>
        </div>
        <div className="px-4 py-2 rounded-xl" style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "white", fontSize: "13px", fontWeight: 600 }}>
          {currentMonthYear}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-2xl p-5" style={{ background: "white", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            <div className="flex items-center justify-between mb-4">
              <span style={{ fontSize: "13px", color: "#64748b", fontWeight: 500 }}>{stat.label}</span>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: stat.bg, color: stat.color }}>
                {stat.icon}
              </div>
            </div>
            <p style={{ fontSize: "26px", fontWeight: 700, color: "#0f172a", lineHeight: 1 }}>{stat.value}</p>
            <p style={{ fontSize: "12px", color: "#94a3b8", marginTop: "6px" }}>{stat.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2 rounded-2xl p-5" style={{ background: "white", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <div className="mb-4">
            <h3 style={{ color: "#0f172a", marginBottom: "2px" }}>Monthly Spending</h3>
            <p style={{ fontSize: "12px", color: "#94a3b8" }}>Scheduled renewal charges for the next 6 months in original billing currency</p>
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
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(value) => `Rs. ${value}`} />
              <Tooltip
                formatter={(value: number) => [`Rs. ${value.toFixed(0)}`, "Scheduled"]}
                contentStyle={{ borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: "12px" }}
              />
              <Area type="monotone" dataKey="spend" stroke="#6366f1" strokeWidth={2.5} fill="url(#spendGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <h3 style={{ color: "#0f172a", marginBottom: "2px" }}>By Category</h3>
          <p style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "12px" }}>Monthly cost breakdown in INR</p>
          <ResponsiveContainer width="100%" height={150}>
            <PieChart>
              <Pie data={categoryData} cx="50%" cy="50%" innerRadius={42} outerRadius={68} paddingAngle={3} dataKey="value">
                {categoryData.map((entry) => (
                  <Cell key={entry.name} fill={categoryColors[entry.name as keyof typeof categoryColors] || "#6366f1"} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => [`Rs. ${value.toFixed(0)}`, ""]} contentStyle={{ borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: "12px" }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-col gap-1.5 mt-2">
            {categoryData.slice(0, 4).map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: categoryColors[item.name as keyof typeof categoryColors] || "#6366f1" }} />
                  <span style={{ fontSize: "11px", color: "#64748b" }}>{item.name}</span>
                </div>
                <span style={{ fontSize: "11px", fontWeight: 600, color: "#0f172a" }}>Rs. {item.value.toFixed(0)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2 rounded-2xl p-5" style={{ background: "white", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
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
            {upcomingRenewals.length === 0 ? (
              <div className="p-6 rounded-xl text-center" style={{ background: "#f8fafc", border: "1px solid #f1f5f9", color: "#64748b", fontSize: "14px" }}>
                No renewals are due soon.
              </div>
            ) : upcomingRenewals.map((sub) => {
              const days = getDaysUntilExpiry(sub.expiryDate);
              const urgent = days <= 7;
              const warning = days <= 14;

              return (
                <div key={sub.id} className="flex items-center justify-between p-3 rounded-xl" style={{ background: "#f8fafc", border: "1px solid #f1f5f9" }}>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-white relative flex-shrink-0"
                      style={{
                        background: failedLogos.has(sub.id) ? sub.color : "white",
                        backgroundImage: !failedLogos.has(sub.id) ? `url('${getClearbitLogoUrl(sub.platform, sub.logoDomain)}')` : "none",
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }}
                    >
                      {failedLogos.has(sub.id) ? (
                        <span style={{ fontSize: "9px", fontWeight: 700, color: "white" }}>{sub.logo}</span>
                      ) : (
                        <img
                          src={getClearbitLogoUrl(sub.platform, sub.logoDomain)}
                          alt={sub.platform}
                          className="w-full h-full object-contain rounded-xl"
                          style={{ padding: "1px" }}
                          onError={() => handleLogoError(sub.id)}
                        />
                      )}
                    </div>
                    <div>
                      <p style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a" }}>{sub.platform}</p>
                      <p style={{ fontSize: "11px", color: "#94a3b8" }}>{sub.plan} - {sub.cycle}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <p style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>{formatOriginalAmount(sub)}</p>
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

        <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <h3 style={{ color: "#0f172a", marginBottom: "2px" }}>Top Spends</h3>
          <p style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "12px" }}>Highest monthly cost in INR</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart layout="vertical" data={topSpends} margin={{ left: 0, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(value) => `Rs. ${value}`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} width={80} />
              <Tooltip formatter={(value: number) => [`Rs. ${value.toFixed(0)}`, "Monthly"]} contentStyle={{ borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: "12px" }} />
              <Bar dataKey="cost" fill="#6366f1" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
