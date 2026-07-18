"""
Loads the RetainIQ dataset (dataset/customer_segment.csv) and enriches
every row with derived fields (health score, churn probability, risk
level, segment, recommended action) so the rest of the API can serve a
single consistent Customer shape.

Note: churn_analysis (the human-readable "why") is intentionally NOT
computed here anymore. It used to be a hardcoded rule-based sentence
list, which isn't actually AI despite being labeled "AI Insights" on
the frontend. That explanation is now generated live, on demand, by a
real LLM call in api/ai.py (GET /api/ai/explain/{customer_id}), using
the raw feature values below as its input.
"""
import os
from functools import lru_cache

import pandas as pd

from services.health_score import compute_health_score
from services.churn_prediction import compute_churn_probability, classify_risk
from services.recommendation import get_segment, build_recommendation

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_PATH = os.path.normpath(
    os.path.join(BASE_DIR, "..", "..", "dataset", "customer_segment.csv")
)


def _clean(value, default="Unknown"):
    value = str(value).strip() if value is not None else ""
    return value if value else default


def _row_to_customer(idx, row):
    health_score = compute_health_score(row)
    churn_probability = compute_churn_probability(row)
    risk_level = classify_risk(churn_probability)
    segment = get_segment(row, risk_level, health_score)

    customer_id = str(idx + 1)

    try:
        recc_rating = float(row.get("music_recc_rating", 0) or 0)
    except (TypeError, ValueError):
        recc_rating = None

    return {
        "id": customer_id,
        "name": f"Customer {customer_id}",
        "email": f"user{customer_id}@retainiq.example.com",
        "age": _clean(row.get("Age")),
        "gender": _clean(row.get("Gender")),
        "spotify_listening_device": _clean(row.get("spotify_listening_device")),
        "spotify_subscription_plan": _clean(row.get("spotify_subscription_plan"), "Free (ad-supported)"),
        "spotify_usage_period": _clean(row.get("spotify_usage_period")),
        "fav_music_genre": _clean(row.get("fav_music_genre")),
        "music_time_slot": _clean(row.get("music_time_slot")),
        "music_lis_frequency": _clean(row.get("music_lis_frequency")),
        "music_recc_rating": recc_rating,
        "pod_lis_frequency": _clean(row.get("pod_lis_frequency")),
        "fav_pod_genre": _clean(row.get("fav_pod_genre")),
        "pod_variety_satisfaction": _clean(row.get("pod_variety_satisfaction")),
        "churn": int(row.get("churn") or 0),
        "health_score": health_score,
        "churn_probability": churn_probability,
        "risk_level": risk_level,
        "segment": segment,
        "churn_analysis": [],  # deprecated field, kept for schema stability
        "recommendation": build_recommendation(risk_level, segment),
    }


@lru_cache(maxsize=1)
def _load_dataframe():
    df = pd.read_csv(DATASET_PATH)
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


def add_customer(name: str, email: str, plan: str):
    customers = get_customers()
    new_id = str(len(customers) + 1)

    health_score = 70
    churn_probability = 30
    risk_level = classify_risk(churn_probability)

    new_customer = {
        "id": new_id,
        "name": name,
        "email": email,
        "age": "Unknown",
        "gender": "Unknown",
        "spotify_listening_device": "Unknown Device",
        "spotify_subscription_plan": plan,
        "spotify_usage_period": "Less than 6 months",
        "fav_music_genre": "Unknown",
        "music_time_slot": "Unknown",
        "music_lis_frequency": "Unknown",
        "music_recc_rating": None,
        "pod_lis_frequency": "Unknown",
        "fav_pod_genre": "Unknown",
        "pod_variety_satisfaction": "Unknown",
        "churn": 0,
        "health_score": health_score,
        "churn_probability": churn_probability,
        "risk_level": risk_level,
        "segment": "New",
        "churn_analysis": [],
        "recommendation": {
            "action": "Send onboarding tips & feature walkthrough",
            "reason": "Recently joined users benefit most from a guided onboarding sequence.",
        },
    }
    customers.append(new_customer)
    return new_customer