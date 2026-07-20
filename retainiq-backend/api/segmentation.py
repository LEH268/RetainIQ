from fastapi import APIRouter

from data_processing.dataset_loader import (
    get_customers
)


from collections import defaultdict



router = APIRouter()



SEGMENT_DESCRIPTION = {


    "VIP":
    "Premium users with strong engagement and low churn risk.",


    "Loyal":
    "Stable customers with healthy listening behaviour.",


    "New":
    "Recently joined Spotify users.",


    "At Risk":
    "Customers with high churn possibility.",


    "Inactive":
    "Low engagement customers."

}



@router.get("/segments")
def segments():


    customers = get_customers()



    groups = defaultdict(list)



    for customer in customers:

        groups[
            customer["segment"]
        ].append(customer)



    result = []



    for name, members in groups.items():


        avg_churn = round(

            sum(
                c["churn_probability"]
                for c in members
            )
            /
            len(members),

            1
        )



        avg_health = round(

            sum(
                c["health_score"]
                for c in members
            )
            /
            len(members),

            1

        )



        result.append({

            "name":name,


            "value":
                len(members),


            "description":
                SEGMENT_DESCRIPTION.get(
                    name,
                    ""
                ),


            "averageChurn":
                avg_churn,


            "averageHealth":
                avg_health

        })



    result.sort(
        key=lambda x:x["value"],
        reverse=True
    )


    return result