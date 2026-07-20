import { useState } from "react";
import { Users, TrendingUp, ShieldAlert, Send, Sparkles, CheckCircle2, Loader2, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const BUSINESS_SEGMENTS = [
  { 
    name: "👑 VVIP", 
    desc: "Highest subscription plan, Excellent health score (>85), Very high lifetime value, Highly engaged, Low churn risk",
    users: 240, avgRevenue: "$1,200", avgRisk: "2%", detected: 12
  },
  { 
    name: "⭐ VIP", 
    desc: "Highest subscription plan, Moderate health score, Medium lifetime value, Regular engagement",
    users: 850, avgRevenue: "$450", avgRisk: "15%", detected: 34
  },
  { 
    name: "❤️ Loyal", 
    desc: "Subscribed plan, Consistent activity, Stable health score, Long customer history",
    users: 2100, avgRevenue: "$180", avgRisk: "8%", detected: 120
  },
  { 
    name: "⚠️ At Risk", 
    desc: "Subscribed customer, High churn probability, Low engagement, Declining health score",
    users: 58, avgRevenue: "$95", avgRisk: "78%", detected: 58
  },
  { 
    name: "🆕 New", 
    desc: "Joined within last 30 days, Recently subscribed, Limited engagement history",
    users: 320, avgRevenue: "$45", avgRisk: "45%", detected: 22
  }
];

export default function Segmentation() {
  const [selectedSeg, setSelectedSeg] = useState(BUSINESS_SEGMENTS[3]); // Default to At Risk
  const [bulkActionStatus, setBulkActionStatus] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleBulkAction = () => {
    setIsProcessing(true);
    setBulkActionStatus("");
    
    // Simulating AI automatic execution
    setTimeout(() => {
        setIsProcessing(false);
        setBulkActionStatus(`Successfully executed actions for ${selectedSeg.detected} customers in ${selectedSeg.name} segment.`);
    }, 2000);
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-10">
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-[var(--color-border)] shadow-sm">
        <div>
          <h1 className="font-display text-3xl font-bold">AI Customer Segmentation</h1>
          <p className="text-sm text-ink/60 mt-1 font-medium">Business-defined segments powered by AI behavioral analysis.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Sidebar Segments */}
        <div className="w-full lg:w-1/3 flex flex-col gap-3">
          {BUSINESS_SEGMENTS.map((seg, i) => (
            <div 
              key={i} 
              onClick={() => setSelectedSeg(seg)}
              className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${selectedSeg.name === seg.name ? 'bg-white shadow-md border-[var(--color-brand)]' : 'bg-white border-transparent hover:border-gray-200'}`}
            >
              <div className="flex items-center gap-4">
                <div>
                  <h3 className="font-bold font-display text-lg">{seg.name}</h3>
                  <p className="text-xs font-bold text-ink/50 uppercase">{seg.users} Users</p>
                </div>
              </div>
              <ArrowRight size={18} className={selectedSeg.name === seg.name ? 'text-[var(--color-brand)]' : 'text-transparent'} />
            </div>
          ))}
        </div>

        {/* Segment Details */}
        <div className="w-full lg:w-2/3 bg-white rounded-2xl border border-[var(--color-border)] shadow-sm overflow-hidden sticky top-6">
          <div className="p-8 bg-gray-50 border-b border-[var(--color-border)]">
             <div className="flex justify-between items-start mb-4">
               <h2 className="text-3xl font-display font-black flex items-center gap-3">
                 {selectedSeg.name}
               </h2>
               <Link to={`/customers?segment=${selectedSeg.name.replace(/[^a-zA-Z\s]/g, '').trim()}`} className="px-4 py-2 bg-white rounded-xl text-sm font-bold shadow-sm border border-[var(--color-border)] hover:text-[var(--color-brand)] transition-colors">
                 View Customer List
               </Link>
             </div>
             <div className="bg-white p-4 rounded-xl border border-gray-200">
                <p className="text-ink/80 font-medium text-sm leading-relaxed">{selectedSeg.desc}</p>
             </div>
          </div>

          <div className="grid grid-cols-3 divide-x divide-[var(--color-border)] border-b border-[var(--color-border)] bg-white">
             <div className="p-6 flex flex-col items-center text-center">
               <Users className="text-ink/40 mb-2" size={20} />
               <p className="text-xs font-bold text-ink/50 uppercase">Total Users</p>
               <p className="text-2xl font-black font-display mt-1">{selectedSeg.users}</p>
             </div>
             <div className="p-6 flex flex-col items-center text-center">
               <TrendingUp className="text-emerald-500 mb-2" size={20} />
               <p className="text-xs font-bold text-ink/50 uppercase">Avg Revenue</p>
               <p className="text-2xl font-black font-display mt-1">{selectedSeg.avgRevenue}</p>
             </div>
             <div className="p-6 flex flex-col items-center text-center">
               <ShieldAlert className="text-rose-500 mb-2" size={20} />
               <p className="text-xs font-bold text-ink/50 uppercase">Avg Risk</p>
               <p className="text-2xl font-black font-display mt-1">{selectedSeg.avgRisk}</p>
             </div>
          </div>

          {/* AI Recommended Bulk Actions */}
          <div className="p-8 bg-gradient-to-b from-white to-blue-50/30">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="text-[var(--color-brand)]" size={24} />
              <h3 className="font-bold text-xl font-display">AI Recommended Bulk Actions</h3>
            </div>
            
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-6">
                <div className="flex items-start gap-4 mb-6 pb-6 border-b border-gray-100">
                    <div className="bg-amber-100 text-amber-700 p-3 rounded-lg shrink-0">
                        <ShieldAlert size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-ink/60 uppercase tracking-wider mb-1">AI Detected</p>
                        <p className="text-2xl font-black font-display text-ink">{selectedSeg.detected} {selectedSeg.name.replace(/[^a-zA-Z\s]/g, '').trim()} customers</p>
                        <p className="text-sm text-ink/60 mt-1">Ready for automated engagement.</p>
                    </div>
                </div>

                <div className="mb-6">
                    <p className="text-sm font-bold text-ink/60 uppercase tracking-wider mb-3">Recommended Action Protocol</p>
                    <ul className="space-y-3">
                        <li className="flex items-center gap-3 text-sm font-bold text-ink bg-gray-50 p-3 rounded-lg border border-gray-100">
                            <span className="text-[var(--color-brand)]">1.</span> Send retention email
                        </li>
                        <li className="flex items-center gap-3 text-sm font-bold text-ink bg-gray-50 p-3 rounded-lg border border-gray-100">
                            <span className="text-[var(--color-brand)]">2.</span> Offer Premium discount
                        </li>
                        <li className="flex items-center gap-3 text-sm font-bold text-ink bg-gray-50 p-3 rounded-lg border border-gray-100">
                            <span className="text-[var(--color-brand)]">3.</span> Schedule health reminder
                        </li>
                    </ul>
                </div>

                <button 
                    onClick={handleBulkAction} 
                    disabled={isProcessing || bulkActionStatus !== ""}
                    className="w-full py-4 rounded-xl font-bold text-white bg-[var(--color-ink)] hover:bg-opacity-90 transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
                >
                    {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                    {isProcessing ? "AI is executing sequence..." : "Run Bulk Action"}
                </button>
            </div>

            {bulkActionStatus && (
              <div className="p-4 rounded-xl text-sm font-bold flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200 animate-in fade-in slide-in-from-bottom-2">
                <CheckCircle2 size={18}/> {bulkActionStatus}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}