from fastapi import APIRouter


router=APIRouter()



@router.get("/reports")

def reports():


    return {


        "reports":[

            {
            "id":1,
            "name":
            "Customer Churn Report",

            "date":
            "2026-07-18"
            }


        ]

    }