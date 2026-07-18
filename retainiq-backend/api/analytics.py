from fastapi import APIRouter


router=APIRouter()



@router.get("/analytics")

def analytics(
    timeframe="Monthly",
    compare=False
):


    return {


        "timeframe":
        timeframe,


        "compare":
        compare,


        "engagement":
        [
            {
                "month":"Jan",
                "value":80
            },
            {
                "month":"Feb",
                "value":90
            }
        ],


        "churn":

        [
            {
                "month":"Jan",
                "value":10
            }
        ]

    }