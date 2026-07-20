"""Churn probability post-processing and risk classification."""

from services.churn_model import (
    predict_churn_probabilities,
    predict_churn_probability,
)

HIGH_RISK_THRESHOLD = 60
MODERATE_RISK_THRESHOLD = 30


def compute_churn_probability(customer):
    """Return a rounded churn probability percentage for one customer."""
    probability = predict_churn_probability(customer)
    return round(max(0.0, min(100.0, probability)))


def compute_churn_probabilities(customers):
    """Return rounded churn probability percentages for many customers."""
    return [
        round(max(0.0, min(100.0, value)))
        for value in predict_churn_probabilities(customers)
    ]


def classify_risk(probability):
    """Map a churn probability percentage onto a risk label."""
    if probability >= HIGH_RISK_THRESHOLD:
        return "High Risk"
    if probability >= MODERATE_RISK_THRESHOLD:
        return "Moderate Risk"
    return "Healthy"