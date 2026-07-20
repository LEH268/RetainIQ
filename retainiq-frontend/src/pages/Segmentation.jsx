import { useState, useEffect } from "react";
import {
  Users, TrendingUp, ShieldAlert, Send, Sparkles, CheckCircle2,
  Loader2, ArrowRight, AlertTriangle, RefreshCw, Plus, X, Pencil, Check,
} from "lucide-react";
import { Link } from "react-router-dom";
import api from "../lib/api";

export default function Segmentation() {
  const [segments, setSegments] = useState([]);
  const [selectedSeg, setSelectedSeg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [protocol, setProtocol] = useState([]);
  const [actionsLoading, setActionsLoading] = useState(false);
  const [aiGenerated, setAiGenerated] = useState(false);
  const [focus, setFocus] = useState("");

  const [library, setLibrary] = useState([]);
  const [showLibrary, setShowLibrary] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editDraft, setEditDraft] = useState("");
  const [customAction, setCustomAction] = useState("");

  const [bulkActionStatus, setBulkActionStatus] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    api
      .get("/api/segments")
      .then((res) => {
        setSegments(res.data);
        setSelectedSeg(res.data.find((s) => s.name === "At Risk") || res.data[0] || null);
      })
      .catch(() => setError("Failed to load segments. Is the backend running?"))
      .finally(() => setLoading(false));

    api
      .get("/api/segments/action-library")
      .then((res) => setLibrary(res.data.actions || []))
      .catch(() => setLibrary([]));
  }, []);

  const loadActions = (segment) => {
    if (!segment) return;
    setActionsLoading(true);
    setBulkActionStatus("");
    setEditingIndex(null);
    api
      .get(`/api/segments/${encodeURIComponent(segment.name)}/actions?count=4`)
      .then((res) => {
        setProtocol((res.data.actions || []).map((text) => ({ text, selected: true })));
        setAiGenerated(res.data.aiGenerated);
        setFocus(res.data.focus || "");
      })
      .catch(() => setProtocol([]))
      .finally(() => setActionsLoading(false));
  };

  useEffect(() => {
    loadActions(selectedSeg);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSeg]);

  const toggleAction = (index) => {
    setProtocol((prev) =>
      prev.map((item, i) => (i === index ? { ...item, selected: !item.selected } : item))
    );
  };

  const removeAction = (index) => {
    setProtocol((prev) => prev.filter((_, i) => i !== index));
  };

  const startEdit = (index) => {
    setEditingIndex(index);
    setEditDraft(protocol[index].text);
  };

  const commitEdit = () => {
    if (!editDraft.trim()) return;
    setProtocol((prev) =>
      prev.map((item, i) => (i === editingIndex ? { ...item, text: editDraft.trim() } : item))
    );
    setEditingIndex(null);
    setEditDraft("");
  };

  const addAction = (text) => {
    if (!text.trim()) return;
    setProtocol((prev) => [...prev, { text: text.trim(), selected: true }]);
    setCustomAction("");
    setShowLibrary(false);
  };

  const selectedActions = protocol.filter((item) => item.selected).map((item) => item.text);

  const handleBulkAction = async () => {
    if (!selectedSeg || selectedActions.length === 0) return;
    setIsProcessing(true);
    setBulkActionStatus("");
    try {
      const res = await api.post("/api/segments/bulk-action", {
        segment: selectedSeg.name,
        actions: selectedActions,
      });
      setBulkActionStatus(res.data.message);
    } catch {
      setBulkActionStatus("Bulk action failed. Check the backend logs.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center font-display text-lg text-ink/50">
        <Loader2 className="animate-spin mr-2" /> Loading segments...
      </div>
    );
  }

  if (error || !selectedSeg) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <AlertTriangle size={40} className="text-rose-500" />
        <p className="font-bold text-lg">{error || "No segments available."}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-10">
      <div className="bg-white p-6 rounded-2xl border border-[var(--color-border)] shadow-sm">
        <h1 className="font-display text-3xl font-bold">AI Customer Segmentation</h1>
        <p className="text-sm text-ink/60 mt-1 font-medium">
          Segments derived live from churn scores, plan mix, tenure, and engagement.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        <div className="w-full lg:w-1/3 flex flex-col gap-3">
          {segments.map((seg) => (
            <div
              key={seg.name}
              onClick={() => setSelectedSeg(seg)}
              className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                selectedSeg.name === seg.name
                  ? "bg-white shadow-md border-[var(--color-brand)]"
                  : "bg-white border-transparent hover:border-gray-200"
              }`}
            >
              <div>
                <h3 className="font-bold font-display text-lg">{seg.displayName}</h3>
                <p className="text-xs font-bold text-ink/50 uppercase">
                  {seg.users} users · avg age {seg.averageAge}
                </p>
              </div>
              <ArrowRight
                size={18}
                className={selectedSeg.name === seg.name ? "text-[var(--color-brand)]" : "text-transparent"}
              />
            </div>
          ))}
        </div>

        <div className="w-full lg:w-2/3 bg-white rounded-2xl border border-[var(--color-border)] shadow-sm overflow-hidden">
          <div className="p-8 bg-gray-50 border-b border-[var(--color-border)]">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-3xl font-display font-black">{selectedSeg.displayName}</h2>
              <Link
                to={`/customers?segment=${encodeURIComponent(selectedSeg.name)}`}
                className="px-4 py-2 bg-white rounded-xl text-sm font-bold shadow-sm border border-[var(--color-border)] hover:text-[var(--color-brand)] transition-colors"
              >
                View Customer List
              </Link>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-200">
              <p className="text-ink/80 font-medium text-sm leading-relaxed">
                {selectedSeg.description}
              </p>
              {focus && (
                <p className="text-xs font-bold text-[var(--color-brand)] mt-2 uppercase tracking-wide">
                  Strategic focus: {focus}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-4 divide-x divide-[var(--color-border)] border-b border-[var(--color-border)]">
            {[
              { icon: Users, color: "text-ink/40", label: "Users", value: selectedSeg.users },
              { icon: TrendingUp, color: "text-emerald-500", label: "Avg Revenue", value: selectedSeg.avgRevenue },
              { icon: ShieldAlert, color: "text-rose-500", label: "Avg Risk", value: selectedSeg.avgRisk },
              { icon: Users, color: "text-blue-500", label: "Avg Age", value: selectedSeg.averageAge },
            ].map(({ icon: Icon, color, label, value }) => (
              <div key={label} className="p-5 flex flex-col items-center text-center">
                <Icon className={`${color} mb-2`} size={20} />
                <p className="text-xs font-bold text-ink/50 uppercase">{label}</p>
                <p className="text-xl font-black font-display mt-1">{value}</p>
              </div>
            ))}
          </div>

          <div className="p-8 bg-gradient-to-b from-white to-blue-50/30">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Sparkles className="text-[var(--color-brand)]" size={24} />
                <h3 className="font-bold text-xl font-display">AI Recommended Bulk Actions</h3>
                {aiGenerated && (
                  <span className="text-[10px] font-black uppercase bg-[var(--color-brand-soft)] text-[var(--color-brand-dark)] px-2 py-0.5 rounded-md">
                    Live AI
                  </span>
                )}
              </div>
              <button
                onClick={() => loadActions(selectedSeg)}
                disabled={actionsLoading}
                className="flex items-center gap-1.5 text-xs font-bold text-ink/60 hover:text-[var(--color-brand)] disabled:opacity-40"
              >
                <RefreshCw size={14} className={actionsLoading ? "animate-spin" : ""} /> Regenerate
              </button>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-6">
              <div className="flex items-start gap-4 mb-6 pb-6 border-b border-gray-100">
                <div className="bg-amber-100 text-amber-700 p-3 rounded-lg shrink-0">
                  <ShieldAlert size={24} />
                </div>
                <div>
                  <p className="text-sm font-bold text-ink/60 uppercase tracking-wider mb-1">
                    AI Detected
                  </p>
                  <p className="text-2xl font-black font-display text-ink">
                    {selectedSeg.detected} {selectedSeg.name} customers
                  </p>
                  <p className="text-sm text-ink/60 mt-1">
                    Flagged as non-healthy and eligible for this protocol.
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-bold text-ink/60 uppercase tracking-wider">
                    Action Protocol
                  </p>
                  <p className="text-xs font-bold text-ink/50">
                    {selectedActions.length} of {protocol.length} selected
                  </p>
                </div>

                {actionsLoading ? (
                  <div className="flex items-center gap-2 text-sm font-bold text-ink/50 py-6">
                    <Loader2 size={16} className="animate-spin" /> AI is designing a protocol for{" "}
                    {selectedSeg.name}...
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {protocol.map((item, index) => (
                      <li
                        key={index}
                        className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                          item.selected
                            ? "bg-[var(--color-brand-soft)]/40 border-[var(--color-brand)]/30"
                            : "bg-gray-50 border-gray-100 opacity-60"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={item.selected}
                          onChange={() => toggleAction(index)}
                          className="mt-1 w-4 h-4 rounded accent-[var(--color-brand)] cursor-pointer shrink-0"
                        />

                        {editingIndex === index ? (
                          <div className="flex-1 flex gap-2">
                            <input
                              value={editDraft}
                              onChange={(e) => setEditDraft(e.target.value)}
                              onKeyDown={(e) => e.key === "Enter" && commitEdit()}
                              autoFocus
                              className="flex-1 rounded-lg border-2 border-[var(--color-brand)] px-3 py-1.5 text-sm outline-none"
                            />
                            <button
                              onClick={commitEdit}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                            >
                              <Check size={16} />
                            </button>
                            <button
                              onClick={() => setEditingIndex(null)}
                              className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <>
                            <span className="flex-1 text-sm font-bold text-ink">
                              <span className="text-[var(--color-brand)] mr-1.5">{index + 1}.</span>
                              {item.text}
                            </span>
                            <button
                              onClick={() => startEdit(index)}
                              className="p-1 text-ink/40 hover:text-[var(--color-brand)] shrink-0"
                              title="Edit"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => removeAction(index)}
                              className="p-1 text-ink/40 hover:text-rose-600 shrink-0"
                              title="Remove"
                            >
                              <X size={14} />
                            </button>
                          </>
                        )}
                      </li>
                    ))}
                  </ul>
                )}

                {!actionsLoading && (
                  <div className="mt-3">
                    {showLibrary ? (
                      <div className="border-2 border-dashed border-gray-200 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-xs font-bold text-ink/60 uppercase">Add an action</p>
                          <button
                            onClick={() => setShowLibrary(false)}
                            className="text-ink/40 hover:text-ink"
                          >
                            <X size={16} />
                          </button>
                        </div>
                        <div className="flex gap-2 mb-3">
                          <input
                            value={customAction}
                            onChange={(e) => setCustomAction(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && addAction(customAction)}
                            placeholder="Write your own action..."
                            className="flex-1 rounded-lg border-2 border-gray-200 px-3 py-2 text-sm outline-none focus:border-[var(--color-brand)]"
                          />
                          <button
                            onClick={() => addAction(customAction)}
                            className="px-4 py-2 bg-[var(--color-brand)] text-white rounded-lg text-sm font-bold"
                          >
                            Add
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {library
                            .filter((option) => !protocol.some((item) => item.text === option))
                            .map((option) => (
                              <button
                                key={option}
                                onClick={() => addAction(option)}
                                className="text-xs font-bold px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg hover:border-[var(--color-brand)] hover:text-[var(--color-brand)] transition-colors"
                              >
                                + {option}
                              </button>
                            ))}
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowLibrary(true)}
                        className="flex items-center gap-1.5 text-sm font-bold text-[var(--color-brand)] hover:underline"
                      >
                        <Plus size={16} /> Add action
                      </button>
                    )}
                  </div>
                )}
              </div>

              <button
                onClick={handleBulkAction}
                disabled={isProcessing || actionsLoading || selectedActions.length === 0}
                className="w-full py-4 rounded-xl font-bold text-white bg-[var(--color-ink)] hover:bg-opacity-90 transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
              >
                {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                {isProcessing
                  ? "Executing sequence..."
                  : selectedActions.length === 0
                  ? "Select at least one action"
                  : `Run ${selectedActions.length} action(s) on ${selectedSeg.detected} customers`}
              </button>
            </div>

            {bulkActionStatus && (
              <div className="p-4 rounded-xl text-sm font-bold flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 size={18} /> {bulkActionStatus}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}