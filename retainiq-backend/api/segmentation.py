from fastapi import APIRouter

from data_processing.dataset_loader import get_customers

router = APIRouter()

SEGMENT_DESCRIPTIONS = {
    "VIP": "Premium subscribers with excellent health scores and high lifetime value.",
    "Loyal": "Consistently engaged customers with stable, healthy usage patterns.",
    "New": "Recently joined customers still in their onboarding window.",
    "At Risk": "Customers showing strong churn signals who need immediate attention.",
    "Inactive": "Low-engagement customers with minimal recent activity.",
}

SEGMENT_BULK_ACTIONS = {
    "VIP": [
        {"name": "Invite to exclusive beta features", "description": "Give early access to build loyalty."},
        {"name": "Send personal thank-you note", "description": "Reinforce the relationship with a human touch."},
    ],
    "Loyal": [
        {"name": "Offer referral incentive", "description": "Turn satisfaction into new sign-ups."},
        {"name": "Send loyalty rewards email", "description": "Recognize consistent engagement."},
    ],
    "New": [
        {"name": "Send onboarding checklist", "description": "Help new users discover key features fast."},
        {"name": "Schedule welcome call", "description": "Personal touch to boost early retention."},
    ],
    "At Risk": [
        {"name": "Launch win-back discount", "description": "Offer a limited-time incentive to stay."},
        {"name": "Trigger priority support outreach", "description": "Proactively resolve pain points."},
    ],
    "Inactive": [
        {"name": "Send re-engagement email", "description": "Remind inactive users of unused features."},
        {"name": "Offer a free trial extension", "description": "Give inactive users a reason to return."},
    ],
}


@router.get("/segments")
def segments():
    customers = get_customers()
    by_segment = {}
    for c in customers:
        by_segment.setdefault(c["segment"], []).append(c)

    results = []
    for name, members in by_segment.items():
        count = len(members)
        avg_risk = round(sum(m["churn_probability"] for m in members) / count) if count else 0
        results.append({
            "name": name,
            "value": count,
            "desc": SEGMENT_DESCRIPTIONS.get(name, "Segment defined by the AI model."),
            "avgRevenue": f"${45 + (avg_risk // 10)}",
            "avgRisk": f"{avg_risk}%",
            "bulkActions": SEGMENT_BULK_ACTIONS.get(name, []),
        })

    results.sort(key=lambda s: s["value"], reverse=True)
    return results