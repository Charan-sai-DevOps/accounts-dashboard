import { useMemo } from "react";
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { Subscription, getMonthlyCost, getAnnualCost, categoryColors } from "../data/subscriptions";

interface ReportsProps {
  subscriptions: Subscription[];
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

interface CategoryTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  subscriptions: Subscription[];
}

function CategoryTooltip({ active, payload, label, subscriptions }: CategoryTooltipProps) {
  if (active && payload && payload.length) {
    const categorySubs = subscriptions
      .filter((sub) => sub.category === label)
      .map((sub) => ({
        platform: sub.platform,
        cost: getMonthlyCost(sub),
        color: sub.color || "#6366f1",
      }))
      .sort((a, b) => b.cost - a.cost);

    const totalCategorySpend = categorySubs.reduce((acc, curr) => acc + curr.cost, 0);

    return (
      <div 
        className="rounded-2xl p-4 shadow-xl border backdrop-blur-md"
        style={{
          background: "rgba(15, 23, 42, 0.95)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3)",
          minWidth: "220px",
          color: "white",
        }}
      >
        <p style={{ fontSize: "11px", fontWeight: 700, color: "#94a3b8", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          {label}
        </p>
        <div className="flex flex-col gap-2.5">
          {categorySubs.map((sub, idx) => (
            <div key={idx} className="flex items-center justify-between gap-6">
              <div className="flex items-center gap-2">
                <div 
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0" 
                  style={{ background: sub.color }} 
                />
                <span style={{ fontSize: "12px", fontWeight: 500, color: "#f8fafc" }}>
                  {sub.platform}
                </span>
              </div>
              <span style={{ fontSize: "12px", fontWeight: 700, color: "#cbd5e1" }}>
                ${sub.cost.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
        <div style={{ margin: "10px 0 6px 0", height: "1px", background: "rgba(255, 255, 255, 0.1)" }} />
        <div className="flex items-center justify-between">
          <span style={{ fontSize: "12px", fontWeight: 600, color: "#94a3b8" }}>Total Spend</span>
          <span style={{ fontSize: "13px", fontWeight: 800, color: "#38bdf8" }}>
            ${totalCategorySpend.toFixed(2)}/mo
          </span>
        </div>
      </div>
    );
  }
  return null;
}

export function Reports({ subscriptions }: ReportsProps) {
  const totalMonthly = useMemo(() => subscriptions.reduce((s, sub) => s + getMonthlyCost(sub), 0), [subscriptions]);
  const totalAnnual = useMemo(() => subscriptions.reduce((s, sub) => s + getAnnualCost(sub), 0), [subscriptions]);

  const categoryData = useMemo(() => {
    const map: Record<string, { monthly: number; count: number }> = {};
    subscriptions.forEach((s) => {
      if (!map[s.category]) map[s.category] = { monthly: 0, count: 0 };
      map[s.category].monthly += getMonthlyCost(s);
      map[s.category].count += 1;
    });
    return Object.entries(map)
      .map(([name, v]) => ({ name, monthly: parseFloat(v.monthly.toFixed(2)), count: v.count }))
      .sort((a, b) => b.monthly - a.monthly);
  }, [subscriptions]);

  const cycleData = useMemo(() => {
    const map: Record<string, number> = {};
    subscriptions.forEach((s) => { map[s.cycle] = (map[s.cycle] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [subscriptions]);

  const buyerData = useMemo(() => {
    const map: Record<string, number> = {};
    subscriptions.forEach((s) => { map[s.buyer || "Unknown"] = (map[s.buyer || "Unknown"] || 0) + getMonthlyCost(s); });
    return Object.entries(map).map(([name, monthly]) => ({ name, monthly: parseFloat(monthly.toFixed(2)) })).sort((a, b) => b.monthly - a.monthly);
  }, [subscriptions]);

  const trendData = useMemo(() => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const seed = totalMonthly;
    return MONTHS.map((month, i) => {
      const diff = (i - currentMonth + 12) % 12;
      const base = diff <= 1 ? seed : seed * (0.8 + Math.random() * 0.25);
      return { month, spend: parseFloat(base.toFixed(2)), projected: i > currentMonth ? parseFloat((seed * (1 + 0.02 * (i - currentMonth))).toFixed(2)) : null };
    });
  }, [totalMonthly]);

  const CYCLE_COLORS = { Monthly: "#6366f1", Quarterly: "#f59e0b", Annual: "#10b981" };

  const summaryCards = [
    { label: "Monthly Spend", value: `$${totalMonthly.toFixed(2)}`, color: "#6366f1" },
    { label: "Annual Spend", value: `$${totalAnnual.toFixed(2)}`, color: "#10b981" },
    { label: "Avg per Sub", value: `$${(totalMonthly / subscriptions.length).toFixed(2)}/mo`, color: "#f59e0b" },
    { label: "Total Platforms", value: subscriptions.length.toString(), color: "#ec4899" },
  ];

  return (
    <div className="flex flex-col gap-6 p-6 min-h-full" style={{ background: "#f8fafc" }}>
      <div>
        <h1 style={{ color: "#0f172a", marginBottom: "4px" }}>Reports & Analytics</h1>
        <p style={{ color: "#64748b", fontSize: "14px" }}>Deep dive into your subscription spending</p>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-4 gap-4">
        {summaryCards.map((c) => (
          <div key={c.label} className="rounded-2xl p-5" style={{ background: "white", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            <div className="w-2 h-2 rounded-full mb-3" style={{ background: c.color }} />
            <p style={{ fontSize: "22px", fontWeight: 700, color: "#0f172a" }}>{c.value}</p>
            <p style={{ fontSize: "12px", color: "#94a3b8", marginTop: "4px" }}>{c.label}</p>
          </div>
        ))}
      </div>

      {/* Trend + Cycle */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 rounded-2xl p-5" style={{ background: "white", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <h3 style={{ color: "#0f172a", marginBottom: "4px" }}>Spending Trend</h3>
          <p style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "16px" }}>Actual vs projected monthly spend</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
              <Tooltip formatter={(v: number) => v ? [`$${v.toFixed(2)}`, ""] : ["-", ""]} contentStyle={{ borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: "12px" }} />
              <Legend />
              <Line type="monotone" dataKey="spend" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 3, fill: "#6366f1" }} name="Actual" connectNulls />
              <Line type="monotone" dataKey="projected" stroke="#e2e8f0" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Projected" connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <h3 style={{ color: "#0f172a", marginBottom: "4px" }}>Billing Cycle Split</h3>
          <p style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "16px" }}>Subscriptions by cycle type</p>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={cycleData} cx="50%" cy="50%" outerRadius={72} paddingAngle={4} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                {cycleData.map((entry) => (
                  <Cell key={entry.name} fill={CYCLE_COLORS[entry.name as keyof typeof CYCLE_COLORS] || "#6366f1"} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: "12px" }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-col gap-2 mt-2">
            {cycleData.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: CYCLE_COLORS[item.name as keyof typeof CYCLE_COLORS] || "#6366f1" }} />
                  <span style={{ fontSize: "12px", color: "#64748b" }}>{item.name}</span>
                </div>
                <span style={{ fontSize: "12px", fontWeight: 600, color: "#0f172a" }}>{item.value} subs</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Category spend + Buyer spend */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <h3 style={{ color: "#0f172a", marginBottom: "4px" }}>Spend by Category</h3>
          <p style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "16px" }}>Monthly cost per category</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={categoryData} margin={{ bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} angle={-30} textAnchor="end" />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
              <Tooltip content={<CategoryTooltip subscriptions={subscriptions} />} />
              <Bar dataKey="monthly" radius={[6, 6, 0, 0]}>
                {categoryData.map((entry) => (
                  <Cell key={entry.name} fill={categoryColors[entry.name as keyof typeof categoryColors] || "#6366f1"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <h3 style={{ color: "#0f172a", marginBottom: "4px" }}>Spend by Buyer</h3>
          <p style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "16px" }}>Monthly spend per team member</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={buyerData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
              <Tooltip formatter={(v: number) => [`$${v.toFixed(2)}`, "Monthly"]} contentStyle={{ borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: "12px" }} />
              <Bar dataKey="monthly" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex flex-col gap-2 mt-3">
            {buyerData.map((b, i) => {
              const pct = ((b.monthly / totalMonthly) * 100).toFixed(0);
              return (
                <div key={b.name} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-white flex-shrink-0" style={{ background: ["#6366f1", "#8b5cf6", "#ec4899"][i % 3], fontSize: "10px", fontWeight: 700 }}>
                    {b.name[0]}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span style={{ fontSize: "12px", color: "#0f172a", fontWeight: 500 }}>{b.name}</span>
                      <span style={{ fontSize: "11px", color: "#64748b" }}>${b.monthly.toFixed(2)}/mo · {pct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#f1f5f9" }}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: ["#6366f1", "#8b5cf6", "#ec4899"][i % 3] }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
