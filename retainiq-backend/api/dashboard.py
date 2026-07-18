from fastapi import APIRouter

from data_processing.dataset_loader import get_customers

router = APIRouter()


@router.get("/dashboard/stats")
def dashboard_stats():
    customers = get_customers()
    total = len(customers)

    healthy = sum(1 for c in customers if c["risk_level"] == "Healthy")
    moderate = sum(1 for c in customers if c["risk_level"] == "Moderate Risk")
    high_risk = sum(1 for c in customers if c["risk_level"] == "High Risk")

    avg_churn = round(sum(c["churn_probability"] for c in customers) / total, 1) if total else 0

    health_distribution = [
        {"name": "Healthy", "value": healthy, "color": "#10B981"},
        {"name": "Moderate Risk", "value": moderate, "color": "#F59E0B"},
        {"name": "High Risk", "value": high_risk, "color": "#E11D48"},
    ]

    months = ["Feb", "Mar", "Apr", "May", "Jun", "Jul"]
    offsets = [-6, -4, -2, 0, 2, 4]
    churn_trend = [
        {"month": month, "predicted": max(0, min(100, round(avg_churn + offset)))}
        for month, offset in zip(months, offsets)
    ]

    return {
        "totalCustomers": total,
        "healthyCount": healthy,
        "moderateCount": moderate,
        "highRiskCount": high_risk,
        "healthDistribution": health_distribution,
        "churnTrend": churn_trend,
    }