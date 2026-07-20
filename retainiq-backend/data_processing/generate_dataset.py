import csv
import random
import os

# Data dictionary setup
first_names_malay = ["Ahmad", "Amirul", "Muhammad", "Syed", "Tengku", "Siti", "Nurul", "Farah", "Zainab", "Aishah"]
last_names_malay = ["Faizal", "Asyraf", "Ariff", "Saddiq", "Amir", "Awang", "Hassan", "Ali", "Ismail", "Othman"]

first_names_chinese = ["Wei Jie", "Zhi Hao", "Wei Ming", "Kah Seng", "Kay Peng", "Jia Yi", "Xin Ling", "Xin Yu", "Mei Ling", "Wei Ting"]
last_names_chinese = ["Tan", "Lim", "Wong", "Lee", "Chong", "Goh", "Ng", "Low", "Khoo", "Chan"]

first_names_indian = ["Rajesh", "Muthu", "Suresh", "Arjun", "Vikneswaran", "Priya", "Anjali", "Meera", "Kavitha", "Nandini"]
last_names_indian = ["Kumar", "Sami", "Singh", "Nair", "Patel", "Desai", "Rao", "Krishnan", "Rajan", "Sharma"]

first_names_euro = ["John", "Oliver", "Lucas", "Daniel", "Benjamin", "Emma", "Sophie", "Isabella", "Chloe", "Charlotte"]
last_names_euro = ["Smith", "Brown", "Miller", "Davis", "King", "Watson", "Taylor", "White", "Martin", "Garcia"]


def generate_name():
    ethnicity = random.choice(["Malay", "Chinese", "Indian", "European"])

    if ethnicity == "Malay":
        return f"{random.choice(first_names_malay)} {random.choice(last_names_malay)}"
    elif ethnicity == "Chinese":
        return f"{random.choice(last_names_chinese)} {random.choice(first_names_chinese)}"
    elif ethnicity == "Indian":
        return f"{random.choice(first_names_indian)} {random.choice(last_names_indian)}"
    else:
        return f"{random.choice(first_names_euro)} {random.choice(last_names_euro)}"


genders = ["Male", "Female", "Others"]

usage_periods = [
    "Less than 6 months",
    "6 months to 1 year",
    "1 year to 2 years",
    "More than 2 years"
]

devices = [
    "Smartphone",
    "Computer or laptop",
    "Smart speakers or voice assistants",
    "Wearable devices",
    "Smartphone, Computer or laptop",
    "Smartphone, Wearable devices",
    "Smartphone, Smart speakers or voice assistants",
    "Computer or laptop, Wearable devices",
    "Smartphone, Computer or laptop, Smart speakers or voice assistants"
]

plans = [
    "Premium Individual (RM 17.50/mo)",
    "Premium Duo (RM 24.50/mo)",
    "Premium Family (RM 27.90/mo)",
    "Premium Student (RM 9.50/mo)",
    "Premium Mini (RM 1.50/day)",
    "Free (ad-supported)"
]

pref_premium_plans = [
    "Individual Plan - RM 17.50/month",
    "Duo Plan - RM 24.50/month",
    "Family Plan - RM 27.90/month",
    "Student Plan - RM 9.50/month",
    ""
]

content_types = ["Music", "Podcast"]

genres = [
    "Pop",
    "Classical",
    "Rock",
    "Electronic/Dance",
    "Melody",
    "Rap",
    "Kpop",
    "All"
]

time_slots = ["Morning", "Afternoon", "Night"]

moods = [
    "Relaxation and stress relief",
    "Uplifting and motivational",
    "Sadness or melancholy",
    "Social gatherings or parties",
    "Relaxation and stress relief, Uplifting and motivational",
    "Sadness or melancholy, Social gatherings or parties"
]

frequencies = [
    "Never",
    "Rarely",
    "Once a week",
    "Several times a week",
    "Daily"
]

expl_methods = [
    "Recommendations",
    "Playlists",
    "Radio",
    "Others",
    "Recommendations, Playlists",
    "Recommendations, Radio",
    "Playlists, Radio"
]

