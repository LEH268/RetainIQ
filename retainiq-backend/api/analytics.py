from fastapi import APIRouter

from data_processing.dataset_loader import get_customers

router = APIRouter()

TIMEFRAME_LABELS = {
    "Daily": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    "Weekly": ["Wk 1", "Wk 2", "Wk 3", "Wk 4", "Wk 5", "Wk 6"],
    "Monthly": ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    "Yearly": ["2021", "2022", "2023", "2024", "2025", "2026"],
}


@router.get("/analytics")
def analytics(timeframe: str = "Monthly", compare: bool = False):
    customers = get_customers()
    total = len(customers) or 1
    labels = TIMEFRAME_LABELS.get(timeframe, TIMEFRAME_LABELS["Monthly"])

    base_users = max(1, total // len(labels))
    data = []
    running_users = 0
    for i, label in enumerate(labels):
        running_users += base_users + i * 2
        revenue = running_users * 12  # mock average revenue per user
        data.append({"month": label, "users": running_users, "revenue": revenue})

    return data