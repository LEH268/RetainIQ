import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from "recharts";
import { Download, Calendar, BarChart2, TrendingUp, TrendingDown, FileText, Sparkles } from "lucide-react";
import api from "../lib/api";

export default function Analytics() {
  const [dateFrom, setDateFrom] = useState("2025-01-01");
  const [dateTo, setDateTo] = useState("2025-06-30");
  const [isComparing, setIsComparing] = useState(false);
  const [chartData, setChartData] = useState([]);
  const [exportFormat, setExportFormat] = useState("PDF");
  const [exportType, setExportType] = useState("All Reports");

  const is2024 = dateFrom.startsWith("2024");
  const revenueTrend = is2024 ? "+22.1%" : "+44.4%";
  const totalGrowth = is2024 ? "+8.3%" : "+16.6%";
  const avgChurn = "12.5%"; 

  useEffect(() => {
      api.get(`/api/analytics?timeframe=Monthly&compare=${isComparing}`).then(res => {
          setChartData(res.data);
      }).catch(console.error);
  }, [isComparing, dateFrom, dateTo]);

  const handleExport = () => {
    alert(`Exporting ${exportType} as ${exportFormat} from ${dateFrom} to ${dateTo}...`);
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-10">
      <div className="bg-white p-6 rounded-2xl border border-[var(--color-border)] shadow-sm">
        <h1 className="font-display text-3xl font-bold mb-6">Analytics & Reports</h1>
        
        <div className="flex flex-wrap gap-4 items-end bg-gray-50 p-4 rounded-xl border border-gray-200">
          <div>
            <label className="block text-xs font-bold text-ink/60 mb-1">From</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="px-3 py-2 rounded-lg border-2 border-gray-200 text-sm font-bold outline-none focus:border-[var(--color-brand)]" />
          </div>
          <div>
            <label className="block text-xs font-bold text-ink/60 mb-1">To</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="px-3 py-2 rounded-lg border-2 border-gray-200 text-sm font-bold outline-none focus:border-[var(--color-brand)]" />
          </div>
          <button onClick={() => setIsComparing(!isComparing)} className={`flex items-center gap-2 rounded-xl border-2 px-4 py-2.5 text-sm font-bold transition-all ${isComparing ? 'bg-[var(--color-brand-soft)] border-[var(--color-brand)] text-[var(--color-brand-dark)]' : 'bg-white border-[var(--color-border)] hover:border-[var(--color-brand)] hover:text-[var(--color-brand)]'}`}>
            <Calendar size={16} /> {isComparing ? "Comparing to Previous Period" : "Compare Previous"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
         <div className="bg-white p-5 rounded-2xl border border-[var(--color-border)] shadow-sm flex items-center justify-between">
           <div><p className="text-sm font-bold text-ink/60">Total Growth</p><p className="text-3xl font-display font-bold mt-1">{totalGrowth}</p></div>
           <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center"><TrendingUp size={24}/></div>
         </div>
         <div className="bg-white p-5 rounded-2xl border border-[var(--color-border)] shadow-sm flex items-center justify-between">
           <div><p className="text-sm font-bold text-ink/60">Revenue Trend</p><p className="text-3xl font-display font-bold mt-1">{revenueTrend}</p></div>
           <div className="w-12 h-12 rounded-full bg-blue-50 text-[var(--color-brand)] flex items-center justify-center"><BarChart2 size={24}/></div>
         </div>
         <div className="bg-white p-5 rounded-2xl border border-[var(--color-border)] shadow-sm flex items-center justify-between">
           <div><p className="text-sm font-bold text-ink/60">Avg. Churn Rate</p><p className="text-3xl font-display font-bold mt-1 text-rose-600">{avgChurn}</p></div>
           <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center"><TrendingDown size={24}/></div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-[var(--color-border)] shadow-sm">
          <h3 className="mb-6 text-lg font-bold font-display">Customer Growth {isComparing && "(Compare Mode)"}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-brand)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="var(--color-brand)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip cursor={{ stroke: 'var(--color-border)' }} />
              <Area type="monotone" name="Current Year" dataKey="users" stroke="var(--color-brand)" fillOpacity={1} fill="url(#colorUsers)" strokeWidth={3} />
              {isComparing && <Area type="monotone" name="Previous Year" dataKey="previousYearUsers" stroke="#94A3B8" fillOpacity={1} fill="#e2e8f0" strokeWidth={2} strokeDasharray="5 5" />}
            </AreaChart>
          </ResponsiveContainer>
        </div>
        
        <div className="bg-gradient-to-br from-blue-50 to-[var(--color-brand-soft)] p-8 rounded-2xl border border-[var(--color-brand)]/20 shadow-sm flex flex-col justify-center relative overflow-hidden">
          <h3 className="font-bold text-2xl font-display text-ink mb-4 relative z-10 flex items-center gap-2">
            <Sparkles className="text-[var(--color-brand)]"/> Executive AI Summary
          </h3>
          <div className="space-y-4 relative z-10">
            <p className="text-ink/80 leading-relaxed font-medium bg-white/60 p-4 rounded-xl border border-white">
              Overall revenue increased by 12% in the selected period. Premium subscriptions contributed 58% of the total revenue.
            </p>
            <p className="text-ink/80 leading-relaxed font-medium bg-white/60 p-4 rounded-xl border border-white">
              At Risk customers decreased by 5%. Recommended strategy is to expand the Premium campaign while increasing retention efforts for Basic users.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-[var(--color-border)] shadow-sm">
        <h3 className="mb-4 text-lg font-bold font-display">Export Reports</h3>
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs font-bold text-ink/60 mb-1">Format</label>
            <select value={exportFormat} onChange={e => setExportFormat(e.target.value)} className="px-4 py-2 rounded-lg border-2 border-gray-200 text-sm font-bold outline-none focus:border-[var(--color-brand)]">
              <option>PDF</option>
              <option>Excel</option>
              <option>CSV</option>
              <option>Word</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-ink/60 mb-1">Report Type</label>
            <select value={exportType} onChange={e => setExportType(e.target.value)} className="px-4 py-2 rounded-lg border-2 border-gray-200 text-sm font-bold outline-none focus:border-[var(--color-brand)]">
              <option>All Reports</option>
              <option>Revenue</option>
              <option>Customers</option>
              <option>Campaign</option>
              <option>Analytics</option>
              <option>Executive Summary</option>
            </select>
          </div>
          <button onClick={handleExport} className="flex items-center gap-2 rounded-xl bg-[var(--color-ink)] text-white px-6 py-2 text-sm font-bold shadow-sm hover:bg-opacity-90 transition-all">
            <Download size={16} /> Export
          </button>
        </div>
      </div>
    </div>
  );
}