from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

_campaigns = [
    {"id": 1, "name": "Student Plan Reactivation", "target": "Inactive Students", "status": "Active"},
    {"id": 2, "name": "Duo Plan Upsell", "target": "Individual Plan Users", "status": "Scheduled"},
    {"id": 3, "name": "Win-Back High Risk Families", "target": "At Risk", "status": "Active"},
    {"id": 4, "name": "Loyalty RM 5.00 Discount", "target": "Loyal", "status": "Draft"},
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