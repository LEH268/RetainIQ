"""Analytics endpoints: trend series, explained KPIs, distributions, AI summary."""

from collections import Counter

from fastapi import APIRouter

from data_processing.dataset_loader import get_customers
from services.ai_client import generate_json_list
from services.timeseries import (
    AVERAGE_MONTHLY_VALUE,
    build_monthly_series,
    series_metrics,
    to_quarterly,
)

router = APIRouter()

SUMMARY_FALLBACK = [
    "Set ANTHROPIC_API_KEY in the backend environment to generate a live "
    "executive summary. All figures below are computed from the dataset.",
    "Distribution and trend figures are derived directly from customer records "
    "and remain accurate whether or not the AI service is reachable.",
]


def _truthy(value):
    """Interpret a query string flag as a boolean."""
    return str(value).lower() in ("true", "1", "yes", "on")


def _distribution(customers, field):
    """Return a name/value distribution for a dataset column."""
    counts = Counter(
        str(customer.get(field, "") or "Unknown") for customer in customers
    )
    return [
        {"name": name, "value": value}
        for name, value in sorted(counts.items(), key=lambda item: item[1], reverse=True)
    ]


@router.get("/analytics")
def analytics(timeframe: str = "Monthly", compare: str = "false"):
    """Return the projected trend series consumed by the Analytics chart."""
    customers = get_customers()
    compare_flag = _truthy(compare)

    series = build_monthly_series(customers, include_previous_year=compare_flag)

    if timeframe.lower() == "quarterly":
        return to_quarterly(series, include_previous_year=compare_flag)

    return series


@router.get("/analytics/kpis")
def analytics_kpis(timeframe: str = "Monthly", compare: str = "false"):
    """Return headline KPIs with an explicit definition and window for each.

    Every metric names what it measures and the period it covers so the UI
    never displays an unlabelled percentage.
    """
    customers = get_customers()
    compare_flag = _truthy(compare)
    series = build_monthly_series(customers, include_previous_year=compare_flag)
    metrics = series_metrics(series)

    if not metrics:
        return {"kpis": [], "metrics": {}}

    window = f"{metrics['windowStart']}–{metrics['windowEnd']}"

    kpis = [
        {
            "id": "subscriberGrowth",
            "label": "Subscriber Growth",
            "value": f"{metrics['subscriberGrowth']:+.1f}%",
            "definition": (
                f"Change in active subscriber count from {metrics['windowStart']} "
                f"({metrics['startingSubscribers']:,}) to {metrics['windowEnd']} "
                f"({metrics['endingSubscribers']:,})."
            ),
            "window": window,
            "tone": "up" if metrics["subscriberGrowth"] >= 0 else "down",
            "supporting": (
                f"{metrics['totalNew']:,} joined, {metrics['totalCancelled']:,} "
                f"cancelled across the period."
            ),
        },
        {
            "id": "revenueTrend",
            "label": "Revenue Trend",
            "value": f"{metrics['revenueGrowth']:+.1f}%",
            "definition": (
                f"Change in monthly recurring revenue from {metrics['windowStart']} "
                f"(RM {metrics['startingRevenue']:,.0f}) to {metrics['windowEnd']} "
                f"(RM {metrics['endingRevenue']:,.0f}), at RM "
                f"{AVERAGE_MONTHLY_VALUE} average per paid subscriber."
            ),
            "window": window,
            "tone": "up" if metrics["revenueGrowth"] >= 0 else "down",
            "supporting": f"Cumulative revenue: RM {metrics['totalRevenue']:,.0f}.",
        },
        {
            "id": "averageChurn",
            "label": "Avg Monthly Churn Rate",
            "value": f"{metrics['averageChurnRate']}%",
            "definition": (
                f"Mean of the {metrics['windowLength']} monthly churn rates across "
                f"{window}. Each month's rate is the share of subscribers scored "
                "as High Risk that period."
            ),
            "window": window,
            "tone": "down",
            "supporting": (
                f"Worst month: {metrics['worstChurnMonth']} at "
                f"{metrics['worstChurnRate']}%."
            ),
        },
        {
            "id": "peakMonth",
            "label": "Peak Subscriber Month",
            "value": metrics["peakMonth"],
            "definition": (
                f"Month with the highest projected subscriber count "
                f"({metrics['peakUsers']:,}) within {window}."
            ),
            "window": window,
            "tone": "up",
            "supporting": f"Lowest point was {metrics['troughMonth']}.",
        },
    ]

    return {
        "kpis": kpis,
        "metrics": metrics,
        "note": (
            "Monthly figures are modelled projections from current cohort "
            "composition; the dataset has no signup or cancellation timestamps."
        ),
    }


@router.get("/analytics/distributions")
def distributions():
    """Return subscription, device, genre, gender, and frequency distributions."""
    customers = get_customers()
    return {
        "subscriptionDistribution": _distribution(customers, "spotify_subscription_plan"),
        "deviceDistribution": _distribution(customers, "spotify_listening_device"),
        "genreDistribution": _distribution(customers, "fav_music_genre"),
        "listeningFrequency": _distribution(customers, "music_lis_frequency"),
        "genderDistribution": _distribution(customers, "Gender"),
    }


@router.get("/analytics/summary")
def analytics_summary():
    """Return an AI-written executive summary grounded in real cohort metrics."""
    customers = get_customers()
    total = len(customers)
    if not total:
        return {"summary": SUMMARY_FALLBACK, "aiGenerated": False}

    series = build_monthly_series(customers)
    metrics = series_metrics(series)

    high_risk = sum(1 for c in customers if c["risk_level"] == "High Risk")
    moderate = sum(1 for c in customers if c["risk_level"] == "Moderate Risk")
    paid = sum(
        1 for c in customers
        if "Free" not in str(c.get("spotify_subscription_plan", ""))
    )
    daily = sum(1 for c in customers if c.get("music_lis_frequency") == "Daily")
    average_health = round(sum(c["health_score"] for c in customers) / total, 1)

    prompt = f"""Analyse this subscription cohort and write an executive summary
for a customer success leader.

Current cohort:
Total customers: {total}
High risk: {high_risk} ({round(high_risk / total * 100, 1)}%)
Moderate risk: {moderate} ({round(moderate / total * 100, 1)}%)
Paid subscribers: {paid} ({round(paid / total * 100, 1)}%)
Daily listeners: {daily} ({round(daily / total * 100, 1)}%)
Average health score: {average_health}/100

Projected 12-month trend:
Subscriber growth: {metrics['subscriberGrowth']}%
Revenue growth: {metrics['revenueGrowth']}%
Average monthly churn rate: {metrics['averageChurnRate']}%
Peak month: {metrics['peakMonth']}, weakest: {metrics['troughMonth']}
Worst churn month: {metrics['worstChurnMonth']} at {metrics['worstChurnRate']}%

Write exactly 2 paragraphs. Paragraph 1 states the current position citing
specific numbers. Paragraph 2 identifies the single biggest risk and gives one
concrete recommended action. Return a JSON array of 2 strings and nothing else."""

    summary = generate_json_list(
        "You are a senior retention analyst. You are precise, quantitative, "
        "and never invent figures that were not supplied.",
        prompt,
        max_tokens=600,
        fallback=SUMMARY_FALLBACK,
    )

    return {
        "summary": (summary + SUMMARY_FALLBACK)[:2],
        "aiGenerated": summary != SUMMARY_FALLBACK,
    }