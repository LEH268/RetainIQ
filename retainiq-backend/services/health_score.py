"""Computes a 0-100 health score from a raw dataset row."""


def compute_health_score(row):
    score = 50

    plan = str(row.get("spotify_subscription_plan", "") or "")
    if "Premium" in plan:
        score += 25
    elif "Free" in plan:
        score -= 10

    try:
        rating = float(row.get("music_recc_rating", 3) or 3)
    except (TypeError, ValueError):
        rating = 3
    score += (rating - 3) * 8

    pod_freq = str(row.get("pod_lis_frequency", "") or "")
    if pod_freq in ("Daily", "Several times a week"):
        score += 10
    elif pod_freq == "Never":
        score -= 10

    satisfaction = str(row.get("pod_variety_satisfaction", "") or "")
    if satisfaction in ("Satisfied", "Very Satisfied"):
        score += 10
    elif satisfaction in ("Dissatisfied", "Very Dissatisfied"):
        score -= 15

    usage = str(row.get("spotify_usage_period", "") or "")
    if usage == "More than 2 years":
        score += 8
    elif usage == "Less than 6 months":
        score -= 5

    return max(0, min(100, round(score)))