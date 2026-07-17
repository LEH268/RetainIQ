import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar } from "recharts"; 
import { Link, useNavigate } from "react-router-dom"; 
import { Download, Sparkles } from "lucide-react"; 
import StatCard from "../components/StatCard"; 
import RiskBadge from "../components/RiskBadge"; 
import { healthDistribution, churnTrend, segments, customers } from "../data/mockCustomers"; 
import { downloadCSV } from "../utils/exportCsv";

export default function Dashboard() {   
  const navigate = useNavigate();   
  const highRisk = customers.filter((c) => c.risk === "High Risk");   
  const totalCustomers = healthDistribution.reduce((acc, curr) => acc + curr.value, 0);   

  const handleExport = () => {     
    // Format data for business executive report export
    const reportData = customers.map(c => ({
      ID: c.id,
      Name: c.name,
      Company: c.company,
      Plan: c.plan,
      HealthScore: c.healthScore,
      ChurnProbability: `${c.churnProbability}%`,
      Risk: c.risk,
      Segment: c.segment
    }));
    downloadCSV(reportData, "retainiq-executive-report.csv");
  };   

  return (     
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">       
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-[var(--color-border)] shadow-sm">         
        <div>           
          <h1 className="font-display text-3xl font-bold bg-gradient-to-r from-[var(--color-brand)] to-[var(--color-accent)] bg-clip-text text-transparent">AI Executive Dashboard</h1>           
          <p className="text-sm text-ink/60 mt-1 font-medium">Global view of customer health, segmentation, and predictive metrics.</p>         
        </div>         
        <button onClick={handleExport} className="flex items-center gap-2 rounded-xl bg-white border-2 border-[var(--color-border)] px-5 py-2.5 text-sm font-semibold hover:border-[var(--color-brand)] hover:text-[var(--color-brand)] transition-all shadow-sm">           
          <Download size={16} />           
          Export Report         
        </button>       
      </div>       
      
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">         
        <StatCard label="Total Active Customers" value={totalCustomers.toLocaleString()} delta="+4.2%" to="/customers?status=Active" />         
        <StatCard label="High-Risk Customers" value={highRisk.length} delta="+12" deltaTone="down" to="/customers?risk=High Risk" />         
        <StatCard label="Avg. Health Score" value="71" delta="+1.8%" />         
        <StatCard label="Predicted Churn Rate" value="6.8%" delta="-0.5%" />       
      </div>       

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">         
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] p-6 shadow-sm lg:col-span-1">           
          <h3 className="mb-4 text-base font-bold font-display">Customer Health Distribution</h3>           
          <ResponsiveContainer width="100%" height={220}>             
            <PieChart>               
              <Pie data={healthDistribution} dataKey="value" nameKey="name" innerRadius={65} outerRadius={85} paddingAngle={4}>                 
                {healthDistribution.map((entry, i) => (                   
                  <Cell key={i} fill={entry.color} stroke="transparent" />                 
                ))}               
              </Pie>               
              <Tooltip formatter={(value) => [`${value} Customers`, 'Count']} />             
            </PieChart>           
          </ResponsiveContainer>           
          <div className="mt-4 flex flex-col gap-3 text-sm text-ink/80">             
            {healthDistribution.map((d) => (               
              <div key={d.name} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors">                 
                <span className="flex items-center gap-2 font-medium">                   
                  <span className="h-3 w-3 rounded-full shadow-sm" style={{ background: d.color }} />                   
                  {d.name}                 
                </span>                 
                <div className="text-right">                   
                  <span className="font-bold text-ink mr-2">{d.value}</span>                   
                  <span className="text-xs text-ink/50 font-semibold bg-gray-100 px-2 py-1 rounded-md">                     
                    {Math.round((d.value / totalCustomers) * 100)}%                   
                  </span>                 
                </div>               
              </div>             
            ))}           
          </div>         
        </div>                  
        
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] p-6 shadow-sm lg:col-span-2">           
          <h3 className="mb-4 text-base font-bold font-display">Global Churn Prediction Trend</h3>           
          <ResponsiveContainer width="100%" height={280}>             
            <LineChart data={churnTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>               
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />               
              <XAxis dataKey="month" stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} dy={10} />               
              <YAxis stroke="#94A3B8" fontSize={12} unit="%" tickLine={false} axisLine={false} />               
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} cursor={{ stroke: 'var(--color-border)', strokeWidth: 2 }} />               
              <Line type="monotone" dataKey="predicted" stroke="url(#colorBrand)" strokeWidth={4} dot={{ r: 5, fill: 'var(--color-brand)', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} />               
              <defs>                 
                <linearGradient id="colorBrand" x1="0" y1="0" x2="1" y2="0">                   
                  <stop offset="0%" stopColor="var(--color-brand)" />                   
                  <stop offset="100%" stopColor="var(--color-accent)" />                 
                </linearGradient>               
              </defs>             
            </LineChart>           
          </ResponsiveContainer>         
        </div>       
      </div>       

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">         
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] p-6 shadow-sm lg:col-span-1">           
          <div className="flex justify-between items-start mb-6">             
            <div>               
              <h3 className="text-base font-bold font-display">Segmentation</h3>               
              <p className="text-xs text-ink/60 mt-1 font-medium">Click a bar to view list.</p>             
            </div>             
            <Sparkles size={18} className="text-[var(--color-accent)]" />           
          </div>           
          <ResponsiveContainer width="100%" height={240}>             
            <BarChart data={segments} layout="vertical" margin={{ left: 10 }}>               
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />               
              <XAxis type="number" hide />               
              <YAxis dataKey="name" type="category" stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} width={70} />               
              <Tooltip cursor={{ fill: 'var(--color-brand-soft)' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 4px rgb(0 0 0 / 0.1)' }} />               
              <Bar dataKey="value" fill="var(--color-brand)" radius={[0, 6, 6, 0]} barSize={24} cursor="pointer" onClick={(data) => navigate(`/customers?segment=${data.name}`)}>                 
                {segments.map((entry, index) => (                   
                  <Cell key={`cell-${index}`} fill={entry.name === 'VIP' ? 'var(--color-accent)' : 'var(--color-brand)'} />                 
                ))}               
              </Bar>             
            </BarChart>           
          </ResponsiveContainer>         
        </div>         

        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] p-6 shadow-sm lg:col-span-2 flex flex-col">           
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-[var(--color-border)]">             
            <h3 className="text-base font-bold font-display">High-Risk Priority Actions</h3>             
            <Link to="/customers?risk=High Risk" className="text-xs font-bold text-[var(--color-brand)] bg-[var(--color-brand-soft)] px-3 py-1.5 rounded-lg hover:bg-[var(--color-brand)] hover:text-white transition-colors">               
              View All High-Risk             
            </Link>           
          </div>           
          <div className="flex-1 overflow-y-auto pr-2">             
            {highRisk.length > 0 ? (               
              <ul className="flex flex-col gap-3">                 
                {highRisk.map((c) => (                   
                  <li key={c.id} className="flex items-center justify-between p-4 bg-gray-50/50 border border-gray-100 rounded-xl hover:border-[var(--color-brand)]/30 hover:bg-white transition-all group">                     
                    <div className="flex flex-col gap-1">                       
                      <Link to={`/customers/${c.id}`} className="text-sm font-bold text-ink group-hover:text-[var(--color-brand)] transition-colors">{c.name}</Link>                       
                      <p className="text-xs font-medium text-ink/60">{c.company} • Churn Prob: <span className="text-[var(--color-risk-high)] font-bold">{c.churnProbability}%</span></p>                     
                    </div>                     
                    <Link to={`/customers/${c.id}`} className="px-4 py-2 text-xs font-bold bg-white border-2 border-[var(--color-brand)] text-[var(--color-brand)] rounded-xl hover:bg-[var(--color-brand)] hover:text-white transition-all shadow-sm">                       
                      Review AI Action                     
                    </Link>                   
                  </li>                 
                ))}               
              </ul>             
            ) : (               
              <p className="py-10 text-center text-sm font-medium text-ink/50 flex flex-col items-center gap-3">                 
                <span className="text-4xl">🎉</span>                 
                No high-risk customers right now.               
              </p>             
            )}           
          </div>         
        </div>       
      </div>     
    </div>   
  ); 
}