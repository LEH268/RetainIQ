import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, AreaChart, Area } from "recharts";
import { Download } from "lucide-react";

const growthData = [
  { month: "Jan", users: 2100 }, { month: "Feb", users: 2150 }, { month: "Mar", users: 2280 },
  { month: "Apr", users: 2340 }, { month: "May", users: 2400 }, { month: "Jun", users: 2450 }
];

export default function Analytics() {
  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-10">
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-[var(--color-border)] shadow-sm">
        <div>
          <h1 className="font-display text-3xl font-bold">Deep Analytics</h1>
          <p className="text-sm text-ink/60 mt-1 font-medium">Customer Growth, Churn, and Retention metrics.</p>
        </div>
        <button className="flex items-center gap-2 rounded-xl bg-white border-2 border-[var(--color-border)] px-5 py-2.5 text-sm font-bold hover:border-[var(--color-brand)] hover:text-[var(--color-brand)] transition-all">
          <Download size={16} /> Export PNG
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-[var(--color-border)] shadow-sm">
          <h3 className="mb-6 text-lg font-bold font-display">Customer Growth Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={growthData}>
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
              <Area type="monotone" dataKey="users" stroke="var(--color-brand)" fillOpacity={1} fill="url(#colorUsers)" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-[var(--color-border)] shadow-sm">
          <h3 className="mb-6 text-lg font-bold font-display">Top Churn Reasons (AI Identified)</h3>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-sm font-bold mb-2"><span>Under-utilized features</span><span>45%</span></div>
              <div className="w-full bg-gray-100 rounded-full h-2.5"><div className="bg-rose-500 h-2.5 rounded-full" style={{width: '45%'}}></div></div>
            </div>
            <div>
              <div className="flex justify-between text-sm font-bold mb-2"><span>Pricing sensitivity</span><span>28%</span></div>
              <div className="w-full bg-gray-100 rounded-full h-2.5"><div className="bg-amber-500 h-2.5 rounded-full" style={{width: '28%'}}></div></div>
            </div>
            <div>
              <div className="flex justify-between text-sm font-bold mb-2"><span>Poor onboarding</span><span>15%</span></div>
              <div className="w-full bg-gray-100 rounded-full h-2.5"><div className="bg-amber-400 h-2.5 rounded-full" style={{width: '15%'}}></div></div>
            </div>
            <div>
              <div className="flex justify-between text-sm font-bold mb-2"><span>Support delays</span><span>12%</span></div>
              <div className="w-full bg-gray-100 rounded-full h-2.5"><div className="bg-[var(--color-brand)] h-2.5 rounded-full" style={{width: '12%'}}></div></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}