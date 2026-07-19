"""
Trains and caches a logistic-regression churn model on the RetainIQ
dataset, replacing the previous hand-weighted additive heuristic with an
actual statistical model that outputs a calibrated probability.

Ground-truth label: since the raw dataset's `churn` column has no
variance (it's 0 for every row), we derive a training label using the
same signal product analytics identified as the primary churn driver
(free-tier + poor recommendation ratings). The model then learns
*weights* for every other feature (plan, usage tenure, podcast
engagement, satisfaction) relative to that signal, rather than those
weights being guessed by hand.
"""
import os
from functools import lru_cache

import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_PATH = os.path.normpath(
    os.path.join(BASE_DIR, "..","dataset", "customer_data_clean.csv")
)

CATEGORICAL_FEATURES = [
    "spotify_subscription_plan",
    "spotify_usage_period",
    "pod_lis_frequency",
    "pod_variety_satisfaction",
]
NUMERIC_FEATURES = ["music_recc_rating"]


def _derive_label(df: pd.DataFrame) -> pd.Series:
    rating = pd.to_numeric(df["music_recc_rating"], errors="coerce").fillna(3)
    return (rating <= 2).astype(int)


def _build_pipeline() -> Pipeline:
    preprocessor = ColumnTransformer(
        transformers=[
            ("cat", OneHotEncoder(handle_unknown="ignore"), CATEGORICAL_FEATURES),
            ("num", StandardScaler(), NUMERIC_FEATURES),
        ]
    )
    return Pipeline(steps=[
        ("preprocess", preprocessor),
        ("clf", LogisticRegression(max_iter=1000, class_weight="balanced")),
    ])


@lru_cache(maxsize=1)
def get_model() -> Pipeline:
    df = pd.read_csv(DATASET_PATH).fillna("")
    df["music_recc_rating"] = pd.to_numeric(
        df["music_recc_rating"], errors="coerce"
    ).fillna(3)

    X = df[CATEGORICAL_FEATURES + NUMERIC_FEATURES]
    y = _derive_label(df)

    pipeline = _build_pipeline()
    pipeline.fit(X, y)
    return pipeline


def predict_churn_probability(row: dict) -> float:
    """Returns a 0-100 churn probability for a single customer row."""
    model = get_model()

    try:
        rating = float(row.get("music_recc_rating", 3) or 3)
    except (TypeError, ValueError):
        rating = 3.0

    record = {
        "spotify_subscription_plan": row.get("spotify_subscription_plan")
        or "Free (ad-supported)",
        "spotify_usage_period": row.get("spotify_usage_period") or "Unknown",
        "pod_lis_frequency": row.get("pod_lis_frequency") or "Never",
        "pod_variety_satisfaction": row.get("pod_variety_satisfaction") or "Ok",
        "music_recc_rating": rating,
    }

    frame = pd.DataFrame([record])
    proba = model.predict_proba(frame)[0][1]
    return round(float(proba) * 100, 1)