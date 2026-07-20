from services.churn_model import (
    predict_churn_probability
)



def compute_churn_probability(customer):

    probability = predict_churn_probability(
        customer
    )

    return round(
        max(
            0,
            min(
                100,
                probability
            )
        )
    )



def classify_risk(probability):

    if probability >= 60:
        return "High Risk"


    elif probability >= 30:
        return "Moderate Risk"


    else:
        return "Healthy"