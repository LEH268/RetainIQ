from fastapi import APIRouter

from pydantic import BaseModel



router = APIRouter()



campaigns = [

{
"id":1,
"name":"Premium Upgrade Campaign",
"target":"Free Users",
"status":"Active"
},

{
"id":2,
"name":"Win Back Campaign",
"target":"At Risk Users",
"status":"Scheduled"
}

]



class CampaignCreate(BaseModel):

    name:str

    target:str="All Customers"



@router.get("/campaigns")
def get_campaigns():

    return campaigns




@router.post("/campaigns")
def create_campaign(
    payload:CampaignCreate
):


    new_campaign={


        "id":
        len(campaigns)+1,


        "name":
        payload.name,


        "target":
        payload.target,


        "status":
        "Scheduled"

    }



    campaigns.append(
        new_campaign
    )


    return new_campaign