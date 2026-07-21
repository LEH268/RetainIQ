import { useState, useEffect, useCallback } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend,
} from "recharts";
import {
  Download, TrendingUp, Printer, Share2, FileText, CheckCircle2,
  Loader2, Link2, Calendar, RotateCcw,
} from "lucide-react";
import StatCard from "../components/StatCard";
import api from "../lib/api";
import { downloadCSV } from "../utils/exportCsv";
import { mapCustomer } from "../utils/dataMapper";

const PRESETS = [
  { label: "Last 30 days", days: 30 },
  { label: "Last 90 days", days: 90 },
  { label: "Last 12 months", days: 365 },
  { label: "All time", days: null },
];

function isoDaysBefore(endIso, days) {
  const date = new Date(endIso);
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

export default function Reports() {
  const [bounds, setBounds] = useState({ minDate: "", maxDate: "" });
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  const [isComparing, setIsComparing] = useState(false);
  const [compareMode, setCompareMode] = useState("shift");
  const [compareYears, setCompareYears] = useState(1);
  const [compareStart, setCompareStart] = useState("");
  const [compareEnd, setCompareEnd] = useState("");

  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [shareStatus, setShareStatus] = useState("");
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  useEffect(() => {
    api
      .get("/reports/range")
      .then((res) => {
        setBounds(res.data);
        setStart(res.data.minDate);
        setEnd(res.data.maxDate);
      })
      .catch(console.error);
  }, []);

  const buildParams = useCallback(() => {
    const params = new URLSearchParams();
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
  }, [start, end, isComparing, compareMode, compareStart, compareEnd, compareYears]);

  useEffect(() => {
    if (!start || !end) return;
    setLoading(true);
    api
      .get(`/reports?${buildParams()}`)
      .then((res) => setReportData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [buildParams, start, end]);

  const applyPreset = (days) => {
    if (!bounds.maxDate) return;
    if (days === null) {
      setStart(bounds.minDate);
      setEnd(bounds.maxDate);
      return;
    }
    setEnd(bounds.maxDate);
    const candidate = isoDaysBefore(bounds.maxDate, days);
    setStart(candidate < bounds.minDate ? bounds.minDate : candidate);
  };

  const resetRange = () => {
    setStart(bounds.minDate);
    setEnd(bounds.maxDate);
    setIsComparing(false);
    setCompareStart("");
    setCompareEnd("");
  };

  const handleExport = () => {
    if (!reportData) return;
    setIsExporting(true);

    const lines = [
      "RetainIQ - AI Analytics Report",
      `Period: ${reportData.start} to ${reportData.end}`,
      `Generated: ${new Date().toLocaleString()}`,
      "",
      `Customers active in period: ${reportData.totalCustomers}`,
      `New signups: ${reportData.newSignups}`,
      `Cancellations: ${reportData.cancellations}`,
      `Total Revenue At Risk: ${reportData.atRisk}`,
      `Revenue Saved by AI: ${reportData.saved}`,
      `Model Holdout AUC: ${reportData.accuracy}`,
      "",
    ];

    if (reportData.comparison) {
      lines.push(
        "Comparison period:",
        `  ${reportData.comparison.start} to ${reportData.comparison.end}`,
        `  Customers: ${reportData.comparison.totalCustomers}`,
        `  New signups: ${reportData.comparison.newSignups}`,
        `  Cancellations: ${reportData.comparison.cancellations}`,
        `  Revenue at risk: ${reportData.comparison.atRisk}`,
        ""
      );
    }

    lines.push(
      "Executive AI Summary:",
      reportData.summaryParagraph1,
      reportData.summaryParagraph2,
      "",
      "Revenue Risk & Recovery by Segment:",
      ...reportData.chartData.map(
        (row) =>
          `  ${row.segment}: at-risk RM ${row.atRiskRevenue}, saved RM ${row.savedRevenue}`
      )
    );

    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `retainiq-report-${reportData.start}-to-${reportData.end}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setIsExporting(false);
    setExportSuccess(true);
    setTimeout(() => setExportSuccess(false), 3000);
  };

  const handleShare = async () => {
    const shareData = {
      title: "RetainIQ AI Analytics Report",
      text: `RetainIQ ${reportData?.start} to ${reportData?.end}: ${reportData?.atRisk || ""} at risk, ${reportData?.saved || ""} recoverable.`,
      url: window.location.href,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        /* user dismissed the share sheet */
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShareStatus("Link copied!");
    } catch {
      setShareStatus("Couldn't copy link");
    } finally {
      setTimeout(() => setShareStatus(""), 2000);
    }
  };

  const handleExcelExport = async () => {
    setIsExportingExcel(true);
    try {
      const res = await api.get("/customers");
      const customers = res.data.map(mapCustomer);
      const exportData = customers.map((c) => ({
        Customer_Name: c.name,
        Segment: c.segment,
        Health_Score: c.healthScore,
        Churn_Probability: `${c.churnProbability}%`,
        Risk: c.risk,
        Status: c.status,
      }));
      downloadCSV(exportData, `retainiq-detailed-${start}-to-${end}.csv`);
    } catch {
      alert("Failed to generate the detailed report. Check the backend logs.");
    } finally {
      setIsExportingExcel(false);
    }
  };

  if (loading && !reportData) {
    return (
      <div className="flex items-center justify-center p-20 gap-2 text-ink/50 font-bold">
        <Loader2 className="animate-spin" /> Loading report...
      </div>
    );
  }

  if (!reportData) {
    return <div className="text-center p-20 font-bold text-rose-500">Report unavailable.</div>;
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col gap-4 bg-white p-6 rounded-2xl border border-[var(--color-border)] shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold">AI Analytics Reports</h1>
            <p className="text-sm text-ink/60 mt-1 font-medium">
              Generate, print, and export executive summaries for any date range.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => window.print()}
              title="Print / Save as PDF"
              className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <Printer size={18} />
            </button>

            <div className="relative">
              <button
                onClick={handleShare}
                title="Share report"
                className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <Share2 size={18} />
              </button>
              {shareStatus && (
                <span className="absolute -bottom-8 right-0 text-xs font-bold bg-ink text-white px-2 py-1 rounded-lg whitespace-nowrap flex items-center gap-1">
                  <Link2 size={12} /> {shareStatus}
                </span>
              )}
            </div>

            <button
              onClick={handleExport}
              disabled={isExporting || exportSuccess}
              className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold shadow-sm transition-all ${
                exportSuccess
                  ? "bg-emerald-500 text-white"
                  : "bg-[var(--color-ink)] text-white hover:bg-opacity-90"
              }`}
            >
              {isExporting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : exportSuccess ? (
                <CheckCircle2 size={16} />
              ) : (
                <Download size={16} />
              )}
              {isExporting ? "Compiling..." : exportSuccess ? "Downloaded" : "Export Report"}
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-xs font-bold text-ink/60 mb-1">
                Report start
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
                Report end
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
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <StatCard
          label="Total Revenue At Risk"
          value={reportData.atRisk}
          delta={
            reportData.comparison
              ? `${reportData.atRiskRevenue >= reportData.comparison.atRiskRevenue ? "+" : ""}${(
                  reportData.atRiskRevenue - reportData.comparison.atRiskRevenue
                ).toFixed(0)}`
              : undefined
          }
          deltaTone="down"
        />
        <StatCard label="Revenue Saved by AI" value={reportData.saved} to="/reports" />
        <StatCard label="Model Holdout AUC" value={reportData.accuracy} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-[var(--color-border)] shadow-sm">
          <p className="text-sm font-bold text-ink/60">Active in period</p>
          <p className="text-3xl font-display font-bold mt-2">{reportData.totalCustomers}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-[var(--color-border)] shadow-sm">
          <p className="text-sm font-bold text-ink/60">New signups</p>
          <p className="text-3xl font-display font-bold mt-2 text-emerald-600">
            {reportData.newSignups}
          </p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-[var(--color-border)] shadow-sm">
          <p className="text-sm font-bold text-ink/60">Cancellations</p>
          <p className="text-3xl font-display font-bold mt-2 text-rose-600">
            {reportData.cancellations}
          </p>
        </div>
      </div>

      {reportData.comparison && (
        <div className="bg-white p-6 rounded-2xl border border-[var(--color-border)] shadow-sm">
          <h3 className="font-bold text-lg font-display mb-4">
            Comparison: {reportData.comparison.start} to {reportData.comparison.end}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {[
              ["Active", reportData.comparison.totalCustomers, reportData.totalCustomers],
              ["Signups", reportData.comparison.newSignups, reportData.newSignups],
              ["Cancellations", reportData.comparison.cancellations, reportData.cancellations],
              ["At risk", reportData.comparison.atRiskCustomers, reportData.atRiskCustomers],
            ].map(([label, previous, current]) => (
              <div key={label} className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <p className="text-xs font-bold text-ink/50 uppercase">{label}</p>
                <p className="text-xl font-display font-bold mt-1">{current}</p>
                <p
                  className={`text-xs font-bold mt-1 ${
                    current >= previous ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  {current >= previous ? "+" : ""}
                  {current - previous} vs {previous}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-[var(--color-border)] shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="text-[var(--color-brand)]" />
            <h3 className="font-bold text-lg font-display">Revenue Risk & Recovery</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={reportData.chartData}
              margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
              <XAxis dataKey="segment" stroke="#64748B" tickLine={false} axisLine={false} />
              <YAxis
                stroke="#64748B"
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `RM${(val / 1000).toFixed(1)}k`}
              />
              <Tooltip cursor={{ fill: "var(--color-brand-soft)" }} />
              <Legend wrapperStyle={{ fontSize: 12, fontWeight: 700 }} />
              <Bar
                dataKey="atRiskRevenue"
                name="At Risk Revenue"
                fill="var(--color-risk-high)"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="savedRevenue"
                name="Saved Revenue"
                fill="var(--color-brand)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-[var(--color-brand-soft)] p-8 rounded-2xl border border-[var(--color-brand)]/20 shadow-sm flex flex-col justify-center relative overflow-hidden">
          <div className="absolute -top-10 -right-10 text-[var(--color-brand)]/10">
            <FileText size={160} />
          </div>
          <h3 className="font-bold text-2xl font-display text-ink mb-2 relative z-10">
            Executive AI Summary
          </h3>
          <p className="text-xs font-bold text-ink/50 mb-4 uppercase tracking-wide relative z-10">
            {reportData.start} to {reportData.end}
          </p>
          <div className="space-y-4 relative z-10">
            <p className="text-ink/80 leading-relaxed font-medium bg-white/60 p-4 rounded-xl border border-white">
              {reportData.summaryParagraph1}
            </p>
            <p className="text-ink/80 leading-relaxed font-medium bg-white/60 p-4 rounded-xl border border-white">
              {reportData.summaryParagraph2}
            </p>
          </div>
          <button
            onClick={handleExcelExport}
            disabled={isExportingExcel}
            className="mt-6 self-start px-6 py-2.5 bg-white text-[var(--color-brand)] font-bold rounded-xl shadow-sm border border-[var(--color-brand)]/30 hover:bg-[var(--color-brand)] hover:text-white transition-all relative z-10 disabled:opacity-60"
          >
            {isExportingExcel ? "Generating..." : "Generate Detailed Excel Report"}
          </button>
        </div>
      </div>
    </div>
  );
}