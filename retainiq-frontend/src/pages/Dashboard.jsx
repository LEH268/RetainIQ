import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar } from "recharts";
import StatCard from "../components/StatCard";
import RiskBadge from "../components/RiskBadge";
import { healthDistribution, churnTrend, segments, customers } from "../data/mockCustomers";

export default function Dashboard() {
  const highRisk = customers.filter((c) => c.risk === "High Risk");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-ink/60">Customer health and churn risk, at a glance.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Customers" value="317" delta="+4.2%" />
        <StatCard label="High-Risk Customers" value={highRisk.length} delta="+2" deltaTone="down" />
        <StatCard label="Avg. Health Score" value="71" delta="+1.8%" />
        <StatCard label="Subscription Growth" value="12.4%" delta="+0.6%" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] p-5 lg:col-span-1">
          <h3 className="mb-4 text-sm font-medium">Customer Health Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={healthDistribution} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                {healthDistribution.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 flex justify-center gap-4 text-xs text-ink/60">
            {healthDistribution.map((d) => (
              <span key={d.name} className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ background: d.color }} />
                {d.name}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] p-5 lg:col-span-2">
          <h3 className="mb-4 text-sm font-medium">Churn Prediction Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={churnTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="month" stroke="#94a3a0" fontSize={12} />
              <YAxis stroke="#94a3a0" fontSize={12} unit="%" />
              <Tooltip />
              <Line type="monotone" dataKey="predicted" stroke="var(--color-brand)" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] p-5 lg:col-span-1">
          <h3 className="mb-4 text-sm font-medium">Customer Segmentation</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={segments}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="name" stroke="#94a3a0" fontSize={11} />
              <YAxis stroke="#94a3a0" fontSize={12} />
              <Tooltip />
              <Bar dataKey="value" fill="var(--color-brand)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] p-5 lg:col-span-2">
          <h3 className="mb-4 text-sm font-medium">Recent AI Alerts</h3>
          <ul className="flex flex-col divide-y divide-[var(--color-border)]">
            {highRisk.map((c) => (
              <li key={c.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium">{c.name}</p>
                  <p className="text-xs text-ink/60">{c.company} · {c.churnProbability}% churn probability</p>
                </div>
                <RiskBadge risk={c.risk} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
