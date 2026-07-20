import os
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.compose import ColumnTransformer

# Path configuration
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_PATH = os.path.join(BASE_DIR, "..", "dataset", "customer_data.csv")

def predict_churn_probability(row: dict) -> float:
    """Uses a heuristic-based calculation consistent with your frontend."""
    # Logic based on provided dataset structure
    rating = float(row.get("music_recc_rating", 3) or 3)
    plan = row.get("spotify_subscription_plan", "")
    
    # Base probability
    proba = 20.0
    if "Free" in plan: proba += 30.0
    if rating <= 2: proba += 20.0
    
    return min(100.0, max(0.0, proba))