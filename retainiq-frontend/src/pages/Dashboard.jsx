import { useState, useEffect, useCallback } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { useNavigate, Link } from "react-router-dom";
import { Bell, Activity, Loader2, X, AlertTriangle, Layers, Megaphone, Users, BarChart2, Settings, CheckCircle2, Sparkles } from "lucide-react";
import api from "../lib/api";

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [aiInsights, setAiInsights] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingAi, setLoadingAi] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get("/api/dashboard/stats");
      setStats(res.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load dashboard statistics.");
    } finally {
      setLoadingStats(false);
    }
  }, []);

  const fetchAiInsights = useCallback(async () => {
    try {
      setLoadingAi(true);
      const res = await api.get("/api/ai/generate-insights");
      setAiInsights(res.data.insights || []);
    } catch (err) {
      console.error("AI Insight generation failed:", err);
      setAiInsights(["AI is currently analyzing your data. Please check back later."]);
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
        <Loader2 className="animate-spin mr-2"/> Loading Dashboard Data...
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

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-10">
      
      {/* AI Business Insights */}
      <div className="bg-gradient-to-r from-[var(--color-brand-soft)] to-indigo-50 border border-[var(--color-brand)]/20 p-6 rounded-2xl shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-display font-bold text-[var(--color-brand-dark)] flex items-center gap-2">
            <Sparkles size={20} className="text-[var(--color-brand)]"/> AI Business Insights
          </h2>
          {loadingAi && <Loader2 size={16} className="animate-spin text-[var(--color-brand)]" />}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {loadingAi ? (
            <div className="col-span-2 flex items-center gap-2 text-sm text-ink/60 italic">
              Generating real-time insights based on your latest metrics...
            </div>
          ) : (
            aiInsights.map((insight, index) => (
              <div key={index} className="flex items-center gap-3 bg-white/60 p-3 rounded-xl shadow-sm">
                <CheckCircle2 className="text-[var(--color-brand)] shrink-0" size={20} />
                <span className="text-sm font-bold text-ink/80">{insight}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main KPI Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <Link 
          to="/customers" 
          className="bg-white p-5 rounded-2xl border border-[var(--color-border)] shadow-sm flex flex-col justify-between hover:shadow-md hover:border-gray-400 hover:-translate-y-1 transition-all cursor-pointer"
        >
          <p className="text-sm font-bold text-ink/60">Total Customers</p>
          <p className="text-4xl font-display font-bold mt-2 mb-4">{stats.totalCustomers}</p>
        </Link>
        <Link 
          to="/customers?status=Active" 
          className="bg-blue-50 border border-blue-200 p-5 rounded-2xl shadow-sm flex flex-col justify-between hover:shadow-md hover:border-blue-400 hover:-translate-y-1 transition-all cursor-pointer"
        >
          <p className="text-sm font-bold text-blue-800">Active Customers</p>
          <p className="text-4xl font-display font-bold text-blue-600 mt-2 mb-4">{stats.activeCustomers || 0}</p>
        </Link>
        <Link 
          to="/customers?status=Inactive" 
          className="bg-gray-50 border border-gray-200 p-5 rounded-2xl shadow-sm flex flex-col justify-between hover:shadow-md hover:border-gray-400 hover:-translate-y-1 transition-all cursor-pointer"
        >
          <p className="text-sm font-bold text-gray-800">Inactive Customers</p>
          <p className="text-4xl font-display font-bold text-gray-600 mt-2 mb-4">{stats.inactiveCustomers || 0}</p>
        </Link>
        <Link 
          to="/customers?health=excellent,good" 
          className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl shadow-sm flex flex-col justify-between hover:shadow-md hover:border-emerald-400 hover:-translate-y-1 transition-all cursor-pointer"
        >
          <p className="text-sm font-bold text-emerald-800">Healthy Customers</p>
          <p className="text-4xl font-display font-bold text-emerald-600 mt-2 mb-4">{stats.healthyCount}</p>
        </Link>
        <Link 
          to="/customers?health=fair" 
          className="bg-amber-50 border border-amber-200 p-5 rounded-2xl shadow-sm flex flex-col justify-between hover:shadow-md hover:border-amber-400 hover:-translate-y-1 transition-all cursor-pointer"
        >
          <p className="text-sm font-bold text-amber-800">Moderate Risk</p>
          <p className="text-4xl font-display font-bold text-amber-600 mt-2 mb-4">{stats.moderateCount}</p>
        </Link>
        <Link 
          to="/customers?health=poor" 
          className="bg-rose-50 border border-rose-200 p-5 rounded-2xl shadow-sm flex flex-col justify-between hover:shadow-md hover:border-rose-400 hover:-translate-y-1 transition-all cursor-pointer"
        >
          <p className="text-sm font-bold text-rose-800">High Risk</p>
          <p className="text-4xl font-display font-bold text-rose-600 mt-2 mb-4">{stats.highRiskCount}</p>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Health Distribution */}
        <div className="rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-sm col-span-1 lg:col-span-1">
          <h3 className="mb-6 text-lg font-bold font-display">Health Distribution</h3>
          <div className="flex flex-col items-center gap-6">
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
                <Tooltip formatter={(value, name, props) => [`${value} Users (${props.payload.percentage}%)`, name]} />
              </PieChart>
            </ResponsiveContainer>
            
            <div className="w-full space-y-3 mt-2">
              <h4 className="text-xs font-bold text-ink/50 uppercase border-b pb-2 mb-2">Health Score Breakdown</h4>
              
              {stats.healthDistribution.map((tier, index) => (
                <div key={index} className="flex justify-between items-center text-sm">
                  <span className="font-bold flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: tier.color }}></span>
                    {tier.name}
                  </span>
                  <span className="text-ink/80 font-bold flex gap-1.5 items-center">
                    {tier.value}
                    <span className="text-xs font-medium text-ink/50 bg-gray-100 px-1.5 py-0.5 rounded-md">
                      {tier.percentage}%
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Subscription Growth */}
        <div className="rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-sm col-span-1 lg:col-span-2">
          <h3 className="mb-4 text-lg font-bold font-display">Subscription Growth (YTD)</h3>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={stats.subscriptionGrowth}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
              <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip cursor={{ stroke: 'var(--color-border)' }} />
              <Line type="monotone" dataKey="new" name="New Subscribers" stroke="#10B981" strokeWidth={3} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="renewals" name="Renewals" stroke="#0284C7" strokeWidth={3} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="cancelled" name="Cancelled" stroke="#E11D48" strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Dashboard Quick Actions */}
      <div className="bg-white p-6 rounded-2xl border border-[var(--color-border)] shadow-sm">
        <h3 className="mb-6 text-lg font-bold font-display">Dashboard Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Link to="/customers" className="flex flex-col items-center justify-center p-4 bg-gray-50 border border-gray-100 rounded-xl hover:bg-[var(--color-brand-soft)] hover:border-[var(--color-brand)] transition-colors group">
            <Users size={24} className="text-gray-400 group-hover:text-[var(--color-brand)] mb-2"/>
            <span className="font-bold text-sm">Customers</span>
            <span className="text-xs text-ink/50">View all</span>
          </Link>
          <Link to="/analytics" className="flex flex-col items-center justify-center p-4 bg-gray-50 border border-gray-100 rounded-xl hover:bg-[var(--color-brand-soft)] hover:border-[var(--color-brand)] transition-colors group">
            <BarChart2 size={24} className="text-gray-400 group-hover:text-[var(--color-brand)] mb-2"/>
            <span className="font-bold text-sm">Analytics</span>
            <span className="text-xs text-ink/50">View details</span>
          </Link>
          <Link to="/segmentation" className="flex flex-col items-center justify-center p-4 bg-gray-50 border border-gray-100 rounded-xl hover:bg-[var(--color-brand-soft)] hover:border-[var(--color-brand)] transition-colors group">
            <Layers size={24} className="text-gray-400 group-hover:text-[var(--color-brand)] mb-2"/>
            <span className="font-bold text-sm">Segmentation</span>
            <span className="text-xs text-ink/50">Manage AI</span>
          </Link>
          <Link to="/campaigns" className="flex flex-col items-center justify-center p-4 bg-gray-50 border border-gray-100 rounded-xl hover:bg-[var(--color-brand-soft)] hover:border-[var(--color-brand)] transition-colors group">
            <Megaphone size={24} className="text-gray-400 group-hover:text-[var(--color-brand)] mb-2"/>
            <span className="font-bold text-sm">Campaigns</span>
            <span className="text-xs text-ink/50">Launch</span>
          </Link>
          <Link to="/settings" className="flex flex-col items-center justify-center p-4 bg-gray-50 border border-gray-100 rounded-xl hover:bg-[var(--color-brand-soft)] hover:border-[var(--color-brand)] transition-colors group">
            <Settings size={24} className="text-gray-400 group-hover:text-[var(--color-brand)] mb-2"/>
            <span className="font-bold text-sm">Settings</span>
            <span className="text-xs text-ink/50">Manage System</span>
          </Link>
        </div>
      </div>
    </div>
  );
}