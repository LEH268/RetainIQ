"""Rule-based churn probability estimation (stand-in for a trained model)."""
from services.health_score import compute_health_score


def compute_churn_probability(row):
    health_score = compute_health_score(row)
    churn_probability = 100 - health_score
    return max(0, min(100, round(churn_probability)))


def classify_risk(churn_probability):
    if churn_probability >= 60:
        return "High Risk"
    if churn_probability >= 30:
        return "Moderate Risk"
    return "Healthy"