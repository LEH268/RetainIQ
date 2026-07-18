import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";
import { Download, TrendingUp, Printer, Share2, FileText, CheckCircle2, Loader2, Link2 } from "lucide-react";
import StatCard from "../components/StatCard";
import api from "../lib/api";
import { downloadCSV } from "../utils/exportCsv";
import { mapCustomer } from "../utils/dataMapper";

export default function Reports() {
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [shareStatus, setShareStatus] = useState("");
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [reportPeriod, setReportPeriod] = useState("Monthly");

  useEffect(() => {
     api.get('/api/reports').then(res => setReportData(res.data)).catch(console.error);
  }, []);

  const handleExport = () => {
    if (!reportData) return;
    setIsExporting(true);
    
    const lines = [
      "RetainIQ - AI Analytics Report",
      `Period: ${reportPeriod}`,
      `Generated: ${new Date().toLocaleString()}`,
      "",
      `Total Revenue At Risk: ${reportData.atRisk}`,
      `Revenue Saved by AI: ${reportData.saved}`,
      `AI Prediction Accuracy: ${reportData.accuracy}`,
      "",
      "Executive AI Summary:",
      reportData.summaryParagraph1,
      reportData.summaryParagraph2,
      "",
      "Revenue Risk & Recovery by Segment:",
      ...reportData.chartData.map(
        (row) => `  ${row.segment}: at-risk $${row.atRiskRevenue}, saved $${row.savedRevenue}`
      ),
    ];

    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `retainiq-${reportPeriod.toLowerCase()}-report.txt`;
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
      text: `RetainIQ report: ${reportData?.atRisk || ""} at risk, ${reportData?.saved || ""} saved by AI.`,
      url: window.location.href,
    };

    if (navigator.share) {
      try { await navigator.share(shareData); } catch (err) {}
      return;
    }
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShareStatus("Link copied!");
    } catch (err) {
      setShareStatus("Couldn't copy link");
    } finally {
      setTimeout(() => setShareStatus(""), 2000);
    }
  };

  const handleExcelExport = async () => {
    setIsExportingExcel(true);
    try {
      const res = await api.get("/api/customers");
      const customers = res.data.map(mapCustomer);
      const exportData = customers.map(c => ({
        Customer_Name: c.name, Segment: c.segment, Health_Score: c.healthScore,
        Churn_Probability: `${c.churnProbability}%`, Risk: c.risk, Status: c.status,
      }));
      downloadCSV(exportData, "retainiq-detailed-report.csv");
    } catch (err) {
      alert("Failed to generate the detailed report. Check the backend logs.");
    } finally {
      setIsExportingExcel(false);
    }
  };

  if(!reportData) return <div className="text-center p-20">Loading API Reports...</div>

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[var(--color-border)] shadow-sm">
        <div>
          <h1 className="font-display text-3xl font-bold">AI Analytics Reports</h1>
          <p className="text-sm text-ink/60 mt-1 font-medium">Generate, print, and export executive summaries.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <select 
            value={reportPeriod} 
            onChange={(e) => setReportPeriod(e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold bg-gray-50 outline-none focus:border-[var(--color-brand)]"
          >
            <option value="Daily">Daily Report</option>
            <option value="Monthly">Monthly Report</option>
            <option value="Yearly">Yearly Report</option>
          </select>
          <button onClick={() => window.print()} title="Print / Save as PDF" className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors"><Printer size={18}/></button>
          
          <div className="relative">
            <button onClick={handleShare} title="Share report" className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors"><Share2 size={18}/></button>
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
              exportSuccess ? 'bg-emerald-500 text-white' : 'bg-[var(--color-ink)] text-white hover:bg-opacity-90'
            }`}
          >
            {isExporting ? <Loader2 size={16} className="animate-spin" /> : exportSuccess ? <CheckCircle2 size={16} /> : <Download size={16} />}
            {isExporting ? "Compiling..." : exportSuccess ? "Downloaded" : "Export Report"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <StatCard label="Total Revenue At Risk" value={reportData.atRisk} delta="+12%" deltaTone="down" />
        <StatCard label="Revenue Saved by AI" value={reportData.saved} delta="+24%" to="/reports" />
        <StatCard label="AI Prediction Accuracy" value={reportData.accuracy} delta="+1.1%" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-[var(--color-border)] shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="text-[var(--color-brand)]" />
            <h3 className="font-bold text-lg font-display">Revenue Risk & Recovery</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={reportData.chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
              <XAxis dataKey="segment" stroke="#64748B" tickLine={false} axisLine={false} />
              <YAxis stroke="#64748B" tickLine={false} axisLine={false} tickFormatter={(val) => `$${val/1000}k`} />
              <Tooltip cursor={{ fill: 'var(--color-brand-soft)' }} />
              <Bar dataKey="atRiskRevenue" name="At Risk Revenue" fill="var(--color-risk-high)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="savedRevenue" name="Saved Revenue" fill="var(--color-brand)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="bg-gradient-to-br from-blue-50 to-[var(--color-brand-soft)] p-8 rounded-2xl border border-[var(--color-brand)]/20 shadow-sm flex flex-col justify-center relative overflow-hidden">
          <div className="absolute -top-10 -right-10 text-[var(--color-brand)]/10">
            <FileText size={160} />
          </div>
          <h3 className="font-bold text-2xl font-display text-ink mb-4 relative z-10">Executive AI Summary</h3>
          <div className="space-y-4 relative z-10">
            <p className="text-ink/80 leading-relaxed font-medium bg-white/60 p-4 rounded-xl border border-white">
              {reportData.summaryParagraph1 || "AI Summary loading..."}
            </p>
            <p className="text-ink/80 leading-relaxed font-medium bg-white/60 p-4 rounded-xl border border-white">
              {reportData.summaryParagraph2 || "AI Summary loading..."}
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