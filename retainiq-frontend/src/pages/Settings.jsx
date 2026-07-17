export default function Settings() {
  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto pb-10">
      <div className="bg-white p-6 rounded-2xl border border-[var(--color-border)] shadow-sm">
        <h1 className="font-display text-3xl font-bold">Platform Settings</h1>
        <p className="text-sm text-ink/60 mt-1 font-medium">Manage preferences, company details, and API integrations.</p>
      </div>

      <div className="bg-white p-8 rounded-2xl border border-[var(--color-border)] shadow-sm space-y-8">
        
        {/* Profile & Role */}
        <section>
          <h2 className="text-xl font-bold font-display mb-6 border-b border-gray-100 pb-4">Profile & Role</h2>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-ink mb-2">Full Name</label>
              <input type="text" defaultValue="John Lee" className="w-full rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-medium outline-none focus:border-[var(--color-brand)]" />
            </div>
            <div>
              <label className="block text-sm font-bold text-ink mb-2">Role (Admin Only)</label>
              <select className="w-full rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-medium outline-none focus:border-[var(--color-brand)]">
                <option>Customer Success Manager</option>
                <option>Sales Manager</option>
                <option>Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-ink mb-2">Company Name</label>
              <input type="text" defaultValue="Tech Corp Inc." className="w-full rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-medium outline-none focus:border-[var(--color-brand)]" />
            </div>
            <div>
              <label className="block text-sm font-bold text-ink mb-2">Language</label>
              <select className="w-full rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-medium outline-none focus:border-[var(--color-brand)]">
                <option>English</option>
                <option>Mandarin</option>
              </select>
            </div>
          </div>
        </section>

        {/* Preferences */}
        <section>
          <h2 className="text-xl font-bold font-display mb-6 border-b border-gray-100 pb-4">System Preferences</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl border border-gray-200">
              <div>
                <p className="font-bold text-sm">Dark Theme</p>
                <p className="text-xs font-medium text-ink/60">Toggle dark mode for the entire dashboard.</p>
              </div>
              <input type="checkbox" className="w-5 h-5 rounded text-[var(--color-brand)]" />
            </div>
            <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl border border-gray-200">
              <div>
                <p className="font-bold text-sm">Email Notifications</p>
                <p className="text-xs font-medium text-ink/60">Receive daily AI churn risk summaries.</p>
              </div>
              <input type="checkbox" defaultChecked className="w-5 h-5 rounded text-[var(--color-brand)]" />
            </div>
          </div>
        </section>

        {/* Advanced API */}
        <section>
          <h2 className="text-xl font-bold font-display mb-6 border-b border-gray-100 pb-4">API Configuration</h2>
          <div>
            <label className="block text-sm font-bold text-ink mb-2">Gemini API Key (Future Feature)</label>
            <input type="password" defaultValue="********" className="w-full rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-medium outline-none focus:border-[var(--color-brand)]" />
          </div>
        </section>

        <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end gap-3">
          <button className="px-6 py-2.5 rounded-xl font-bold text-ink/70 hover:bg-gray-100 transition-colors">Cancel</button>
          <button className="px-6 py-2.5 rounded-xl font-bold bg-[var(--color-brand)] text-white hover:bg-[var(--color-brand-dark)] shadow-sm transition-colors">Save Settings</button>
        </div>
      </div>
    </div>
  );
}