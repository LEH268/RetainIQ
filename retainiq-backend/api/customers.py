from fastapi import APIRouter

from data_processing.dataset_loader import get_customers


router = APIRouter()



@router.get("/customers")

def customers():

    return {

        "customers":
        get_customers()

    }