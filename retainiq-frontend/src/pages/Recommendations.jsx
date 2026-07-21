import { useState, useEffect } from "react";
import { Target, ArrowRight, Brain, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import api from "../lib/api";

export default function Recommendations() {
  const [recs, setRecs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionStatus, setActionStatus] = useState({});

  useEffect(() => {
    api.get("/recommendations").then(res => {
      setRecs(res.data);
      setLoading(false);
    }).catch(err => {
      console.error("Failed to fetch recommendations:", err);
      setLoading(false);
    });
  }, []);

  const handleAction = async (id, type) => {
    setActionStatus(prev => ({ ...prev, [id]: type === 'apply' ? 'Applying...' : 'Rejecting...' }));
    
    try {
        await api.post(`/recommendations/${id}/action`, { type });
        setActionStatus(prev => ({ ...prev, [id]: type === 'apply' ? 'Applied Successfully' : 'Rejected' }));
        
        setTimeout(() => {
          setRecs(prev => prev.filter(r => r.id !== id));
        }, 1000);
    } catch (e) {
        setActionStatus(prev => ({ ...prev, [id]: 'Error from API' }));
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center font-display text-lg text-ink/50">
        <Loader2 className="animate-spin mr-2"/> Syncing AI Recommendations...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-10">
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-[var(--color-border)] shadow-sm">
        <div>
          <h1 className="font-display text-3xl font-bold">AI Recommendation Center</h1>
          <p className="text-sm text-ink/60 mt-1 font-medium">Review and apply AI-generated retention strategies.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {recs.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-[var(--color-border)] shadow-sm text-center flex flex-col items-center">
            <CheckCircle2 size={48} className="text-emerald-500 mb-4" />
            <h2 className="text-xl font-bold font-display">All Caught Up!</h2>
            <p className="text-sm font-medium text-ink/60 mt-2">No active AI recommendations available.</p>
          </div>
        ) : (
          recs.map((rec) => (
            <div key={rec.id} className="bg-white p-6 rounded-2xl border border-[var(--color-border)] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:shadow-md transition-shadow relative overflow-hidden">
              
              {actionStatus[rec.id] && (
                <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-10 flex items-center justify-center">
                  <div className={`font-bold text-lg flex items-center gap-2 ${actionStatus[rec.id].includes('Apply') ? 'text-emerald-600' : 'text-gray-500'}`}>
                    {actionStatus[rec.id] === 'Applied Successfully' ? <CheckCircle2 /> : actionStatus[rec.id] === 'Rejected' ? <XCircle /> : <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />}
                    {actionStatus[rec.id]}
                  </div>
                </div>
              )}

              <div className="flex-1 w-full">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-bold text-lg">{rec.customer}</h3>
                  <span className={`text-xs font-bold px-2 py-1 rounded-md bg-gray-50 border border-gray-200`}>{rec.risk}</span>
                </div>
                
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 mt-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <div className="flex items-center gap-2">
                    <Target className="text-[var(--color-brand)] shrink-0" size={24}/>
                    <p className="font-black text-[var(--color-brand-dark)] text-lg">{rec.rec}</p>
                  </div>
                  <ArrowRight className="hidden sm:block text-ink/30 shrink-0" size={16}/>
                  <div>
                    <p className="text-xs font-bold text-ink/50 uppercase">Expected Success</p>
                    <p className="font-black text-emerald-600 text-lg">{rec.success}</p>
                  </div>
                </div>

                <div className="mt-4 flex items-start gap-2 text-sm font-medium text-ink/70 bg-[var(--color-brand-soft)]/30 p-3 rounded-lg border border-[var(--color-brand)]/20">
                  <Brain size={16} className="text-[var(--color-brand)] mt-0.5 shrink-0" />
                  <p><strong>AI Rationale:</strong> {rec.reason}</p>
                </div>
              </div>
              
              <div className="flex flex-col gap-4 w-full md:w-auto md:min-w-[200px]">
                <div className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
                  <span className="text-xs font-bold text-ink/60">Priority</span>
                  <span className="text-xs font-bold">{rec.priority}</span>
                </div>
                <div className="flex gap-2 mt-2">
                  <button onClick={() => handleAction(rec.id, 'apply')} className="flex-1 bg-[var(--color-brand)] text-white text-sm font-bold py-2 rounded-lg hover:bg-[var(--color-brand-dark)] transition-colors shadow-sm">Apply</button>
                  <button onClick={() => handleAction(rec.id, 'reject')} className="px-3 bg-white border border-rose-200 text-rose-600 rounded-lg hover:bg-rose-50 font-bold text-sm shadow-sm">Reject</button>
                </div>
              </div>

            </div>
          ))
        )}
      </div>
    </div>
  );
}