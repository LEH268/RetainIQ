import os
import pandas as pd

from services.churn_prediction import (
    compute_churn_probability,
    classify_risk
)

from services.health_score import (
    compute_health_score
)


BASE_DIR = os.path.dirname(os.path.abspath(__file__))

DATASET_PATH = os.path.join(
    os.path.dirname(BASE_DIR),
    "dataset",
    "customer_data.csv"
)


def generate_segment(customer):

    churn = customer["churn_probability"]

    if churn >= 60:
        return "At Risk"

    if (
        customer["spotify_subscription_plan"]
        != "Free (ad-supported)"
        and customer["music_lis_frequency"] == "Daily"
    ):
        return "VIP"

    if customer["spotify_usage_period"] == "Less than 6 months":
        return "New"

    if churn < 30:
        return "Loyal"

    return "Inactive"



def load_dataset():

    if not os.path.exists(DATASET_PATH):
        raise FileNotFoundError(
            "customer_data.csv not found"
        )

    df = pd.read_csv(DATASET_PATH)

    df = df.fillna("")

    return df



def get_customers():

    df = load_dataset()

    customers = []


    for index, row in df.iterrows():

        customer = row.to_dict()


        # create ID
        customer["id"] = str(index + 1)


        # calculate churn
        churn_probability = compute_churn_probability(
            customer
        )

        customer["churn_probability"] = churn_probability


        # risk
        customer["risk_level"] = classify_risk(
            churn_probability
        )


        # health
        customer["health_score"] = compute_health_score(
            customer
        )


        # segment
        customer["segment"] = generate_segment(
            customer
        )


        customers.append(customer)


    return customers



def get_customer_by_id(customer_id):

    customers = get_customers()


    for customer in customers:

        if str(customer["id"]) == str(customer_id):
            return customer


    return None