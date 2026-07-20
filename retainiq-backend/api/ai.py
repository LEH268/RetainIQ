"""AI-powered endpoints: chat, explanations, simulation, email, insights."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from data_processing.dataset_loader import get_customer_by_id, get_customers
from services.ai_client import (
    AIClientError,
    generate_json_list,
    generate_text,
    is_configured,
)

router = APIRouter()

SIMULATION_ACTIONS = [
    {
        "name": "Offer Premium Discount",
        "impact": -15,
        "detail": "A 20-30% discount on the next billing cycle.",
    },
    {
        "name": "Send Personalized Email",
        "impact": -8,
        "detail": "Targeted content recommendations based on listening history.",
    },
    {
        "name": "Provide Customer Support",
        "impact": -12,
        "detail": "Proactive outreach from a support specialist.",
    },
    {
        "name": "Free Premium Trial",
        "impact": -20,
        "detail": "A 30-day upgrade at no cost.",
    },
]

INSIGHTS_FALLBACK = [
    "Set GEMINI_API_KEY in the backend .env to generate live AI insights.",
    "All metrics shown on this dashboard are computed directly from the dataset.",
]


class ChatMessage(BaseModel):
    """Payload for the AI chat endpoint."""

    message: str


class SimulateRequest(BaseModel):
    """Payload for the retention action simulator."""

    customerId: str
    action: str


class GenerateEmailRequest(BaseModel):
    """Payload for the campaign email generator."""

    name: str = ""
    target: str = "All Customers"
    objective: str = "Retention (Prevent Churn)"
    tone: str = "Professional & Direct"
    details: str = ""


def _cohort_context():
    """Return a compact textual summary of the current cohort for prompting."""
    customers = get_customers()
    total = len(customers)
    if not total:
        return "No customers loaded.", {}

    high = sum(1 for c in customers if c["risk_level"] == "High Risk")
    moderate = sum(1 for c in customers if c["risk_level"] == "Moderate Risk")
    healthy = total - high - moderate
    paid = sum(
        1 for c in customers if "Free" not in str(c.get("spotify_subscription_plan", ""))
    )
    daily = sum(1 for c in customers if c.get("music_lis_frequency") == "Daily")
    average_health = round(sum(c["health_score"] for c in customers) / total, 1)
    average_churn = round(sum(c["churn_probability"] for c in customers) / total, 1)

    stats = {
        "total": total,
        "high": high,
        "moderate": moderate,
        "healthy": healthy,
        "paid": paid,
        "daily": daily,
        "average_health": average_health,
        "average_churn": average_churn,
    }

    context = f"""Total customers: {total}
High risk: {high} ({round(high / total * 100, 1)}%)
Moderate risk: {moderate} ({round(moderate / total * 100, 1)}%)
Healthy: {healthy} ({round(healthy / total * 100, 1)}%)
Paid subscribers: {paid}
Daily listeners: {daily}
Average health score: {average_health}/100
Average churn probability: {average_churn}%"""

    return context, stats


@router.get("/ai/status")
def ai_status_endpoint():
    """Report AI availability with an actionable message for the UI."""
    from services.ai_client import ai_status
    return ai_status()


@router.get("/ai/generate-insights")
def generate_insights():
    """Return AI-written business insights grounded in cohort metrics."""
    context, stats = _cohort_context()
    if not stats:
        return {"insights": INSIGHTS_FALLBACK, "aiGenerated": False}

    prompt = f"""You are reviewing a Spotify-style subscription customer base.

{context}

Write 4 business insights for a customer success team. Each must:
- cite at least one specific number from the data above
- state an implication, not just a restatement
- stay under 22 words

Return a JSON array of 4 strings and nothing else."""

    insights = generate_json_list(
        "You are RetainIQ's analytics engine. You are concise, quantitative, "
        "and never invent figures that were not supplied.",
        prompt,
        max_tokens=450,
        fallback=INSIGHTS_FALLBACK,
    )

    return {
        "insights": insights[:4],
        "aiGenerated": insights != INSIGHTS_FALLBACK,
    }


@router.post("/ai/chat")
def chat(payload: ChatMessage):
    """Answer a free-form question about the customer dataset.
    Falls back to a deterministic data summary when the AI service is
    unreachable, so the chat panel is never dead.
    """
    context, stats = _cohort_context()

    top_risk = sorted(
        get_customers(), key=lambda item: item["churn_probability"], reverse=True
    )[:5]
    risk_lines = "\n".join(
        f"- {c.get('name', 'Unknown')} ({c['segment']}): {c['churn_probability']}% churn, "
        f"health {c['health_score']}"
        for c in top_risk
    )

    prompt = f"""Customer dataset summary:
{context}

Highest-risk customers:
{risk_lines}

User question: {payload.message}

