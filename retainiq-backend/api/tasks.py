from fastapi import APIRouter


router=APIRouter()



@router.get("/tasks")

def tasks():

    return {


        "tasks":[

            {
                "id":1,
                "title":
                "Contact high risk customer",

                "status":
                "Pending"
            }

        ]

    }