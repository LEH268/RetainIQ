from fastapi import APIRouter

from data_processing.dataset_loader import get_customers


router = APIRouter()



@router.get("/dashboard")

def dashboard():


    customers=get_customers()


    return {

        "total_customers":
        len(customers),


        "high_risk":
        20,


        "healthy":
        70,


        "customers":
        customers[:10]

    }