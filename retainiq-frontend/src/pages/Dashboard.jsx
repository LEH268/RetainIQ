import { useState, useEffect, useCallback } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { useNavigate, Link } from "react-router-dom";
import { Bell, UserPlus, FileText, Activity, Loader2, X, AlertTriangle } from "lucide-react";
import RiskBadge from "../components/RiskBadge";
import api from "../lib/api";

export default function Dashboard() {
  const navigate = useNavigate();

  const [showNotifications, setShowNotifications] = useState(false);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: "", email: "", plan: "Free (ad-supported)" });
  const [addingCustomer, setAddingCustomer] = useState(false);
  const [addCustomerError, setAddCustomerError] = useState("");

  const fetchStats = useCallback(() => {
    return api.get("/api/dashboard/stats").then(res => {
      setStats(res.data);
    });
  }, []);

  useEffect(() => {
    fetchStats()
      .catch(err => console.error("Failed to fetch dashboard stats. Ensure backend is running.", err))
      .finally(() => setLoading(false));
  }, [fetchStats]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchStats();
    } catch (err) {
      console.error("Failed to refresh AI analysis:", err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    if (!newCustomer.name.trim() || !newCustomer.email.trim()) {
      setAddCustomerError("Name and email are required.");
      return;
    }
    setAddingCustomer(true);
    setAddCustomerError("");
    try {
      const res = await api.post("/api/customers", newCustomer);
      setShowAddCustomer(false);
      setNewCustomer({ name: "", email: "", plan: "Free (ad-supported)" });
      navigate(`/customers/${res.data.id}`);
    } catch (err) {
      setAddCustomerError("Failed to create customer. Check the backend logs.");
    } finally {
      setAddingCustomer(false);
    }
  };

  if (loading) {
    return <div className="flex h-screen items-center justify-center font-display text-lg text-ink/50"><Loader2 className="animate-spin mr-2"/> Loading AI Insights...</div>;
  }

  if (!stats) {
    return <div className="flex h-screen items-center justify-center font-display text-lg text-rose-500">Failed to load Dashboard data from Backend API.</div>;
  }

  const notifications = [
    stats.highRiskCount > 0 && {
      icon: AlertTriangle,
      tone: "text-rose-600",
      text: `${stats.highRiskCount} customers are currently High Risk`,
      to: "/customers?risk=High Risk",
    },
    stats.moderateCount > 0 && {
      icon: AlertTriangle,
      tone: "text-amber-600",
      text: `${stats.moderateCount} customers are Moderate Risk`,
      to: "/customers?risk=Moderate Risk",
    },
    { icon: FileText, tone: "text-[var(--color-brand)]", text: "Weekly AI report is ready to view", to: "/reports" },
  ].filter(Boolean);

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
            {notifications.length > 0 && (
              <span className="absolute top-1 right-1 h-3 w-3 bg-red-500 rounded-full border-2 border-white"></span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-2xl border border-[var(--color-border)] shadow-xl z-20 overflow-hidden">
              <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between">
                <p className="font-bold font-display">Notifications</p>
                <button onClick={() => setShowNotifications(false)} className="text-ink/40 hover:text-ink"><X size={16} /></button>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifications.map((n, i) => (
                  <Link
                    key={i}
                    to={n.to}
                    onClick={() => setShowNotifications(false)}
                    className="flex items-start gap-3 p-4 hover:bg-gray-50 border-b border-gray-50 last:border-0"
                  >
                    <n.icon size={18} className={`${n.tone} mt-0.5 shrink-0`} />
                    <p className="text-sm font-medium text-ink">{n.text}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => setShowAddCustomer(true)}
          className="flex items-center gap-2 bg-white border border-[var(--color-border)] px-4 py-2.5 rounded-xl text-sm font-bold hover:border-[var(--color-brand)] hover:text-[var(--color-brand)] transition-colors shadow-sm"
        >
          <UserPlus size={16} /> Add Customer
        </button>
        <button
          onClick={() => navigate("/reports")}
          className="flex items-center gap-2 bg-white border border-[var(--color-border)] px-4 py-2.5 rounded-xl text-sm font-bold hover:border-[var(--color-brand)] hover:text-[var(--color-brand)] transition-colors shadow-sm"
        >
          <FileText size={16} /> Generate Report
        </button>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 bg-white border border-[var(--color-border)] px-4 py-2.5 rounded-xl text-sm font-bold hover:border-[var(--color-brand)] hover:text-[var(--color-brand)] transition-colors shadow-sm disabled:opacity-60"
        >
          {refreshing ? <Loader2 size={16} className="animate-spin" /> : <Activity size={16} />}
          {refreshing ? "Refreshing..." : "Refresh AI Analysis"}
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

      {showAddCustomer && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold font-display">Add Customer</h2>
              <button onClick={() => setShowAddCustomer(false)} className="text-ink/40 hover:text-ink"><X size={18} /></button>
            </div>
            <form onSubmit={handleAddCustomer} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-bold mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  className="w-full rounded-xl border-2 border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[var(--color-brand)]"
                  placeholder="Jane Cooper"
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1.5">Email</label>
                <input
                  type="email"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                  className="w-full rounded-xl border-2 border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[var(--color-brand)]"
                  placeholder="jane@company.com"
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1.5">Plan</label>
                <select
                  value={newCustomer.plan}
                  onChange={(e) => setNewCustomer({ ...newCustomer, plan: e.target.value })}
                  className="w-full rounded-xl border-2 border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[var(--color-brand)]"
                >
                  <option>Free (ad-supported)</option>
                  <option>Premium (paid subscription)</option>
                </select>
              </div>
              {addCustomerError && <p className="text-sm font-bold text-rose-600">{addCustomerError}</p>}
              <div className="flex gap-3 mt-2">
                <button type="button" onClick={() => setShowAddCustomer(false)} className="flex-1 py-2.5 rounded-xl font-bold text-ink/70 hover:bg-gray-100">Cancel</button>
                <button type="submit" disabled={addingCustomer} className="flex-1 py-2.5 rounded-xl font-bold bg-[var(--color-brand)] text-white hover:bg-[var(--color-brand-dark)] disabled:opacity-60">
                  {addingCustomer ? "Adding..." : "Add Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}