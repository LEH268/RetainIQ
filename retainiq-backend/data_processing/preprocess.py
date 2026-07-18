import pandas as pd


DATA_PATH = "../../dataset/spotify_user_behavior.xlsx"


def load_dataset():

    df = pd.read_excel(DATA_PATH)

    print("Dataset Shape:")
    print(df.shape)

    print("\nColumns:")
    print(df.columns)

    print("\nMissing Values:")
    print(df.isnull().sum())

    return df



if __name__ == "__main__":

    data = load_dataset()