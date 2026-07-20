from fastapi import APIRouter

from data_processing.dataset_loader import (
    get_customers
)


router = APIRouter()



@router.get("/dashboard/stats")
def dashboard_stats():


    customers = get_customers()


    total = len(customers)



    healthy = sum(
        1
        for c in customers
        if c["risk_level"] == "Healthy"
    )


    moderate = sum(
        1
        for c in customers
        if c["risk_level"] == "Moderate Risk"
    )


    high = sum(
        1
        for c in customers
        if c["risk_level"] == "High Risk"
    )



    avg_health = round(
        sum(
            c["health_score"]
            for c in customers
        )
        /
        total,
        1
    ) if total else 0



    avg_churn = round(
        sum(
            c["churn_probability"]
            for c in customers
        )
        /
        total,
        1
    ) if total else 0




    return {


        "totalCustomers":
            total,


        "healthyCount":
            healthy,


        "moderateCount":
            moderate,


        "highRiskCount":
            high,



        "averageHealthScore":
            avg_health,


        "averageChurnProbability":
            avg_churn,



        "healthDistribution":[

            {
                "name":"Healthy",
                "value":healthy
            },


            {
                "name":"Moderate Risk",
                "value":moderate
            },


            {
                "name":"High Risk",
                "value":high
            }

        ]

    }