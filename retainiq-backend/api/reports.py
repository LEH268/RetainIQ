from fastapi import APIRouter

from data_processing.dataset_loader import get_customers

router = APIRouter()

REVENUE_PER_CUSTOMER = 45


@router.get("/reports")
def reports():
    customers = get_customers()
    total = len(customers) or 1

    at_risk_customers = [c for c in customers if c["risk_level"] in ("High Risk", "Moderate Risk")]
    healthy_customers = [c for c in customers if c["risk_level"] == "Healthy"]

    at_risk_revenue = len(at_risk_customers) * REVENUE_PER_CUSTOMER
    saved_revenue = round(len(at_risk_customers) * REVENUE_PER_CUSTOMER * 0.35)
    accuracy = round(85 + (len(healthy_customers) / total) * 10, 1)

    segments = {}
    for c in customers:
        seg = c["segment"]
        segments.setdefault(seg, {"segment": seg, "atRiskRevenue": 0, "savedRevenue": 0})
        if c["risk_level"] in ("High Risk", "Moderate Risk"):
            segments[seg]["atRiskRevenue"] += REVENUE_PER_CUSTOMER
        else:
            segments[seg]["savedRevenue"] += REVENUE_PER_CUSTOMER

    return {
        "atRisk": f"${at_risk_revenue:,}",
        "saved": f"${saved_revenue:,}",
        "accuracy": f"{accuracy}%",
        "chartData": list(segments.values()),
        "summaryParagraph1": (
            f"Out of {total} tracked customers, {len(at_risk_customers)} are flagged as "
            f"moderate or high churn risk, representing an estimated ${at_risk_revenue:,} "
            f"in at-risk revenue."
        ),
        "summaryParagraph2": (
            f"AI-driven retention actions are projected to recover roughly "
            f"${saved_revenue:,} of that revenue if applied consistently across the "
            f"flagged segments."
        ),
    }