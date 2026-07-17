import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Brain, Zap, Target, AlertTriangle, ShieldCheck, Activity } from "lucide-react";
import RiskBadge from "../components/RiskBadge";
import { customers } from "../data/mockCustomers";

export default function CustomerProfile() {
  const { id } = useParams();
  const customer = customers.find((c) => c.id === id);

  if (!customer) {
    return (
      <div className="max-w-7xl mx-auto">
        <Link to="/customers" className="text-sm font-bold text-[var(--color-brand)] hover:underline">← Back to customers</Link>
        <p className="mt-4 text-ink/60 font-medium">Customer not found.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-10">
      <Link to="/customers" className="flex w-fit items-center gap-1.5 text-sm font-bold text-ink/60 hover:text-[var(--color-brand)] transition-colors">
        <ArrowLeft size={16} /> Back to Directory
      </Link>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[var(--color-border)] shadow-sm">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="font-display text-3xl font-bold">{customer.name}</h1>
            <span className={`px-2.5 py-1 text-xs font-bold rounded-md border shadow-sm ${
                customer.status === 'Active' ? 'bg-green-50 text-green-700 border-green-200' :
                customer.status === 'New' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                'bg-gray-100 text-gray-600 border-gray-200'
              }`}>
                {customer.status} Status
            </span>
          </div>
          <p className="text-sm text-ink/60 font-medium">{customer.company} • <span className="font-bold text-ink">{customer.plan} Plan</span></p>
        </div>
        <div className="flex flex-col items-start md:items-end gap-2">
          <RiskBadge risk={customer.risk} />
          <span className="text-sm font-bold bg-gray-100 px-3 py-1 rounded-lg text-gray-700 border border-gray-200 shadow-sm">Segment: {customer.segment}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* 1. Customer Health Score Calculation */}
        <div className="rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg text-[var(--color-brand)]">
                <Activity size={24} />
              </div>
              <h2 className="text-lg font-bold font-display">Health Calculation</h2>
            </div>
            <div className="text-right">
              <p className="text-4xl font-bold font-display leading-none">{customer.healthScore}<span className="text-xl text-ink/40">/100</span></p>
            </div>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-100 text-left text-xs uppercase tracking-wider text-ink/50 font-bold">
                <th className="py-3">Indicator</th>
                <th className="py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {customer.indicators.map((ind, i) => (
                <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                  <td className="py-4 font-semibold text-ink">{ind.name}</td>
                  <td className="py-4 text-right">
                    <span className={`px-3 py-1.5 rounded-lg text-xs font-bold border shadow-sm ${
                      ind.status === 'danger' ? 'bg-red-50 text-red-700 border-red-100' :
                      ind.status === 'warning' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' : 'bg-green-50 text-green-700 border-green-100'
                    }`}>
                      {ind.value}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 2. AI Churn Prediction */}
        <div className="rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-50 rounded-lg text-[var(--color-risk-high)]">
                <AlertTriangle size={24} />
              </div>
              <h2 className="text-lg font-bold font-display">Churn Prediction</h2>
            </div>
            <div className="text-right">
              <p className="text-4xl font-bold font-display leading-none text-[var(--color-risk-high)]">{customer.churnProbability}%</p>
            </div>
          </div>
          <p className="text-sm font-bold text-ink/80 mb-3 bg-gray-50 p-2 rounded-lg inline-block">AI Raw Analysis:</p>
          <ul className="list-disc pl-6 space-y-2 text-sm font-medium text-ink/70">
            {customer.churnAnalysis.map((analysis, i) => (
              <li key={i}>{analysis}</li>
            ))}
          </ul>
          {customer.churnProbability > 50 && (
             <div className="mt-6 bg-rose-50 border-2 border-rose-100 rounded-xl p-4 flex items-start gap-3 shadow-sm">
               <span className="text-rose-500 text-xl mt-0.5">🔴</span>
               <p className="text-sm text-rose-900 font-medium leading-relaxed"><span className="font-bold">High Risk Alert:</span> Take preventive action before {customer.name.split(' ')[0]} cancels their subscription.</p>
             </div>
          )}
        </div>

        {/* 3. Explainable AI Insight */}
        <div className="rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-sm lg:col-span-1">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-50 rounded-lg text-[var(--color-accent)]">
              <Brain size={24} />
            </div>
            <h2 className="text-lg font-bold font-display">Explainable AI Insights</h2>
          </div>
          <p className="text-sm font-medium text-ink/60 mb-5">Natural language explanation of the predictive model:</p>
          <ul className="space-y-3">
            {customer.insights.map((insight, i) => (
              <li key={i} className="flex items-start gap-3 text-sm font-semibold text-ink/80 bg-gray-50 p-3.5 rounded-xl border border-gray-100 shadow-sm">
                <span className="text-[var(--color-accent)] font-bold mt-0.5"><Sparkles size={16}/></span> 
                {insight}
              </li>
            ))}
          </ul>
        </div>

        {/* 4. Personalized Recommendation Engine */}
        <div className="rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-sm lg:col-span-1 flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-50 rounded-lg text-[var(--color-brand)]">
              <Target size={24} />
            </div>
            <h2 className="text-lg font-bold font-display">Personalized Action Plan</h2>
          </div>
          <div className="mb-5">
            <p className="text-xs font-bold uppercase tracking-wider text-ink/50 mb-2">Triggers Detected</p>
            <div className="flex flex-wrap gap-2">
              {customer.aiDetection.map((det, i) => (
                <span key={i} className="bg-blue-50 text-blue-800 text-xs font-bold px-3 py-1.5 rounded-lg border border-blue-100">{det}</span>
              ))}
            </div>
          </div>
          <div className="mt-auto bg-gradient-to-br from-[var(--color-brand-soft)] to-blue-50 border-2 border-[var(--color-brand)]/20 rounded-xl p-5 shadow-inner">
            <p className="text-xs uppercase tracking-wide text-[var(--color-brand)] font-black mb-1 flex items-center gap-1"><Zap size={14}/> Recommended Step</p>
            <p className="text-xl font-bold text-ink mt-2 mb-2 leading-tight">{customer.recommendation.action}</p>
            <p className="text-sm font-medium text-ink/70">{customer.recommendation.reason}</p>
          </div>
        </div>

        {/* 6. AI Action Simulator */}
        <div className="rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-50 rounded-lg text-[var(--color-risk-mid)]">
                <Zap size={24} />
              </div>
              <h2 className="text-lg font-bold font-display">Retention Simulator</h2>
            </div>
          </div>
          <p className="text-sm font-medium text-ink/60 mb-6 bg-gray-50 p-3 rounded-lg">Evaluate different strategies to see their predicted impact on churn risk before taking action.</p>
          
          <div className="overflow-hidden rounded-xl border-2 border-[var(--color-border)] shadow-sm">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 border-b-2 border-[var(--color-border)]">
                <tr>
                  <th className="px-6 py-4 font-bold text-ink/60 uppercase tracking-wider text-xs">Simulated Action</th>
                  <th className="px-6 py-4 font-bold text-ink/60 uppercase tracking-wider text-xs w-48 text-right">Predicted Risk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {customer.simulations.map((sim, i) => (
                  <tr key={i} className={`transition-colors ${sim.action === customer.bestSimulation ? "bg-emerald-50/50" : "hover:bg-gray-50"}`}>
                    <td className="px-6 py-4 font-bold text-ink text-base">
                      {sim.action}
                      {sim.action === customer.bestSimulation && (
                        <span className="ml-3 inline-flex items-center gap-1.5 rounded-lg bg-emerald-100 border border-emerald-200 px-2.5 py-1 text-xs font-black text-emerald-800 shadow-sm">
                          <ShieldCheck size={14}/> Best ROI
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`font-black text-lg px-3 py-1 rounded-lg ${
                        sim.predictedChurn > 70 ? 'bg-red-50 text-[var(--color-risk-high)]' : 
                        sim.predictedChurn > 40 ? 'bg-yellow-50 text-[var(--color-risk-mid)]' : 'bg-green-50 text-[var(--color-risk-low)]'
                      }`}>
                        {sim.predictedChurn}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}