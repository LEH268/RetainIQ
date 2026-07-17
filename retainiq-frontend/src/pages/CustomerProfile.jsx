import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import RiskBadge from "../components/RiskBadge";
import { customers } from "../data/mockCustomers";

export default function CustomerProfile() {
  const { id } = useParams();
  const customer = customers.find((c) => c.id === id);

  if (!customer) {
    return (
      <div>
        <Link to="/customers" className="text-sm text-[var(--color-brand)] hover:underline">← Back to customers</Link>
        <p className="mt-4 text-ink/60">Customer not found.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Link to="/customers" className="flex w-fit items-center gap-1.5 text-sm text-ink/60 hover:text-[var(--color-brand)]">
        <ArrowLeft size={15} /> Back to customers
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">{customer.name}</h1>
          <p className="text-sm text-ink/60">{customer.company} · {customer.plan} plan</p>
        </div>
        <RiskBadge risk={customer.risk} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] p-5">
          <p className="text-sm text-ink/60">Health Score</p>
          <p className="mt-1 text-2xl font-semibold font-display">{customer.healthScore}/100</p>
        </div>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] p-5">
          <p className="text-sm text-ink/60">Churn Probability</p>
          <p className="mt-1 text-2xl font-semibold font-display">{customer.churnProbability}%</p>
        </div>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] p-5">
          <p className="text-sm text-ink/60">Segment</p>
          <p className="mt-1 text-2xl font-semibold font-display">{customer.segment}</p>
        </div>
      </div>

      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] p-5">
        <h3 className="mb-2 text-sm font-medium">Explainable AI Insights</h3>
        <p className="text-sm text-ink/60">
          Wire this section up to the FastAPI <code>/customers/{"{id}"}/insights</code> endpoint to show
          the top factors driving this customer's churn prediction.
        </p>
      </div>

      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] p-5">
        <h3 className="mb-2 text-sm font-medium">Recommended Actions</h3>
        <p className="text-sm text-ink/60">
          Wire this section up to the recommendation engine endpoint to surface personalized
          retention actions for this customer.
        </p>
      </div>
    </div>
  );
}
