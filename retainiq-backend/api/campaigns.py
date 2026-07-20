"""Campaign CRUD endpoints backed by in-memory storage."""

from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from data_processing.dataset_loader import get_customers

router = APIRouter()

_campaigns = [
    {
        "id": 1,
        "name": "Spring Wellness 2026",
        "target": "All Customers",
        "status": "Active",
        "created": "2026-03-01",
        "objective": "Retention (Prevent Churn)",
        "tone": "Friendly & Casual",
        "keyDetails": "Spring promotion for all users.",
        "emailBody": (
            "Subject: Boost your listening this Spring\n\n"
            "Hi there,\n\nSpring is here and your library deserves a refresh."
        ),
        "scheduledDate": "",
        "recipientCount": 0,
    },
    {
        "id": 2,
        "name": "At-Risk Recovery",
        "target": "At Risk",
        "status": "Draft",
        "created": "2026-03-10",
        "objective": "Win-back (Re-engagement)",
        "tone": "Empathetic & Caring",
        "keyDetails": "Offer 20% discount to come back.",
        "emailBody": (
            "Subject: We miss you\n\nHi,\n\nHere is 20% off your next three "
            "months to welcome you back."
        ),
        "scheduledDate": "",
        "recipientCount": 0,
    },
]

_next_id = 3


class CampaignPayload(BaseModel):
    """Create or update payload for a campaign."""

    name: str
    target: str = "All Customers"
    objective: str = "Retention (Prevent Churn)"
    tone: str = "Professional & Direct"
    keyDetails: str = ""
    emailBody: str = ""
    scheduledDate: str = ""
    status: str = "Draft"


def _recipient_count(target):
    """Return how many customers a campaign target resolves to."""
    customers = get_customers()
    if target in ("All Customers", "", None):
        return len(customers)
    return sum(1 for customer in customers if customer["segment"] == target)


def _find(campaign_id):
    """Return a campaign by id, or None."""
    return next((item for item in _campaigns if item["id"] == campaign_id), None)


@router.get("/campaigns")
def list_campaigns():
    """Return all campaigns with live recipient counts."""
    for campaign in _campaigns:
        campaign["recipientCount"] = _recipient_count(campaign["target"])
    return _campaigns


@router.post("/campaigns")
def create_campaign(payload: CampaignPayload):
    """Create a new campaign."""
    global _next_id

    campaign = payload.model_dump()
    campaign["id"] = _next_id
    campaign["created"] = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    campaign["recipientCount"] = _recipient_count(payload.target)

    _next_id += 1
    _campaigns.insert(0, campaign)
    return campaign


@router.put("/campaigns/{campaign_id}")
def update_campaign(campaign_id: int, payload: CampaignPayload):
    """Replace an existing campaign."""
    campaign = _find(campaign_id)
    if campaign is None:
        raise HTTPException(status_code=404, detail="Campaign not found")

    campaign.update(payload.model_dump())
    campaign["recipientCount"] = _recipient_count(payload.target)
    return campaign


@router.delete("/campaigns/{campaign_id}")
def delete_campaign(campaign_id: int):
    """Delete a campaign by id."""
    campaign = _find(campaign_id)
    if campaign is None:
        raise HTTPException(status_code=404, detail="Campaign not found")

    _campaigns.remove(campaign)
    return {"status": "ok", "id": campaign_id}


@router.get("/campaigns/{campaign_id}/recipients")
def campaign_recipients(campaign_id: int, limit: int = 5):
    """Return a sample of recipient emails for a campaign."""
    campaign = _find(campaign_id)
    if campaign is None:
        raise HTTPException(status_code=404, detail="Campaign not found")

    customers = get_customers()
    if campaign["target"] not in ("All Customers", "", None):
        customers = [c for c in customers if c["segment"] == campaign["target"]]

    return {
        "total": len(customers),
        "sample": [customer["email"] for customer in customers[:limit]],
    }