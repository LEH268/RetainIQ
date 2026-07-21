"""Churn prediction model.

Trains a scikit-learn logistic regression pipeline on the customer dataset and
caches the fitted artefact to disk. Falls back to a documented heuristic if the
dataset or model is unavailable, so the API never hard-fails.
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

# Aligned to the drivers in churn_logit(): plan, tenure, music_freq, pod_freq,
# rating, satisfaction, age. Columns not used by the generator are excluded.
CATEGORICAL_FEATURES = [
    "spotify_subscription_plan",
    "spotify_usage_period",
    "music_lis_frequency",
    "pod_lis_frequency",
    "pod_variety_satisfaction",
]

NUMERIC_FEATURES = ["Age", "music_recc_rating"]

TARGET = "churn"

# Exact plan strings emitted by the generator.
PLAN_INDIVIDUAL = "Premium Individual (RM 17.50/mo)"
PLAN_DUO = "Premium Duo (RM 24.50/mo)"
PLAN_FAMILY = "Premium Family (RM 27.90/mo)"
PLAN_STUDENT = "Premium Student (RM 9.50/mo)"
PLAN_MINI = "Premium Mini (RM 1.50/day)"
PLAN_FREE = "Free (ad-supported)"

_model = None
_metrics = {}
_loaded = False
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


def _validate_columns(df):
    """Raise if the dataset is missing columns the model depends on."""
    required = set(CATEGORICAL_FEATURES + NUMERIC_FEATURES + [TARGET])
    missing = required - set(df.columns)
    if missing:
        raise KeyError(f"Dataset is missing required columns: {sorted(missing)}")


def _prepare_frame(df):
    """Coerce raw dataframe columns into the types the pipeline expects."""
    frame = df.copy()
    for column in CATEGORICAL_FEATURES:
        if column not in frame.columns:
            logger.warning("Missing categorical column at inference: %s", column)
            frame[column] = ""
        frame[column] = frame[column].fillna("").astype(str)
    for column in NUMERIC_FEATURES:
        if column not in frame.columns:
            logger.warning("Missing numeric column at inference: %s", column)
            frame[column] = 0
        frame[column] = pd.to_numeric(frame[column], errors="coerce").fillna(0)
    return frame


def train_model(save=True):
    """Train the churn pipeline on the dataset and return (pipeline, metrics)."""
    if not os.path.exists(DATASET_PATH):
        raise FileNotFoundError(f"Dataset not found at {DATASET_PATH}")

    df = pd.read_csv(DATASET_PATH)
    _validate_columns(df)

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
        "features": CATEGORICAL_FEATURES + NUMERIC_FEATURES,
        "fallback": False,
    }

    if save:
        os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
        joblib.dump({"pipeline": pipeline, "metrics": metrics}, MODEL_PATH)

    logger.info("Churn model trained: %s", metrics)
    return pipeline, metrics


def _load_or_train():
    """Load the cached model, training a fresh one if the cache is stale."""
    global _model, _metrics

    if os.path.exists(MODEL_PATH):
        try:
            artefact = joblib.load(MODEL_PATH)
            cached_features = artefact.get("metrics", {}).get("features")
            expected = CATEGORICAL_FEATURES + NUMERIC_FEATURES
            if cached_features != expected:
                logger.warning(
                    "Cached model feature set is stale (%s), retraining.",
                    cached_features,
                )
            else:
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
    global _loaded
    if not _loaded:
        with _lock:
            if not _loaded:
                _load_or_train()
                _loaded = True
    return _model


def get_metrics():
    """Return training metrics for the active model."""
    get_model()
    return dict(_metrics)


def reset_model():
    """Clear the in-process cache so the next call reloads or retrains."""
    global _model, _metrics, _loaded
    with _lock:
        _model = None
        _metrics = {}
        _loaded = False


def _heuristic_probability(row):
    """Fallback scoring used only when the trained model is unavailable.

    Mirrors the sign and rough magnitude of churn_logit() in the generator,
    expressed directly as a percentage.
    """
    try:
        rating = float(row.get("music_recc_rating") or 3)
    except (TypeError, ValueError):
        rating = 3.0

    try:
        age = float(row.get("Age") or 30)
    except (TypeError, ValueError):
        age = 30.0

    plan = str(row.get("spotify_subscription_plan") or "")
    music_freq = str(row.get("music_lis_frequency") or "")
    pod_freq = str(row.get("pod_lis_frequency") or "")
    tenure = str(row.get("spotify_usage_period") or "")
    satisfaction = str(row.get("pod_variety_satisfaction") or "")

    score = 20.0

    plan_effect = {
        PLAN_FREE: 22.0,
        PLAN_MINI: 14.0,
        PLAN_STUDENT: 2.0,
        PLAN_INDIVIDUAL: 0.0,
        PLAN_DUO: -6.0,
        PLAN_FAMILY: -10.0,
    }
    score += plan_effect.get(plan, 0.0)

    tenure_effect = {
        "Less than 6 months": 16.0,
        "6 months to 1 year": 5.0,
        "1 year to 2 years": -4.0,
        "More than 2 years": -14.0,
    }
    score += tenure_effect.get(tenure, 0.0)

    engagement_effect = {
        "Never": 26.0,
        "Rarely": 16.0,
        "Once a week": 4.0,
        "Several times a week": -8.0,
        "Daily": -18.0,
    }
    score += engagement_effect.get(music_freq, 0.0)
    score += engagement_effect.get(pod_freq, 0.0) * 0.3

    score += (3.0 - rating) * 9.0

    satisfaction_effect = {
        "Very Dissatisfied": 14.0,
        "Dissatisfied": 7.0,
        "Ok": 0.0,
        "Satisfied": -6.0,
        "Very Satisfied": -11.0,
    }
    score += satisfaction_effect.get(satisfaction, 0.0)

    if age < 20:
        score += 6.0
    elif age > 45:
        score -= 4.0

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