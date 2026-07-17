import { Layers, Download } from "lucide-react";
import { segments } from "../data/mockCustomers";
import { Link } from "react-router-dom";

export default function Segmentation() {
  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-10">
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-[var(--color-border)] shadow-sm">
        <div>
          <h1 className="font-display text-3xl font-bold">AI Customer Segmentation</h1>
          <p className="text-sm text-ink/60 mt-1 font-medium">Automatic behavioral grouping[cite: 5].</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {segments.map((seg, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-[var(--color-border)] shadow-sm flex flex-col items-center justify-center text-center hover:shadow-md transition-all">
            <Layers className={`mb-4 ${seg.name === 'VIP' ? 'text-[var(--color-accent)]' : seg.name === 'At Risk' ? 'text-rose-500' : 'text-[var(--color-brand)]'}`} size={32} />
            <h2 className="text-xl font-black mb-2">{seg.name}</h2>
            <p className="text-3xl font-display font-bold text-ink/80 mb-6">{seg.value} <span className="text-sm font-bold text-ink/40">Users</span></p>
            
            <div className="w-full flex gap-3">
              <Link to={`/customers?segment=${seg.name}`} className="flex-1 py-2.5 bg-gray-50 border border-gray-200 text-sm font-bold rounded-xl hover:bg-gray-100 transition-colors">View List</Link>
              <button className="px-4 py-2.5 bg-[var(--color-brand-soft)] text-[var(--color-brand)] rounded-xl hover:bg-[var(--color-brand)] hover:text-white transition-colors"><Download size={18}/></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}