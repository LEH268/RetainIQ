"""Customer directory endpoints with server-side filtering."""

from fastapi import APIRouter, HTTPException

from api.recommendations import generate_action
from data_processing.dataset_loader import get_customer_by_id, get_customers

router = APIRouter()

HEALTH_BANDS = {
    "excellent": (85, 100),
    "good": (70, 84),
    "fair": (50, 69),
    "poor": (0, 49),
}


def _matches_health(customer, health_param):
    """Return True when a customer falls in any of the requested health bands."""
    if not health_param:
        return True
    bands = [band.strip().lower() for band in health_param.split(",") if band.strip()]
    score = customer["health_score"]
    for band in bands:
        bounds = HEALTH_BANDS.get(band)
        if bounds and bounds[0] <= score <= bounds[1]:
            return True
    return False


@router.get("/customers")
def customers(
    risk: str | None = None,
    segment: str | None = None,
    status: str | None = None,
    plan: str | None = None,
    health: str | None = None,
    gender: str | None = None,
    min_age: int | None = None,
    max_age: int | None = None,
    search: str | None = None,
    limit: int | None = None,
):
    """Return customers filtered by any combination of directory facets."""
    result = get_customers()

    if risk:
        result = [item for item in result if item["risk_level"] == risk]
    if segment:
        result = [item for item in result if item["segment"] == segment]
    if status:
        result = [item for item in result if item["status"] == status]
    if plan:
        result = [
            item for item in result
            if str(item.get("spotify_subscription_plan", "")) == plan
        ]
    if gender:
        result = [item for item in result if str(item.get("Gender", "")) == gender]
    if health:
        result = [item for item in result if _matches_health(item, health)]
    if min_age is not None:
        result = [item for item in result if int(item.get("Age", 0)) >= min_age]
    if max_age is not None:
        result = [item for item in result if int(item.get("Age", 0)) <= max_age]
    if search:
        needle = search.lower()
        result = [
            item for item in result
            if needle in str(item.get("Name", "")).lower()
            or needle in str(item.get("email", "")).lower()
        ]
    if limit:
        result = result[:limit]

    return result


@router.get("/customers/facets")
def customer_facets():
    """Return the distinct filter values present in the dataset."""
    customers_list = get_customers()

    def distinct(field):
        return sorted({
            str(item.get(field, "")) for item in customers_list if item.get(field, "")
        })

    ages = [int(item.get("Age", 0)) for item in customers_list if item.get("Age")]

    return {
        "statuses": distinct("status"),
        "segments": distinct("segment"),
        "riskLevels": ["Healthy", "Moderate Risk", "High Risk"],
        "plans": distinct("spotify_subscription_plan"),
        "genders": distinct("Gender"),
        "healthBands": list(HEALTH_BANDS.keys()),
        "ageRange": {"min": min(ages) if ages else 0, "max": max(ages) if ages else 0},
    }


@router.get("/customers/{customer_id}")
def customer_detail(customer_id: str):
    """Return one customer enriched with its recommended retention action."""
    customer = get_customer_by_id(customer_id)

    if customer is None:
        raise HTTPException(status_code=404, detail="Customer not found")

    enriched = dict(customer)
    enriched["recommendation"] = generate_action(customer)
    return enriched