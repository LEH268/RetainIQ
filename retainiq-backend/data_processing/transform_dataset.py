import pandas as pd
import random
import os

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SOURCE_PATH = os.path.normpath(os.path.join(BASE_DIR, "..", "..", "dataset", "customer_segment.csv"))
OUTPUT_PATH = os.path.normpath(os.path.join(BASE_DIR, "..", "..", "dataset", "customer_data_clean.csv"))

print(BASE_DIR)
print(SOURCE_PATH)
print(os.path.exists(SOURCE_PATH))
df = pd.read_csv(SOURCE_PATH)

# 1. Remove Free users (We only analyze paying subscribers)
df = df[~df['spotify_subscription_plan'].str.contains("Free", na=False)].copy()

# 2. Transform Age from ranges to specific numbers
def parse_age(age_str):
    if pd.isna(age_str): return random.randint(20, 35)
    if "12-20" in age_str: return random.randint(12, 20)
    if "20-35" in age_str: return random.randint(21, 35)
    if "35-60" in age_str: return random.randint(36, 60)
    if "60+" in age_str: return random.randint(61, 75)
    return random.randint(20, 35)

df['Age'] = df['Age'].apply(parse_age)

# 3. Apply new subscription plans
plans = [
    "Premium Individual (RM 17.50/mo)", 
    "Premium Student (RM 9.50/mo)", 
    "Premium Duo (RM 24.50/mo)", 
    "Premium Family (RM 27.90/mo)"
]
def assign_plan(age):
    if age <= 24: return "Premium Student (RM 9.50/mo)"
    return random.choices(plans, weights=[0.5, 0.1, 0.2, 0.2])[0]

df['spotify_subscription_plan'] = df['Age'].apply(assign_plan)

# 4. Create artificial behavior to trigger "Moderate" and "High" risk in the backend
for idx in df.index:
    rand_val = random.random()
    if rand_val < 0.2: # 20% High Risk profile
        df.at[idx, 'music_lis_frequency'] = 'Rarely'
        df.at[idx, 'music_recc_rating'] = random.randint(1, 2)
    elif rand_val < 0.5: # 30% Moderate Risk profile
        df.at[idx, 'music_lis_frequency'] = 'Once a week'
        df.at[idx, 'music_recc_rating'] = 3
    else: # 50% Healthy profile
        df.at[idx, 'music_lis_frequency'] = 'Daily'
        df.at[idx, 'music_recc_rating'] = random.randint(4, 5)

df.to_csv(OUTPUT_PATH, index=False)
print("Dataset transformed successfully. Saved to customer_data_clean.csv")