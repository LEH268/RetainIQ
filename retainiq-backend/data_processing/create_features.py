import pandas as pd


def create_churn_label(df):


    df["churn"] = 0


    risk_condition = (

        (df["spotify_subscription_plan"] == "Free")
        &
        (df["music_recc_rating"] <= 2)

    )


    df.loc[risk_condition,"churn"] = 1


    return df



if __name__ == "__main__":


    df = pd.read_excel(
        "../../dataset/spotify_user_behavior.xlsx"
    )


    df = create_churn_label(df)


    df.to_csv(
        "../../dataset/customer_data.csv",
        index=False
    )


    print("Feature creation completed")