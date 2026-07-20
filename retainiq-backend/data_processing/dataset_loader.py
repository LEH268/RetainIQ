"""Dataset loading, enrichment, and in-process caching.

The CSV is read once and every customer is scored in a single vectorised pass.
Results are cached so repeated API calls do not re-run inference over the
whole dataset.
"""

import logging
import os
import threading

import pandas as pd

from services.churn_prediction import classify_risk, compute_churn_probabilities
from services.health_score import compute_health_score

logger = logging.getLogger(__name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_PATH = os.path.join(os.path.dirname(BASE_DIR), "dataset", "customer_data.csv")

AT_RISK_CHURN_THRESHOLD = 60
LOYAL_CHURN_THRESHOLD = 30

_customers_cache = None
_index_cache = None
_cache_lock = threading.Lock()

EMAIL_DOMAIN = "retainiq-demo.com"


def _build_email(name, customer_id):
    """Derive a stable demo email address from a customer name."""
    slug = "".join(char.lower() for char in str(name) if char.isalnum() or char == " ")
    slug = ".".join(part for part in slug.split() if part) or "customer"
    return f"{slug}.{customer_id}@{EMAIL_DOMAIN}"


def generate_segment(customer):
    """Assign a business segment based on churn risk, plan, and tenure."""
    churn = customer["churn_probability"]
    plan = customer.get("spotify_subscription_plan", "")
    frequency = customer.get("music_lis_frequency", "")
    tenure = customer.get("spotify_usage_period", "")
    health = customer.get("health_score", 0)

    if churn >= AT_RISK_CHURN_THRESHOLD:
        return "At Risk"

    is_paid = "Free" not in plan

    if is_paid and health >= 85 and frequency == "Daily":
        return "VVIP"

    if is_paid and frequency in ("Daily", "Several times a week"):
        return "VIP"

    if tenure == "Less than 6 months":
        return "New"

    if churn < LOYAL_CHURN_THRESHOLD:
        return "Loyal"

    return "Inactive"


def determine_status(customer):
    """Derive an account status label used by the customer directory filters."""
    if customer.get("spotify_usage_period") == "Less than 6 months":
        return "New"
    if customer.get("music_lis_frequency") in ("Never", "Rarely"):
        return "Inactive"
    return "Active"


def load_dataset():
    """Read the raw CSV into a dataframe with blanks instead of NaN."""
    if not os.path.exists(DATASET_PATH):
        raise FileNotFoundError(
            f"customer_data.csv not found at {DATASET_PATH}. "
            "Run: python data_processing/generate_dataset.py"
        )
    df = pd.read_csv(DATASET_PATH)
    return df.fillna("")


def _build_customers():
    """Load, score, and enrich every customer in a single pass."""
    df = load_dataset()
    records = df.to_dict(orient="records")

    probabilities = compute_churn_probabilities(records)

    customers = []
    for index, (record, probability) in enumerate(zip(records, probabilities)):
        customer = dict(record)
        customer_id = str(index + 1)

        customer["id"] = customer_id
        customer["churn_probability"] = probability
        customer["risk_level"] = classify_risk(probability)
        customer["health_score"] = compute_health_score(customer, probability)
        customer["segment"] = generate_segment(customer)
        customer["status"] = determine_status(customer)
        customer["email"] = _build_email(customer.get("Name", ""), customer_id)

        customers.append(customer)

    logger.info("Loaded and scored %d customers", len(customers))
    return customers


def get_customers(refresh=False):
    """Return the enriched customer list, using the cache unless refreshing."""
    global _customers_cache, _index_cache

    if _customers_cache is not None and not refresh:
        return _customers_cache

    with _cache_lock:
        if _customers_cache is None or refresh:
            customers = _build_customers()
            _customers_cache = customers
            _index_cache = {customer["id"]: customer for customer in customers}

    return _customers_cache


def get_customer_by_id(customer_id):
    """Return one customer by id in constant time, or None."""
    get_customers()
    return _index_cache.get(str(customer_id))


def invalidate_cache():
    """Clear the cached dataset so the next read reloads from disk."""
    global _customers_cache, _index_cache
    with _cache_lock:
        _customers_cache = None
        _index_cache = None