"""Generate a synthetic Spotify-style customer dataset with realistic churn signal.

Churn is derived from behavioural drivers plus noise, so downstream models
have genuine (but imperfect) signal to learn. Rating is NOT derived from churn,
which avoids target leakage.
"""

import csv
import os
import random

RANDOM_SEED = 42
N_ROWS = 1639

random.seed(RANDOM_SEED)

FIRST_NAMES_MALAY = ["Ahmad", "Amirul", "Muhammad", "Syed", "Tengku",
                     "Siti", "Nurul", "Farah", "Zainab", "Aishah"]
LAST_NAMES_MALAY = ["Faizal", "Asyraf", "Ariff", "Saddiq", "Amir",
                    "Awang", "Hassan", "Ali", "Ismail", "Othman"]

FIRST_NAMES_CHINESE = ["Wei Jie", "Zhi Hao", "Wei Ming", "Kah Seng", "Kay Peng",
                       "Jia Yi", "Xin Ling", "Xin Yu", "Mei Ling", "Wei Ting"]
LAST_NAMES_CHINESE = ["Tan", "Lim", "Wong", "Lee", "Chong",
                      "Goh", "Ng", "Low", "Khoo", "Chan"]

FIRST_NAMES_INDIAN = ["Rajesh", "Muthu", "Suresh", "Arjun", "Vikneswaran",
                      "Priya", "Anjali", "Meera", "Kavitha", "Nandini"]
LAST_NAMES_INDIAN = ["Kumar", "Sami", "Singh", "Nair", "Patel",
                     "Desai", "Rao", "Krishnan", "Rajan", "Sharma"]

FIRST_NAMES_EURO = ["John", "Oliver", "Lucas", "Daniel", "Benjamin",
                    "Emma", "Sophie", "Isabella", "Chloe", "Charlotte"]
LAST_NAMES_EURO = ["Smith", "Brown", "Miller", "Davis", "King",
                   "Watson", "Taylor", "White", "Martin", "Garcia"]

GENDERS = ["Male", "Female", "Others"]

USAGE_PERIODS = [
    "Less than 6 months",
    "6 months to 1 year",
    "1 year to 2 years",
    "More than 2 years",
]

DEVICES = [
    "Smartphone",
    "Computer or laptop",
    "Smart speakers or voice assistants",
    "Wearable devices",
    "Smartphone, Computer or laptop",
    "Smartphone, Wearable devices",
    "Smartphone, Smart speakers or voice assistants",
    "Computer or laptop, Wearable devices",
    "Smartphone, Computer or laptop, Smart speakers or voice assistants",
]

PLANS = [
    "Premium Individual (RM 17.50/mo)",
    "Premium Duo (RM 24.50/mo)",
    "Premium Family (RM 27.90/mo)",
    "Premium Student (RM 9.50/mo)",
    "Premium Mini (RM 1.50/day)",
    "Free (ad-supported)",
]

PREFERRED_PREMIUM_PLANS = [
    "Individual Plan - RM 17.50/month",
    "Duo Plan - RM 24.50/month",
    "Family Plan - RM 27.90/month",
    "Student Plan - RM 9.50/month",
]

CONTENT_TYPES = ["Music", "Podcast"]

GENRES = ["Pop", "Classical", "Rock", "Electronic/Dance",
          "Melody", "Rap", "Kpop", "All"]

TIME_SLOTS = ["Morning", "Afternoon", "Night"]

MOODS = [
    "Relaxation and stress relief",
    "Uplifting and motivational",
    "Sadness or melancholy",
    "Social gatherings or parties",
    "Relaxation and stress relief, Uplifting and motivational",
    "Sadness or melancholy, Social gatherings or parties",
]

FREQUENCIES = ["Never", "Rarely", "Once a week", "Several times a week", "Daily"]

EXPLORATION_METHODS = [
    "Recommendations",
    "Playlists",
    "Radio",
    "Others",
    "Recommendations, Playlists",
    "Recommendations, Radio",
    "Playlists, Radio",
]

POD_GENRES = ["Comedy", "Lifestyle and Health", "Sports", "Business",
              "Health and Fitness", "Technology", "Informative Stuff",
              "Food and Cooking"]

POD_FORMATS = ["Conversational", "Interview", "Story Telling", "Educational", "Both"]

POD_HOSTS = ["Well-known Individuals", "Unknown Podcasters", "Both"]

POD_DURATIONS = ["Shorter", "Longer", "Both"]

SATISFACTIONS = ["Very Dissatisfied", "Dissatisfied", "Ok", "Satisfied", "Very Satisfied"]

HEADER = [
    "Name", "Age", "Gender", "spotify_usage_period", "spotify_listening_device",
    "spotify_subscription_plan", "premium_sub_willingness", "preffered_premium_plan",
    "preferred_listening_content", "fav_music_genre", "music_time_slot",
    "music_Influencial_mood", "music_lis_frequency", "music_expl_method",
    "music_recc_rating", "pod_lis_frequency", "fav_pod_genre",
    "preffered_pod_format", "pod_host_preference", "preffered_pod_duration",
    "pod_variety_satisfaction", "churn",
]


