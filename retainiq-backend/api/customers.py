from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from data_processing.dataset_loader import get_customers, get_customer_by_id, add_customer

router = APIRouter()


class NewCustomer(BaseModel):
    name: str
    email: str
    plan: str = "Free (ad-supported)"


@router.get("/customers")
def customers():
    return get_customers()


@router.get("/customers/{customer_id}")
def customer_detail(customer_id: str):
    customer = get_customer_by_id(customer_id)
    if customer is None:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer


@router.post("/customers")
def create_customer(payload: NewCustomer):
    if not payload.name.strip() or not payload.email.strip():
        raise HTTPException(status_code=400, detail="Name and email are required.")
    return add_customer(payload.name.strip(), payload.email.strip(), payload.plan)