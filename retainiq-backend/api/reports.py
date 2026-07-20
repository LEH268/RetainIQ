from fastapi import APIRouter

from data_processing.dataset_loader import (
    get_customers
)


router = APIRouter()



AVERAGE_MONTHLY_VALUE = 17.50



@router.get("/reports")
def reports():


    customers = get_customers()


    total = len(customers)


    high_risk = [

        c for c in customers

        if c["risk_level"] == "High Risk"

    ]



    moderate_risk = [

        c for c in customers

        if c["risk_level"] == "Moderate Risk"

    ]



    at_risk = (
        high_risk
        +
        moderate_risk
    )



    at_risk_count = len(at_risk)



    revenue_risk = round(
        at_risk_count
        *
        AVERAGE_MONTHLY_VALUE,
        2
    )



    possible_saved = round(
        revenue_risk
        *
        0.35,
        2
    )



    healthy_percentage = round(

        len(
            [
                c for c in customers
                if c["risk_level"]=="Healthy"
            ]
        )
        /
        total
        *
        100,

        1

    )



    return {


        "totalCustomers":
            total,


        "atRiskCustomers":
            at_risk_count,


        "atRiskRevenue":
            revenue_risk,


        "potentialSavedRevenue":
            possible_saved,


        "healthyPercentage":
            healthy_percentage,


        "riskBreakdown":[


            {
                "name":"High Risk",
                "value":len(high_risk)
            },


            {
                "name":"Moderate Risk",
                "value":len(moderate_risk)
            },


            {
                "name":"Healthy",
                "value":
                total-at_risk_count
            }

        ]

    }