pod_genres = [
    "Comedy",
    "Lifestyle and Health",
    "Sports",
    "Business",
    "Health and Fitness",
    "Technology",
    "Informative Stuff",
    "Food and Cooking",
    ""
]

pod_formats = [
    "Conversational",
    "Interview",
    "Story Telling",
    "Educational",
    "Both",
    ""
]

pod_hosts = [
    "Well-known Individuals",
    "Unknown Podcasters",
    "Both",
    ""
]

pod_durations = [
    "Shorter",
    "Longer",
    "Both",
    ""
]

satisfactions = [
    "Very Dissatisfied",
    "Dissatisfied",
    "Ok",
    "Satisfied",
    "Very Satisfied"
]

header = [
    "Name",
    "Age",
    "Gender",
    "spotify_usage_period",
    "spotify_listening_device",
    "spotify_subscription_plan",
    "premium_sub_willingness",
    "preffered_premium_plan",
    "preferred_listening_content",
    "fav_music_genre",
    "music_time_slot",
    "music_Influencial_mood",
    "music_lis_frequency",
    "music_expl_method",
    "music_recc_rating",
    "pod_lis_frequency",
    "fav_pod_genre",
    "preffered_pod_format",
    "pod_host_preference",
    "preffered_pod_duration",
    "pod_variety_satisfaction",
    "churn"
]


def generate_row():
    plan = random.choices(
        plans,
        weights=[30, 20, 20, 15, 5, 10],
        k=1
    )[0]

    willing = "Yes" if "Premium" in plan else random.choice(["Yes", "No"])

    pref_plan = random.choice(pref_premium_plans[:-1]) if willing == "Yes" else ""

    pod_freq = random.choices(
        frequencies,
        weights=[20, 30, 20, 15, 15],
        k=1
    )[0]

    if pod_freq == "Never":
        p_genre = ""
        p_format = ""
        p_host = ""
        p_dur = ""
        p_sat = random.choice(satisfactions)
    else:
        p_genre = random.choice(pod_genres[:-1])
        p_format = random.choice(pod_formats[:-1])
        p_host = random.choice(pod_hosts[:-1])
        p_dur = random.choice(pod_durations[:-1])
        p_sat = random.choice(satisfactions)

    churn = random.choices(
        [0, 1],
        weights=[80, 20],
        k=1
    )[0]

    recc_rating = random.randint(3, 5) if churn == 0 else random.randint(1, 3)

    return [
        generate_name(),
        random.randint(13, 65),
        random.choices(genders, weights=[48, 48, 4], k=1)[0],
        random.choice(usage_periods),
        f'"{random.choice(devices)}"',
        plan,
        willing,
        pref_plan,
        random.choices(content_types, weights=[80, 20], k=1)[0],
        random.choice(genres),
        random.choice(time_slots),
        f'"{random.choice(moods)}"',
        random.choice(frequencies),
        f'"{random.choice(expl_methods)}"',
        recc_rating,
        pod_freq,
        p_genre,
        p_format,
        p_host,
        p_dur,
        p_sat,
        churn


    ]


# ==============================
# Save dataset
# ==============================

# Current script directory
current_dir = os.path.dirname(os.path.abspath(__file__))

# Parent directory
parent_dir = os.path.dirname(current_dir)

# Dataset directory
dataset_dir = os.path.join(parent_dir, "dataset")

# Create dataset directory if it does not exist
os.makedirs(dataset_dir, exist_ok=True)

# Output file path
output_file = os.path.join(dataset_dir, "customer_data.csv")

# Generate dataset
with open(output_file, "w", newline="", encoding="utf-8") as f:
    writer = csv.writer(f, quoting=csv.QUOTE_NONE, escapechar="\\")

    writer.writerow(header)

    for _ in range(1639):
        row = generate_row()
        formatted_row = [str(x) for x in row]
        f.write(",".join(formatted_row) + "\n")

print(f"Generation complete! File saved as {output_file}")