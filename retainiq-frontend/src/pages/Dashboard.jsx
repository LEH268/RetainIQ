import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar } from "recharts";
import { Link } from "react-router-dom";
import { Bell, ChevronRight, UserPlus, FileText, Download, Activity, Check, Loader2 } from "lucide-react";
import RiskBadge from "../components/RiskBadge";
import api from "../lib/api";

export default function Dashboard() {
  const [showNotifications, setShowNotifications] = useState(false);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/api/dashboard/stats").then(res => {
      setStats(res.data);
      setLoading(false);
    }).catch(err => {
      console.error("Failed to fetch dashboard stats. Ensure backend is running.", err);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div className="flex h-screen items-center justify-center font-display text-lg text-ink/50"><Loader2 className="animate-spin mr-2"/> Loading AI Insights...</div>;
  }

  if (!stats) {
    return <div className="flex h-screen items-center justify-center font-display text-lg text-rose-500">Failed to load Dashboard data from Backend API.</div>;
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-10">
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-[var(--color-border)] shadow-sm">
        <div>
          <h1 className="font-display text-3xl font-bold">Welcome Back</h1>
          <p className="text-sm text-ink/60 mt-1 font-medium">Today's Customer Health Overview</p>
        </div>
        <div className="flex items-center gap-4 relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2.5 rounded-full hover:bg-gray-100 relative transition-colors"
          >
            <Bell size={20} />
            <span className="absolute top-1 right-1 h-3 w-3 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button className="flex items-center gap-2 bg-white border border-[var(--color-border)] px-4 py-2.5 rounded-xl text-sm font-bold hover:border-[var(--color-brand)] hover:text-[var(--color-brand)] transition-colors shadow-sm">
          <UserPlus size={16} /> Add Customer
        </button>
        <button className="flex items-center gap-2 bg-white border border-[var(--color-border)] px-4 py-2.5 rounded-xl text-sm font-bold hover:border-[var(--color-brand)] hover:text-[var(--color-brand)] transition-colors shadow-sm">
          <FileText size={16} /> Generate Report
        </button>
        <button className="flex items-center gap-2 bg-white border border-[var(--color-border)] px-4 py-2.5 rounded-xl text-sm font-bold hover:border-[var(--color-brand)] hover:text-[var(--color-brand)] transition-colors shadow-sm">
          <Activity size={16} /> Refresh AI Analysis
        </button>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white p-5 rounded-2xl border border-[var(--color-border)] shadow-sm flex flex-col justify-between">
          <p className="text-sm font-bold text-ink/60">Total Customers</p>
          <p className="text-4xl font-display font-bold mt-2 mb-4">{stats.totalCustomers}</p>
          <Link to="/customers" className="text-sm font-bold text-[var(--color-brand)] hover:underline">View Customers</Link>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
          <p className="text-sm font-bold text-emerald-800">Healthy Customers</p>
          <div className="flex items-end gap-2 mt-2 mb-4">
            <p className="text-4xl font-display font-bold text-emerald-600">{stats.healthyCount}</p>
          </div>
          <Link to="/customers?risk=Healthy" className="text-sm font-bold text-emerald-700 hover:underline">View Healthy</Link>
        </div>
        <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
          <p className="text-sm font-bold text-amber-800">Moderate Risk</p>
          <p className="text-4xl font-display font-bold text-amber-600 mt-2 mb-4">{stats.moderateCount}</p>
          <Link to="/customers?risk=Moderate Risk" className="text-sm font-bold text-amber-700 hover:underline">View Customers</Link>
        </div>
        <div className="bg-rose-50 border border-rose-200 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
          <p className="text-sm font-bold text-rose-800">High Risk</p>
          <p className="text-4xl font-display font-bold text-rose-600 mt-2 mb-4">{stats.highRiskCount}</p>
          <Link to="/customers?risk=High Risk" className="text-sm font-bold text-white bg-rose-600 px-3 py-1.5 rounded-lg text-center hover:bg-rose-700 transition-colors">Take Action</Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-base font-bold font-display">Health Distribution AI</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={stats.healthDistribution} dataKey="value" nameKey="name" innerRadius={65} outerRadius={85} paddingAngle={4}>
                {stats.healthDistribution.map((entry, i) => <Cell key={i} fill={entry.color} stroke="transparent" />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-base font-bold font-display">AI Churn Trend Prediction</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={stats.churnTrend}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis fontSize={12} unit="%" tickLine={false} axisLine={false} />
              <Tooltip cursor={{ stroke: 'var(--color-border)' }} />
              <Line type="monotone" dataKey="predicted" stroke="var(--color-risk-high)" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}