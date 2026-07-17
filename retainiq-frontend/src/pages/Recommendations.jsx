import { Target, ArrowRight, Settings2 } from "lucide-react";

const recList = [
  { customer: "Amy Tan", risk: "High Risk", rec: "20% Discount", success: "82%", priority: "High", difficulty: "Easy" },
  { customer: "Tech Corp", risk: "Moderate", rec: "Free Product Training", success: "65%", priority: "Medium", difficulty: "Moderate" },
  { customer: "John Lee", risk: "Healthy", rec: "Enterprise Upsell", success: "45%", priority: "Low", difficulty: "Hard" }
];

export default function Recommendations() {
  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-10">
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-[var(--color-border)] shadow-sm">
        <div>
          <h1 className="font-display text-3xl font-bold">AI Recommendation Center</h1>
          <p className="text-sm text-ink/60 mt-1 font-medium">Review and apply AI-generated retention strategies[cite: 5].</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {recList.map((rec, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-[var(--color-border)] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:shadow-md transition-shadow">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-bold text-lg">{rec.customer}</h3>
                <span className={`text-xs font-bold px-2 py-1 rounded-md ${rec.risk === 'High Risk' ? 'bg-rose-50 text-rose-700' : 'bg-gray-100 text-gray-700'}`}>{rec.risk}</span>
              </div>
              <div className="flex items-center gap-2 mt-4 bg-gray-50 px-4 py-3 rounded-xl border border-gray-200">
                <Target className="text-[var(--color-brand)]" size={20}/>
                <p className="font-black text-[var(--color-brand-dark)] text-lg">{rec.rec}</p>
                <ArrowRight className="text-ink/30 mx-2" size={16}/>
                <div>
                  <p className="text-xs font-bold text-ink/50 uppercase">Expected Success</p>
                  <p className="font-black text-emerald-600 text-lg">{rec.success}</p>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col gap-4 w-full md:w-auto md:min-w-[200px]">
              <div className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
                <span className="text-xs font-bold text-ink/60">Priority</span>
                <span className={`text-xs font-bold ${rec.priority === 'High' ? 'text-rose-600' : 'text-amber-600'}`}>{rec.priority}</span>
              </div>
              <div className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
                <span className="text-xs font-bold text-ink/60">Difficulty</span>
                <span className="text-xs font-bold text-ink">{rec.difficulty}</span>
              </div>
              <div className="flex gap-2 mt-2">
                <button className="flex-1 bg-[var(--color-brand)] text-white text-sm font-bold py-2 rounded-lg hover:bg-opacity-90 transition-colors">Apply</button>
                <button className="px-3 bg-white border border-gray-300 text-ink rounded-lg hover:bg-gray-50"><Settings2 size={16}/></button>
                <button className="px-3 bg-white border border-rose-200 text-rose-600 rounded-lg hover:bg-rose-50 font-bold text-sm">Reject</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}