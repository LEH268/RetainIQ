import { useState, useEffect } from "react";
import { Megaphone, Plus, Mail, CheckCircle2, Sparkles, Loader2, Send } from "lucide-react";
import api from "../lib/api";

export default function Campaigns() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedEmail, setGeneratedEmail] = useState("");
  const [segment, setSegment] = useState("High-Risk VIPs");
  const [prompt, setPrompt] = useState("Offer a free 1-on-1 onboarding session to help them use the new API features.");
  const [campaigns, setCampaigns] = useState([]);

  useEffect(() => {
     api.get('/api/campaigns').then(res => setCampaigns(res.data)).catch(console.error);
  }, []);

  const handleGenerateEmail = async () => {
    setIsGenerating(true);
    setGeneratedEmail("");
    
    try {
        const res = await api.post('/api/ai/generate-email', { segment, prompt });
        setGeneratedEmail(res.data.emailDraft);
    } catch (err) {
        setGeneratedEmail("API Error: Make sure your backend implements POST /api/ai/generate-email");
    } finally {
        setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-10">
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-[var(--color-border)] shadow-sm">
        <div>
          <h1 className="font-display text-3xl font-bold">Targeted Campaigns</h1>
          <p className="text-sm text-ink/60 mt-1 font-medium">Launch targeted engagements based on AI customer segmentation.</p>
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
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {campaigns.length > 0 ? campaigns.map((camp, i) => (
                <tr key={i} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-ink">{camp.name}</td>
                  <td className="px-6 py-4"><span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-bold border border-blue-200">{camp.target}</span></td>
                  <td className="px-6 py-4">{camp.status}</td>
                </tr>
              )) : (
                <tr><td colSpan={3} className="px-6 py-8 text-center text-ink/50 text-sm">No campaigns loaded from backend.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* AI Email Generator */}
        <div className="bg-white p-6 rounded-2xl border-2 border-[var(--color-brand)]/20 shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="text-[var(--color-brand)]" size={20} />
            <h3 className="font-bold text-lg font-display">AI Email Generator</h3>
          </div>
          <p className="text-sm font-medium text-ink/60 mb-6">Select a segment and let AI draft a high-conversion retention email via the backend model.</p>
          
          <label className="block text-xs font-bold text-ink/70 mb-2 uppercase">Target Segment</label>
          <select 
            value={segment}
            onChange={(e) => setSegment(e.target.value)}
            className="w-full rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-medium outline-none focus:border-[var(--color-brand)] mb-4"
          >
            <option>High-Risk VIPs</option>
            <option>Inactive Loyalists</option>
            <option>New Customers</option>
          </select>

          <label className="block text-xs font-bold text-ink/70 mb-2 uppercase">AI Prompt</label>
          <textarea 
            rows="3" 
            className="w-full rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium outline-none focus:border-[var(--color-brand)] mb-4"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          
          {!generatedEmail && !isGenerating && (
            <button 
              onClick={handleGenerateEmail}
              className="w-full py-3 bg-[var(--color-ink)] text-white rounded-xl font-bold hover:bg-opacity-90 transition-all shadow-sm flex items-center justify-center gap-2"
            >
              Generate Draft
            </button>
          )}

          {isGenerating && (
            <div className="w-full py-8 flex flex-col items-center justify-center text-[var(--color-brand)]">
              <Loader2 className="animate-spin mb-2" size={24} />
              <p className="text-sm font-bold">AI model is generating content...</p>
            </div>
          )}

          {generatedEmail && (
            <div className="mt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <label className="block text-xs font-bold text-emerald-600 mb-2 uppercase flex items-center gap-1"><CheckCircle2 size={14}/> Draft Ready</label>
              <textarea 
                rows="8" 
                className="w-full rounded-xl border-2 border-[var(--color-brand)]/30 bg-[var(--color-brand-soft)]/20 px-4 py-3 text-sm font-medium outline-none focus:border-[var(--color-brand)] mb-4 text-ink"
                value={generatedEmail}
                onChange={(e) => setGeneratedEmail(e.target.value)}
              />
              <div className="flex gap-2">
                <button 
                  onClick={() => setGeneratedEmail("")}
                  className="px-4 py-2.5 bg-gray-100 text-ink rounded-xl font-bold hover:bg-gray-200 transition-all shadow-sm text-sm"
                >
                  Discard
                </button>
                <button className="flex-1 py-2.5 bg-[var(--color-brand)] text-white rounded-xl font-bold hover:bg-[var(--color-brand-dark)] transition-all shadow-sm text-sm flex items-center justify-center gap-2">
                  <Send size={16} /> Approve & Send
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}