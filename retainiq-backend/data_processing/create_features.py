import os

import pandas as pd

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SOURCE_PATH = os.path.normpath(os.path.join(BASE_DIR, "..", "..", "dataset", "customer_segment.csv"))
OUTPUT_PATH = os.path.normpath(os.path.join(BASE_DIR, "..", "..", "dataset", "customer_data.csv"))


def create_churn_label(df):
    df["churn"] = 0

    risk_condition = (
        (df["spotify_subscription_plan"] == "Free (ad-supported)")
        & (df["music_recc_rating"] <= 2)
    )

    df.loc[risk_condition, "churn"] = 1

    return df


if __name__ == "__main__":
    df = pd.read_csv(SOURCE_PATH)
    df = create_churn_label(df)
    df.to_csv(OUTPUT_PATH, index=False)
    print("Feature creation completed")