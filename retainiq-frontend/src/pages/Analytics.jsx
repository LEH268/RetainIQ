import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, AreaChart, Area, BarChart, Bar, Legend } from "recharts";
import { Download, Calendar, BarChart2, TrendingUp, TrendingDown } from "lucide-react";
import api from "../lib/api";

export default function Analytics() {
  const [timeframe, setTimeframe] = useState("Monthly");
  const [isComparing, setIsComparing] = useState(false);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
      api.get(`/api/analytics?timeframe=${timeframe}&compare=${isComparing}`).then(res => {
          setChartData(res.data);
      }).catch(console.error);
  }, [timeframe, isComparing]);

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[var(--color-border)] shadow-sm">
        <div>
          <h1 className="font-display text-3xl font-bold">Deep Analytics</h1>
          <p className="text-sm text-ink/60 mt-1 font-medium">Customer Growth, Churn, and Revenue metrics.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200">
            {["Daily", "Weekly", "Monthly", "Yearly"].map(tf => (
              <button 
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${timeframe === tf ? 'bg-white shadow-sm text-ink' : 'text-ink/50 hover:text-ink'}`}
              >
                {tf}
              </button>
            ))}
          </div>
          
          <button 
            onClick={() => setIsComparing(!isComparing)}
            className={`flex items-center gap-2 rounded-xl border-2 px-4 py-1.5 text-sm font-bold transition-all ${isComparing ? 'bg-[var(--color-brand-soft)] border-[var(--color-brand)] text-[var(--color-brand-dark)]' : 'bg-white border-[var(--color-border)] hover:border-[var(--color-brand)] hover:text-[var(--color-brand)]'}`}
          >
            <Calendar size={16} />
            {isComparing ? "Comparing: 2025 vs 2026" : "Compare (2025 vs 2026)"}
          </button>
          
          <button className="flex items-center gap-2 rounded-xl bg-[var(--color-ink)] text-white px-4 py-2 text-sm font-bold shadow-sm hover:bg-opacity-90 transition-all">
            <Download size={16} /> Export
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
         <div className="bg-white p-5 rounded-2xl border border-[var(--color-border)] shadow-sm flex items-center justify-between">
           <div><p className="text-sm font-bold text-ink/60">Total Growth</p><p className="text-3xl font-display font-bold mt-1">+16.6%</p></div>
           <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center"><TrendingUp size={24}/></div>
         </div>
         <div className="bg-white p-5 rounded-2xl border border-[var(--color-border)] shadow-sm flex items-center justify-between">
           <div><p className="text-sm font-bold text-ink/60">Revenue Trend</p><p className="text-3xl font-display font-bold mt-1">+44.4%</p></div>
           <div className="w-12 h-12 rounded-full bg-blue-50 text-[var(--color-brand)] flex items-center justify-center"><BarChart2 size={24}/></div>
         </div>
         <div className="bg-white p-5 rounded-2xl border border-[var(--color-border)] shadow-sm flex items-center justify-between">
           <div><p className="text-sm font-bold text-ink/60">Avg. Churn Rate</p><p className="text-3xl font-display font-bold mt-1 text-rose-600">15.5%</p></div>
           <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center"><TrendingDown size={24}/></div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-[var(--color-border)] shadow-sm">
          <h3 className="mb-6 text-lg font-bold font-display">Customer Growth ({timeframe})</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-brand)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="var(--color-brand)" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorPrevUsers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#94A3B8" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#94A3B8" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip cursor={{ stroke: 'var(--color-border)' }} />
              
              <Area type="monotone" name="Current Year" dataKey="users" stroke="var(--color-brand)" fillOpacity={1} fill="url(#colorUsers)" strokeWidth={3} />
              
              {isComparing && (
                <Area type="monotone" name="Previous Year" dataKey="previousYearUsers" stroke="#94A3B8" fillOpacity={1} fill="url(#colorPrevUsers)" strokeWidth={2} strokeDasharray="5 5" />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border border-[var(--color-border)] shadow-sm">
          <h3 className="mb-6 text-lg font-bold font-display">Revenue Trend ({timeframe})</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `RM${val/1000}k`} />
              <Tooltip cursor={{ fill: 'var(--color-brand-soft)' }} />
              <Bar dataKey="revenue" name="Revenue" fill="var(--color-brand)" radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}