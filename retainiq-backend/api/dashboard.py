"""Dashboard KPI and distribution endpoints."""

from collections import Counter

from fastapi import APIRouter

from data_processing.dataset_loader import get_customers
from services.timeseries import build_monthly_series, series_metrics

router = APIRouter()

HEALTH_COLORS = {
    "Healthy": "#10B981",
    "Moderate Risk": "#F59E0B",
    "High Risk": "#E11D48",
}


def _percentage(part, whole):
    """Return part/whole as a percentage rounded to one decimal place."""
    return round(part / whole * 100, 1) if whole else 0.0


@router.get("/dashboard/stats")
def dashboard_stats():
    """Return headline KPIs, health distribution, and a projected growth series."""
    customers = get_customers()
    total = len(customers)

    risk_counts = Counter(customer["risk_level"] for customer in customers)
    status_counts = Counter(customer["status"] for customer in customers)

    healthy = risk_counts.get("Healthy", 0)
    moderate = risk_counts.get("Moderate Risk", 0)
    high = risk_counts.get("High Risk", 0)

    average_health = (
        round(sum(c["health_score"] for c in customers) / total, 1) if total else 0
    )
    average_churn = (
        round(sum(c["churn_probability"] for c in customers) / total, 1) if total else 0
    )

    health_distribution = [
        {
            "name": name,
            "value": value,
            "color": HEALTH_COLORS[name],
            "percentage": _percentage(value, total),
        }
        for name, value in (
            ("Healthy", healthy),
            ("Moderate Risk", moderate),
            ("High Risk", high),
        )
    ]

    growth_series = build_monthly_series(customers)

    return {
        "totalCustomers": total,
        "activeCustomers": status_counts.get("Active", 0),
        "inactiveCustomers": status_counts.get("Inactive", 0),
        "newCustomers": status_counts.get("New", 0),
        "healthyCount": healthy,
        "moderateCount": moderate,
        "highRiskCount": high,
        "averageHealthScore": average_health,
        "averageChurnProbability": average_churn,
        "healthDistribution": health_distribution,
        "subscriptionGrowth": growth_series,
        "growthMetrics": series_metrics(growth_series),
        "seriesNote": (
            "Monthly series is a modelled projection from current cohort "
            "composition; the dataset contains no signup timestamps."
        ),
    }