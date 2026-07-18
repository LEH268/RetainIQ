from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

_campaigns = [
    {"id": 1, "name": "Premium Upgrade Campaign", "target": "Free Plan Users", "status": "Active"},
    {"id": 2, "name": "Win-Back High Risk VIPs", "target": "At Risk", "status": "Active"},
    {"id": 3, "name": "New User Onboarding Series", "target": "New", "status": "Scheduled"},
]


class NewCampaign(BaseModel):
    name: str
    target: str = "All Customers"


@router.get("/campaigns")
def campaigns():
    return _campaigns


@router.post("/campaigns")
def create_campaign(payload: NewCampaign):
    if not payload.name.strip():
        raise HTTPException(status_code=400, detail="Campaign name is required.")

    new_campaign = {
        "id": max((c["id"] for c in _campaigns), default=0) + 1,
        "name": payload.name.strip(),
        "target": payload.target.strip() or "All Customers",
        "status": "Scheduled",
    }
    _campaigns.append(new_campaign)
    return new_campaign