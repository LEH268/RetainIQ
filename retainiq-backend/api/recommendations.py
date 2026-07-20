from fastapi import APIRouter

from data_processing.dataset_loader import (
    get_customers
)


from pydantic import BaseModel



router = APIRouter()



dismissed = set()



class RecommendationAction(BaseModel):

    type:str




def generate_action(customer):


    if customer["spotify_subscription_plan"] == "Free (ad-supported)":

        return {
            "action":
            "Offer Premium trial",

            "reason":
            "Free users have higher conversion opportunity."
        }



    if customer["music_lis_frequency"] in [
        "Never",
        "Rarely"
    ]:

        return {

            "action":
            "Send re-engagement campaign",


            "reason":
            "Listening activity is decreasing."

        }



    return {


        "action":
        "Send loyalty reward",


        "reason":
        "Maintain customer engagement."

    }




@router.get("/recommendations")
def recommendations():


    customers = get_customers()



    risky = [

        c for c in customers

        if c["risk_level"]
        !=
        "Healthy"

    ]



    risky.sort(

        key=lambda x:
        x["churn_probability"],

        reverse=True

    )



    result=[]



    for customer in risky[:10]:


        if customer["id"] in dismissed:

            continue



        action = generate_action(
            customer
        )


        result.append({

            "id":
            customer["id"],


            "customer":
            customer["Name"],


            "risk":
            customer["risk_level"],


            "churnProbability":
            customer["churn_probability"],


            "recommendation":
            action["action"],


            "reason":
            action["reason"]

        })


    return result




@router.post(
"/recommendations/{customer_id}/action"
)
def action(
    customer_id:str,
    payload:RecommendationAction
):


    dismissed.add(
        customer_id
    )


    return {

        "status":"ok",

        "customerId":
        customer_id,

        "action":
        payload.type

    }