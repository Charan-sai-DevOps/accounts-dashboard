import { useMemo, memo, ReactNode } from "react";
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { Subscription, getMonthlyCost, getAnnualCost, categoryColors, TEAM_ORDER, teamColors, Team } from "../data/subscriptions";

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

interface TeamTooltipProps {
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
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: sub.color }} />
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

function TeamTooltip({ active, payload, label, subscriptions }: TeamTooltipProps) {
  if (active && payload && payload.length) {
    const teamSubs = subscriptions
      .filter((sub) => sub.team === label)
      .map((sub) => ({
        platform: sub.platform,
        cost: getMonthlyCost(sub),
        color: sub.color || "#6366f1",
      }))
      .sort((a, b) => b.cost - a.cost);

    const totalTeamSpend = teamSubs.reduce((acc, curr) => acc + curr.cost, 0);

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
          {teamSubs.map((sub, idx) => (
            <div key={idx} className="flex items-center justify-between gap-6">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: sub.color }} />
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
            ${totalTeamSpend.toFixed(2)}/mo
          </span>
        </div>
      </div>
    );
  }
  return null;
}

const TrendChart = memo(({ data }: { data: Array<{ month: string; spend: number; projected: number }> }) => (
  <ResponsiveContainer width="100%" height={220}>
    <LineChart data={data}>
      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
      <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
      <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(value) => `$${value}`} />
      <Tooltip formatter={(value: number) => [`$${value.toFixed(2)}`, ""]} contentStyle={{ borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: "12px" }} />
      <Legend />
      <Line type="monotone" dataKey="spend" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 3, fill: "#6366f1" }} name="Current" connectNulls />
      <Line type="monotone" dataKey="projected" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Projected" connectNulls />
    </LineChart>
  </ResponsiveContainer>
));

const CycleChart = memo(({ data, colors }: { data: Array<{ name: string; value: number }>, colors: Record<string, string> }) => (
  <ResponsiveContainer width="100%" height={180}>
    <PieChart>
      <Pie data={data} cx="50%" cy="50%" outerRadius={72} paddingAngle={4} dataKey="value">
        {data.map((entry) => (
          <Cell key={entry.name} fill={colors[entry.name as keyof typeof colors] || "#6366f1"} />
        ))}
      </Pie>
      <Tooltip contentStyle={{ borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: "12px" }} />
    </PieChart>
  </ResponsiveContainer>
));

const CategoryBarChart = memo(({ data, subscriptions }: { data: Array<{ name: string; monthly: number; count: number }>, subscriptions: Subscription[] }) => (
  <ResponsiveContainer width="100%" height={220}>
    <BarChart data={data} margin={{ bottom: 20 }}>
      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
      <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} angle={-30} textAnchor="end" />
      <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(value) => `$${value}`} />
      <Tooltip content={<CategoryTooltip subscriptions={subscriptions} />} />
      <Bar dataKey="monthly" radius={[6, 6, 0, 0]}>
        {data.map((entry) => (
          <Cell key={entry.name} fill={categoryColors[entry.name as keyof typeof categoryColors] || "#6366f1"} />
        ))}
      </Bar>
    </BarChart>
  </ResponsiveContainer>
));

const TeamBarChart = memo(({ data, subscriptions, colors }: { data: Array<{ name: Team; monthly: number }>, subscriptions: Subscription[], colors: Record<Team, { color: string }> }) => (
  <ResponsiveContainer width="100%" height={220}>
    <BarChart data={data} margin={{ bottom: 8 }}>
      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
      <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
      <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(value) => `$${value}`} />
      <Tooltip content={<TeamTooltip subscriptions={subscriptions} />} />
      <Bar dataKey="monthly" radius={[6, 6, 0, 0]} activeBar={{ opacity: 0.85 }}>
        {data.map((entry) => (
          <Cell key={entry.name} fill={colors[entry.name].color} />
        ))}
      </Bar>
    </BarChart>
  </ResponsiveContainer>
));

