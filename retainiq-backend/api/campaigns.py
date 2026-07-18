from fastapi import APIRouter

router = APIRouter()

_campaigns = [
    {"id": 1, "name": "Premium Upgrade Campaign", "target": "Free Plan Users", "status": "Active"},
    {"id": 2, "name": "Win-Back High Risk VIPs", "target": "At Risk", "status": "Active"},
    {"id": 3, "name": "New User Onboarding Series", "target": "New", "status": "Scheduled"},
]


@router.get("/campaigns")
def campaigns():
    return _campaigns