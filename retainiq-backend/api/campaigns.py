from fastapi import APIRouter


router=APIRouter()



@router.get("/campaigns")

def campaigns():

    return {


        "campaigns":[

            {

            "id":1,

            "name":
            "Premium Upgrade Campaign",

            "status":
            "Active"

            }

        ]

    }