import { useState, useEffect } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  ResponsiveContainer, AreaChart, Area, Legend,
} from "recharts";
import {
  Download, Calendar, TrendingUp, TrendingDown, Sparkles, Loader2, Info,
} from "lucide-react";
import api from "../lib/api";

export default function Analytics() {
  const [timeframe, setTimeframe] = useState("Monthly");
  const [isComparing, setIsComparing] = useState(false);
  const [chartData, setChartData] = useState([]);
  const [kpis, setKpis] = useState([]);
  const [note, setNote] = useState("");
  const [summary, setSummary] = useState([]);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [expandedKpi, setExpandedKpi] = useState(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get(`/analytics?timeframe=${timeframe}&compare=${isComparing}`),
      api.get(`/analytics/kpis?timeframe=${timeframe}&compare=${isComparing}`),
    ])
      .then(([seriesRes, kpiRes]) => {
        setChartData(seriesRes.data);
        setKpis(kpiRes.data.kpis || []);
        setNote(kpiRes.data.note || "");
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [timeframe, isComparing]);

  useEffect(() => {
    api
      .get("/analytics/summary")
      .then((res) => setSummary(res.data.summary || []))
      .catch(() => setSummary([]))
      .finally(() => setSummaryLoading(false));
  }, []);

  const handleExport = () => {
    if (!chartData.length) return;
    const headers = Object.keys(chartData[0]);
    const rows = [
      headers.join(","),
      ...chartData.map((row) => headers.map((key) => row[key]).join(",")),
    ];
    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `retainiq-analytics-${timeframe.toLowerCase()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-10">
      <div className="bg-white p-6 rounded-2xl border border-[var(--color-border)] shadow-sm">
        <h1 className="font-display text-3xl font-bold mb-6">Analytics & Reports</h1>

        <div className="flex flex-wrap gap-4 items-end bg-gray-50 p-4 rounded-xl border border-gray-200">
          <div>
            <label className="block text-xs font-bold text-ink/60 mb-1">Timeframe</label>
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="px-4 py-2 rounded-lg border-2 border-gray-200 text-sm font-bold outline-none focus:border-[var(--color-brand)]"
            >
              <option>Monthly</option>
              <option>Quarterly</option>
            </select>
          </div>
          <button
            onClick={() => setIsComparing(!isComparing)}
            className={`flex items-center gap-2 rounded-xl border-2 px-4 py-2.5 text-sm font-bold transition-all ${
              isComparing
                ? "bg-[var(--color-brand-soft)] border-[var(--color-brand)] text-[var(--color-brand-dark)]"
                : "bg-white border-[var(--color-border)] hover:border-[var(--color-brand)]"
            }`}
          >
            <Calendar size={16} /> {isComparing ? "Comparing to prior year" : "Compare prior year"}
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 rounded-xl bg-[var(--color-ink)] text-white px-5 py-2.5 text-sm font-bold shadow-sm ml-auto"
          >
            <Download size={16} /> Export CSV
          </button>
        </div>

        {note && (
          <div className="mt-4 flex items-start gap-2 text-xs font-medium text-ink/50 bg-blue-50/50 border border-blue-100 p-3 rounded-lg">
            <Info size={14} className="shrink-0 mt-0.5 text-blue-600" />
            <span>{note}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpis.map((kpi) => (
          <button
            key={kpi.id}
            onClick={() => setExpandedKpi(expandedKpi === kpi.id ? null : kpi.id)}
            className="bg-white p-5 rounded-2xl border border-[var(--color-border)] shadow-sm text-left hover:border-[var(--color-brand)] transition-colors"
          >
            <div className="flex items-start justify-between mb-2">
              <p className="text-sm font-bold text-ink/60">{kpi.label}</p>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  kpi.tone === "up"
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-rose-50 text-rose-600"
                }`}
              >
                {kpi.tone === "up" ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              </div>
            </div>
            <p className="text-3xl font-display font-bold">{kpi.value}</p>
            <p className="text-xs font-bold text-ink/40 mt-1 uppercase tracking-wide">
              {kpi.window}
            </p>
            <p className="text-xs font-medium text-ink/60 mt-2 leading-relaxed">
              {expandedKpi === kpi.id ? kpi.definition : kpi.supporting}
            </p>
            <p className="text-[10px] font-bold text-[var(--color-brand)] mt-2 uppercase">
              {expandedKpi === kpi.id ? "Show less" : "What does this mean?"}
            </p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-[var(--color-border)] shadow-sm">
          <h3 className="mb-1 text-lg font-bold font-display">Subscriber Trend</h3>
          <p className="text-xs font-medium text-ink/50 mb-5">
            Projected subscriber count by {timeframe.toLowerCase()} period
          </p>
          {loading ? (
            <div className="h-[300px] flex items-center justify-center text-ink/40">
              <Loader2 className="animate-spin" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-brand)" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="var(--color-brand)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} domain={["dataMin - 50", "dataMax + 50"]} />
                <Tooltip cursor={{ stroke: "var(--color-border)" }} />
                <Legend wrapperStyle={{ fontSize: 12, fontWeight: 700 }} />
                <Area
                  type="monotone"
                  name="Current year"
                  dataKey="users"
                  stroke="var(--color-brand)"
                  fill="url(#colorUsers)"
                  strokeWidth={3}
                />
                {isComparing && (
                  <Area
                    type="monotone"
                    name="Prior year"
                    dataKey="previousYearUsers"
                    stroke="#94A3B8"
                    fill="#e2e8f0"
                    fillOpacity={0.5}
                    strokeWidth={2}
                    strokeDasharray="5 5"
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white p-6 rounded-2xl border border-[var(--color-border)] shadow-sm">
          <h3 className="mb-1 text-lg font-bold font-display">Churn Rate</h3>
          <p className="text-xs font-medium text-ink/50 mb-5">
            Share of subscribers scored High Risk each period
          </p>
          {loading ? (
            <div className="h-[300px] flex items-center justify-center text-ink/40">
              <Loader2 className="animate-spin" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip formatter={(value) => `${value}%`} />
                <Line
                  type="monotone"
                  name="Churn rate"
                  dataKey="churnRate"
                  stroke="#E11D48"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-[var(--color-brand-soft)] p-8 rounded-2xl border border-[var(--color-brand)]/20 shadow-sm">
        <h3 className="font-bold text-2xl font-display text-ink mb-4 flex items-center gap-2">
          <Sparkles className="text-[var(--color-brand)]" /> Executive AI Summary
        </h3>
        <div className="space-y-4">
          {summaryLoading ? (
            <div className="flex items-center gap-2 text-sm font-bold text-ink/50">
              <Loader2 size={16} className="animate-spin" /> Generating summary...
            </div>
          ) : (
            summary.map((paragraph, index) => (
              <p
                key={index}
                className="text-ink/80 leading-relaxed font-medium bg-white/60 p-4 rounded-xl border border-white"
              >
                {paragraph}
              </p>
            ))
          )}
        </div>
      </div>
    </div>
  );
}