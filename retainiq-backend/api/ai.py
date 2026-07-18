from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from data_processing.dataset_loader import get_customers, get_customer_by_id

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

    text = payload.message.lower()
    if "high risk" in text or "churn" in text:
        reply = (
            f"There are currently {high_risk} high-risk customers out of {total} tracked. "
            "I'd recommend prioritizing outreach to the top segment on the Recommendations page."
        )
    elif "hello" in text or "hi" in text:
        reply = "Hi! Ask me about churn risk, customer segments, or retention recommendations."
    else:
        reply = (
            f"I have data on {total} customers. Try asking about high-risk customers, "
            "segments, or specific retention strategies."
        )
    return {"reply": reply}


@router.post("/ai/generate-email")
def generate_email(payload: GenerateEmailRequest):
    draft = (
        "Subject: A little something for you, on us\n\n"
        "Hi there,\n\n"
        f"We noticed you're part of our {payload.segment} group, and we wanted to reach out. "
        f"{payload.prompt}\n\n"
        "We'd love for you to stick around — let us know if there's anything we can do to help.\n\n"
        "Warmly,\nThe RetainIQ Team"
    )
    return {"emailDraft": draft}


@router.post("/ai/bulk-action")
def bulk_action(payload: BulkActionRequest):
    return {
        "status": "ok",
        "message": f"'{payload.action}' initiated for segment '{payload.segmentName}'.",
    }