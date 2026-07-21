import { useState, useEffect, useCallback } from "react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from "recharts";
import { Link } from "react-router-dom";
import {
  Loader2, Layers, Megaphone, Users, BarChart2, Settings,
  CheckCircle2, Sparkles, Info,
} from "lucide-react";
import api from "../lib/api";

const KPI_CARDS = [
  { key: "totalCustomers", label: "Total Customers", to: "/customers", theme: "bg-white border-[var(--color-border)]", text: "text-ink", value: "text-ink" },
  { key: "activeCustomers", label: "Active Customers", to: "/customers?status=Active", theme: "bg-blue-50 border-blue-200", text: "text-blue-800", value: "text-blue-600" },
  { key: "inactiveCustomers", label: "Inactive Customers", to: "/customers?status=Inactive", theme: "bg-gray-50 border-gray-200", text: "text-gray-800", value: "text-gray-600" },
  { key: "healthyCount", label: "Healthy Customers", to: "/customers?risk=Healthy", theme: "bg-emerald-50 border-emerald-200", text: "text-emerald-800", value: "text-emerald-600" },
  { key: "moderateCount", label: "Moderate Risk", to: "/customers?risk=Moderate%20Risk", theme: "bg-amber-50 border-amber-200", text: "text-amber-800", value: "text-amber-600" },
  { key: "highRiskCount", label: "High Risk", to: "/customers?risk=High%20Risk", theme: "bg-rose-50 border-rose-200", text: "text-rose-800", value: "text-rose-600" },
];

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [aiInsights, setAiInsights] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingAi, setLoadingAi] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get("/dashboard/stats");
      setStats(res.data);
    } catch {
      setError("Failed to load dashboard statistics. Is the backend running?");
    } finally {
      setLoadingStats(false);
    }
  }, []);

  const fetchAiInsights = useCallback(async () => {
    try {
      const res = await api.get("/ai/generate-insights");
      setAiInsights(res.data.insights || []);
    } catch {
      setAiInsights(["AI insights unavailable. Check OPENAI_API_KEY in the backend."]);
    } finally {
      setLoadingAi(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    fetchAiInsights();
  }, [fetchStats, fetchAiInsights]);

  if (loadingStats) {
    return (
      <div className="flex h-screen items-center justify-center font-display text-lg text-ink/50">
        <Loader2 className="animate-spin mr-2" /> Loading dashboard data...
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex h-screen items-center justify-center font-display text-lg text-rose-500">
        {error || "Data unavailable."}
      </div>
    );
  }

  const growth = stats.growthMetrics || {};

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-10">
      <div className="bg-gradient-to-r from-[var(--color-brand-soft)] to-indigo-50 border border-[var(--color-brand)]/20 p-6 rounded-2xl shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-display font-bold text-[var(--color-brand-dark)] flex items-center gap-2">
            <Sparkles size={20} className="text-[var(--color-brand)]" /> AI Business Insights
          </h2>
          {loadingAi && <Loader2 size={16} className="animate-spin text-[var(--color-brand)]" />}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {loadingAi ? (
            <div className="col-span-2 text-sm text-ink/60 italic">
              Generating insights from your latest metrics...
            </div>
          ) : (
            aiInsights.map((insight, index) => (
              <div key={index} className="flex items-start gap-3 bg-white/60 p-3 rounded-xl shadow-sm">
                <CheckCircle2 className="text-[var(--color-brand)] shrink-0 mt-0.5" size={20} />
                <span className="text-sm font-bold text-ink/80">{insight}</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {KPI_CARDS.map((card) => (
          <Link
            key={card.key}
            to={card.to}
            className={`${card.theme} border p-5 rounded-2xl shadow-sm flex flex-col justify-between hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer`}
          >
            <p className={`text-sm font-bold ${card.text}`}>{card.label}</p>
            <p className={`text-4xl font-display font-bold mt-2 mb-1 ${card.value}`}>
              {stats[card.key] ?? 0}
            </p>
            <p className="text-xs font-medium text-ink/40">
              {stats.totalCustomers
                ? `${((stats[card.key] ?? 0) / stats.totalCustomers * 100).toFixed(1)}% of base`
                : ""}
            </p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-sm">
          <h3 className="mb-6 text-lg font-bold font-display">Health Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={stats.healthDistribution}
                dataKey="value"
                nameKey="name"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={4}
                label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {stats.healthDistribution.map((entry, i) => (
                  <Cell key={i} fill={entry.color} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name, props) => [
                  `${value} customers (${props.payload.percentage}%)`,
                  name,
                ]}
              />
            </PieChart>
          </ResponsiveContainer>

          <div className="w-full space-y-3 mt-4">
            <h4 className="text-xs font-bold text-ink/50 uppercase border-b pb-2">
              Health Score Breakdown
            </h4>
            {stats.healthDistribution.map((tier) => (
              <Link
                key={tier.name}
                to={`/customers?risk=${encodeURIComponent(tier.name)}`}
                className="flex justify-between items-center text-sm hover:bg-gray-50 -mx-2 px-2 py-1 rounded-lg"
              >
                <span className="font-bold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: tier.color }} />
                  {tier.name}
                </span>
                <span className="text-ink/80 font-bold flex gap-1.5 items-center">
                  {tier.value}
                  <span className="text-xs font-medium text-ink/50 bg-gray-100 px-1.5 py-0.5 rounded-md">
                    {tier.percentage}%
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-sm lg:col-span-2">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold font-display">Subscription Movement (YTD)</h3>
              <p className="text-xs font-medium text-ink/50 mt-1">
                New joins, renewals, and cancellations by month
              </p>
            </div>
            {growth.subscriberGrowth !== undefined && (
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                  growth.subscriberGrowth >= 0
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-rose-50 text-rose-700"
                }`}
              >
                {growth.subscriberGrowth >= 0 ? "+" : ""}
                {growth.subscriberGrowth}% net
              </span>
            )}
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats.subscriptionGrowth}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
              <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip cursor={{ stroke: "var(--color-border)" }} />
              <Legend wrapperStyle={{ fontSize: 12, fontWeight: 700 }} />
              <Line type="monotone" dataKey="new" name="New" stroke="#10B981" strokeWidth={3} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="renewals" name="Renewals" stroke="#0284C7" strokeWidth={3} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="cancelled" name="Cancelled" stroke="#E11D48" strokeWidth={3} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>

          {growth.peakMonth && (
            <div className="mt-4 flex items-start gap-2 text-xs font-medium text-ink/50 bg-gray-50 p-3 rounded-lg">
              <Info size={14} className="shrink-0 mt-0.5" />
              <span>
                Peak in {growth.peakMonth} ({growth.peakUsers?.toLocaleString()} subscribers),
                weakest in {growth.troughMonth}. {stats.seriesNote}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-[var(--color-border)] shadow-sm">
        <h3 className="mb-6 text-lg font-bold font-display">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { to: "/customers", icon: Users, label: "Customers", sub: "View all" },
            { to: "/analytics", icon: BarChart2, label: "Analytics", sub: "View details" },
            { to: "/segmentation", icon: Layers, label: "Segmentation", sub: "Manage AI" },
            { to: "/campaigns", icon: Megaphone, label: "Campaigns", sub: "Launch" },
            { to: "/settings", icon: Settings, label: "Settings", sub: "Configure" },
          ].map(({ to, icon: Icon, label, sub }) => (
            <Link
              key={to}
              to={to}
              className="flex flex-col items-center justify-center p-4 bg-gray-50 border border-gray-100 rounded-xl hover:bg-[var(--color-brand-soft)] hover:border-[var(--color-brand)] transition-colors group"
            >
              <Icon size={24} className="text-gray-400 group-hover:text-[var(--color-brand)] mb-2" />
              <span className="font-bold text-sm">{label}</span>
              <span className="text-xs text-ink/50">{sub}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}