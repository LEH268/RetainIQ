import { Megaphone, Plus, Mail, CheckCircle2 } from "lucide-react";

export default function Campaigns() {
  const mockCampaigns = [
    { name: "VIP Retention Initiative", target: "VIP (High Risk)", status: "Active", conversion: "14%" },
    { name: "Inactive User Reactivation", target: "Inactive", status: "Draft", conversion: "-" },
    { name: "Pro Plan Upsell Training", target: "Loyal", status: "Completed", conversion: "28%" }
  ];

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-10">
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-[var(--color-border)] shadow-sm">
        <div>
          <h1 className="font-display text-3xl font-bold">Targeted Campaigns</h1>
          <p className="text-sm text-ink/60 mt-1 font-medium">Launch targeted engagements based on AI customer segmentation[cite: 5].</p>
        </div>
        <button className="flex items-center gap-2 rounded-xl bg-[var(--color-brand)] text-white px-5 py-2.5 text-sm font-bold hover:bg-[var(--color-brand-dark)] transition-all shadow-sm">
          <Plus size={16} /> New Campaign
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white shadow-sm">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b-2 border-[var(--color-border)]">
              <tr>
                <th className="px-6 py-4 font-bold text-ink/60 uppercase tracking-wider text-xs">Campaign Name</th>
                <th className="px-6 py-4 font-bold text-ink/60 uppercase tracking-wider text-xs">Target Segment</th>
                <th className="px-6 py-4 font-bold text-ink/60 uppercase tracking-wider text-xs">Status</th>
                <th className="px-6 py-4 font-bold text-ink/60 uppercase tracking-wider text-xs text-right">Success Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {mockCampaigns.map((camp, i) => (
                <tr key={i} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-ink">{camp.name}</td>
                  <td className="px-6 py-4"><span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-bold border border-blue-200">{camp.target}</span></td>
                  <td className="px-6 py-4">
                    <span className={`flex items-center gap-1.5 font-bold text-xs ${camp.status === 'Active' ? 'text-green-600' : 'text-gray-500'}`}>
                      {camp.status === 'Active' && <CheckCircle2 size={14}/>} {camp.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-black text-right text-lg">{camp.conversion}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-[var(--color-border)] shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Mail className="text-[var(--color-brand)]" />
            <h3 className="font-bold text-lg font-display">AI Email Generator</h3>
          </div>
          <p className="text-sm font-medium text-ink/60 mb-6">Select a segment and let AI draft a high-conversion retention email.</p>
          
          <label className="block text-xs font-bold text-ink/70 mb-2 uppercase">Target Segment</label>
          <select className="w-full rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-medium outline-none focus:border-[var(--color-brand)] mb-4">
            <option>High-Risk VIPs</option>
            <option>Inactive Loyalists</option>
          </select>

          <label className="block text-xs font-bold text-ink/70 mb-2 uppercase">AI Prompt</label>
          <textarea 
            rows="3" 
            className="w-full rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium outline-none focus:border-[var(--color-brand)] mb-4"
            defaultValue="Offer a free 1-on-1 onboarding session to help them use the new API features."
          />
          
          <button className="w-full py-3 bg-[var(--color-ink)] text-white rounded-xl font-bold hover:bg-opacity-90 transition-all shadow-sm">
            Generate Draft
          </button>
        </div>
      </div>
    </div>
  );
}