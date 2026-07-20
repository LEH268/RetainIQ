"""Deterministic time-series projection for dashboard and analytics charts.

The dataset has no signup or cancellation timestamps, so monthly series are
modelled projections derived from the current cohort composition rather than
observed history. Seasonality and noise are generated from a fixed seed so the
same cohort always produces the same chart — values move month to month, but
they are reproducible and explainable, not random.
"""

import hashlib
import math

MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
          "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

QUARTERS = ["Q1", "Q2", "Q3", "Q4"]

AVERAGE_MONTHLY_VALUE = 17.50

# Music streaming demand peaks in December (holidays) and dips in the
# northern-hemisphere summer. Index 0 is January.
SEASONALITY = [0.96, 0.94, 1.01, 1.03, 1.06, 0.98,
               0.93, 0.95, 1.04, 1.07, 1.02, 1.12]

# Churn runs counter-cyclically: subscribers cancel after the holiday spike
# and during low-engagement summer months.
CHURN_SEASONALITY = [1.14, 1.09, 0.97, 0.94, 0.91, 1.03,
                     1.11, 1.07, 0.95, 0.92, 0.96, 0.88]


def _deterministic_noise(seed_text, index, amplitude):
    """Return a stable pseudo-random offset in [-amplitude, +amplitude].

    Derived from a hash so the same inputs always yield the same value; the
    chart never changes shape on refresh.
    """
    digest = hashlib.md5(f"{seed_text}:{index}".encode("utf-8")).hexdigest()
    normalised = int(digest[:8], 16) / 0xFFFFFFFF
    return (normalised * 2 - 1) * amplitude


def _cohort_seed(customers):
    """Return a seed string that changes only when the cohort changes."""
    total = len(customers)
    high = sum(1 for c in customers if c["risk_level"] == "High Risk")
    return f"retainiq-{total}-{high}"


def build_monthly_series(customers, include_previous_year=False):
    """Return a 12-month projected series with seasonality and stable noise.

    Each point carries subscriber counts, churn rate, and revenue so the
    dashboard and analytics pages can render from one shared computation.
    """
    total = len(customers)
    if not total:
        return []

    seed = _cohort_seed(customers)

    high_risk = sum(1 for c in customers if c["risk_level"] == "High Risk")
    new_customers = sum(1 for c in customers if c["status"] == "New")
    active = sum(1 for c in customers if c["status"] == "Active")
    paid = sum(
        1 for c in customers
        if "Free" not in str(c.get("spotify_subscription_plan", ""))
    )

    base_churn_rate = high_risk / total * 100
    monthly_new = new_customers / 6 if new_customers else total * 0.03
    monthly_cancelled = high_risk / 12 if high_risk else total * 0.01
    monthly_renewals = active / 12 if active else total * 0.05

    series = []
    running_total = total * 0.74

    for index, month in enumerate(MONTHS):
        season = SEASONALITY[index]
        churn_season = CHURN_SEASONALITY[index]

        gained = monthly_new * season * (1 + _deterministic_noise(seed + "new", index, 0.22))
        lost = monthly_cancelled * churn_season * (1 + _deterministic_noise(seed + "lost", index, 0.26))
        renewed = monthly_renewals * season * (1 + _deterministic_noise(seed + "ren", index, 0.15))

        running_total += gained - lost
        subscribers = max(1, round(running_total))

        churn_rate = round(
            max(0.5, base_churn_rate * churn_season
                * (1 + _deterministic_noise(seed + "churn", index, 0.14))),
            1,
        )

        paid_share = paid / total
        revenue = round(subscribers * paid_share * AVERAGE_MONTHLY_VALUE, 2)

        point = {
            "month": month,
            "users": subscribers,
            "new": max(0, round(gained)),
            "renewals": max(0, round(renewed)),
            "cancelled": max(0, round(lost)),
            "churnRate": churn_rate,
            "revenue": revenue,
        }

        if include_previous_year:
            # Prior year modelled at ~82% of current scale with its own noise.
            prior_factor = 0.82 * (1 + _deterministic_noise(seed + "prior", index, 0.09))
            point["previousYearUsers"] = max(1, round(subscribers * prior_factor))
            point["previousYearRevenue"] = round(revenue * prior_factor, 2)
            point["previousYearChurnRate"] = round(churn_rate * 1.18, 1)

        series.append(point)

    return series


def to_quarterly(series, include_previous_year=False):
    """Aggregate a 12-month series into four quarterly points."""
    quarterly = []
    for index, quarter in enumerate(QUARTERS):
        chunk = series[index * 3:(index + 1) * 3]
        if not chunk:
            continue

        point = {
            "month": quarter,
            "users": round(sum(item["users"] for item in chunk) / len(chunk)),
            "new": sum(item["new"] for item in chunk),
            "renewals": sum(item["renewals"] for item in chunk),
            "cancelled": sum(item["cancelled"] for item in chunk),
            "churnRate": round(sum(item["churnRate"] for item in chunk) / len(chunk), 1),
            "revenue": round(sum(item["revenue"] for item in chunk), 2),
        }

        if include_previous_year:
            point["previousYearUsers"] = round(
                sum(item["previousYearUsers"] for item in chunk) / len(chunk)
            )
            point["previousYearRevenue"] = round(
                sum(item["previousYearRevenue"] for item in chunk), 2
            )

        quarterly.append(point)

    return quarterly


def series_metrics(series):
    """Derive headline growth and churn metrics from a monthly series.

    Every returned value is accompanied by the exact window it was computed
    over, so the frontend never has to guess what a percentage means.
    """
    if not series:
        return {}

    first = series[0]
    last = series[-1]

    subscriber_growth = (
        (last["users"] - first["users"]) / first["users"] * 100
        if first["users"] else 0
    )
    revenue_growth = (
        (last["revenue"] - first["revenue"]) / first["revenue"] * 100
        if first["revenue"] else 0
    )
    average_churn = sum(item["churnRate"] for item in series) / len(series)

    peak = max(series, key=lambda item: item["users"])
    trough = min(series, key=lambda item: item["users"])
    worst_churn = max(series, key=lambda item: item["churnRate"])

    return {
        "subscriberGrowth": round(subscriber_growth, 1),
        "revenueGrowth": round(revenue_growth, 1),
        "averageChurnRate": round(average_churn, 1),
        "startingSubscribers": first["users"],
        "endingSubscribers": last["users"],
        "startingRevenue": first["revenue"],
        "endingRevenue": last["revenue"],
        "totalRevenue": round(sum(item["revenue"] for item in series), 2),
        "totalNew": sum(item["new"] for item in series),
        "totalCancelled": sum(item["cancelled"] for item in series),
        "peakMonth": peak["month"],
        "peakUsers": peak["users"],
        "troughMonth": trough["month"],
        "worstChurnMonth": worst_churn["month"],
        "worstChurnRate": worst_churn["churnRate"],
        "windowStart": first["month"],
        "windowEnd": last["month"],
        "windowLength": len(series),
    }