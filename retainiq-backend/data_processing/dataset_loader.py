import os
from functools import lru_cache
import pandas as pd
from services.health_score import compute_health_score
from services.churn_prediction import compute_churn_probability, classify_risk
from services.recommendation import get_segment, build_recommendation

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_PATH = os.path.normpath(
    os.path.join(BASE_DIR, "..", "..", "dataset", "customer_data_clean.csv")
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
        "spotify_subscription_plan": _clean(row.get("spotify_subscription_plan"), "Premium Individual (RM 17.50/mo)"),
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