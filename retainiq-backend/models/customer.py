from typing import List, Optional
from pydantic import BaseModel


class Recommendation(BaseModel):
    action: str
    reason: str


class Customer(BaseModel):
    id: str
    name: str
    email: str
    spotify_listening_device: Optional[str] = None
    spotify_subscription_plan: Optional[str] = None
    spotify_usage_period: Optional[str] = None
    churn: int = 0
    health_score: int
    churn_probability: int
    risk_level: str
    segment: str
    churn_analysis: List[str] = []
    recommendation: Recommendation