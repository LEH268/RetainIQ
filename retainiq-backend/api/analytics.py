from fastapi import APIRouter
import random
from data_processing.dataset_loader import get_customers

router = APIRouter()

TIMEFRAME_LABELS = {
    "Daily": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    "Weekly": ["Wk 1", "Wk 2", "Wk 3", "Wk 4", "Wk 5", "Wk 6"],
    "Monthly": ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    "Yearly": ["2021", "2022", "2023", "2024", "2025", "2026"],
}

@router.get("/analytics")
def analytics(timeframe: str = "Monthly", compare: bool = False):
    labels = TIMEFRAME_LABELS.get(timeframe, TIMEFRAME_LABELS["Monthly"])
    data = []
    
    current_users = 5000
    compare_users = 4200 # Baseline for previous year
    
    for label in labels:
        # Simulate realistic fluctuations (churn vs acquisition)
        fluctuation = random.randint(-150, 400) 
        current_users += fluctuation
        revenue = current_users * 17.50 # Avg RM per user based on Premium
        
        entry = {
            "month": label, 
            "users": current_users, 
            "revenue": round(revenue, 2)
        }
        
        if compare:
            comp_fluctuation = random.randint(-100, 300)
            compare_users += comp_fluctuation
            entry["previousYearUsers"] = compare_users
            
        data.append(entry)
        
    return data