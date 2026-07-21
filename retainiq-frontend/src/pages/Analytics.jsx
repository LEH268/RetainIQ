import { useState, useEffect, useCallback } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  ResponsiveContainer, AreaChart, Area, Legend,
} from "recharts";
import {
  Download, Calendar, TrendingUp, TrendingDown, Sparkles, Loader2, Info,
  RotateCcw,
} from "lucide-react";
import api from "../lib/api";

const GRANULARITY_OPTIONS = [
  { value: "daily", label: "Daily" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "yearly", label: "Yearly" },
];

const PRESETS = [
  { label: "Last 30 days", days: 30 },
  { label: "Last 90 days", days: 90 },
  { label: "Last 12 months", days: 365 },
  { label: "Last 24 months", days: 730 },
];

function isoDaysBefore(endIso, days) {
  const date = new Date(endIso);
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

function clampIso(value, min, max) {
  if (!value) return value;
  if (min && value < min) return min;
  if (max && value > max) return max;
  return value;
}

export default function Analytics() {
  const [granularity, setGranularity] = useState("monthly");
  const [bounds, setBounds] = useState({ minDate: "", maxDate: "" });

  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  const [isComparing, setIsComparing] = useState(false);
  const [compareMode, setCompareMode] = useState("shift"); // "shift" | "custom"
  const [compareYears, setCompareYears] = useState(1);
  const [compareStart, setCompareStart] = useState("");
  const [compareEnd, setCompareEnd] = useState("");

  const [chartData, setChartData] = useState([]);
  const [kpis, setKpis] = useState([]);
  const [note, setNote] = useState("");
  const [truncated, setTruncated] = useState(false);
  const [summary, setSummary] = useState([]);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [expandedKpi, setExpandedKpi] = useState(null);

  useEffect(() => {
    api
      .get("/analytics/range")
      .then((res) => {
        setBounds(res.data);
        setStart(res.data.minDate);
        setEnd(res.data.maxDate);
      })
      .catch(console.error);
  }, []);

  const buildParams = useCallback(() => {
    const params = new URLSearchParams();
    params.set("timeframe", granularity);
    if (start) params.set("start", start);
    if (end) params.set("end", end);
    params.set("compare", String(isComparing));
    if (isComparing) {
      if (compareMode === "custom") {
        if (compareStart) params.set("compareStart", compareStart);
        if (compareEnd) params.set("compareEnd", compareEnd);
      } else {
        params.set("compareYears", String(compareYears));
      }
    }
    return params.toString();
  }, [
    granularity, start, end, isComparing,
    compareMode, compareStart, compareEnd, compareYears,
  ]);

  useEffect(() => {
    if (!start || !end) return;
    const query = buildParams();
    setLoading(true);
    Promise.all([
      api.get(`/analytics?${query}`),
      api.get(`/analytics/kpis?${query}`),
    ])
      .then(([seriesRes, kpiRes]) => {
        setChartData(seriesRes.data.series || []);
        setTruncated(Boolean(seriesRes.data.truncated));
        setKpis(kpiRes.data.kpis || []);
        setNote(kpiRes.data.note || "");
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [buildParams, start, end]);

  useEffect(() => {
    if (!start || !end) return;
    setSummaryLoading(true);
    api
      .get(`/analytics/summary?timeframe=${granularity}&start=${start}&end=${end}`)
      .then((res) => setSummary(res.data.summary || []))
      .catch(() => setSummary([]))
      .finally(() => setSummaryLoading(false));
  }, [granularity, start, end]);

  const applyPreset = (days) => {
    const maxDate = bounds.maxDate;
    if (!maxDate) return;
    setEnd(maxDate);
    setStart(clampIso(isoDaysBefore(maxDate, days), bounds.minDate, maxDate));
  };

  const resetRange = () => {
    setStart(bounds.minDate);
    setEnd(bounds.maxDate);
    setIsComparing(false);
    setCompareStart("");
    setCompareEnd("");
  };

  const handleExport = () => {
    if (!chartData.length) return;
    const headers = Object.keys(chartData[0]);
    const rows = [
      headers.join(","),
      ...chartData.map((row) =>
        headers.map((key) => `"${row[key] ?? ""}"`).join(",")
      ),
    ];
    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `retainiq-analytics-${granularity}-${start}-to-${end}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-10">
      <div className="bg-white p-6 rounded-2xl border border-[var(--color-border)] shadow-sm">
        <h1 className="font-display text-3xl font-bold mb-6">Analytics & Reports</h1>

        <div className="flex flex-col gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-xs font-bold text-ink/60 mb-1">
                Granularity
              </label>
              <select
                value={granularity}
                onChange={(e) => setGranularity(e.target.value)}
                className="px-4 py-2 rounded-lg border-2 border-gray-200 text-sm font-bold outline-none focus:border-[var(--color-brand)]"
              >
                {GRANULARITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-ink/60 mb-1">
                Start date
              </label>
              <input
                type="date"
                value={start}
                min={bounds.minDate}
                max={end || bounds.maxDate}
                onChange={(e) => setStart(e.target.value)}
                className="px-4 py-2 rounded-lg border-2 border-gray-200 text-sm font-bold outline-none focus:border-[var(--color-brand)]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-ink/60 mb-1">
                End date
              </label>
              <input
                type="date"
                value={end}
                min={start || bounds.minDate}
                max={bounds.maxDate}
                onChange={(e) => setEnd(e.target.value)}
                className="px-4 py-2 rounded-lg border-2 border-gray-200 text-sm font-bold outline-none focus:border-[var(--color-brand)]"
              />
            </div>

            <button
              onClick={() => setIsComparing(!isComparing)}
              className={`flex items-center gap-2 rounded-xl border-2 px-4 py-2.5 text-sm font-bold transition-all ${
                isComparing
                  ? "bg-[var(--color-brand-soft)] border-[var(--color-brand)] text-[var(--color-brand-dark)]"
                  : "bg-white border-[var(--color-border)] hover:border-[var(--color-brand)]"
              }`}
            >
              <Calendar size={16} /> {isComparing ? "Comparing" : "Compare period"}
            </button>

            <button
              onClick={resetRange}
              className="flex items-center gap-2 rounded-xl border-2 border-[var(--color-border)] bg-white px-4 py-2.5 text-sm font-bold hover:border-[var(--color-brand)]"
            >
              <RotateCcw size={16} /> Reset
            </button>

            <button
              onClick={handleExport}
              className="flex items-center gap-2 rounded-xl bg-[var(--color-ink)] text-white px-5 py-2.5 text-sm font-bold shadow-sm ml-auto"
            >
              <Download size={16} /> Export CSV
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset.label}
                onClick={() => applyPreset(preset.days)}
                className="text-xs font-bold px-3 py-1.5 bg-white border border-gray-200 rounded-lg hover:border-[var(--color-brand)] hover:text-[var(--color-brand)] transition-colors"
              >
                {preset.label}
              </button>
            ))}
            {bounds.minDate && (
              <span className="text-xs font-medium text-ink/40 self-center ml-2">
                Data available {bounds.minDate} to {bounds.maxDate}
              </span>
            )}
          </div>

          {isComparing && (
            <div className="flex flex-wrap gap-4 items-end border-t border-gray-200 pt-4">
              <div>
                <label className="block text-xs font-bold text-ink/60 mb-1">
                  Comparison mode
                </label>
                <select
                  value={compareMode}
                  onChange={(e) => setCompareMode(e.target.value)}
                  className="px-4 py-2 rounded-lg border-2 border-gray-200 text-sm font-bold outline-none focus:border-[var(--color-brand)]"
                >
                  <option value="shift">Same window, earlier year</option>
                  <option value="custom">Custom date range</option>
                </select>
              </div>

              {compareMode === "shift" ? (
                <div>
                  <label className="block text-xs font-bold text-ink/60 mb-1">
                    Years back
                  </label>
                  <select
                    value={compareYears}
                    onChange={(e) => setCompareYears(Number(e.target.value))}
                    className="px-4 py-2 rounded-lg border-2 border-gray-200 text-sm font-bold outline-none focus:border-[var(--color-brand)]"
                  >
                    {[1, 2, 3, 4, 5].map((year) => (
                      <option key={year} value={year}>
                        {year} year{year > 1 ? "s" : ""} ago
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-bold text-ink/60 mb-1">
                      Compare start
                    </label>
                    <input
                      type="date"
                      value={compareStart}
                      min={bounds.minDate}
                      max={bounds.maxDate}
                      onChange={(e) => setCompareStart(e.target.value)}
                      className="px-4 py-2 rounded-lg border-2 border-gray-200 text-sm font-bold outline-none focus:border-[var(--color-brand)]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-ink/60 mb-1">
                      Compare end
                    </label>
                    <input
                      type="date"
                      value={compareEnd}
                      min={compareStart || bounds.minDate}
                      max={bounds.maxDate}
                      onChange={(e) => setCompareEnd(e.target.value)}
                      className="px-4 py-2 rounded-lg border-2 border-gray-200 text-sm font-bold outline-none focus:border-[var(--color-brand)]"
                    />
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {truncated && (
          <div className="mt-4 flex items-start gap-2 text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 p-3 rounded-lg">
            <Info size={14} className="shrink-0 mt-0.5" />
            <span>
              This range produces too many periods to chart. Showing the most
              recent 400. Narrow the range or use a coarser granularity.
            </span>
          </div>
        )}

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
            {kpi.delta !== null && kpi.delta !== undefined && (
              <p
                className={`text-xs font-bold mt-1 ${
                  kpi.delta >= 0 ? "text-emerald-600" : "text-rose-600"
                }`}
              >
                {kpi.delta >= 0 ? "+" : ""}
                {kpi.delta} vs comparison window
              </p>
            )}
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
            Active subscribers per {granularity.replace("ly", "")} period,
            {" "}{start} to {end}
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
                <YAxis
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  domain={["dataMin - 50", "dataMax + 50"]}
                />
                <Tooltip cursor={{ stroke: "var(--color-border)" }} />
                <Legend wrapperStyle={{ fontSize: 12, fontWeight: 700 }} />
                <Area
                  type="monotone"
                  name="Selected period"
                  dataKey="users"
                  stroke="var(--color-brand)"
                  fill="url(#colorUsers)"
                  strokeWidth={3}
                />
                {isComparing && (
                  <Area
                    type="monotone"
                    name="Comparison period"
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
            Cancellations as a share of the exposed population each period
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
                <Legend wrapperStyle={{ fontSize: 12, fontWeight: 700 }} />
                <Line
                  type="monotone"
                  name="Selected period"
                  dataKey="churnRate"
                  stroke="#E11D48"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
                {isComparing && (
                  <Line
                    type="monotone"
                    name="Comparison period"
                    dataKey="previousYearChurnRate"
                    stroke="#94A3B8"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ r: 3 }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-[var(--color-brand-soft)] p-8 rounded-2xl border border-[var(--color-brand)]/20 shadow-sm">
        <h3 className="font-bold text-2xl font-display text-ink mb-4 flex items-center gap-2">
          <Sparkles className="text-[var(--color-brand)]" /> Executive AI Summary
        </h3>
        <p className="text-xs font-bold text-ink/50 mb-4 uppercase tracking-wide">
          {start} to {end} · {granularity}
        </p>
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