"""
Loads the RetainIQ dataset (dataset/customer_segment.csv) and enriches
every row with derived fields (health score, churn probability, risk
level, segment, explainable insights, recommended action) so the rest
of the API can serve a single consistent Customer shape.
"""
import os
from functools import lru_cache

import pandas as pd

from services.health_score import compute_health_score
from services.churn_prediction import compute_churn_probability, classify_risk
from services.recommendation import (
    get_segment,
    build_churn_analysis,
    build_recommendation,
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_PATH = os.path.normpath(
    os.path.join(BASE_DIR, "..", "..", "dataset", "customer_segment.csv")
)


def _row_to_customer(idx, row):
    health_score = compute_health_score(row)
    churn_probability = compute_churn_probability(row)
    risk_level = classify_risk(churn_probability)
    segment = get_segment(row, risk_level, health_score)

    customer_id = str(idx + 1)

    return {
        "id": customer_id,
        "name": f"Customer {customer_id}",
        "email": f"user{customer_id}@retainiq.example.com",
        "spotify_listening_device": row.get("spotify_listening_device") or "Unknown Device",
        "spotify_subscription_plan": row.get("spotify_subscription_plan") or "Free (ad-supported)",
        "spotify_usage_period": row.get("spotify_usage_period") or "Unknown",
        "churn": int(row.get("churn") or 0),
        "health_score": health_score,
        "churn_probability": churn_probability,
        "risk_level": risk_level,
        "segment": segment,
        "churn_analysis": build_churn_analysis(row, health_score),
        "recommendation": build_recommendation(risk_level, segment),
    }


@lru_cache(maxsize=1)
def _load_dataframe():
    df = pd.read_csv(DATASET_PATH)
    # Replace NaN with "" so string checks (e.g. `x or "default"`) behave correctly.
    return df.fillna("")


@lru_cache(maxsize=1)
def _load_customers():
    df = _load_dataframe()
    return [_row_to_customer(idx, row.to_dict()) for idx, row in df.iterrows()]


def get_customers():
    return _load_customers()


def get_customer_by_id(customer_id):
    for customer in get_customers():
        if customer["id"] == str(customer_id):
            return customer
    return None