"""Customer segmentation endpoints with editable AI-generated action protocols."""

from collections import defaultdict

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from data_processing.dataset_loader import get_customers
from services.ai_client import generate_json_list

router = APIRouter()

AVERAGE_MONTHLY_VALUE = 17.50

SEGMENT_METADATA = {
    "VVIP": {
        "icon": "👑",
        "description": (
            "Paid subscribers with excellent health scores and daily listening. "
            "Highest lifetime value and lowest churn risk."
        ),
        "focus": "advocacy, referral, and premium tier expansion",
    },
    "VIP": {
        "icon": "⭐",
        "description": (
            "Paid subscribers with regular engagement and stable health scores. "
            "Strong upsell potential."
        ),
        "focus": "upsell to higher tiers and deepening engagement habits",
    },
    "Loyal": {
        "icon": "❤️",
        "description": (
            "Consistently active customers with low churn probability and a long "
            "relationship history."
        ),
        "focus": "reward, recognition, and preventing quiet disengagement",
    },
    "At Risk": {
        "icon": "⚠️",
        "description": (
            "High churn probability driven by low engagement and declining health "
            "scores. Immediate intervention required."
        ),
        "focus": "urgent save offers and diagnosing the cause of disengagement",
    },
    "New": {
        "icon": "🆕",
        "description": (
            "Joined within the last six months with limited engagement history. "
            "Onboarding quality determines retention."
        ),
        "focus": "onboarding completion and forming a first listening habit",
    },
    "Inactive": {
        "icon": "💤",
        "description": (
            "Low engagement with moderate churn risk. Re-activation campaigns have "
            "the highest marginal return here."
        ),
        "focus": "reactivation triggers and rebuilding content relevance",
    },
}

SEGMENT_ORDER = ["VVIP", "VIP", "Loyal", "New", "At Risk", "Inactive"]

# Per-segment fallbacks, used only when the AI service is unreachable.
# Distinct per segment so the UI is never uniform even in degraded mode.
FALLBACK_ACTIONS = {
    "VVIP": [
        "Invite to an early-access beta programme for new listening features",
        "Offer a referral credit worth one month of their current plan",
        "Send a personalised year-in-review of their listening milestones",
    ],
    "VIP": [
        "Present a Family plan upgrade priced against their current tier",
        "Surface three under-explored genres based on their listening history",
        "Enrol in a quarterly engagement check-in sequence",
    ],
    "Loyal": [
        "Grant loyalty credit tied to their subscription anniversary",
        "Recommend curated playlists matched to their dominant listening slot",
        "Invite to the community feedback panel for new feature input",
    ],
    "At Risk": [
        "Send an immediate save offer discounting the next three billing cycles",
        "Trigger a taste-profile reset to correct poor recommendation quality",
        "Route to a support specialist for a proactive outreach call",
    ],
    "New": [
        "Deliver a day-seven onboarding email showing unused core features",
        "Prompt playlist creation to establish an early listening habit",
        "Offer an extended trial on the plan tier above their current one",
    ],
    "Inactive": [
        "Send a reactivation email leading with newly released content in their genre",
        "Offer a one-month discounted return to a paid tier",
        "Run a short preference survey to diagnose the cause of drop-off",
    ],
}

GENERIC_FALLBACK = [
    "Send a personalised retention email highlighting unused features",
    "Offer a targeted subscription discount or trial extension",
    "Schedule an engagement check-in through the in-app inbox",
]

# Actions the user can add manually from the UI picker.
ACTION_LIBRARY = [
    "Send a personalised retention email",
    "Offer a subscription discount",
    "Extend a free trial of a higher tier",
    "Trigger a recommendation profile reset",
    "Schedule a support specialist outreach call",
    "Send a curated playlist tailored to their top genre",
    "Deliver an onboarding feature walkthrough",
    "Grant loyalty credit or a subscription anniversary reward",
    "Run a preference survey to diagnose disengagement",
    "Invite to an early-access beta programme",
    "Offer a referral credit",
    "Send a win-back offer with a limited-time expiry",
]


class BulkActionRequest(BaseModel):
    """Payload for executing a bulk action against a segment."""

    segment: str
    actions: list[str] = []


def _segment_groups():
    """Return customers grouped by segment name."""
    groups = defaultdict(list)
    for customer in get_customers():
        groups[customer["segment"]].append(customer)
    return groups


def _summarise(name, members):
    """Return the aggregate metrics the frontend renders for a segment."""
    count = len(members)
    average_churn = round(sum(c["churn_probability"] for c in members) / count, 1)
    average_health = round(sum(c["health_score"] for c in members) / count, 1)
    average_age = round(sum(int(c.get("Age", 0) or 0) for c in members) / count, 1)
    paid = sum(
        1 for c in members
        if "Free" not in str(c.get("spotify_subscription_plan", ""))
    )
    daily = sum(1 for c in members if c.get("music_lis_frequency") == "Daily")
    detected = sum(1 for c in members if c["risk_level"] != "Healthy")

    metadata = SEGMENT_METADATA.get(
        name, {"icon": "•", "description": "", "focus": "general retention"}
    )

    return {
        "name": name,
        "displayName": f"{metadata['icon']} {name}".strip(),
        "icon": metadata["icon"],
        "description": metadata["description"],
        "focus": metadata["focus"],
        "users": count,
        "value": count,
        "detected": detected,
        "paidCount": paid,
        "dailyListeners": daily,
        "averageAge": average_age,
        "avgRevenue": (
            f"RM {round(paid * AVERAGE_MONTHLY_VALUE / count, 2)}" if count else "RM 0"
        ),
        "avgRisk": f"{average_churn}%",
        "averageChurn": average_churn,
        "averageHealth": average_health,
    }


