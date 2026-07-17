import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar } from "recharts";  
import { Link, useNavigate } from "react-router-dom";  
import { Bell, RefreshCw, ChevronRight } from "lucide-react";  
import StatCard from "../components/StatCard";  
import RiskBadge from "../components/RiskBadge";  
import { healthDistribution, churnTrend, engagementTrend, recentAlerts } from "../data/mockCustomers";  

export default function Dashboard() {      
  const navigate = useNavigate();      
  
  return (          
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-10">              
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-[var(--color-border)] shadow-sm">                  
        <div>                      
          <h1 className="font-display text-3xl font-bold">Welcome Back, John</h1>                      
          <p className="text-sm text-ink/60 mt-1 font-medium">Today's Customer Health Overview</p>                  
        </div>                  
        <div className="flex items-center gap-4">
          <button className="p-2.5 rounded-full hover:bg-gray-100 relative transition-colors">
            <Bell size={20} />
            <span className="absolute top-1 right-1 h-3 w-3 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
          <button className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-100 transition-colors">
            <RefreshCw size={16} /> Refresh AI
          </button>
          <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
            <div className="w-10 h-10 bg-[var(--color-brand)] text-white rounded-full flex items-center justify-center font-bold text-lg">J</div>
            <div className="hidden md:block">
              <p className="text-sm font-bold leading-tight">John Lee</p>
              <p className="text-xs text-ink/60 font-medium">Customer Manager</p>
            </div>
          </div>
        </div>
      </div>                     
      
      {/* Top Stat Cards matching PRD */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">                  
        <div className="bg-white p-5 rounded-2xl border border-[var(--color-border)] shadow-sm flex flex-col justify-between">
          <p className="text-sm font-bold text-ink/60">Total Customers</p>
          <p className="text-4xl font-display font-bold mt-2 mb-4">2,450</p>
          <Link to="/customers" className="text-sm font-bold text-[var(--color-brand)] hover:underline">View Customers</Link>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
          <p className="text-sm font-bold text-emerald-800">Healthy Customers</p>
          <div className="flex items-end gap-2 mt-2 mb-4">
            <p className="text-4xl font-display font-bold text-emerald-600">1,800</p>
            <p className="text-sm font-bold text-emerald-700 bg-emerald-100 px-2 py-1 rounded-lg">73%</p>
          </div>
          <Link to="/customers?risk=Healthy" className="text-sm font-bold text-emerald-700 hover:underline">View Healthy</Link>
        </div>
        <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
          <p className="text-sm font-bold text-amber-800">Moderate Risk</p>
          <p className="text-4xl font-display font-bold text-amber-600 mt-2 mb-4">438</p>
          <Link to="/customers?risk=Moderate Risk" className="text-sm font-bold text-amber-700 hover:underline">View Customers</Link>
        </div>
        <div className="bg-rose-50 border border-rose-200 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
          <p className="text-sm font-bold text-rose-800">High Risk</p>
          <p className="text-4xl font-display font-bold text-rose-600 mt-2 mb-4">212</p>
          <Link to="/customers?risk=High Risk" className="text-sm font-bold text-white bg-rose-600 px-3 py-1.5 rounded-lg text-center hover:bg-rose-700 transition-colors">Take Action</Link>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-[var(--color-border)] shadow-sm flex flex-col justify-between">
          <p className="text-sm font-bold text-ink/60">Monthly Revenue</p>
          <p className="text-3xl font-display font-bold mt-2 mb-4 text-ink">RM530,000</p>
          <Link to="/reports" className="text-sm font-bold text-[var(--color-brand)] hover:underline">Revenue Report</Link>
        </div>
      </div>              
      
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">                  
        <div className="rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-sm">                      
          <h3 className="mb-4 text-base font-bold font-display">Health Distribution</h3>                      
          <ResponsiveContainer width="100%" height={220}>                          
            <PieChart>                              
              <Pie data={healthDistribution} dataKey="value" nameKey="name" innerRadius={65} outerRadius={85} paddingAngle={4}>                                  
                {healthDistribution.map((entry, i) => <Cell key={i} fill={entry.color} stroke="transparent" />)}                              
              </Pie>                              
              <Tooltip />                          
            </PieChart>                      
          </ResponsiveContainer>                      
        </div>                                    
        <div className="rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-sm">                      
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base font-bold font-display">Monthly Churn Trend</h3>
            <span className="text-rose-600 font-bold bg-rose-50 px-2 py-1 rounded-md text-xs flex items-center">18% ↑2%</span>
          </div>                      
          <ResponsiveContainer width="100%" height={220}>                          
            <LineChart data={churnTrend}>                              
              <CartesianGrid strokeDasharray="3 3" vertical={false} />                              
              <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />                              
              <YAxis fontSize={12} unit="%" tickLine={false} axisLine={false} />                              
              <Tooltip cursor={{ stroke: 'var(--color-border)' }} />                              
              <Line type="monotone" dataKey="predicted" stroke="var(--color-risk-high)" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />                          
            </LineChart>                      
          </ResponsiveContainer>                  
        </div>
        <div className="rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-sm">                      
          <h3 className="mb-4 text-base font-bold font-display">Engagement Trend</h3>                      
          <ResponsiveContainer width="100%" height={220}>                          
            <BarChart data={engagementTrend}>                              
              <CartesianGrid strokeDasharray="3 3" vertical={false} />                              
              <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />                              
              <YAxis fontSize={12} tickLine={false} axisLine={false} />                              
              <Tooltip cursor={{ fill: 'var(--color-brand-soft)' }} />                              
              <Bar dataKey="value" fill="var(--color-brand)" radius={[4, 4, 0, 0]} barSize={30} />                          
            </BarChart>                      
          </ResponsiveContainer>                  
        </div>              
      </div>              
      
      <div className="rounded-2xl border border-[var(--color-border)] bg-white shadow-sm overflow-hidden flex flex-col">                      
        <div className="flex items-center justify-between p-6 border-b border-[var(--color-border)]">                          
          <h3 className="text-lg font-bold font-display">Recent Alerts</h3>                          
          <Link to="/tasks" className="text-sm font-bold text-[var(--color-brand)] hover:underline flex items-center">View All <ChevronRight size={16}/></Link>                      
        </div>                      
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 border-b border-[var(--color-border)]">
            <tr>
              <th className="px-6 py-4 font-bold text-ink/60 uppercase tracking-wider text-xs">Customer Name</th>
              <th className="px-6 py-4 font-bold text-ink/60 uppercase tracking-wider text-xs">Status</th>
              <th className="px-6 py-4 font-bold text-ink/60 uppercase tracking-wider text-xs">Alert Issue</th>
              <th className="px-6 py-4 font-bold text-ink/60 uppercase tracking-wider text-xs text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {recentAlerts.map((alert, i) => (
              <tr key={i} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-bold">{alert.customer}</td>
                <td className="px-6 py-4"><RiskBadge risk={alert.risk} /></td>
                <td className="px-6 py-4 font-medium text-ink/80">{alert.issue}</td>
                <td className="px-6 py-4 text-right">
                  <Link to={`/customers/CUS-1042`} className="inline-block px-4 py-2 bg-white border border-gray-300 rounded-lg text-xs font-bold hover:border-[var(--color-brand)] hover:text-[var(--color-brand)] transition-colors shadow-sm">View</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>          
    </div>      
  ); 
}