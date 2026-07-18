from fastapi import APIRouter


router=APIRouter()



@router.get("/settings")

def settings():

    return {


        "company":
        "RetainIQ",


        "notification":
        True

    }