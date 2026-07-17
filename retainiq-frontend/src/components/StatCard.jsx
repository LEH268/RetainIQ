export default function StatCard({ label, value, delta, deltaTone = "up" }) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] p-5">
      <p className="text-sm text-ink/60">{label}</p>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-semibold font-display">{value}</span>
        {delta && (
          <span className={`text-xs font-medium ${deltaTone === "up" ? "text-[var(--color-risk-low)]" : "text-[var(--color-risk-high)]"}`}>
            {delta}
          </span>
        )}
      </div>
    </div>
  );
}
