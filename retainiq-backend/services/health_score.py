from services.churn_model import (
    predict_churn_probability
)



def compute_health_score(customer):

    churn_probability = (
        predict_churn_probability(customer)
    )


    score = 100 - churn_probability


    # engagement bonus

    if customer.get(
        "music_lis_frequency"
    ) == "Daily":

        score += 10


    if customer.get(
        "spotify_usage_period"
    ) == "More than 2 years":

        score += 5



    if customer.get(
        "music_recc_rating"
    ):

        rating = int(
            customer["music_recc_rating"]
        )

        score += rating



    return round(
        max(
            0,
            min(
                100,
                score
            )
        )
    )