Answer using only the data above. If the data cannot answer the question, say
so plainly and suggest what would be needed. Keep the reply under 120 words."""

    try:
        reply = generate_text(
            "You are the RetainIQ analytics assistant. You are direct, "
            "quantitative, and never fabricate data.",
            prompt,
            max_tokens=400,
        )
        return {"reply": reply, "aiGenerated": True}
    except AIClientError as exc:
        # Return 200 with the raw figures rather than a dead error bubble.
        fallback = (
            f"The AI service is unavailable, so here are the current figures "
            f"directly from the dataset:\n\n{context}\n\n"
            f"Highest-risk customers:\n{risk_lines}\n\n"
            f"Reason: {exc}"
        )
        return {"reply": fallback, "aiGenerated": False, "error": str(exc)}


@router.get("/ai/explain/{customer_id}")
def explain(customer_id: str):
    """Return AI-generated churn drivers for a single customer."""
    customer = get_customer_by_id(customer_id)
    if customer is None:
        raise HTTPException(status_code=404, detail="Customer not found")

    prompt = f"""Explain why this customer has their current churn risk.

Health score: {customer['health_score']}/100
Churn probability: {customer['churn_probability']}%
Risk level: {customer['risk_level']}
Segment: {customer['segment']}
Subscription plan: {customer.get('spotify_subscription_plan')}
Tenure: {customer.get('spotify_usage_period')}
Music listening frequency: {customer.get('music_lis_frequency')}
Podcast listening frequency: {customer.get('pod_lis_frequency')}
Recommendation rating: {customer.get('music_recc_rating')}/5
Content satisfaction: {customer.get('pod_variety_satisfaction')}
Listening device: {customer.get('spotify_listening_device')}

Return 3 to 4 factors. Each must name the specific field driving it and stay
under 20 words. Return a JSON array of strings and nothing else."""

    fallback = [
        f"Churn probability of {customer['churn_probability']}% places this "
        f"customer in the {customer['risk_level']} band.",
        f"Listening frequency is '{customer.get('music_lis_frequency')}', a "
        "primary engagement driver.",
        f"Subscription plan is '{customer.get('spotify_subscription_plan')}'.",
    ]

    insights = generate_json_list(
        "You explain customer churn drivers to retention analysts. Cite the "
        "specific field behind each factor.",
        prompt,
        max_tokens=400,
        fallback=fallback,
    )

    return {
        "insights": insights[:4],
        "aiGenerated": insights != fallback,
    }


@router.get("/ai/simulate-options/{customer_id}")
def simulate_options(customer_id: str):
    """Return the retention actions available for simulation."""
    customer = get_customer_by_id(customer_id)
    if customer is None:
        raise HTTPException(status_code=404, detail="Customer not found")

    return {
        "options": [
            {"name": action["name"], "detail": action["detail"]}
            for action in SIMULATION_ACTIONS
        ]
    }


@router.post("/ai/simulate")
def simulate(payload: SimulateRequest):
    """Project the churn probability after applying a retention action."""
    customer = get_customer_by_id(payload.customerId)
    if customer is None:
        raise HTTPException(status_code=404, detail="Customer not found")

    action = next(
        (item for item in SIMULATION_ACTIONS if item["name"] == payload.action),
        None,
    )
    impact = action["impact"] if action else -10

    # Interventions move high-risk customers more than already-healthy ones.
    current = customer["churn_probability"]
    scaled_impact = impact * (0.6 + (current / 100) * 0.8)
    projected = max(0, min(100, round(current + scaled_impact)))

    return {
        "previous": current,
        "newChurnProbability": projected,
        "delta": projected - current,
        "action": payload.action,
    }


@router.post("/ai/generate-email")
def generate_email(payload: GenerateEmailRequest):
    """Generate a retention campaign email for a target segment."""
    customers = get_customers()
    if payload.target in ("All Customers", "", None):
        cohort = customers
    else:
        cohort = [c for c in customers if c["segment"] == payload.target] or customers

    count = len(cohort)
    average_churn = (
        round(sum(c["churn_probability"] for c in cohort) / count, 1) if count else 0
    )

    prompt = f"""Write a customer retention email.

Campaign name: {payload.name}
Target segment: {payload.target} ({count} customers, average churn {average_churn}%)
Objective: {payload.objective}
Tone: {payload.tone}
Key details to include: {payload.details}

Requirements:
- Start with a "Subject:" line
- Under 150 words total
- Match the requested tone precisely
- Incorporate every key detail supplied
- No placeholder brackets; write finished copy

Return the email text only."""

    try:
        email = generate_text(
            "You are RetainIQ's retention marketing copywriter.",
            prompt,
            max_tokens=500,
        )
    except AIClientError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    return {
        "email": email,
        "emailDraft": email,
        "recipientCount": count,
    }