function ReportsComponent({ subscriptions }: ReportsProps) {
  const activeSubscriptions = useMemo(
    () => subscriptions.filter((sub) => sub.active && sub.renewalStatus !== "Cancelled"),
    [subscriptions]
  );

  const totalMonthly = useMemo(
    () => activeSubscriptions.reduce((sum, sub) => sum + getMonthlyCost(sub), 0),
    [activeSubscriptions]
  );

  const totalAnnual = useMemo(
    () => activeSubscriptions.reduce((sum, sub) => sum + getAnnualCost(sub), 0),
    [activeSubscriptions]
  );

  const categoryData = useMemo(() => {
    const map: Record<string, { monthly: number; count: number }> = {};
    activeSubscriptions.forEach((sub) => {
      if (!map[sub.category]) map[sub.category] = { monthly: 0, count: 0 };
      map[sub.category].monthly += getMonthlyCost(sub);
      map[sub.category].count += 1;
    });

    return Object.entries(map)
      .map(([name, value]) => ({ name, monthly: parseFloat(value.monthly.toFixed(2)), count: value.count }))
      .sort((a, b) => b.monthly - a.monthly);
  }, [activeSubscriptions]);

  const cycleData = useMemo(() => {
    const map: Record<string, number> = {};
    activeSubscriptions.forEach((sub) => {
      map[sub.cycle] = (map[sub.cycle] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [activeSubscriptions]);

  const teamData = useMemo(() => {
    const map: Record<Team, number> = {
      Development: 0,
      "Graphic Design": 0,
      "Social Media": 0,
    };

    activeSubscriptions.forEach((sub) => {
      if (!(sub.team in map)) return;
      map[sub.team as Team] += getMonthlyCost(sub);
    });

    return TEAM_ORDER
      .map((name) => ({
        name,
        monthly: parseFloat(map[name].toFixed(2)),
      }))
      .sort((a, b) => b.monthly - a.monthly);
  }, [activeSubscriptions]);

  const trendData = useMemo(() => {
    const currentMonth = new Date().getMonth();
    return MONTHS.map((month, index) => ({
      month,
      spend: parseFloat((index <= currentMonth ? totalMonthly : 0).toFixed(2)),
      projected: parseFloat(totalMonthly.toFixed(2)),
    }));
  }, [totalMonthly]);

  const CYCLE_COLORS = { Monthly: "#6366f1", Quarterly: "#f59e0b", Annual: "#10b981" };

  const summaryCards = [
    { label: "Monthly Spend", value: `$${totalMonthly.toFixed(2)}`, color: "#6366f1" },
    { label: "Annual Spend", value: `$${totalAnnual.toFixed(2)}`, color: "#10b981" },
    { label: "Avg per Sub", value: `$${(totalMonthly / Math.max(activeSubscriptions.length, 1)).toFixed(2)}/mo`, color: "#f59e0b" },
    { label: "Total Platforms", value: activeSubscriptions.length.toString(), color: "#ec4899" },
  ];

  return (
    <div className="flex flex-col gap-6 p-6 min-h-full [&_button]:cursor-pointer" style={{ background: "#f8fafc" }}>
      <div>
        <h1 style={{ color: "#0f172a", marginBottom: "4px", fontWeight: 700 }}>Reports & Analytics</h1>
        <p style={{ color: "#64748b", fontSize: "14px" }}>Deep dive into your subscription spending</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {summaryCards.map((card) => (
          <div key={card.label} className="rounded-2xl p-5" style={{ background: "white", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            <div className="w-2 h-2 rounded-full mb-3" style={{ background: card.color }} />
            <p style={{ fontSize: "22px", fontWeight: 700, color: "#0f172a" }}>{card.value}</p>
            <p style={{ fontSize: "12px", color: "#94a3b8", marginTop: "4px" }}>{card.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl p-5" style={{ background: "white", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <h3 style={{ color: "#0f172a", marginBottom: "4px", fontWeight: 700 }}>Spending Trend</h3>
          <p style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "16px" }}>Current monthly spend and steady projection</p>
          <TrendChart data={trendData} />
        </div>

        <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <h3 style={{ color: "#0f172a", marginBottom: "4px", fontWeight: 700 }}>Billing Cycle Split</h3>
          <p style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "16px" }}>Subscriptions by cycle type</p>
          <CycleChart data={cycleData} colors={CYCLE_COLORS} />
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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <h3 style={{ color: "#0f172a", marginBottom: "4px", fontWeight: 700 }}>Spend by Category</h3>
          <p style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "16px" }}>Monthly cost per category</p>
          <CategoryBarChart data={categoryData} subscriptions={activeSubscriptions} />
        </div>

        <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <h3 style={{ color: "#0f172a", marginBottom: "4px", fontWeight: 700 }}>Spend by Team</h3>
          <p style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "16px" }}>Monthly spend per team</p>
          <TeamBarChart data={teamData} subscriptions={activeSubscriptions} colors={teamColors} />
          <div className="flex flex-col gap-2 mt-3">
            {teamData.map((team) => {
              const pct = totalMonthly > 0 ? ((team.monthly / totalMonthly) * 100).toFixed(0) : "0";
              return (
                <div key={team.name} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-white flex-shrink-0" style={{ background: teamColors[team.name as Team].color, fontSize: "10px", fontWeight: 700 }}>
                    {team.name[0]}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span style={{ fontSize: "12px", color: "#0f172a", fontWeight: 500 }}>{team.name}</span>
                      <span style={{ fontSize: "11px", color: "#64748b" }}>${team.monthly.toFixed(2)}/mo - {pct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#f1f5f9" }}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: teamColors[team.name as Team].color }} />
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

export const Reports = memo(ReportsComponent);
