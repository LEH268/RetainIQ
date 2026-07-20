"""Churn prediction model.

Trains a scikit-learn logistic regression pipeline on the customer dataset at
import time and caches the fitted artefact to disk. Falls back to a documented
heuristic if the dataset or model is unavailable, so the API never hard-fails.
"""

import logging
import os
import threading

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import roc_auc_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

logger = logging.getLogger(__name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_PATH = os.path.join(os.path.dirname(BASE_DIR), "dataset", "customer_data.csv")
MODEL_PATH = os.path.join(os.path.dirname(BASE_DIR), "models", "churn_model.joblib")

CATEGORICAL_FEATURES = [
    "Gender",
    "spotify_usage_period",
    "spotify_subscription_plan",
    "premium_sub_willingness",
    "preferred_listening_content",
    "fav_music_genre",
    "music_time_slot",
    "music_lis_frequency",
    "pod_lis_frequency",
    "pod_variety_satisfaction",
]

NUMERIC_FEATURES = ["Age", "music_recc_rating"]

TARGET = "churn"

_model = None
_metrics = {}
_lock = threading.Lock()


def _build_pipeline():
    """Return an unfitted preprocessing + classifier pipeline."""
    preprocessor = ColumnTransformer(
        transformers=[
            (
                "categorical",
                OneHotEncoder(handle_unknown="ignore", sparse_output=False),
                CATEGORICAL_FEATURES,
            ),
            ("numeric", StandardScaler(), NUMERIC_FEATURES),
        ],
        remainder="drop",
    )
    return Pipeline(
        steps=[
            ("preprocess", preprocessor),
            (
                "classifier",
                LogisticRegression(
                    max_iter=1000,
                    class_weight="balanced",
                    C=1.0,
                    random_state=42,
                ),
            ),
        ]
    )


def _prepare_frame(df):
    """Coerce raw dataframe columns into the types the pipeline expects."""
    frame = df.copy()
    for column in CATEGORICAL_FEATURES:
        if column not in frame.columns:
            frame[column] = ""
        frame[column] = frame[column].fillna("").astype(str)
    for column in NUMERIC_FEATURES:
        if column not in frame.columns:
            frame[column] = 0
        frame[column] = pd.to_numeric(frame[column], errors="coerce").fillna(0)
    return frame


def train_model(save=True):
    """Train the churn pipeline on the dataset and return (pipeline, metrics)."""
    if not os.path.exists(DATASET_PATH):
        raise FileNotFoundError(f"Dataset not found at {DATASET_PATH}")

    df = pd.read_csv(DATASET_PATH)
    frame = _prepare_frame(df)
    features = frame[CATEGORICAL_FEATURES + NUMERIC_FEATURES]
    labels = pd.to_numeric(frame[TARGET], errors="coerce").fillna(0).astype(int)

    x_train, x_test, y_train, y_test = train_test_split(
        features, labels, test_size=0.2, random_state=42, stratify=labels
    )

    pipeline = _build_pipeline()
    pipeline.fit(x_train, y_train)

    test_probabilities = pipeline.predict_proba(x_test)[:, 1]
    metrics = {
        "test_auc": round(float(roc_auc_score(y_test, test_probabilities)), 4),
        "train_rows": int(len(x_train)),
        "test_rows": int(len(x_test)),
        "positive_rate": round(float(labels.mean()), 4),
    }

    if save:
        os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
        joblib.dump({"pipeline": pipeline, "metrics": metrics}, MODEL_PATH)

    logger.info("Churn model trained: %s", metrics)
    return pipeline, metrics


def _load_or_train():
    """Load the cached model, training a fresh one if the cache is missing."""
    global _model, _metrics

    if os.path.exists(MODEL_PATH):
        try:
            artefact = joblib.load(MODEL_PATH)
            _model = artefact["pipeline"]
            _metrics = artefact.get("metrics", {})
            logger.info("Loaded cached churn model: %s", _metrics)
            return
        except Exception as exc:
            logger.warning("Failed to load cached model, retraining: %s", exc)

    try:
        _model, _metrics = train_model(save=True)
    except Exception as exc:
        logger.warning("Model training failed, using heuristic fallback: %s", exc)
        _model = None
        _metrics = {"fallback": True, "reason": str(exc)}


def get_model():
    """Return the fitted pipeline, loading or training it once on first use."""
    global _model
    if _model is None and not _metrics:
        with _lock:
            if _model is None and not _metrics:
                _load_or_train()
    return _model


def get_metrics():
    """Return training metrics for the active model."""
    get_model()
    return dict(_metrics)


def _heuristic_probability(row):
    """Fallback scoring used only when the trained model is unavailable."""
    try:
        rating = float(row.get("music_recc_rating") or 3)
    except (TypeError, ValueError):
        rating = 3.0

    plan = str(row.get("spotify_subscription_plan") or "")
    frequency = str(row.get("music_lis_frequency") or "")
    tenure = str(row.get("spotify_usage_period") or "")

    score = 22.0
    if "Free" in plan:
        score += 26.0
    elif "Mini" in plan:
        score += 14.0
    elif "Family" in plan:
        score -= 8.0

    score += {"Never": 24.0, "Rarely": 15.0, "Once a week": 5.0,
              "Several times a week": -6.0, "Daily": -12.0}.get(frequency, 0.0)
    score += {"Less than 6 months": 14.0, "6 months to 1 year": 5.0,
              "1 year to 2 years": -4.0, "More than 2 years": -11.0}.get(tenure, 0.0)
    score += (3.0 - rating) * 8.0

    return float(min(100.0, max(0.0, score)))


def predict_churn_probability(row):
    """Return churn probability as a percentage in [0, 100] for one customer."""
    return predict_churn_probabilities([row])[0]


def predict_churn_probabilities(rows):
    """Return churn probabilities as percentages for a list of customer dicts.

    Vectorised so a full dataset scores in one pass instead of per-row calls.
    """
    if not rows:
        return []

    model = get_model()
    if model is None:
        return [_heuristic_probability(row) for row in rows]

    try:
        frame = _prepare_frame(pd.DataFrame(rows))
        features = frame[CATEGORICAL_FEATURES + NUMERIC_FEATURES]
        probabilities = model.predict_proba(features)[:, 1] * 100.0
        return [float(np.clip(value, 0.0, 100.0)) for value in probabilities]
    except Exception as exc:
        logger.warning("Model inference failed, using heuristic: %s", exc)
        return [_heuristic_probability(row) for row in rows]


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    _, trained_metrics = train_model(save=True)
    print(trained_metrics)