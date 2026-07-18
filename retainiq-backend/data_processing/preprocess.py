import os

import pandas as pd

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.normpath(os.path.join(BASE_DIR, "..", "..", "dataset", "customer_segment.csv"))


def load_dataset():
    df = pd.read_csv(DATA_PATH)

    print("Dataset Shape:")
    print(df.shape)

    print("\nColumns:")
    print(df.columns)

    print("\nMissing Values:")
    print(df.isnull().sum())

    return df


if __name__ == "__main__":
    data = load_dataset()