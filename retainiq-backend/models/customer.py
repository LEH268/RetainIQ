from typing import List, Optional
from pydantic import BaseModel


class Recommendation(BaseModel):
    action: str
    reason: str


class Customer(BaseModel):
    id: str
    name: str
    email: str
    age: Optional[str] = None
    gender: Optional[str] = None
    spotify_listening_device: Optional[str] = None
    spotify_subscription_plan: Optional[str] = None
    spotify_usage_period: Optional[str] = None
    fav_music_genre: Optional[str] = None
    music_time_slot: Optional[str] = None
    music_lis_frequency: Optional[str] = None
    music_recc_rating: Optional[float] = None
    pod_lis_frequency: Optional[str] = None
    fav_pod_genre: Optional[str] = None
    pod_variety_satisfaction: Optional[str] = None
    churn: int = 0
    health_score: int
    churn_probability: int
    risk_level: str
    segment: str
    churn_analysis: List[str] = []
    recommendation: Recommendation