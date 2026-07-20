import json

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from data_processing.dataset_loader import (
    get_customers,
    get_customer_by_id
)

from services.ai_client import (
    generate_text,
    AIClientError
)


router = APIRouter()



# ==========================
# Request Models
# ==========================


class ChatMessage(BaseModel):

    message: str



class SimulateRequest(BaseModel):

    customerId: str

    action: str



class GenerateEmailRequest(BaseModel):

    segment: str

    prompt: str



# ==========================
# Simulation Actions
# ==========================


ACTIONS = [

    {
        "name":
        "Offer Premium Discount",

        "impact":
        -15
    },


    {
        "name":
        "Send Personalized Email",

        "impact":
        -8
    },


    {
        "name":
        "Provide Customer Support",

        "impact":
        -12
    },


    {
        "name":
        "Free Premium Trial",

        "impact":
        -20
    }

]



# ==========================
# AI Simulation
# ==========================


@router.get(
"/ai/simulate-options/{customer_id}"
)
def simulate_options(customer_id:str):


    customer = get_customer_by_id(
        customer_id
    )


    if customer is None:

        raise HTTPException(
            404,
            "Customer not found"
        )



    return {

        "options":[

            {
                "name":
                action["name"]
            }

            for action in ACTIONS

        ]

    }




@router.post("/ai/simulate")
def simulate(
    payload:SimulateRequest
):


    customer = get_customer_by_id(
        payload.customerId
    )


    if customer is None:

        raise HTTPException(
            404,
            "Customer not found"
        )



    action = next(

        (
            x for x in ACTIONS
            if x["name"] == payload.action
        ),

        None

    )



    impact = (

        action["impact"]

        if action

        else -10

    )



    new_probability = max(

        0,

        min(

            100,

            customer["churn_probability"]
            +
            impact

        )

    )



    return {


        "previous":

        customer["churn_probability"],


        "newChurnProbability":

        new_probability

    }




# ==========================
# AI Chat
# ==========================


@router.post("/ai/chat")
def chat(
    payload:ChatMessage
):


    customers = get_customers()



    total = len(customers)


    high = len(

        [
            c for c in customers
            if c["risk_level"]
            ==
            "High Risk"
        ]

    )



    prompt = f"""

Customer dataset:

Total customers:
{total}

High risk customers:
{high}


Question:

{payload.message}

Answer as RetainIQ customer analytics assistant.

"""



    try:

        response = generate_text(

            "You are RetainIQ AI assistant.",

            prompt,

            300

        )


    except AIClientError as e:

        raise HTTPException(
            503,
            str(e)
        )



    return {


        "reply":
        response

    }





# ==========================
# Explainable AI
# ==========================


@router.get(
"/ai/explain/{customer_id}"
)
def explain(customer_id:str):


    customer = get_customer_by_id(
        customer_id
    )


    if customer is None:

        raise HTTPException(
            404,
            "Customer not found"
        )



    prompt = f"""

Analyze this Spotify customer.

Health Score:
{customer["health_score"]}


Churn Probability:
{customer["churn_probability"]}%


Risk:
{customer["risk_level"]}


Subscription:
{customer["spotify_subscription_plan"]}


Listening Frequency:
{customer["music_lis_frequency"]}


Rating:
{customer["music_recc_rating"]}


Return JSON array only.

Example:

[
"Reason 1",
"Reason 2"
]

"""



    try:

        result = generate_text(

            "You explain customer churn factors.",

            prompt,

            300

        )


    except AIClientError as e:

        raise HTTPException(
            503,
            str(e)
        )



    try:

        insights = json.loads(
            result
        )

    except:

        insights=[
            result
        ]



    return {


        "insights":
        insights

    }




# ==========================
# Email Generator
# ==========================


@router.post(
"/ai/generate-email"
)
def generate_email(
    payload:GenerateEmailRequest
):


    prompt=f"""

Create customer retention email.

Segment:
{payload.segment}


Instruction:
{payload.prompt}

Keep under 150 words.

"""


    try:

        email = generate_text(

            "You are RetainIQ marketing assistant.",

            prompt,

            400

        )


    except AIClientError as e:

        raise HTTPException(
            503,
            str(e)
        )



    return {


        "emailDraft":
        email

    }