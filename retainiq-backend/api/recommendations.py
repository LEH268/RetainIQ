"""Per-customer retention recommendations."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from data_processing.dataset_loader import get_customer_by_id, get_customers

router = APIRouter()

_dismissed = set()

PRIORITY_HIGH_THRESHOLD = 70
PRIORITY_MEDIUM_THRESHOLD = 45


class RecommendationAction(BaseModel):
    """Payload for applying or rejecting a recommendation."""

    type: str
    action: str | None = None


def generate_action(customer):
    """Return the recommended retention action for one customer."""
    plan = str(customer.get("spotify_subscription_plan", ""))
    frequency = str(customer.get("music_lis_frequency", ""))
    tenure = str(customer.get("spotify_usage_period", ""))

    try:
        rating = float(customer.get("music_recc_rating") or 3)
    except (TypeError, ValueError):
        rating = 3.0

    if "Free" in plan:
        return {
            "action": "Offer Premium trial",
            "reason": (
                "Free-tier users convert at the highest rate when offered a "
                "time-limited Premium trial."
            ),
            "success": "62%",
        }

    if frequency in ("Never", "Rarely"):
        return {
            "action": "Send re-engagement campaign",
            "reason": (
                "Listening frequency has dropped to a level that historically "
                "precedes cancellation."
            ),
            "success": "48%",
        }

    if rating <= 2:
        return {
            "action": "Trigger recommendation reset",
            "reason": (
                "Low recommendation satisfaction signals a poor content match "
                "that a taste-profile refresh can correct."
            ),
            "success": "41%",
        }

    if tenure == "Less than 6 months":
        return {
            "action": "Run onboarding follow-up",
            "reason": (
                "Early-tenure customers churn most often when core features "
                "remain undiscovered."
            ),
            "success": "55%",
        }

    return {
        "action": "Send loyalty reward",
        "reason": "Reinforce engagement before health score declines further.",
        "success": "37%",
    }


def _priority(probability):
    """Map churn probability to a priority label."""
    if probability >= PRIORITY_HIGH_THRESHOLD:
        return "High"
    if probability >= PRIORITY_MEDIUM_THRESHOLD:
        return "Medium"
    return "Low"


@router.get("/recommendations")
def recommendations(limit: int = 10):
    """Return the highest-churn customers with a recommended action each."""
    customers = get_customers()

    risky = [
        customer
        for customer in customers
        if customer["risk_level"] != "Healthy" and customer["id"] not in _dismissed
    ]
    risky.sort(key=lambda item: item["churn_probability"], reverse=True)

    result = []
    for customer in risky[:limit]:
        action = generate_action(customer)
        result.append(
            {
                "id": customer["id"],
                "customer": customer.get("Name", "Unknown"),
                "email": customer.get("email", ""),
                "risk": customer["risk_level"],
                "churnProbability": customer["churn_probability"],
                "healthScore": customer["health_score"],
                "segment": customer["segment"],
                "rec": action["action"],
                "recommendation": action["action"],
                "reason": action["reason"],
                "success": action["success"],
                "priority": _priority(customer["churn_probability"]),
            }
        )

    return result


@router.post("/recommendations/{customer_id}/action")
def action(customer_id: str, payload: RecommendationAction):
    """Apply or reject a recommendation for a customer."""
    customer = get_customer_by_id(customer_id)
    if customer is None:
        raise HTTPException(status_code=404, detail="Customer not found")

    _dismissed.add(str(customer_id))

    return {
        "status": "ok",
        "customerId": customer_id,
        "customer": customer.get("Name", ""),
        "action": payload.action or payload.type,
        "type": payload.type,
    }