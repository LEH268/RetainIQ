import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import RiskBadge from "../components/RiskBadge";
import { customers } from "../data/mockCustomers";

export default function Customers() {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) => c.name.toLowerCase().includes(q) || c.company.toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">Customers</h1>
          <p className="text-sm text-ink/60">Search, review health scores, and spot churn risk.</p>
        </div>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or company"
            className="w-72 rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-[var(--color-brand)]"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] text-left text-xs uppercase tracking-wide text-ink/50">
              <th className="px-5 py-3 font-medium">Customer</th>
              <th className="px-5 py-3 font-medium">Plan</th>
              <th className="px-5 py-3 font-medium">Health Score</th>
              <th className="px-5 py-3 font-medium">Churn Probability</th>
              <th className="px-5 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-brand-soft)]/40">
                <td className="px-5 py-3">
                  <Link to={`/customers/${c.id}`} className="font-medium hover:text-[var(--color-brand)]">
                    {c.name}
                  </Link>
                  <p className="text-xs text-ink/60">{c.company}</p>
                </td>
                <td className="px-5 py-3">{c.plan}</td>
                <td className="px-5 py-3">{c.healthScore}/100</td>
                <td className="px-5 py-3">{c.churnProbability}%</td>
                <td className="px-5 py-3"><RiskBadge risk={c.risk} /></td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-ink/50">
                  No customers match "{query}".
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