@router.get("/segments")
def segments():
    """Return every segment with live aggregate metrics."""
    groups = _segment_groups()
    result = [_summarise(name, members) for name, members in groups.items() if members]
    result.sort(
        key=lambda item: SEGMENT_ORDER.index(item["name"])
        if item["name"] in SEGMENT_ORDER
        else len(SEGMENT_ORDER)
    )
    return result


@router.get("/segments/action-library")
def action_library():
    """Return the catalogue of actions the user can add to a protocol manually."""
    return {"actions": ACTION_LIBRARY}


@router.get("/segments/{segment_name}/actions")
def segment_actions(segment_name: str, count: int = 4):
    """Return an AI-generated action protocol tailored to one segment.

    The prompt carries that segment's specific plan mix, engagement profile,
    and strategic focus, so no two segments receive the same protocol.
    """
    groups = _segment_groups()
    members = groups.get(segment_name)

    if not members:
        raise HTTPException(status_code=404, detail="Segment not found")

    summary = _summarise(segment_name, members)

    plan_counts = defaultdict(int)
    frequency_counts = defaultdict(int)
    genre_counts = defaultdict(int)
    tenure_counts = defaultdict(int)

    for customer in members:
        plan_counts[str(customer.get("spotify_subscription_plan", ""))] += 1
        frequency_counts[str(customer.get("music_lis_frequency", ""))] += 1
        genre_counts[str(customer.get("fav_music_genre", ""))] += 1
        tenure_counts[str(customer.get("spotify_usage_period", ""))] += 1

    def top(counter, limit=3):
        return sorted(counter.items(), key=lambda item: item[1], reverse=True)[:limit]

    def render(pairs):
        return "\n".join(f"- {key}: {value} customers" for key, value in pairs)

    ratings = [
        float(c.get("music_recc_rating") or 0)
        for c in members
        if c.get("music_recc_rating")
    ]
    average_rating = round(sum(ratings) / len(ratings), 2) if ratings else 0

    prompt = f"""Design a retention action protocol for one specific customer segment.

SEGMENT: {segment_name}
Strategic focus for this segment: {summary['focus']}
Profile: {summary['description']}

Segment metrics:
- Customers: {summary['users']}
- Flagged non-healthy: {summary['detected']}
- Average churn probability: {summary['averageChurn']}%
- Average health score: {summary['averageHealth']}/100
- Average age: {summary['averageAge']}
- Paid subscribers: {summary['paidCount']} of {summary['users']}
- Daily listeners: {summary['dailyListeners']} of {summary['users']}
- Average recommendation rating: {average_rating}/5

Most common subscription plans:
{render(top(plan_counts))}

Most common listening frequencies:
{render(top(frequency_counts))}

Most common tenure bands:
{render(top(tenure_counts))}

Most common favourite genres:
{render(top(genre_counts))}

Produce exactly {count} actions, sequenced in the order they should be executed.
Requirements:
- Each action must be a single sentence under 20 words
- Each must reference something specific to THIS segment's plan mix, tenure,
  engagement level, or genre profile
- Actions must be concrete and executable, not strategic platitudes
- Do NOT produce generic advice that would apply to any segment

Return a JSON array of {count} strings and nothing else."""

    fallback = FALLBACK_ACTIONS.get(segment_name, GENERIC_FALLBACK)

    actions = generate_json_list(
        "You are a retention campaign strategist. Every recommendation must be "
        "grounded in the specific segment data supplied and must differ "
        "meaningfully from what you would recommend for other segments.",
        prompt,
        max_tokens=450,
        fallback=fallback,
    )

    return {
        "segment": segment_name,
        "detected": summary["detected"],
        "actions": actions[:count],
        "aiGenerated": actions != fallback,
        "focus": summary["focus"],
    }


@router.post("/segments/bulk-action")
def bulk_action(payload: BulkActionRequest):
    """Record execution of a user-approved action protocol against a segment."""
    groups = _segment_groups()
    members = groups.get(payload.segment)

    if not members:
        raise HTTPException(status_code=404, detail="Segment not found")

    if not payload.actions:
        raise HTTPException(
            status_code=400, detail="Select at least one action to execute"
        )

    affected = sum(1 for c in members if c["risk_level"] != "Healthy")

    return {
        "status": "ok",
        "segment": payload.segment,
        "affectedCustomers": affected,
        "actionsExecuted": payload.actions,
        "message": (
            f"Executed {len(payload.actions)} action(s) for {affected} customers "
            f"in the {payload.segment} segment."
        ),
    }