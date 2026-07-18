import { useMemo, useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search, Download, Filter, Sparkles, Loader2 } from "lucide-react";
import RiskBadge from "../components/RiskBadge";
import { downloadCSV } from "../utils/exportCsv";
import api from "../lib/api";
import { mapCustomer } from "../utils/dataMapper";

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState("");
  
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const statusFilter = searchParams.get("status") || "All";
  const riskFilter = searchParams.get("risk") || "All";
  const segmentFilter = searchParams.get("segment") || "All";

  useEffect(() => {
    api.get("/api/customers").then(res => {
      setCustomers(res.data.map(mapCustomer));
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  const updateFilters = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value === "All") {
      newParams.delete(key);
    } else {
      newParams.set(key, value);
    }
    setSearchParams(newParams);
  };
  
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const filtered = useMemo(() => {
    let result = customers.filter((c) => {
      const matchesQuery = query === "" || 
        c.name.toLowerCase().includes(query.toLowerCase()) || 
        c.company.toLowerCase().includes(query.toLowerCase());
      const matchesStatus = statusFilter === "All" || c.status === statusFilter;
      const matchesRisk = riskFilter === "All" || c.risk === riskFilter;
      const matchesSegment = segmentFilter === "All" || c.segment === segmentFilter;
      
      return matchesQuery && matchesStatus && matchesRisk && matchesSegment;
    });

    if (sortConfig.key) {
        result.sort((a, b) => {
            if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
            if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }

    return result;
  }, [query, statusFilter, riskFilter, segmentFilter, customers, sortConfig]);

  const handleExport = () => {
    const exportData = filtered.map(c => ({
      Customer_Name: c.name, Company: c.company, Email: c.email, Status: c.status, Plan: c.plan,
      Health_Score: c.healthScore, Churn_Probability: `${c.churnProbability}%`, Risk: c.risk, Segment: c.segment
    }));
    downloadCSV(exportData, "filtered-customers-list.csv");
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-10">
      <div className="bg-white p-6 rounded-2xl border border-[var(--color-border)] shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display text-3xl font-bold">Customers AI Directory</h1>
            <p className="text-sm font-medium text-ink/60 mt-1">Filter cohorts, review health scores, and simulate AI retention strategies.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name, company..."
                className="w-full lg:w-64 rounded-xl border-2 border-[var(--color-border)] bg-gray-50 py-2.5 pl-10 pr-4 text-sm font-medium outline-none focus:border-[var(--color-brand)] focus:bg-white transition-all shadow-sm"
              />
            </div>
            <button onClick={handleExport} className="flex items-center gap-2 rounded-xl bg-[var(--color-ink)] text-white px-5 py-2.5 text-sm font-bold hover:bg-[var(--color-ink)]/90 transition-all shadow-sm">
              <Download size={16} /> Export CSV
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 py-4 border-t border-[var(--color-border)]">
          <div className="flex items-center gap-2 text-sm font-bold text-ink/70">
            <Filter size={16} /> Filters:
          </div>
          
          <select value={statusFilter} onChange={(e) => updateFilters("status", e.target.value)} className="rounded-lg border-2 border-[var(--color-border)] bg-white px-3 py-1.5 text-sm font-medium outline-none focus:border-[var(--color-brand)] cursor-pointer">
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="New">New</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          
          <select value={riskFilter} onChange={(e) => updateFilters("risk", e.target.value)} className="rounded-lg border-2 border-[var(--color-border)] bg-white px-3 py-1.5 text-sm font-medium outline-none focus:border-[var(--color-brand)] cursor-pointer">
            <option value="All">All Risks</option>
            <option value="Healthy">Healthy</option>
            <option value="Moderate Risk">Moderate Risk</option>
            <option value="High Risk">High Risk</option>
          </select>
          
          <select value={segmentFilter} onChange={(e) => updateFilters("segment", e.target.value)} className="rounded-lg border-2 border-[var(--color-border)] bg-white px-3 py-1.5 text-sm font-medium outline-none focus:border-[var(--color-brand)] cursor-pointer">
            <option value="All">All Segments</option>
            <option value="VIP">VIP</option>
            <option value="Loyal">Loyal</option>
            <option value="New">New</option>
            <option value="At Risk">At Risk</option>
            <option value="Inactive">Inactive</option>
          </select>

          {(statusFilter !== "All" || riskFilter !== "All" || segmentFilter !== "All") && (
            <button onClick={() => setSearchParams(new URLSearchParams())} className="text-xs font-bold text-[var(--color-brand)] hover:underline ml-auto">
              Clear Filters
            </button>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white shadow-sm">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-gray-50 text-xs uppercase tracking-wider text-ink/50 font-bold">
              <th className="px-6 py-4">Customer</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Segment</th>
              <th className="px-6 py-4 cursor-pointer hover:text-[var(--color-brand)]" onClick={() => handleSort('healthScore')}>
                Health Score {sortConfig.key === 'healthScore' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
              </th>
              <th className="px-6 py-4 cursor-pointer hover:text-[var(--color-brand)]" onClick={() => handleSort('churnProbability')}>
                Churn Prob. {sortConfig.key === 'churnProbability' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
              </th>
              <th className="px-6 py-4">Risk Level</th>
              <th className="px-6 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center gap-2 text-[var(--color-brand)]">
                    <Loader2 size={32} className="animate-spin" />
                    <p className="font-bold text-lg text-ink">Syncing Database...</p>
                  </div>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center gap-2 text-ink/50">
                    <Search size={32} />
                    <p className="font-bold text-lg">No customers found</p>
                    <p className="text-sm font-medium">Try adjusting your filters or search query.</p>
                  </div>
                </td>
              </tr>
            ) : filtered.map((c) => (
              <tr key={c.id} className="hover:bg-blue-50/30 transition-colors group">
                <td className="px-6 py-4">
                  <Link to={`/customers/${c.id}`} className="font-bold text-ink group-hover:text-[var(--color-brand)] transition-colors text-base">{c.name}</Link>
                  <p className="text-xs font-medium text-ink/50 mt-0.5">{c.company}</p>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 text-xs font-bold rounded-md border ${c.status === 'Active' ? 'bg-green-50 text-green-700 border-green-200' : c.status === 'Cancelled' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>{c.status}</span>
                </td>
                <td className="px-6 py-4"><span className="px-2.5 py-1 bg-gray-50 border border-gray-200 text-gray-700 rounded-md text-xs font-bold shadow-sm">{c.segment}</span></td>
                <td className="px-6 py-4 font-bold text-lg">{c.healthScore}<span className="text-xs text-ink/40 font-medium">/100</span></td>
                <td className="px-6 py-4 font-bold text-lg">{c.churnProbability}%</td>
                <td className="px-6 py-4"><RiskBadge risk={c.risk} /></td>
                <td className="px-6 py-4 text-right relative">
                  <Link to={`/customers/${c.id}`} className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-[var(--color-brand-soft)] text-[var(--color-brand)] rounded-xl hover:bg-[var(--color-brand)] hover:text-white transition-all group-hover:shadow-md">
                    <Sparkles size={14} /> Analyze AI
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}