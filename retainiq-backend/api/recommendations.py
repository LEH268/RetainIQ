from fastapi import APIRouter
from pydantic import BaseModel

from data_processing.dataset_loader import get_customers

router = APIRouter()

_dismissed_ids = set()


class RecommendationAction(BaseModel):
    type: str


@router.get("/recommendations")
def recommendations():
    customers = get_customers()
    flagged = [c for c in customers if c["risk_level"] in ("High Risk", "Moderate Risk")]
    flagged.sort(key=lambda c: c["churn_probability"], reverse=True)

    results = []
    for c in flagged[:10]:
        if c["id"] in _dismissed_ids:
            continue
        priority = "High" if c["risk_level"] == "High Risk" else "Medium"
        success = max(40, 90 - c["churn_probability"])
        results.append({
            "id": c["id"],
            "customer": c["name"],
            "risk": c["risk_level"],
            "rec": c["recommendation"]["action"],
            "success": f"{success}%",
            "reason": c["recommendation"]["reason"],
            "priority": priority,
        })
    return results


@router.post("/recommendations/{customer_id}/action")
def act_on_recommendation(customer_id: str, payload: RecommendationAction):
    _dismissed_ids.add(customer_id)
    return {"status": "ok", "type": payload.type, "customerId": customer_id}