import { useState, useEffect } from "react";
import { Save, BrainCircuit, Bell, User, Key } from "lucide-react";
import api from "../lib/api";

export default function Settings() {
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState({ name: "", role: "", company: "" });

  useEffect(() => {
     api.get('/api/settings').then(res => setSettings(res.data)).catch(console.error);
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
        await api.post('/api/settings', settings);
        alert("Settings saved to backend!");
    } catch(e) {
        alert("Failed to save settings");
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto pb-10">
      <div className="bg-white p-6 rounded-2xl border border-[var(--color-border)] shadow-sm flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Platform Settings</h1>
          <p className="text-sm text-ink/60 mt-1 font-medium">Manage preferences, company details, and AI API integrations.</p>
        </div>
      </div>

      <div className="bg-white p-8 rounded-2xl border border-[var(--color-border)] shadow-sm space-y-10">
        <section>
          <h2 className="text-xl font-bold font-display mb-6 border-b border-gray-100 pb-4 flex items-center gap-2">
            <User size={20} className="text-[var(--color-brand)]" /> Profile & Role
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-ink mb-2">Full Name</label>
              <input type="text" value={settings.name || ""} onChange={(e) => setSettings({...settings, name: e.target.value})} className="w-full rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-medium outline-none focus:border-[var(--color-brand)]" />
            </div>
            <div>
              <label className="block text-sm font-bold text-ink mb-2">Role</label>
              <input type="text" value={settings.role || ""} onChange={(e) => setSettings({...settings, role: e.target.value})} className="w-full rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-medium outline-none focus:border-[var(--color-brand)]" />
            </div>
            <div>
              <label className="block text-sm font-bold text-ink mb-2">Company Name</label>
              <input type="text" value={settings.company || ""} onChange={(e) => setSettings({...settings, company: e.target.value})} className="w-full rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-medium outline-none focus:border-[var(--color-brand)]" />
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold font-display mb-6 border-b border-gray-100 pb-4 flex items-center gap-2">
            <BrainCircuit size={20} className="text-amber-500" /> AI Engine Configuration
          </h2>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-ink mb-2 flex items-center gap-2">
                <Key size={16} className="text-ink/60"/> External AI Model Key (Optional)
              </label>
              <input type="password" placeholder="Configured via Backend environment variables..." disabled className="w-full rounded-xl border-2 border-gray-200 bg-gray-100 px-4 py-2.5 text-sm font-medium outline-none font-mono" />
              <p className="text-xs text-ink/50 font-bold mt-1.5">This application relies on the FastAPI backend for AI calls.</p>
            </div>
          </div>
        </section>

        <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end gap-3">
          <button className="px-6 py-2.5 rounded-xl font-bold text-ink/70 hover:bg-gray-100 transition-colors">Cancel</button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold bg-[var(--color-ink)] text-white hover:bg-opacity-90 shadow-sm transition-colors"
          >
            <Save size={18} />
            {isSaving ? "Saving to Database..." : "Save Settings"}
          </button>
        </div>
      </div>
    </div>
  );
}