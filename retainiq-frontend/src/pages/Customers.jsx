import { useMemo, useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search, Download, Filter, Sparkles, Loader2, ChevronDown, ChevronRight } from "lucide-react";
import RiskBadge from "../components/RiskBadge";
import { downloadCSV } from "../utils/exportCsv";
import api from "../lib/api";
import { mapCustomer } from "../utils/dataMapper";

const HEALTH_LABELS = {
  excellent: "Excellent (85-100)",
  good: "Good (70-84)",
  fair: "Fair (50-69)",
  poor: "Poor (0-49)",
};

const PAGE_SIZE = 25;

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [facets, setFacets] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [expandedId, setExpandedId] = useState(null);
  const [page, setPage] = useState(1);

  const statusFilter = searchParams.get("status") || "All";
  const riskFilter = searchParams.get("risk") || "All";
  const segmentFilter = searchParams.get("segment") || "All";
  const planFilter = searchParams.get("plan") || "All";
  const healthFilter = searchParams.get("health") || "All";
  const genderFilter = searchParams.get("gender") || "All";

  useEffect(() => {
    const params = new URLSearchParams();
    if (statusFilter !== "All") params.set("status", statusFilter);
    if (riskFilter !== "All") params.set("risk", riskFilter);
    if (segmentFilter !== "All") params.set("segment", segmentFilter);
    if (planFilter !== "All") params.set("plan", planFilter);
    if (healthFilter !== "All") params.set("health", healthFilter);
    if (genderFilter !== "All") params.set("gender", genderFilter);

    setLoading(true);
    api
      .get(`/api/customers?${params.toString()}`)
      .then((res) => {
        setCustomers(res.data.map(mapCustomer));
        setPage(1);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [statusFilter, riskFilter, segmentFilter, planFilter, healthFilter, genderFilter]);

  useEffect(() => {
    api
      .get("/api/customers/facets")
      .then((res) => setFacets(res.data))
      .catch(() => setFacets(null));
  }, []);

  const updateFilters = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value === "All") newParams.delete(key);
    else newParams.set(key, value);
    setSearchParams(newParams);
  };

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") direction = "desc";
    setSortConfig({ key, direction });
    setPage(1);
  };

  const filtered = useMemo(() => {
    let result = customers.filter((c) => {
      if (!query) return true;
      const needle = query.toLowerCase();
      return (
        c.name.toLowerCase().includes(needle) ||
        c.email.toLowerCase().includes(needle)
      );
    });

    if (sortConfig.key) {
      result = [...result].sort((a, b) => {
        const left = a[sortConfig.key];
        const right = b[sortConfig.key];
        if (left < right) return sortConfig.direction === "asc" ? -1 : 1;
        if (left > right) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [query, customers, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page]
  );

  const handleExport = () => {
    const exportData = filtered.map((c) => ({
      Customer_Name: c.name,
      Age: c.age,
      Gender: c.gender,
      Email: c.email,
      Status: c.status,
      Plan: c.plan,
      Tenure: c.usageTenure,
      Health_Score: c.healthScore,
      Churn_Probability: `${c.churnProbability}%`,
      Risk: c.risk,
      Segment: c.segment,
    }));
    downloadCSV(exportData, "filtered-customers-list.csv");
  };

  const activeFilterCount = [
    statusFilter, riskFilter, segmentFilter, planFilter, healthFilter, genderFilter,
  ].filter((value) => value !== "All").length;

  const sortIndicator = (key) =>
    sortConfig.key === key ? (sortConfig.direction === "asc" ? "↑" : "↓") : "";

  return (
    // Fill the viewport, then let only the table body scroll.
    <div className="flex flex-col gap-4 max-w-7xl mx-auto h-full min-h-0">
      {/* Pinned header + filters */}
      <div className="bg-white p-5 rounded-2xl border border-[var(--color-border)] shadow-sm shrink-0">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
          <div>
            <h1 className="font-display text-2xl font-bold">Customers AI Directory</h1>
            <p className="text-sm font-medium text-ink/60 mt-0.5">
              {loading ? "Loading..." : `${filtered.length} of ${customers.length} shown`}
              {activeFilterCount > 0 && ` · ${activeFilterCount} filter(s)`}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
              <input
                value={query}
                onChange={(e) => { setQuery(e.target.value); setPage(1); }}
                placeholder="Search name or email..."
                className="w-full lg:w-56 rounded-xl border-2 border-[var(--color-border)] bg-gray-50 py-2 pl-10 pr-4 text-sm font-medium outline-none focus:border-[var(--color-brand)] focus:bg-white transition-all"
              />
            </div>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 rounded-xl bg-[var(--color-ink)] text-white px-4 py-2 text-sm font-bold hover:bg-[var(--color-ink)]/90 transition-all shrink-0"
            >
              <Download size={16} /> Export
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-[var(--color-border)]">
          <div className="flex items-center gap-1.5 text-xs font-bold text-ink/70 mr-1">
            <Filter size={14} /> Filters
          </div>

          {[
            { key: "status", value: statusFilter, all: "All Statuses", options: facets?.statuses || ["Active", "New", "Inactive"] },
            { key: "risk", value: riskFilter, all: "All Risks", options: facets?.riskLevels || [] },
            { key: "segment", value: segmentFilter, all: "All Segments", options: facets?.segments || [] },
            { key: "gender", value: genderFilter, all: "All Genders", options: facets?.genders || [] },
          ].map(({ key, value, all, options }) => (
            <select
              key={key}
              value={value}
              onChange={(e) => updateFilters(key, e.target.value)}
              className="rounded-lg border-2 border-[var(--color-border)] bg-white px-2.5 py-1.5 text-xs font-bold outline-none focus:border-[var(--color-brand)] cursor-pointer"
            >
              <option value="All">{all}</option>
              {options.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          ))}

          <select
            value={healthFilter}
            onChange={(e) => updateFilters("health", e.target.value)}
            className="rounded-lg border-2 border-[var(--color-border)] bg-white px-2.5 py-1.5 text-xs font-bold outline-none focus:border-[var(--color-brand)] cursor-pointer"
          >
            <option value="All">All Health</option>
            {(facets?.healthBands || []).map((option) => (
              <option key={option} value={option}>{HEALTH_LABELS[option] || option}</option>
            ))}
          </select>

          <select
            value={planFilter}
            onChange={(e) => updateFilters("plan", e.target.value)}
            className="rounded-lg border-2 border-[var(--color-border)] bg-white px-2.5 py-1.5 text-xs font-bold outline-none focus:border-[var(--color-brand)] cursor-pointer max-w-[180px]"
          >
            <option value="All">All Plans</option>
            {(facets?.plans || []).map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>

          {activeFilterCount > 0 && (
            <button
              onClick={() => setSearchParams(new URLSearchParams())}
              className="text-xs font-bold text-[var(--color-brand)] hover:underline ml-auto"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Scrolling table region */}
      <div className="flex-1 min-h-0 flex flex-col rounded-2xl border border-[var(--color-border)] bg-white shadow-sm overflow-hidden">
        <div className="flex-1 min-h-0 overflow-y-auto">
          <table className="w-full text-sm text-left table-fixed">
            <colgroup>
              <col className="w-[32%]" />
              <col className="w-[13%]" />
              <col className="w-[13%]" />
              <col className="w-[13%]" />
              <col className="w-[16%]" />
              <col className="w-[13%]" />
            </colgroup>
            <thead className="sticky top-0 z-10 bg-gray-50 shadow-sm">
              <tr className="border-b border-[var(--color-border)] text-xs uppercase tracking-wider text-ink/50 font-bold">
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Status</th>
                <th
                  className="px-4 py-3 cursor-pointer hover:text-[var(--color-brand)]"
                  onClick={() => handleSort("healthScore")}
                >
                  Health {sortIndicator("healthScore")}
                </th>
                <th
                  className="px-4 py-3 cursor-pointer hover:text-[var(--color-brand)]"
                  onClick={() => handleSort("churnProbability")}
                >
                  Churn {sortIndicator("churnProbability")}
                </th>
                <th className="px-4 py-3">Risk</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-[var(--color-brand)]">
                      <Loader2 size={32} className="animate-spin" />
                      <p className="font-bold text-lg text-ink">Syncing database...</p>
                    </div>
                  </td>
                </tr>
              ) : pageRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-ink/50">
                      <Search size={32} />
                      <p className="font-bold text-lg">No customers match these filters</p>
                      {activeFilterCount > 0 && (
                        <button
                          onClick={() => setSearchParams(new URLSearchParams())}
                          className="mt-3 px-5 py-2 bg-[var(--color-brand)] text-white rounded-xl font-bold text-sm"
                        >
                          Clear all filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                pageRows.map((c) => (
                  <>
                    <tr key={c.id} className="hover:bg-blue-50/30 transition-colors group">
                      <td className="px-4 py-3">
                        <div className="flex items-start gap-2">
                          <button
                            onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
                            className="mt-0.5 text-ink/30 hover:text-[var(--color-brand)] shrink-0"
                            title="Show details"
                          >
                            {expandedId === c.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                          </button>
                          <div className="min-w-0">
                            <Link
                              to={`/customers/${c.id}`}
                              className="font-bold text-ink group-hover:text-[var(--color-brand)] block truncate"
                              title={c.name}
                            >
                              {c.name}
                            </Link>
                            <p className="text-xs font-medium text-ink/50 truncate">
                              {c.age ?? "—"} · {c.gender} · {c.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 text-xs font-bold rounded-md border whitespace-nowrap ${
                            c.status === "Active"
                              ? "bg-green-50 text-green-700 border-green-200"
                              : c.status === "Inactive"
                              ? "bg-gray-100 text-gray-600 border-gray-200"
                              : "bg-blue-50 text-blue-700 border-blue-200"
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-bold">
                        {c.healthScore}
                        <span className="text-xs text-ink/40 font-medium">/100</span>
                      </td>
                      <td className="px-4 py-3 font-bold">{c.churnProbability}%</td>
                      <td className="px-4 py-3">
                        <RiskBadge risk={c.risk} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          to={`/customers/${c.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold bg-[var(--color-brand-soft)] text-[var(--color-brand)] rounded-lg hover:bg-[var(--color-brand)] hover:text-white transition-all whitespace-nowrap"
                        >
                          <Sparkles size={13} /> Analyze
                        </Link>
                      </td>
                    </tr>

                    {expandedId === c.id && (
                      <tr key={`${c.id}-detail`} className="bg-gray-50/70">
                        <td colSpan={6} className="px-4 py-3">
                          <dl className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-2 text-xs">
                            {[
                              ["Segment", c.segment],
                              ["Plan", c.plan],
                              ["Tenure", c.usageTenure],
                              ["Device", c.device],
                              ["Favourite genre", c.favGenre],
                              ["Listening frequency", c.listeningFrequency],
                              ["Podcast frequency", c.podcastFrequency],
                              ["Recommendation rating", c.recommendationRating ? `${c.recommendationRating}/5` : "—"],
                            ].map(([label, value]) => (
                              <div key={label} className="min-w-0">
                                <dt className="text-ink/45 font-medium">{label}</dt>
                                <dd className="font-bold text-ink/80 truncate" title={String(value)}>
                                  {value}
                                </dd>
                              </div>
                            ))}
                          </dl>
                        </td>
                      </tr>
                    )}
                  </>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pinned pagination */}
        {!loading && filtered.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--color-border)] bg-gray-50 shrink-0">
            <p className="text-xs font-bold text-ink/50">
              {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of{" "}
              {filtered.length}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-xs font-bold rounded-lg border border-[var(--color-border)] bg-white disabled:opacity-40 hover:border-[var(--color-brand)]"
              >
                Previous
              </button>
              <span className="text-xs font-bold text-ink/60">
                Page {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-xs font-bold rounded-lg border border-[var(--color-border)] bg-white disabled:opacity-40 hover:border-[var(--color-brand)]"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}