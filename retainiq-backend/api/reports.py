"""Reporting endpoints with date-filtered revenue-at-risk modelling."""

from collections import defaultdict

from fastapi import APIRouter, Query

from data_processing.dataset_loader import get_customers
from services.ai_client import generate_json_list
from services.churn_model import get_metrics
from services.date_filters import (
    active_between,
    cancelled_between,
    dataset_bounds,
    resolve_range,
    shift_years,
    signed_up_between,
)

router = APIRouter()

AVERAGE_MONTHLY_VALUE = 17.50
RECOVERY_RATE = 0.35

SUMMARY_FALLBACK = [
    "AI summary unavailable. Check /api/ai/status for the reason. All figures "
    "on this page are computed from the dataset.",
    "Revenue at risk is at-risk customer count multiplied by average monthly "
    "subscription value, with a 35% assumed recovery rate.",
]


def _currency(value):
    """Format a number as a compact RM string."""
    if value >= 1000:
        return f"RM {value / 1000:.1f}k"
    return f"RM {value:,.2f}"


def _truthy(value):
    """Interpret a query string flag as a boolean."""
    return str(value).lower() in ("true", "1", "yes", "on")


def _compute_block(cohort, joined, cancelled):
    """Return the financial and risk figures for one cohort window."""
    total = len(cohort)
    high_risk = [c for c in cohort if c["risk_level"] == "High Risk"]
    moderate_risk = [c for c in cohort if c["risk_level"] == "Moderate Risk"]
    at_risk_count = len(high_risk) + len(moderate_risk)

    revenue_at_risk = round(at_risk_count * AVERAGE_MONTHLY_VALUE, 2)
    revenue_saved = round(revenue_at_risk * RECOVERY_RATE, 2)
    healthy_percentage = (
        round((total - at_risk_count) / total * 100, 1) if total else 0.0
    )

    return {
        "totalCustomers": total,
        "highRisk": len(high_risk),
        "moderateRisk": len(moderate_risk),
        "healthy": total - at_risk_count,
        "atRiskCustomers": at_risk_count,
        "atRiskRevenue": revenue_at_risk,
        "potentialSavedRevenue": revenue_saved,
        "healthyPercentage": healthy_percentage,
        "newSignups": len(joined),
        "cancellations": len(cancelled),
    }


def _segment_chart(cohort):
    """Return per-segment at-risk revenue rows."""
    segment_risk = defaultdict(lambda: {"at_risk": 0, "healthy": 0})
    for customer in cohort:
        bucket = segment_risk[customer["segment"]]
        if customer["risk_level"] == "Healthy":
            bucket["healthy"] += 1
        else:
            bucket["at_risk"] += 1

    return [
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


@router.get("/reports/range")
def reports_range():
    """Return selectable date bounds for the report period pickers."""
    customers = get_customers()
    start, end = dataset_bounds(customers)
    return {"minDate": start.isoformat(), "maxDate": end.isoformat()}


@router.get("/reports")
def reports(
    start: str = Query(None, description="ISO start date"),
    end: str = Query(None, description="ISO end date"),
    compare: str = Query("false"),
    compareStart: str = Query(None),
    compareEnd: str = Query(None),
    compareYears: int = Query(1, ge=1, le=10),
):
    """Return report KPIs, per-segment revenue, and an AI summary for a window."""
    customers = get_customers()
    range_start, range_end = resolve_range(customers, start, end)

    cohort = active_between(customers, range_start, range_end)
    joined = signed_up_between(customers, range_start, range_end)
    cancelled = cancelled_between(customers, range_start, range_end)

    block = _compute_block(cohort, joined, cancelled)
    chart_data = _segment_chart(cohort)

    comparison = None
    if _truthy(compare):
        if compareStart or compareEnd:
            prior_start, prior_end = resolve_range(customers, compareStart, compareEnd)
        else:
            prior_start, prior_end = shift_years(range_start, range_end, compareYears)

        prior_cohort = active_between(customers, prior_start, prior_end)
        prior_joined = signed_up_between(customers, prior_start, prior_end)
        prior_cancelled = cancelled_between(customers, prior_start, prior_end)
        comparison = _compute_block(prior_cohort, prior_joined, prior_cancelled)
        comparison["start"] = prior_start.isoformat()
        comparison["end"] = prior_end.isoformat()
        comparison["atRisk"] = _currency(comparison["atRiskRevenue"])
        comparison["saved"] = _currency(comparison["potentialSavedRevenue"])

    model_metrics = get_metrics()
    auc = model_metrics.get("test_auc")
    accuracy_label = f"{auc * 100:.1f}%" if auc else "Heuristic mode"

    comparison_line = ""
    if comparison:
        comparison_line = (
            f"\nComparison window {comparison['start']} to {comparison['end']}: "
            f"{comparison['atRiskCustomers']} at risk, RM "
            f"{comparison['atRiskRevenue']} at risk, "
            f"{comparison['newSignups']} signups, "
            f"{comparison['cancellations']} cancellations."
        )

    prompt = f"""Write an executive report summary for a subscription retention team.

Reporting window: {range_start.isoformat()} to {range_end.isoformat()}

Total customers active in window: {block['totalCustomers']}
High risk: {block['highRisk']}
Moderate risk: {block['moderateRisk']}
Healthy: {block['healthy']} ({block['healthyPercentage']}%)
New signups in window: {block['newSignups']}
Cancellations in window: {block['cancellations']}
Monthly revenue at risk: RM {block['atRiskRevenue']}
Projected recoverable revenue at a 35% success rate: RM {block['potentialSavedRevenue']}
Model holdout AUC: {auc if auc else 'not available'}{comparison_line}

Top segments by at-risk count:
{chr(10).join(f"- {row['segment']}: {row['customers']} customers, RM {row['atRiskRevenue']} at risk" for row in chart_data[:4])}

Write exactly 2 paragraphs. Paragraph 1 states the financial position for this
window using the figures above. Paragraph 2 gives a prioritised action plan
naming specific segments. Return a JSON array of 2 strings and nothing else."""

    summary = generate_json_list(
        "You are a retention strategy consultant writing for executives. "
        "Be specific and quantitative. Never invent numbers.",
        prompt,
        max_tokens=700,
        fallback=SUMMARY_FALLBACK,
    )
    summary = (summary + SUMMARY_FALLBACK)[:2]

    return {
        "start": range_start.isoformat(),
        "end": range_end.isoformat(),
        "totalCustomers": block["totalCustomers"],
        "atRiskCustomers": block["atRiskCustomers"],
        "newSignups": block["newSignups"],
        "cancellations": block["cancellations"],
        "atRisk": _currency(block["atRiskRevenue"]),
        "saved": _currency(block["potentialSavedRevenue"]),
        "accuracy": accuracy_label,
        "atRiskRevenue": block["atRiskRevenue"],
        "potentialSavedRevenue": block["potentialSavedRevenue"],
        "healthyPercentage": block["healthyPercentage"],
        "summaryParagraph1": summary[0],
        "summaryParagraph2": summary[1],
        "aiGenerated": summary[0] != SUMMARY_FALLBACK[0],
        "chartData": chart_data,
        "modelMetrics": model_metrics,
        "comparison": comparison,
        "riskBreakdown": [
            {"name": "High Risk", "value": block["highRisk"]},
            {"name": "Moderate Risk", "value": block["moderateRisk"]},
            {"name": "Healthy", "value": block["healthy"]},
        ],
    }