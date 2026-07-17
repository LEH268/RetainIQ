import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";
import { Download, TrendingUp, Printer, Share2 } from "lucide-react";
import StatCard from "../components/StatCard";

const revenueImpactData = [
  { segment: "VIP", atRiskRevenue: 12000, savedRevenue: 8500 },
  { segment: "Loyal", atRiskRevenue: 24000, savedRevenue: 19000 },
  { segment: "At Risk", atRiskRevenue: 45000, savedRevenue: 12000 },
];

export default function Reports() {
  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[var(--color-border)] shadow-sm">
        <div>
          <h1 className="font-display text-3xl font-bold">AI Analytics Reports</h1>
          <p className="text-sm text-ink/60 mt-1 font-medium">Generate, print, and export executive summaries.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => window.print()} className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors"><Printer size={18}/></button>
          <button className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors"><Share2 size={18}/></button>
          <button className="flex items-center gap-2 rounded-xl bg-[var(--color-ink)] text-white px-5 py-2.5 text-sm font-bold hover:bg-opacity-90 shadow-sm">
            <Download size={16} /> Export PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <StatCard label="Total Revenue At Risk" value="$81,000" delta="+12%" deltaTone="down" />
        <StatCard label="Revenue Saved by AI" value="$39,500" delta="+24%" to="/reports" />
        <StatCard label="AI Prediction Accuracy" value="94.2%" delta="+1.1%" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-[var(--color-border)] shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="text-[var(--color-brand)]" />
            <h3 className="font-bold text-lg font-display">Revenue Risk & Recovery</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueImpactData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
              <XAxis dataKey="segment" stroke="#64748B" tickLine={false} axisLine={false} />
              <YAxis stroke="#64748B" tickLine={false} axisLine={false} tickFormatter={(val) => `$${val/1000}k`} />
              <Tooltip cursor={{ fill: 'var(--color-brand-soft)' }} />
              <Bar dataKey="atRiskRevenue" name="At Risk Revenue" fill="var(--color-risk-high)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="savedRevenue" name="Saved Revenue" fill="var(--color-brand)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-[var(--color-brand-soft)] p-8 rounded-2xl border border-[var(--color-brand)]/20 shadow-sm flex flex-col justify-center">
          <h3 className="font-bold text-2xl font-display text-ink mb-4">Executive AI Summary</h3>
          <p className="text-ink/80 leading-relaxed font-medium mb-4">
            RetainIQ's predictive models indicate a 12% rise in high-risk churn among the <strong>"At Risk"</strong> segment over the last 30 days. 
          </p>
          <p className="text-ink/80 leading-relaxed font-medium mb-6">
            The primary driver identified by Explainable AI is <em>"under-utilization of premium API features"</em>. Automated simulation strategies suggest offering free product training yields the highest ROI in retaining this revenue.
          </p>
          <button className="self-start px-6 py-2.5 bg-white text-[var(--color-brand)] font-bold rounded-xl shadow-sm border border-[var(--color-brand)]/30 hover:bg-[var(--color-brand)] hover:text-white transition-all">
            Generate Excel Report
          </button>
        </div>
      </div>
    </div>
  );
}