import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  CheckCircle2,
  Sparkles,
  Loader2,
  Send,
  X,
  Eye,
  Edit2,
  Trash2,
  Save,
  CalendarClock,
  Users,
  AlertTriangle,
} from "lucide-react";
import api from "../lib/api";

const INITIAL_FORM_STATE = {
  id: null,
  name: "",
  target: "All Customers",
  objective: "Retention (Prevent Churn)",
  tone: "Professional & Direct",
  keyDetails: "",
  emailBody: "",
  scheduledDate: "",
  status: "Draft",
  created: "",
  recipientCount: 0,
};

const TARGET_OPTIONS = [
  "All Customers",
  "VVIP",
  "VIP",
  "Loyal",
  "New",
  "At Risk",
  "Inactive",
];

const OBJECTIVE_OPTIONS = [
  "Retention (Prevent Churn)",
  "Upsell / Cross-sell",
  "Welcome / Onboarding",
  "Win-back (Re-engagement)",
];

const TONE_OPTIONS = [
  "Professional & Direct",
  "Friendly & Casual",
  "Urgent & Exciting",
  "Empathetic & Caring",
];

function statusClasses(status) {
  if (status === "Active") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (status === "Draft") return "bg-gray-100 text-gray-700 border-gray-200";
  return "bg-amber-50 text-amber-700 border-amber-200";
}

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [showFormModal, setShowFormModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [currentCampaign, setCurrentCampaign] = useState(null);
  const [recipients, setRecipients] = useState(null);

  const [campaignForm, setCampaignForm] = useState(INITIAL_FORM_STATE);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [sendAction, setSendAction] = useState(null);
  const [formError, setFormError] = useState("");
  const [toast, setToast] = useState("");

  const loadCampaigns = useCallback(async () => {
    try {
      const res = await api.get("/api/campaigns");
      setCampaigns(res.data);
      setLoadError("");
    } catch {
      setLoadError("Failed to load campaigns. Is the backend running on port 8000?");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(""), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const openCreateModal = () => {
    setCampaignForm(INITIAL_FORM_STATE);
    setSendAction(null);
    setFormError("");
    setShowFormModal(true);
  };

  const openEditModal = (campaign) => {
    setCampaignForm({ ...INITIAL_FORM_STATE, ...campaign });
    setSendAction(campaign.status === "Scheduled" ? "schedule" : null);
    setFormError("");
    setShowFormModal(true);
  };

  const openViewModal = async (campaign) => {
    setCurrentCampaign(campaign);
    setRecipients(null);
    setShowViewModal(true);
    try {
      const res = await api.get(`/api/campaigns/${campaign.id}/recipients?limit=5`);
      setRecipients(res.data);
    } catch {
      setRecipients({ total: campaign.recipientCount || 0, sample: [] });
    }
  };

  const handleDelete = async (campaign) => {
    if (!window.confirm(`Delete "${campaign.name}"? This cannot be undone.`)) return;
    setDeletingId(campaign.id);
    try {
      await api.delete(`/api/campaigns/${campaign.id}`);
      setCampaigns((prev) => prev.filter((item) => item.id !== campaign.id));
      setToast(`Deleted "${campaign.name}".`);
    } catch {
      setToast("Delete failed. Check the backend logs.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleGenerateEmail = async () => {
    if (!campaignForm.name.trim() || !campaignForm.keyDetails.trim()) {
      setFormError("Enter a campaign name and key details before generating.");
      return;
    }

    setFormError("");
    setIsGenerating(true);
    try {
      const res = await api.post("/api/ai/generate-email", {
        name: campaignForm.name,
        target: campaignForm.target,
        objective: campaignForm.objective,
        tone: campaignForm.tone,
        details: campaignForm.keyDetails,
      });
      setCampaignForm((prev) => ({
        ...prev,
        emailBody: res.data.email,
        recipientCount: res.data.recipientCount ?? prev.recipientCount,
      }));
    } catch (error) {
      setFormError(
        error.response?.status === 503
          ? "AI service is not configured. Set GEMINI_API_KEY in retainiq-backend/.env, or write the email manually below."
          : "Email generation failed. You can still write the content manually below."
      );
      setCampaignForm((prev) => ({
        ...prev,
        emailBody: prev.emailBody || `Subject: ${prev.name}\n\n`,
      }));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFinalizeCampaign = async (status) => {
    if (status === "Scheduled" && !campaignForm.scheduledDate) {
      setFormError("Select a date and time before scheduling.");
      return;
    }
    if (!campaignForm.emailBody.trim()) {
      setFormError("Generate or write the email content before saving.");
      return;
    }

    setFormError("");
    setIsSaving(true);

    const payload = {
      name: campaignForm.name,
      target: campaignForm.target,
      objective: campaignForm.objective,
      tone: campaignForm.tone,
      keyDetails: campaignForm.keyDetails,
      emailBody: campaignForm.emailBody,
      scheduledDate: campaignForm.scheduledDate,
      status,
    };

    try {
      if (campaignForm.id) {
        const res = await api.put(`/api/campaigns/${campaignForm.id}`, payload);
        setCampaigns((prev) =>
          prev.map((item) => (item.id === res.data.id ? res.data : item))
        );
      } else {
        const res = await api.post("/api/campaigns", payload);
        setCampaigns((prev) => [res.data, ...prev]);
      }

      setShowFormModal(false);
      setCampaignForm(INITIAL_FORM_STATE);
      setSendAction(null);
      setToast(
        status === "Active"
          ? "Campaign sent to customers."
          : `Campaign saved as ${status.toLowerCase()}.`
      );
    } catch {
      setFormError("Save failed. Check the backend logs.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 max-w-7xl mx-auto h-full min-h-0">
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-[var(--color-border)] shadow-sm">
        <div>
          <h1 className="font-display text-3xl font-bold">Campaigns CRM</h1>
          <p className="text-sm text-ink/60 mt-1 font-medium">
            Create and manage targeted AI engagements.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 rounded-xl bg-[var(--color-brand)] text-white px-5 py-2.5 text-sm font-bold shadow-sm hover:opacity-90 transition-opacity"
        >
          <Plus size={16} /> Create Campaign
        </button>
      </div>

      {toast && (
        <div className="p-4 rounded-xl text-sm font-bold flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 size={18} /> {toast}
        </div>
      )}

      {loadError && (
        <div className="p-4 rounded-xl text-sm font-bold flex items-center gap-2 bg-rose-50 text-rose-700 border border-rose-200">
          <AlertTriangle size={18} /> {loadError}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 border-b-2 border-[var(--color-border)]">
            <tr>
              <th className="px-6 py-4 font-bold text-ink/60 uppercase tracking-wider text-xs">Name</th>
              <th className="px-6 py-4 font-bold text-ink/60 uppercase tracking-wider text-xs">Target Segment</th>
              <th className="px-6 py-4 font-bold text-ink/60 uppercase tracking-wider text-xs">Recipients</th>
              <th className="px-6 py-4 font-bold text-ink/60 uppercase tracking-wider text-xs">Status</th>
              <th className="px-6 py-4 font-bold text-ink/60 uppercase tracking-wider text-xs">Created</th>
              <th className="px-6 py-4 font-bold text-ink/60 uppercase tracking-wider text-xs text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center gap-2 text-[var(--color-brand)]">
                    <Loader2 size={32} className="animate-spin" />
                    <p className="font-bold text-lg text-ink">Loading campaigns...</p>
                  </div>
                </td>
              </tr>
            ) : campaigns.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-ink/50 font-medium">
                  No campaigns found. Create one to get started.
                </td>
              </tr>
            ) : (
              campaigns.map((camp) => (
                <tr key={camp.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-ink">{camp.name}</td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-bold border border-blue-200">
                      {camp.target}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-ink/70">{camp.recipientCount}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${statusClasses(camp.status)}`}>
                      {camp.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-ink/60">{camp.created}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openViewModal(camp)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View details"
                      >
                        <Eye size={16} />
                      </button>
                      {camp.status !== "Active" && (
                        <button
                          onClick={() => openEditModal(camp)}
                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Edit draft"
                        >
                          <Edit2 size={16} />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(camp)}
                        disabled={deletingId === camp.id}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-40"
                        title="Delete"
                      >
                        {deletingId === camp.id ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showFormModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col overflow-hidden"
            style={{ maxHeight: "min(88vh, 900px)" }}
          >
            {/* Pinned modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)] shrink-0">
              <h2 className="text-xl font-bold font-display flex items-center gap-2">
                <Sparkles className="text-[var(--color-brand)]" />
                {campaignForm.id ? "Edit Campaign Draft" : "Generate AI Campaign"}
              </h2>
              <button
                onClick={() => setShowFormModal(false)}
                className="hover:bg-gray-100 p-1 rounded-full"
              >
                <X size={20} />
              </button>
            </div>
            {/* Scrolling modal body */}
            <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-bold mb-1.5">Campaign Name</label>
                  <input
                    type="text"
                    value={campaignForm.name}
                    onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })}
                    className="w-full rounded-xl border-2 border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[var(--color-brand)]"
                    placeholder="e.g. Summer Flash Sale"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1.5">Target Segment</label>
                  <select
                    value={campaignForm.target}
                    onChange={(e) => setCampaignForm({ ...campaignForm, target: e.target.value })}
                    className="w-full rounded-xl border-2 border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[var(--color-brand)]"
                  >
                    {TARGET_OPTIONS.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1.5">Objective</label>
                  <select
                    value={campaignForm.objective}
                    onChange={(e) => setCampaignForm({ ...campaignForm, objective: e.target.value })}
                    className="w-full rounded-xl border-2 border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[var(--color-brand)]"
                  >
                    {OBJECTIVE_OPTIONS.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1.5">Tone of Voice</label>
                  <select
                    value={campaignForm.tone}
                    onChange={(e) => setCampaignForm({ ...campaignForm, tone: e.target.value })}
                    className="w-full rounded-xl border-2 border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[var(--color-brand)]"
                  >
                    {TONE_OPTIONS.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-bold mb-1.5">
                    Key Details / Offers (Instructions for AI)
                  </label>
                  <textarea
                    rows="3"
                    value={campaignForm.keyDetails}
                    onChange={(e) => setCampaignForm({ ...campaignForm, keyDetails: e.target.value })}
                    className="w-full rounded-xl border-2 border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[var(--color-brand)] resize-none"
                    placeholder="e.g. Mention a 20% off code SAVE20 valid until month end."
                  />
                </div>
              </div>
              {formError && (
                <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-sm font-bold text-amber-800">
                  {formError}
                </div>
              )}
              <button
                onClick={handleGenerateEmail}
                disabled={isGenerating}
                className="w-full py-3 mb-5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-70"
              >
                {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
                {isGenerating
                  ? "AI is writing your email..."
                  : campaignForm.emailBody
                  ? "Regenerate Email Content"
                  : "Generate Email Content"}
              </button>
              {campaignForm.emailBody && !isGenerating && (
                <div className="flex flex-col gap-4 border-t border-[var(--color-border)] pt-5">
                  <div>
                    <label className="block text-sm font-bold text-emerald-600 mb-1.5 flex items-center gap-1">
                      <CheckCircle2 size={16} /> Email content (editable)
                    </label>
                    <textarea
                      rows="10"
                      className="w-full rounded-xl border-2 border-emerald-500/30 bg-emerald-50/30 px-4 py-3 text-sm font-medium outline-none focus:border-emerald-500 resize-y"
                      value={campaignForm.emailBody}
                      onChange={(e) => setCampaignForm({ ...campaignForm, emailBody: e.target.value })}
                    />
                  </div>
                  {sendAction === "schedule" && (
                    <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                      <label className="block text-sm font-bold text-amber-900 mb-2">
                        Select date and time to send:
                      </label>
                      <input
                        type="datetime-local"
                        className="w-full rounded-lg border border-amber-300 px-3 py-2 outline-none"
                        value={campaignForm.scheduledDate}
                        onChange={(e) =>
                          setCampaignForm({ ...campaignForm, scheduledDate: e.target.value })
                        }
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
            {/* Pinned modal footer */}
            {campaignForm.emailBody && !isGenerating && (
              <div className="flex flex-wrap justify-end gap-2 px-6 py-4 border-t border-[var(--color-border)] bg-gray-50 shrink-0">
                <button
                  onClick={() => handleFinalizeCampaign("Draft")}
                  disabled={isSaving}
                  className="px-4 py-2.5 rounded-xl font-bold text-sm text-gray-700 bg-white border border-gray-200 hover:bg-gray-100 flex items-center gap-2 disabled:opacity-50"
                >
                  <Save size={15} /> Save Draft
                </button>
                {sendAction !== "schedule" ? (
                  <button
                    onClick={() => setSendAction("schedule")}
                    disabled={isSaving}
                    className="px-4 py-2.5 rounded-xl font-bold text-sm text-amber-700 bg-amber-100 hover:bg-amber-200 flex items-center gap-2 disabled:opacity-50"
                  >
                    <CalendarClock size={15} /> Plan Schedule
                  </button>
                ) : (
                  <button
                    onClick={() => handleFinalizeCampaign("Scheduled")}
                    disabled={isSaving}
                    className="px-4 py-2.5 rounded-xl font-bold text-sm text-white bg-amber-600 hover:bg-amber-700 flex items-center gap-2 disabled:opacity-50"
                  >
                    <CheckCircle2 size={15} /> Confirm Schedule
                  </button>
                )}
                <button
                  onClick={() => handleFinalizeCampaign("Active")}
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl font-bold text-sm bg-[var(--color-brand)] hover:bg-[var(--color-brand-dark)] text-white flex items-center gap-2 disabled:opacity-50"
                >
                  {isSaving ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                  Submit & Send
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {showViewModal && currentCampaign && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden"
            style={{ maxHeight: "min(85vh, 800px)" }}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)] shrink-0">
              <h2 className="text-xl font-bold font-display truncate pr-4">
                {currentCampaign.name}
              </h2>
              <button
                onClick={() => setShowViewModal(false)}
                className="hover:bg-gray-100 p-1 rounded-full shrink-0"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 space-y-5 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div className="min-w-0">
                  <span className="text-ink/50 block font-bold mb-1 text-xs uppercase">Status</span>
                  <span className={`px-2 py-1 rounded-md text-xs font-bold border inline-block ${statusClasses(currentCampaign.status)}`}>
                    {currentCampaign.status}
                    {currentCampaign.status === "Scheduled" && currentCampaign.scheduledDate
                      ? ` (${currentCampaign.scheduledDate.replace("T", " ")})`
                      : ""}
                  </span>
                </div>
                <div className="min-w-0">
                  <span className="text-ink/50 block font-bold mb-1 text-xs uppercase">Created</span>
                  <span className="font-semibold">{currentCampaign.created}</span>
                </div>
                <div className="col-span-2 min-w-0">
                  <span className="text-ink/50 block font-bold mb-1 text-xs uppercase">Objective</span>
                  <span className="font-semibold">{currentCampaign.objective}</span>
                </div>
              </div>
              <div>
                <span className="text-ink/50 block font-bold mb-2 text-xs uppercase">Recipients</span>
                <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4">
                  {recipients === null ? (
                    <div className="flex items-center gap-2 text-blue-900 font-bold">
                      <Loader2 size={16} className="animate-spin" /> Resolving recipients...
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 mb-2 font-bold text-blue-900">
                        <Users size={16} />
                        {currentCampaign.target} ({recipients.total} customers)
                      </div>
                      {recipients.sample.length > 0 ? (
                        <p className="text-xs text-blue-800/80 leading-relaxed break-all">
                          {recipients.sample.join(", ")}
                          {recipients.total > recipients.sample.length &&
                            `, and ${recipients.total - recipients.sample.length} more`}
                        </p>
                      ) : (
                        <p className="text-xs text-blue-800/80 italic">
                          No customers currently match this segment.
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>
              <div>
                <span className="text-ink/50 block font-bold mb-2 text-xs uppercase">Email Content</span>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 whitespace-pre-wrap break-words font-medium text-gray-800">
                  {currentCampaign.emailBody || "No email content available."}
                </div>
              </div>
            </div>
            <div className="flex justify-end px-6 py-4 border-t border-[var(--color-border)] bg-gray-50 shrink-0">
              <button
                onClick={() => setShowViewModal(false)}
                className="px-5 py-2.5 bg-white border border-gray-200 hover:bg-gray-100 rounded-xl font-bold text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}