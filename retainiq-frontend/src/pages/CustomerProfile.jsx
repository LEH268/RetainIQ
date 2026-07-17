import { useParams, Link } from "react-router-dom";
import { useState } from "react";
import { ArrowLeft, Zap, CheckCircle2, History, AlertTriangle } from "lucide-react";
import RiskBadge from "../components/RiskBadge";
import { customers } from "../data/mockCustomers";

export default function CustomerProfile() {
  const { id } = useParams();
  const customer = customers.find((c) => c.id === id) || customers[0]; // Fallback to Amy Tan for demo
  
  // Simulator State
  const [selectedActions, setSelectedActions] = useState([]);
  const [simulatedChurn, setSimulatedChurn] = useState(customer.churnProbability);

  const toggleAction = (actionName, dropValue) => {
    let newActions = [...selectedActions];
    if (newActions.includes(actionName)) {
      newActions = newActions.filter(a => a !== actionName);
    } else {
      newActions.push(actionName);
    }
    setSelectedActions(newActions);
    
    // Simulate drop
    let newRisk = customer.churnProbability;
    if (newActions.includes("Discount 20%")) newRisk -= 26;
    if (newActions.includes("Training")) newRisk -= 49;
    if (newActions.includes("Free Trial")) newRisk -= 15;
    if (newActions.includes("Customer Success Call")) newRisk -= 20;
    
    setSimulatedChurn(Math.max(5, newRisk)); // Floor at 5%
  };

  const handleApplyAction = () => {
    alert("Task Added to Task Center!");
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-10">
      <Link to="/customers" className="flex w-fit items-center gap-1.5 text-sm font-bold text-ink/60 hover:text-[var(--color-brand)] transition-colors">
        <ArrowLeft size={16} /> Back to Customers
      </Link>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[var(--color-border)] shadow-sm">
        <div>
          <h1 className="font-display text-3xl font-bold">{customer.name}</h1>
          <p className="text-sm text-ink/60 font-medium mt-1">{customer.company} • {customer.email}</p>
        </div>
        <div className="flex gap-4 items-center">
          <div className="text-right">
            <span className="text-sm font-bold bg-gray-100 px-3 py-1 rounded-lg text-gray-700 shadow-sm block mb-2">{customer.plan} Plan</span>
            <button className="text-xs font-bold text-[var(--color-brand)] hover:underline">Edit Customer</button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Column 1: Health & Predictions */}
        <div className="flex flex-col gap-6">
          <div className="bg-white p-6 rounded-2xl border border-[var(--color-border)] shadow-sm text-center">
            <h2 className="text-lg font-bold font-display mb-4">Health Score</h2>
            <div className="w-32 h-32 mx-auto rounded-full border-8 border-rose-500 flex items-center justify-center mb-4">
              <span className="text-4xl font-display font-bold text-rose-600">{customer.healthScore}</span>
            </div>
            <p className="text-sm font-bold text-rose-600 bg-rose-50 inline-block px-3 py-1 rounded-lg mb-4">Poor</p>
            <p className="text-xs font-bold text-ink/50">↓ Dropped 12 points</p>
            <button className="mt-4 w-full py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold hover:bg-gray-100">View Analysis</button>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[var(--color-border)] shadow-sm text-center">
            <h2 className="text-lg font-bold font-display mb-4">Churn Prediction</h2>
            <div className="w-full bg-gray-100 rounded-full h-4 mb-2 overflow-hidden">
              <div className="bg-rose-500 h-4 rounded-full" style={{ width: `${customer.churnProbability}%` }}></div>
            </div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-4xl font-display font-bold text-rose-600">{customer.churnProbability}%</span>
              <RiskBadge risk={customer.risk} />
            </div>
            <button className="mt-2 w-full py-2 bg-[var(--color-brand)] text-white rounded-lg text-sm font-bold hover:bg-[var(--color-brand-dark)]">Predict Again (AI)</button>
          </div>
        </div>

        {/* Column 2: Explainable AI & Activity */}
        <div className="flex flex-col gap-6">
          <div className="bg-white p-6 rounded-2xl border border-[var(--color-border)] shadow-sm">
            <h2 className="text-lg font-bold font-display mb-4 flex items-center gap-2"><Brain className="text-[var(--color-accent)]"/> Explainable AI Reason</h2>
            <ul className="space-y-4">
              {customer.churnAnalysis.map((reason, i) => (
                <li key={i} className="bg-rose-50 border border-rose-100 p-3 rounded-xl flex items-start gap-3">
                  <span className="text-rose-600 mt-0.5">↓</span>
                  <div>
                    <p className="text-sm font-bold text-rose-900">{reason}</p>
                    <button className="text-xs font-bold text-rose-600 hover:underline mt-1">More Detail</button>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[var(--color-border)] shadow-sm">
            <h2 className="text-lg font-bold font-display mb-4">Recent Activity</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-xs font-bold text-ink/50 uppercase">Last Login</p>
                <p className="text-lg font-bold mt-1">{customer.recentActivity.lastLogin}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-xs font-bold text-ink/50 uppercase">Sessions</p>
                <p className="text-lg font-bold mt-1">{customer.recentActivity.sessions}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl col-span-2">
                <p className="text-xs font-bold text-ink/50 uppercase">Feature Usage</p>
                <p className="text-lg font-bold mt-1 text-rose-600">{customer.recentActivity.featureUsage}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Column 3: Recommendations & Timeline & Simulator */}
        <div className="flex flex-col gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-[var(--color-brand-soft)] p-6 rounded-2xl border border-[var(--color-brand)]/20 shadow-sm">
            <h2 className="text-lg font-bold font-display mb-4 text-[var(--color-brand-dark)]">AI Recommendation</h2>
            <div className="bg-white p-4 rounded-xl shadow-sm mb-4">
              <p className="text-xl font-black">{customer.recommendation.action}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={handleApplyAction} className="flex-1 py-2 bg-[var(--color-brand)] text-white rounded-lg text-sm font-bold hover:bg-opacity-90">Apply</button>
              <button className="px-4 py-2 bg-white text-ink border border-gray-200 rounded-lg text-sm font-bold hover:bg-gray-50">Save</button>
              <button className="px-4 py-2 bg-white text-rose-600 border border-rose-200 rounded-lg text-sm font-bold hover:bg-rose-50">Ignore</button>
            </div>
          </div>

          {/* Dedicated Simulator from PRD */}
          <div className="bg-white p-6 rounded-2xl border border-[var(--color-border)] shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="text-amber-500" />
              <h2 className="text-lg font-bold font-display">AI Action Simulator</h2>
            </div>
            <p className="text-sm font-bold text-ink/60 mb-4 bg-gray-50 p-3 rounded-lg flex justify-between">
              Current Churn <span>{customer.churnProbability}%</span>
            </p>
            <div className="space-y-3 mb-6">
              <p className="text-xs font-bold text-ink/50 uppercase">Choose Action</p>
              {["Discount 20%", "Training", "Free Trial", "Customer Success Call"].map(action => (
                <label key={action} className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50">
                  <input type="checkbox" className="w-4 h-4 text-[var(--color-brand)] rounded" checked={selectedActions.includes(action)} onChange={() => toggleAction(action)} />
                  <span className="text-sm font-bold">{action}</span>
                </label>
              ))}
            </div>
            <div className="bg-[var(--color-ink)] text-white p-4 rounded-xl text-center">
              <p className="text-xs font-bold text-white/60 uppercase">Predicted Churn After Action</p>
              <p className="text-4xl font-black mt-2 font-display">{simulatedChurn}%</p>
              {simulatedChurn < 20 && <p className="text-xs font-bold text-emerald-400 mt-2">⭐ AI Recommended Combination</p>}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[var(--color-border)] shadow-sm">
            <h2 className="text-lg font-bold font-display mb-4 flex items-center gap-2"><History/> Customer Timeline</h2>
            <div className="space-y-4 border-l-2 border-gray-100 ml-3 pl-4 relative">
              {customer.timeline.map((t, i) => (
                <div key={i} className="relative">
                  <div className={`absolute -left-5.5 mt-1 w-3 h-3 rounded-full ${t.type === 'success' ? 'bg-emerald-500' : t.type === 'danger' ? 'bg-rose-500' : 'bg-amber-500'} ring-4 ring-white`}></div>
                  <p className="text-xs font-bold text-ink/50">{t.date}</p>
                  <p className="text-sm font-bold mt-0.5">{t.event}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}