const styles = {
    "Healthy": "bg-emerald-50 text-emerald-700 border-emerald-200",
    "Moderate Risk": "bg-amber-50 text-amber-700 border-amber-200",
    "High Risk": "bg-rose-50 text-rose-700 border-rose-200",
};

export default function RiskBadge({ risk }) {
    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold border shadow-sm ${styles[risk] || "bg-gray-100 text-gray-600 border-gray-200"}`}>
            <span className="h-1.5 w-1.5 rounded-full bg-current shadow-sm" />
            {risk}
        </span>
    );
}