def generate_name():
    """Return a random full name from one of four naming conventions."""
    ethnicity = random.choice(["Malay", "Chinese", "Indian", "European"])
    if ethnicity == "Malay":
        return f"{random.choice(FIRST_NAMES_MALAY)} {random.choice(LAST_NAMES_MALAY)}"
    if ethnicity == "Chinese":
        return f"{random.choice(LAST_NAMES_CHINESE)} {random.choice(FIRST_NAMES_CHINESE)}"
    if ethnicity == "Indian":
        return f"{random.choice(FIRST_NAMES_INDIAN)} {random.choice(LAST_NAMES_INDIAN)}"
    return f"{random.choice(FIRST_NAMES_EURO)} {random.choice(LAST_NAMES_EURO)}"


def churn_logit(plan, usage_period, music_freq, pod_freq, rating, satisfaction, age):
    """Return a log-odds score for churn based on behavioural drivers.

    Coefficients are hand-set to encode plausible retention dynamics. Real
    signal plus noise means a downstream model can learn something without
    the label being trivially recoverable.
    """
    score = -1.4

    if "Free" in plan:
        score += 1.1
    elif "Mini" in plan:
        score += 0.7
    elif "Student" in plan:
        score += 0.1
    elif "Family" in plan:
        score -= 0.5
    elif "Duo" in plan:
        score -= 0.3

    tenure_effect = {
        "Less than 6 months": 0.8,
        "6 months to 1 year": 0.25,
        "1 year to 2 years": -0.2,
        "More than 2 years": -0.7,
    }
    score += tenure_effect.get(usage_period, 0.0)

    engagement_effect = {
        "Never": 1.3,
        "Rarely": 0.8,
        "Once a week": 0.2,
        "Several times a week": -0.4,
        "Daily": -0.9,
    }
    score += engagement_effect.get(music_freq, 0.0)
    score += engagement_effect.get(pod_freq, 0.0) * 0.3

    score += (3.0 - rating) * 0.45

    satisfaction_effect = {
        "Very Dissatisfied": 0.7,
        "Dissatisfied": 0.35,
        "Ok": 0.0,
        "Satisfied": -0.3,
        "Very Satisfied": -0.55,
    }
    score += satisfaction_effect.get(satisfaction, 0.0)

    if age < 20:
        score += 0.3
    elif age > 45:
        score -= 0.2

    # Irreducible noise so the label is never perfectly predictable.
    score += random.gauss(0, 0.9)
    return score


def logistic(x):
    """Numerically stable logistic function."""
    if x >= 0:
        return 1.0 / (1.0 + pow(2.718281828459045, -x))
    exp_x = pow(2.718281828459045, x)
    return exp_x / (1.0 + exp_x)


def generate_row():
    """Return one dataset row as a list of values."""
    plan = random.choices(PLANS, weights=[30, 20, 20, 15, 5, 10], k=1)[0]
    usage_period = random.choice(USAGE_PERIODS)
    age = random.randint(13, 65)

    willing = "Yes" if "Premium" in plan else random.choice(["Yes", "No"])
    preferred_plan = random.choice(PREFERRED_PREMIUM_PLANS) if willing == "Yes" else ""

    music_freq = random.choices(FREQUENCIES, weights=[5, 12, 20, 30, 33], k=1)[0]
    pod_freq = random.choices(FREQUENCIES, weights=[20, 30, 20, 15, 15], k=1)[0]

    # Rating is generated independently of churn to avoid target leakage.
    rating = random.choices([1, 2, 3, 4, 5], weights=[6, 12, 27, 32, 23], k=1)[0]
    satisfaction = random.choice(SATISFACTIONS)

    if pod_freq == "Never":
        pod_genre = pod_format = pod_host = pod_duration = ""
    else:
        pod_genre = random.choice(POD_GENRES)
        pod_format = random.choice(POD_FORMATS)
        pod_host = random.choice(POD_HOSTS)
        pod_duration = random.choice(POD_DURATIONS)

    probability = logistic(
        churn_logit(plan, usage_period, music_freq, pod_freq,
                    rating, satisfaction, age)
    )
    churn = 1 if random.random() < probability else 0

    return [
        generate_name(),
        age,
        random.choices(GENDERS, weights=[48, 48, 4], k=1)[0],
        usage_period,
        random.choice(DEVICES),
        plan,
        willing,
        preferred_plan,
        random.choices(CONTENT_TYPES, weights=[80, 20], k=1)[0],
        random.choice(GENRES),
        random.choice(TIME_SLOTS),
        random.choice(MOODS),
        music_freq,
        random.choice(EXPLORATION_METHODS),
        rating,
        pod_freq,
        pod_genre,
        pod_format,
        pod_host,
        pod_duration,
        satisfaction,
        churn,
    ]


def main():
    """Write the generated dataset to ../dataset/customer_data.csv."""
    current_dir = os.path.dirname(os.path.abspath(__file__))
    dataset_dir = os.path.join(os.path.dirname(current_dir), "dataset")
    os.makedirs(dataset_dir, exist_ok=True)
    output_file = os.path.join(dataset_dir, "customer_data.csv")

    with open(output_file, "w", newline="", encoding="utf-8") as handle:
        # Let csv handle quoting. Fields contain commas, so QUOTE_MINIMAL
        # is required for a parseable file.
        writer = csv.writer(handle, quoting=csv.QUOTE_MINIMAL)
        writer.writerow(HEADER)
        for _ in range(N_ROWS):
            writer.writerow(generate_row())

    churn_rate = None
    with open(output_file, "r", encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        rows = list(reader)
        churn_rate = sum(int(r["churn"]) for r in rows) / len(rows)

    print(f"Generated {len(rows)} rows at {output_file}")
    print(f"Churn rate: {churn_rate:.1%}")


if __name__ == "__main__":
    main()