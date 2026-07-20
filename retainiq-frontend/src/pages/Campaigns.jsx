import { useState } from "react";
import { Megaphone, Plus, CheckCircle2, Sparkles, Loader2, Send, X, Eye, Edit2, Trash2, Save, CalendarClock, Users } from "lucide-react";
import api from "../lib/api";

const initialFormState = {
  id: null,
  name: "",
  target: "All Customers",
  objective: "Retention (Prevent Churn)",
  tone: "Professional & Direct",
  keyDetails: "",
  emailBody: "",
  scheduledDate: ""
};

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState([
    { 
      id: 1, 
      name: "Spring Wellness 2026", 
      target: "All Customers", 
      status: "Active", 
      created: "2026-03-01",
      objective: "Retention (Prevent Churn)",
      tone: "Friendly & Casual",
      keyDetails: "Spring promotion for all users.",
      emailBody: "Subject: Boost your health this Spring!\n\nHi there,\n\nSpring is here, and it's the perfect time to focus on your wellness...",
      recipientCount: 1245
    },
    { 
      id: 2, 
      name: "At-Risk Recovery", 
      target: "At Risk", 
      status: "Draft", 
      created: "2026-03-10",
      objective: "Win-back (Re-engagement)",
      tone: "Empathetic & Caring",
      keyDetails: "Offer 20% discount to come back.",
      emailBody: "Subject: We miss you!\n\nHi,\n\nIt's been a while since we last saw you. Here is a special 20% discount to welcome you back.",
      recipientCount: 84
    }
  ]);

  const [showFormModal, setShowFormModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [currentCampaign, setCurrentCampaign] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [campaignForm, setCampaignForm] = useState(initialFormState);
  const [sendAction, setSendAction] = useState(null);

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this campaign?")) {
      setCampaigns(campaigns.filter(c => c.id !== id));
    }
  };

  const openViewModal = (campaign) => {
    setCurrentCampaign(campaign);
    setShowViewModal(true);
  };

  const openEditDraft = (campaign) => {
    setCampaignForm({ ...campaign });
    setSendAction(campaign.status === 'Scheduled' ? 'schedule' : null);
    setShowFormModal(true);
  };

  const handleGenerateEmail = async () => {
    if (!campaignForm.name || !campaignForm.keyDetails) {
      return alert("Please enter a campaign name and key details for the AI.");
    }
    
    setIsGenerating(true);
    
    try {
      const res = await api.post("/api/ai/generate-email", {
        name: campaignForm.name,
        target: campaignForm.target,
        objective: campaignForm.objective,
        tone: campaignForm.tone,
        details: campaignForm.keyDetails
      });
      
      setCampaignForm(prev => ({ ...prev, emailBody: res.data.email }));
    } catch (error) {
      console.error("AI Generation Failed:", error);
      setTimeout(() => {
        setCampaignForm(prev => ({ 
           ...prev, 
           emailBody: `Subject: Exclusive offer for our ${prev.target} members!\n\nHi there,\n\nWe are reaching out regarding our ${prev.name} initiative. Based on your profile, we wanted to share these details:\n\n${prev.keyDetails}\n\nDon't miss out on this opportunity!\n\nBest,\nThe Team`
         }));
      }, 1500);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFinalizeCampaign = (status) => {
    if (status === 'Scheduled' && !campaignForm.scheduledDate) {
      return alert("Please select a date and time to schedule the campaign.");
    }
    if (!campaignForm.emailBody) {
      return alert("Please generate or write the email content before saving.");
    }

    const mockCount = campaignForm.target === 'All Customers' ? 1245 : Math.floor(Math.random() * 300) + 50;
    const finalizedCampaign = {
      ...campaignForm,
      id: campaignForm.id || Date.now(),
      status: status,
      created: campaignForm.id ? campaignForm.created : new Date().toISOString().split('T')[0],
      recipientCount: campaignForm.recipientCount || mockCount
    };

    if (campaignForm.id) {
      setCampaigns(campaigns.map(c => c.id === finalizedCampaign.id ? finalizedCampaign : c));
    } else {
      setCampaigns([finalizedCampaign, ...campaigns]);
    }
    
    setShowFormModal(false);
    setCampaignForm(initialFormState);
    setSendAction(null);
    alert(`Campaign successfully ${status === 'Active' ? 'sent to customers' : status.toLowerCase()}!`);
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-10">
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-[var(--color-border)] shadow-sm">
        <div>
          <h1 className="font-display text-3xl font-bold">Campaigns CRM</h1>
          <p className="text-sm text-ink/60 mt-1 font-medium">Create and manage targeted AI engagements.</p>
        </div>
        <button 
          onClick={() => {
            setCampaignForm(initialFormState);
            setSendAction(null);
            setShowFormModal(true);
          }} 
          className="flex items-center gap-2 rounded-xl bg-[var(--color-brand)] text-white px-5 py-2.5 text-sm font-bold shadow-sm hover:opacity-90 transition-opacity"
        >
          <Plus size={16} /> Create Campaign
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 border-b-2 border-[var(--color-border)]">
            <tr>
              <th className="px-6 py-4 font-bold text-ink/60 uppercase tracking-wider text-xs">Name</th>
              <th className="px-6 py-4 font-bold text-ink/60 uppercase tracking-wider text-xs">Target Segment</th>
              <th className="px-6 py-4 font-bold text-ink/60 uppercase tracking-wider text-xs">Status</th>
              <th className="px-6 py-4 font-bold text-ink/60 uppercase tracking-wider text-xs">Created</th>
              <th className="px-6 py-4 font-bold text-ink/60 uppercase tracking-wider text-xs text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {campaigns.map((camp) => (
              <tr key={camp.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-bold text-ink">{camp.name}</td>
                <td className="px-6 py-4">
                  <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-bold border border-blue-200">
                    {camp.target}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${
                    camp.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    camp.status === 'Draft' ? 'bg-gray-100 text-gray-700 border-gray-200' :
                    'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {camp.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-ink/60">{camp.created}</td>
                <td className="px-6 py-4 text-right flex justify-end gap-2">
                    <button onClick={() => openViewModal(camp)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View Details"><Eye size={16}/></button>
                    {camp.status !== 'Active' && (
                      <button onClick={() => openEditDraft(camp)} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Edit Draft"><Edit2 size={16}/></button>
                    )}
                    <button onClick={() => handleDelete(camp.id)} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Delete"><Trash2 size={16}/></button>
                </td>
              </tr>
            ))}
            {campaigns.length === 0 && (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-ink/50 font-medium">No campaigns found. Create one to get started.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showFormModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl p-6 flex flex-col max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6 border-b pb-4">
              <h2 className="text-xl font-bold font-display flex items-center gap-2">
                <Sparkles className="text-[var(--color-brand)]" /> 
                {campaignForm.id ? "Edit Campaign Draft" : "Generate AI Campaign"}
              </h2>
              <button onClick={() => setShowFormModal(false)} className="hover:bg-gray-100 p-1 rounded-full"><X size={20} /></button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-bold mb-1.5">Campaign Name</label>
                <input type="text" value={campaignForm.name} onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })} className="w-full rounded-xl border-2 border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[var(--color-brand)]" placeholder="e.g. Summer Flash Sale" />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1.5">Target Segment</label>
                <select value={campaignForm.target} onChange={(e) => setCampaignForm({ ...campaignForm, target: e.target.value })} className="w-full rounded-xl border-2 border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[var(--color-brand)]">
                  <option>All Customers</option>
                  <option>VVIP</option>
                  <option>VIP</option>
                  <option>Loyal</option>
                  <option>At Risk</option>
                  <option>New</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold mb-1.5">Campaign Objective</label>
                <select value={campaignForm.objective} onChange={(e) => setCampaignForm({ ...campaignForm, objective: e.target.value })} className="w-full rounded-xl border-2 border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[var(--color-brand)]">
                  <option>Retention (Prevent Churn)</option>
                  <option>Upsell / Cross-sell</option>
                  <option>Welcome / Onboarding</option>
                  <option>Win-back (Re-engagement)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold mb-1.5">Tone of Voice</label>
                <select value={campaignForm.tone} onChange={(e) => setCampaignForm({ ...campaignForm, tone: e.target.value })} className="w-full rounded-xl border-2 border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[var(--color-brand)]">
                  <option>Professional & Direct</option>
                  <option>Friendly & Casual</option>
                  <option>Urgent & Exciting</option>
                  <option>Empathetic & Caring</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-bold mb-1.5">Key Details / Offers (Instructions for AI)</label>
                <textarea rows="3" value={campaignForm.keyDetails} onChange={(e) => setCampaignForm({ ...campaignForm, keyDetails: e.target.value })} className="w-full rounded-xl border-2 border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[var(--color-brand)]" placeholder="e.g. Mention a 20% off coupon code SAVE20 valid until end of month. Emphasize our new customer support portal." />
              </div>
            </div>
            
            <button 
              onClick={handleGenerateEmail} 
              disabled={isGenerating}
              className="w-full py-3 mb-6 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-70"
            >
              {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18}/>} 
              {isGenerating ? "AI is writing your email..." : campaignForm.emailBody ? "Regenerate Email Content" : "Generate Email Content"}
            </button>
            
            {campaignForm.emailBody && !isGenerating && (
              <div className="animate-in fade-in flex flex-col gap-4 border-t pt-6">
                <div>
                  <label className="block text-sm font-bold text-emerald-600 mb-1.5 flex items-center gap-1">
                    <CheckCircle2 size={16}/> Generated Email (Feel free to edit)
                  </label>
                  <textarea 
                    rows="8" 
                    className="w-full rounded-xl border-2 border-emerald-500/30 bg-emerald-50/30 px-4 py-3 text-sm font-medium outline-none focus:border-emerald-500"
                    value={campaignForm.emailBody} 
                    onChange={(e) => setCampaignForm({ ...campaignForm, emailBody: e.target.value })} 
                  />
                </div>
                
                {sendAction === 'schedule' && (
                  <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                    <label className="block text-sm font-bold text-amber-900 mb-2">Select Date & Time to Send:</label>
                    <input 
                      type="datetime-local" 
                      className="w-full rounded-lg border border-amber-300 px-3 py-2 outline-none"
                      value={campaignForm.scheduledDate}
                      onChange={(e) => setCampaignForm({...campaignForm, scheduledDate: e.target.value})}
                    />
                  </div>
                )}
                
                <div className="flex flex-wrap justify-end gap-3 mt-2">
                  <button onClick={() => handleFinalizeCampaign('Draft')} className="px-5 py-2.5 rounded-xl font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 flex items-center gap-2">
                    <Save size={16}/> Save Draft
                  </button>
                  
                  {sendAction !== 'schedule' ? (
                    <button onClick={() => setSendAction('schedule')} className="px-5 py-2.5 rounded-xl font-bold text-amber-700 bg-amber-100 hover:bg-amber-200 flex items-center gap-2">
                      <CalendarClock size={16}/> Plan Schedule
                    </button>
                  ) : (
                    <button onClick={() => handleFinalizeCampaign('Scheduled')} className="px-5 py-2.5 rounded-xl font-bold text-white bg-amber-600 hover:bg-amber-700 flex items-center gap-2 shadow-sm">
                      <CheckCircle2 size={16}/> Confirm Schedule
                    </button>
                  )}
                  
                  <button onClick={() => handleFinalizeCampaign('Active')} className="px-6 py-2.5 rounded-xl font-bold bg-[var(--color-brand)] hover:bg-[var(--color-brand-dark)] text-white flex items-center gap-2 shadow-sm">
                    <Send size={16}/> Submit & Send Now
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showViewModal && currentCampaign && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 flex flex-col max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 border-b pb-4">
              <h2 className="text-xl font-bold font-display">View Campaign Details</h2>
              <button onClick={() => setShowViewModal(false)} className="hover:bg-gray-100 p-1 rounded-full"><X size={20} /></button>
            </div>
            
            <div className="space-y-6 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div><span className="text-ink/50 block font-bold mb-1">Campaign Name</span> <span className="font-semibold text-base">{currentCampaign.name}</span></div>
                <div>
                  <span className="text-ink/50 block font-bold mb-1">Status</span> 
                  <span className={`px-2 py-1 rounded-md text-xs font-bold border inline-block ${
                    currentCampaign.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    currentCampaign.status === 'Draft' ? 'bg-gray-100 text-gray-700 border-gray-200' :
                    'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {currentCampaign.status} {currentCampaign.status === 'Scheduled' && currentCampaign.scheduledDate ? `(${currentCampaign.scheduledDate.replace('T', ' ')})` : ''}
                  </span>
                </div>
                <div><span className="text-ink/50 block font-bold mb-1">Objective</span> <span className="font-semibold">{currentCampaign.objective}</span></div>
                <div><span className="text-ink/50 block font-bold mb-1">Created On</span> <span className="font-semibold">{currentCampaign.created}</span></div>
              </div>
              
              <div>
                <span className="text-ink/50 block font-bold mb-2">Recipients List</span>
                <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2 font-bold text-blue-900">
                    <Users size={16} />
                    Targeting: {currentCampaign.target} Segment ({currentCampaign.recipientCount} Customers)
                  </div>
                  {currentCampaign.status === 'Active' ? (
                    <p className="text-xs text-blue-800/80 leading-relaxed">
                      Sent to: john.d@example.com, sarah.smith@example.com, mike.w@test.com, emily.r@demo.com, alex.j@example.com, and {currentCampaign.recipientCount - 5} more...
                    </p>
                  ) : (
                    <p className="text-xs text-blue-800/80 leading-relaxed italic">
                      Emails will be sent to the {currentCampaign.target} segment upon activation.
                    </p>
                  )}
                </div>
              </div>
              
              <div>
                <span className="text-ink/50 block font-bold mb-2">Email Content</span>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 whitespace-pre-wrap font-medium text-gray-800">
                  {currentCampaign.emailBody || "No email content available."}
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end border-t pt-4">
              <button onClick={() => setShowViewModal(false)} className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}