import { useState, useEffect } from "react";
import { Layers, Users, TrendingUp, ShieldAlert, Send, Zap, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import api from "../lib/api";

export default function Segmentation() {
  const [segments, setSegments] = useState([]);
  const [selectedSeg, setSelectedSeg] = useState(null);
  const [bulkActionStatus, setBulkActionStatus] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/api/segments").then(res => {
        setSegments(res.data);
        if(res.data.length > 0) setSelectedSeg(res.data[0]);
        setLoading(false);
    }).catch(err => {
        console.error(err);
        setLoading(false);
    });
  }, []);

  const handleBulkAction = async (actionName) => {
    setBulkActionStatus(`Processing AI Action...`);
    try {
        await api.post('/api/ai/bulk-action', { segmentName: selectedSeg.name, action: actionName });
        setBulkActionStatus(`Success: ${actionName} initiated.`);
    } catch (e) {
        setBulkActionStatus(`Error calling AI backend.`);
    }
    setTimeout(() => setBulkActionStatus(""), 4000);
  };

  if(loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-[var(--color-brand)]" size={32} /></div>;
  if(!segments || segments.length === 0) return <div className="text-center p-20">No Segment Data Returned from Backend</div>;

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-10">
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-[var(--color-border)] shadow-sm">
        <div>
          <h1 className="font-display text-3xl font-bold">AI Customer Segmentation</h1>
          <p className="text-sm text-ink/60 mt-1 font-medium">Auto-classified behavioral cohorts powered by Backend ML.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        <div className="w-full lg:w-1/3 flex flex-col gap-3">
          {segments.map((seg, i) => (
            <div 
              key={i} 
              onClick={() => setSelectedSeg(seg)}
              className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${selectedSeg.name === seg.name ? `bg-white shadow-md border-[var(--color-brand)]` : 'bg-white border-transparent hover:border-gray-200'}`}
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl border bg-gray-50 border-gray-200`}>
                  <Layers className="text-gray-500" size={24} />
                </div>
                <div>
                  <h3 className="font-bold font-display text-lg">{seg.name}</h3>
                  <p className="text-xs font-bold text-ink/50 uppercase">{seg.value} Users</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="w-full lg:w-2/3 bg-white rounded-2xl border border-[var(--color-border)] shadow-sm overflow-hidden sticky top-6">
          <div className={`p-8 bg-gray-50 border-b border-[var(--color-border)]`}>
             <div className="flex justify-between items-start mb-2">
               <h2 className="text-3xl font-display font-black flex items-center gap-3">
                 {selectedSeg.name} Segment
               </h2>
               <Link to={`/customers?segment=${selectedSeg.name}`} className="px-4 py-2 bg-white rounded-xl text-sm font-bold shadow-sm border border-[var(--color-border)] hover:text-[var(--color-brand)] transition-colors">
                 View Customer List
               </Link>
             </div>
             <p className="text-ink/70 font-medium max-w-md">{selectedSeg.desc || "Segment defined by backend model."}</p>
          </div>

          <div className="grid grid-cols-3 divide-x divide-[var(--color-border)] border-b border-[var(--color-border)] bg-white">
             <div className="p-6 flex flex-col items-center text-center">
               <Users className="text-ink/40 mb-2" size={20} />
               <p className="text-xs font-bold text-ink/50 uppercase">Total Users</p>
               <p className="text-2xl font-black font-display mt-1">{selectedSeg.value}</p>
             </div>
             <div className="p-6 flex flex-col items-center text-center">
               <TrendingUp className="text-emerald-500 mb-2" size={20} />
               <p className="text-xs font-bold text-ink/50 uppercase">Avg Revenue</p>
               <p className="text-2xl font-black font-display mt-1">{selectedSeg.avgRevenue}</p>
             </div>
             <div className="p-6 flex flex-col items-center text-center">
               <ShieldAlert className="text-amber-500" size={20} />
               <p className="text-xs font-bold text-ink/50 uppercase">Avg Risk</p>
               <p className="text-2xl font-black font-display mt-1">{selectedSeg.avgRisk}</p>
             </div>
          </div>

          <div className="p-8">
            <div className="flex items-center gap-2 mb-6">
              <Zap className="text-[var(--color-brand)]" size={20} />
              <h3 className="font-bold text-lg font-display">AI Recommended Bulk Actions</h3>
            </div>
            
            {bulkActionStatus && (
              <div className={`mb-6 p-4 rounded-xl text-sm font-bold flex items-center gap-2 ${bulkActionStatus.includes('Success') ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700 animate-pulse'}`}>
                <Send size={16}/> {bulkActionStatus}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {selectedSeg.bulkActions?.map((action, idx) => (
                <button key={idx} onClick={() => handleBulkAction(action.name)} className="p-4 border-2 border-gray-100 rounded-xl text-left hover:border-[var(--color-brand)] hover:bg-blue-50 transition-all group">
                  <p className="font-bold text-ink group-hover:text-[var(--color-brand)]">{action.name}</p>
                  <p className="text-xs text-ink/60 mt-1 font-medium">{action.description}</p>
                </button>
              ))}
              {(!selectedSeg.bulkActions || selectedSeg.bulkActions.length === 0) && (
                <p className="text-sm text-ink/50 italic col-span-2">No backend actions available for this segment.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}