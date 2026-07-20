from fastapi import APIRouter, HTTPException

from data_processing.dataset_loader import (
    get_customers,
    get_customer_by_id
)


router = APIRouter()



@router.get("/customers")
def customers():

    return get_customers()



@router.get("/customers/{customer_id}")
def customer_detail(customer_id: str):

    customer = get_customer_by_id(
        customer_id
    )


    if customer is None:

        raise HTTPException(
            status_code=404,
            detail="Customer not found"
        )


    return customer