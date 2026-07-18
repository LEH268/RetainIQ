"""Segment assignment, explainable insights, and recommended actions."""


def get_segment(row, risk_level, health_score):
    if risk_level == "High Risk":
        return "At Risk"

    plan = str(row.get("spotify_subscription_plan", "") or "")
    usage = str(row.get("spotify_usage_period", "") or "")
    pod_freq = str(row.get("pod_lis_frequency", "") or "")
    rating = row.get("music_recc_rating", 3)

    if "Premium" in plan:
        return "VIP" if health_score >= 80 else "Loyal"

    if usage == "Less than 6 months":
        return "New"

    try:
        if float(rating) <= 2 and pod_freq == "Never":
            return "Inactive"
    except (TypeError, ValueError):
        pass

    return "Loyal"


def build_churn_analysis(row, health_score):
    reasons = []
    plan = str(row.get("spotify_subscription_plan", "") or "")
    rating = row.get("music_recc_rating", 3)
    pod_freq = str(row.get("pod_lis_frequency", "") or "")
    satisfaction = str(row.get("pod_variety_satisfaction", "") or "")

    if "Free" in plan:
        reasons.append("Still on the Free (ad-supported) plan with no premium upgrade")

    try:
        if float(rating) <= 2:
            reasons.append(f"Low recommendation rating ({rating}/5) suggests poor content match")
    except (TypeError, ValueError):
        pass

    if pod_freq == "Never":
        reasons.append("No podcast engagement recorded")

    if satisfaction in ("Dissatisfied", "Very Dissatisfied"):
        reasons.append("Reported dissatisfaction with content variety")

    if not reasons:
        reasons.append("Healthy engagement across listening and podcast activity")

    return reasons


def build_recommendation(risk_level, segment):
    catalog = {
        "High Risk": {
            "action": "Offer 20% retention discount + priority support",
            "reason": "High churn risk detected; a targeted discount plus proactive "
                      "support has historically improved retention for this profile.",
        },
        "Moderate Risk": {
            "action": "Send personalized content recommendation email",
            "reason": "Engagement is inconsistent; refreshed recommendations tend to "
                      "re-engage moderate-risk users.",
        },
        "Healthy": {
            "action": "Invite to loyalty rewards / referral program",
            "reason": "Strong engagement profile; a loyalty incentive can convert "
                      "satisfaction into advocacy.",
        },
    }

    if segment == "New":
        return {
            "action": "Send onboarding tips & feature walkthrough",
            "reason": "Recently joined users benefit most from a guided onboarding sequence.",
        }

    return catalog.get(risk_level, catalog["Healthy"])