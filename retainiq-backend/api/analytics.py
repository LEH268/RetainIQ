from fastapi import APIRouter

from data_processing.dataset_loader import (
    get_customers
)


from collections import Counter



router = APIRouter()



@router.get("/analytics")
def analytics():

    customers = get_customers()



    # Subscription analysis

    subscription = Counter(
        c["spotify_subscription_plan"]
        for c in customers
    )



    # Device analysis

    devices = Counter(
        c["spotify_listening_device"]
        for c in customers
    )



    # Genre analysis

    genres = Counter(
        c["fav_music_genre"]
        for c in customers
    )



    # Listening frequency

    frequency = Counter(
        c["music_lis_frequency"]
        for c in customers
    )




    return {


        "subscriptionDistribution":[

            {
                "name":key,
                "value":value
            }

            for key,value
            in subscription.items()

        ],



        "deviceDistribution":[

            {
                "name":key,
                "value":value
            }

            for key,value
            in devices.items()

        ],




        "genreDistribution":[

            {
                "name":key,
                "value":value
            }

            for key,value
            in genres.items()

        ],



        "listeningFrequency":[

            {
                "name":key,
                "value":value
            }

            for key,value
            in frequency.items()

        ]

    }