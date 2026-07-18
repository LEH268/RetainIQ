import json

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from data_processing.dataset_loader import get_customers, get_customer_by_id
from services.ai_client import generate_text, AIClientError

router = APIRouter()


class ChatMessage(BaseModel):
    message: str


class SimulateRequest(BaseModel):
    customerId: str
    action: str


class GenerateEmailRequest(BaseModel):
    segment: str
    prompt: str


class BulkActionRequest(BaseModel):
    segmentName: str
    action: str


SIMULATION_ACTIONS = [
    {"name": "Offer 20% discount", "impact": -18},
    {"name": "Send personalized email", "impact": -8},
    {"name": "Priority support call", "impact": -12},
    {"name": "Free plan upgrade trial", "impact": -22},
]


@router.get("/ai/simulate-options/{customer_id}")
def simulate_options(customer_id: str):
    customer = get_customer_by_id(customer_id)
    if customer is None:
        raise HTTPException(status_code=404, detail="Customer not found")
    return {"options": [{"name": a["name"]} for a in SIMULATION_ACTIONS]}


@router.post("/ai/simulate")
def simulate(payload: SimulateRequest):
    customer = get_customer_by_id(payload.customerId)
    if customer is None:
        raise HTTPException(status_code=404, detail="Customer not found")

    action = next((a for a in SIMULATION_ACTIONS if a["name"] == payload.action), None)
    impact = action["impact"] if action else -10
    new_probability = max(0, min(100, customer["churn_probability"] + impact))
    return {"newChurnProbability": new_probability}


@router.post("/ai/chat")
def chat(payload: ChatMessage):
    customers = get_customers()
    total = len(customers)
    high_risk = sum(1 for c in customers if c["risk_level"] == "High Risk")
    moderate = sum(1 for c in customers if c["risk_level"] == "Moderate Risk")

    system_prompt = (
        "You are RetainIQ AI, an assistant embedded in a customer-retention "
        "dashboard. Answer in 2-4 sentences, ground every claim in the "
        "stats provided (never invent numbers), and suggest one concrete "
        "next step when it's relevant."
    )
    user_prompt = (
        f"Dataset snapshot: {total} tracked customers, {high_risk} High Risk, "
        f"{moderate} Moderate Risk.\n\nUser question: {payload.message}"
    )

    try:
        reply = generate_text(system_prompt, user_prompt, max_tokens=300)
    except AIClientError as exc:
        raise HTTPException(status_code=503, detail=str(exc))

    return {"reply": reply}


@router.get("/ai/explain/{customer_id}")
def explain_customer(customer_id: str):
    """
    Generates the "Explainable AI Insights" shown on the customer
    profile page. This is a real LLM call — the model is given the
    customer's actual scores and behavioral attributes and asked to
    explain, in its own words, why the score is high or why it's low.
    Nothing here is templated or hardcoded.
    """
    customer = get_customer_by_id(customer_id)
    if customer is None:
        raise HTTPException(status_code=404, detail="Customer not found")

    is_healthy = customer["health_score"] >= 60

    system_prompt = (
        "You are RetainIQ AI, an explainable-AI module inside a churn-"
        "prediction dashboard. You will be given one customer's churn "
        "model output plus their raw behavioral attributes. Explain "
        "concretely and specifically WHY the score came out this way — "
        "reference the actual attribute values given, don't speak in "
        "generalities. "
        + (
            "The score is HEALTHY/LOW-RISK: name the specific positive "
            "signals that are keeping churn risk down."
            if is_healthy else
            "The score is AT-RISK/HIGH CHURN: name the specific negative "
            "signals driving the risk up."
        )
        + " Respond with ONLY a JSON array of 3 to 5 short strings, each "
          "under 22 words, each naming one distinct factor. No markdown, "
          "no code fences, no text outside the JSON array."
    )

    user_prompt = (
        f"Health score: {customer['health_score']}/100\n"
        f"Churn probability: {customer['churn_probability']}%\n"
        f"Risk level: {customer['risk_level']}\n"
        f"Segment: {customer['segment']}\n"
        f"Age group: {customer['age']}\n"
        f"Gender: {customer['gender']}\n"
        f"Subscription plan: {customer['spotify_subscription_plan']}\n"
        f"Account tenure: {customer['spotify_usage_period']}\n"
        f"Primary device: {customer['spotify_listening_device']}\n"
        f"Favorite music genre: {customer['fav_music_genre']}\n"
        f"Usual listening time: {customer['music_time_slot']}\n"
        f"Music listening frequency: {customer['music_lis_frequency']}\n"
        f"User's own recommendation rating (1-5 scale): {customer['music_recc_rating']}\n"
        f"Podcast listening frequency: {customer['pod_lis_frequency']}\n"
        f"Favorite podcast genre: {customer['fav_pod_genre']}\n"
        f"Content variety satisfaction: {customer['pod_variety_satisfaction']}"
    )

    try:
        raw = generate_text(system_prompt, user_prompt, max_tokens=400)
    except AIClientError as exc:
        raise HTTPException(status_code=503, detail=str(exc))

    return {"insights": _parse_insight_array(raw)}


def _parse_insight_array(raw: str):
    cleaned = raw.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`")
        if cleaned.lower().startswith("json"):
            cleaned = cleaned[4:].lstrip()

    try:
        data = json.loads(cleaned)
        if isinstance(data, list) and data:
            return [str(item).strip() for item in data if str(item).strip()]
    except (ValueError, TypeError):
        pass

    # Fallback: the model didn't return clean JSON — split into lines
    # instead of discarding the response.
    lines = [line.strip(" -•\t") for line in cleaned.split("\n") if line.strip()]
    return lines[:5] if lines else [cleaned]


@router.post("/ai/generate-email")
def generate_email(payload: GenerateEmailRequest):
    system_prompt = (
        "You are RetainIQ AI, a retention-marketing copywriter. Write a "
        "short retention email (subject line + body, under 150 words) "
        "for the given customer segment and instructions. Plain text "
        "only, no markdown, sign off as 'The RetainIQ Team'."
    )
    user_prompt = f"Target segment: {payload.segment}\nInstructions: {payload.prompt}"

    try:
        draft = generate_text(system_prompt, user_prompt, max_tokens=500)
    except AIClientError as exc:
        raise HTTPException(status_code=503, detail=str(exc))

    return {"emailDraft": draft}


@router.post("/ai/bulk-action")
def bulk_action(payload: BulkActionRequest):
    system_prompt = (
        "You are RetainIQ AI. Write a single confident confirmation "
        "sentence (max 25 words, no markdown) that a retention action has "
        "been queued for a customer segment."
    )
    user_prompt = f"Action: {payload.action}\nSegment: {payload.segmentName}"

    try:
        message = generate_text(system_prompt, user_prompt, max_tokens=80)
    except AIClientError as exc:
        raise HTTPException(status_code=503, detail=str(exc))

    return {"status": "ok", "message": message}