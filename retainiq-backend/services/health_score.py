"""
Computes a 0-100 health score.

The base of the score is the model's own inverse churn probability
(100 - churn_probability), so health and churn stay mathematically
consistent instead of drifting apart like two independently hand-tuned
formulas would. A small, explicitly-labeled engagement adjustment is
layered on top so two customers with an identical churn probability can
still be differentiated by how actively they use the product.
"""
from services.churn_model import predict_churn_probability

ENGAGEMENT_WEIGHTS = {
    "pod_lis_frequency": {
        "Daily": 6,
        "Several times a week": 6,
        "Never": -6,
    },
    "pod_variety_satisfaction": {
        "Satisfied": 4,
        "Very Satisfied": 4,
        "Dissatisfied": -4,
        "Very Dissatisfied": -4,
    },
    "spotify_usage_period": {
        "More than 2 years": 4,
        "Less than 6 months": -2,
    },
}


def _engagement_adjustment(row) -> int:
    total = 0
    for field, weights in ENGAGEMENT_WEIGHTS.items():
        value = str(row.get(field, "") or "")
        total += weights.get(value, 0)
    return total


def compute_health_score(row):
    churn_probability = predict_churn_probability(row)
    base = 100 - churn_probability
    adjusted = base + _engagement_adjustment(row)
    return max(0, min(100, round(adjusted)))