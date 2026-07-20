"""Customer health score computation."""

DAILY_LISTENING_BONUS = 10
LONG_TENURE_BONUS = 5


def compute_health_score(customer, churn_probability=None):
    """Return a 0-100 health score.

    Accepts a pre-computed churn probability to avoid re-running inference.
    """
    if churn_probability is None:
        from services.churn_model import predict_churn_probability

        churn_probability = predict_churn_probability(customer)

    score = 100.0 - float(churn_probability)

    if customer.get("music_lis_frequency") == "Daily":
        score += DAILY_LISTENING_BONUS

    if customer.get("spotify_usage_period") == "More than 2 years":
        score += LONG_TENURE_BONUS

    rating = customer.get("music_recc_rating")
    if rating not in (None, ""):
        try:
            score += float(rating)
        except (TypeError, ValueError):
            pass

    return round(max(0.0, min(100.0, score)))