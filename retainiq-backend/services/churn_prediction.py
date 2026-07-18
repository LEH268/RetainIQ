"""Churn probability + risk classification, backed by a trained logistic
regression model (see services/churn_model.py) instead of hard-coded
weights."""
from services.churn_model import predict_churn_probability


def compute_churn_probability(row):
    probability = predict_churn_probability(row)
    return max(0, min(100, round(probability)))


def classify_risk(churn_probability):
    if churn_probability >= 60:
        return "High Risk"
    if churn_probability >= 30:
        return "Moderate Risk"
    return "Healthy"