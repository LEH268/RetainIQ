"""Reporting endpoints with revenue-at-risk modelling and an AI summary."""

from collections import defaultdict

from fastapi import APIRouter

from data_processing.dataset_loader import get_customers
from services.ai_client import generate_json_list
from services.churn_model import get_metrics

router = APIRouter()

AVERAGE_MONTHLY_VALUE = 17.50
RECOVERY_RATE = 0.35

SUMMARY_FALLBACK = [
    "Set ANTHROPIC_API_KEY in the backend environment to generate a live "
    "executive summary. All figures on this page are computed from the dataset.",
    "Revenue at risk is derived from at-risk customer counts multiplied by "
    "average monthly subscription value, with a 35% assumed recovery rate.",
]


def _currency(value):
    """Format a number as a compact RM string."""
    if value >= 1000:
        return f"RM {value / 1000:.1f}k"
    return f"RM {value:,.2f}"


@router.get("/reports")
def reports():
    """Return report KPIs, per-segment revenue chart data, and an AI summary."""
    customers = get_customers()
    total = len(customers)

    high_risk = [c for c in customers if c["risk_level"] == "High Risk"]
    moderate_risk = [c for c in customers if c["risk_level"] == "Moderate Risk"]
    at_risk = high_risk + moderate_risk
    at_risk_count = len(at_risk)

    revenue_at_risk = round(at_risk_count * AVERAGE_MONTHLY_VALUE, 2)
    revenue_saved = round(revenue_at_risk * RECOVERY_RATE, 2)

    healthy_percentage = (
        round((total - at_risk_count) / total * 100, 1) if total else 0.0
    )

    segment_risk = defaultdict(lambda: {"at_risk": 0, "healthy": 0})
    for customer in customers:
        bucket = segment_risk[customer["segment"]]
        if customer["risk_level"] == "Healthy":
            bucket["healthy"] += 1
        else:
            bucket["at_risk"] += 1

    chart_data = [
        {
            "segment": name,
            "atRiskRevenue": round(values["at_risk"] * AVERAGE_MONTHLY_VALUE, 2),
            "savedRevenue": round(
                values["at_risk"] * AVERAGE_MONTHLY_VALUE * RECOVERY_RATE, 2
            ),
            "customers": values["at_risk"] + values["healthy"],
        }
        for name, values in sorted(
            segment_risk.items(),
            key=lambda item: item[1]["at_risk"],
            reverse=True,
        )
    ]

    model_metrics = get_metrics()
    auc = model_metrics.get("test_auc")
    accuracy_label = f"{auc * 100:.1f}%" if auc else "Heuristic mode"

    prompt = f"""Write an executive report summary for a subscription retention team.

Total customers: {total}
High risk: {len(high_risk)}
Moderate risk: {len(moderate_risk)}
Healthy: {total - at_risk_count} ({healthy_percentage}%)
Monthly revenue at risk: RM {revenue_at_risk}
Projected recoverable revenue at a 35% success rate: RM {revenue_saved}
Model holdout AUC: {auc if auc else 'not available'}

Top segments by at-risk count:
{chr(10).join(f"- {row['segment']}: {row['customers']} customers, RM {row['atRiskRevenue']} at risk" for row in chart_data[:4])}

Write exactly 2 paragraphs. Paragraph 1 states the financial position using
the figures above. Paragraph 2 gives a prioritised action plan naming specific
segments. Return a JSON array of 2 strings and nothing else."""

    summary = generate_json_list(
        "You are a retention strategy consultant writing for executives. "
        "Be specific and quantitative. Never invent numbers.",
        prompt,
        max_tokens=700,
        fallback=SUMMARY_FALLBACK,
    )
    summary = (summary + SUMMARY_FALLBACK)[:2]

    return {
        "totalCustomers": total,
        "atRiskCustomers": at_risk_count,
        "atRisk": _currency(revenue_at_risk),
        "saved": _currency(revenue_saved),
        "accuracy": accuracy_label,
        "atRiskRevenue": revenue_at_risk,
        "potentialSavedRevenue": revenue_saved,
        "healthyPercentage": healthy_percentage,
        "summaryParagraph1": summary[0],
        "summaryParagraph2": summary[1],
        "aiGenerated": summary[0] != SUMMARY_FALLBACK[0],
        "chartData": chart_data,
        "modelMetrics": model_metrics,
        "riskBreakdown": [
            {"name": "High Risk", "value": len(high_risk)},
            {"name": "Moderate Risk", "value": len(moderate_risk)},
            {"name": "Healthy", "value": total - at_risk_count},
        ],
    }