const styles = {
  "Healthy": "bg-[var(--color-risk-low)]/10 text-[var(--color-risk-low)]",
  "Moderate Risk": "bg-[var(--color-risk-mid)]/10 text-[var(--color-risk-mid)]",
  "High Risk": "bg-[var(--color-risk-high)]/10 text-[var(--color-risk-high)]",
};

export default function RiskBadge({ risk }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${styles[risk] || "bg-gray-100 text-gray-600"}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {risk}
    </span>
  );
}
