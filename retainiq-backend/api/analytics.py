"""Analytics endpoints: date-filtered trend series, KPIs, distributions, AI summary."""

import datetime
from collections import Counter

from fastapi import APIRouter, Query

from data_processing.dataset_loader import get_customers
from services.ai_client import generate_json_list
from services.date_filters import (
    GRANULARITIES,
    active_between,
    active_on,
    cancelled_between,
    cap_periods,
    dataset_bounds,
    iter_periods,
    period_label,
    resolve_range,
    shift_years,
    signed_up_between,
)

router = APIRouter()

AVERAGE_MONTHLY_VALUE = 17.50

SUMMARY_FALLBACK = [
    "AI summary unavailable. Check /api/ai/status for the reason. All figures "
    "below are computed directly from the dataset.",
    "Distribution and trend figures are derived from customer signup and "
    "cancellation dates and remain accurate whether or not the AI is reachable.",
]


def _truthy(value):
    """Interpret a query string flag as a boolean."""
    return str(value).lower() in ("true", "1", "yes", "on")


def _normalise_granularity(timeframe):
    """Map a UI timeframe label onto a supported granularity."""
    value = str(timeframe or "monthly").strip().lower()
    aliases = {
        "day": "daily", "daily": "daily",
        "month": "monthly", "monthly": "monthly",
        "quarter": "quarterly", "quarterly": "quarterly",
        "year": "yearly", "yearly": "yearly", "annual": "yearly",
    }
    return aliases.get(value, "monthly")


def _distribution(customers, field):
    """Return a name/value distribution for a dataset column."""
    counts = Counter(
        str(customer.get(field, "") or "Unknown") for customer in customers
    )
    return [
        {"name": name, "value": value}
        for name, value in sorted(counts.items(), key=lambda item: item[1], reverse=True)
    ]


def _paid(customer):
    """Return True when the customer is on a paid plan."""
    return "Free" not in str(customer.get("spotify_subscription_plan", ""))


def _build_series(customers, start, end, granularity):
    """Return one row per period with real joins, cancellations, and actives."""
    periods, truncated = cap_periods(iter_periods(start, end, granularity))
    rows = []

    for bucket_start, bucket_end in periods:
        joined = signed_up_between(customers, bucket_start, bucket_end)
        cancelled = cancelled_between(customers, bucket_start, bucket_end)
        active = [c for c in customers if active_on(c, bucket_end)]
        paid_active = [c for c in active if _paid(c)]

        active_count = len(active)
        cancel_count = len(cancelled)
        # Denominator is the population exposed to churn during the bucket.
        exposed = active_count + cancel_count
        churn_rate = round(cancel_count / exposed * 100, 2) if exposed else 0.0

        rows.append({
            "period": bucket_start.isoformat(),
            "month": period_label(bucket_start, granularity),
            "periodStart": bucket_start.isoformat(),
            "periodEnd": bucket_end.isoformat(),
            "users": active_count,
            "new": len(joined),
            "cancelled": cancel_count,
            "renewals": max(0, active_count - len(joined)),
            "churnRate": churn_rate,
            "revenue": round(len(paid_active) * AVERAGE_MONTHLY_VALUE, 2),
        })

    return rows, truncated


def _series_metrics(rows):
    """Return summary statistics over a built series."""
    if not rows:
        return {}

    first, last = rows[0], rows[-1]
    starting = first["users"]
    ending = last["users"]
    growth = round((ending - starting) / starting * 100, 1) if starting else 0.0

    starting_revenue = first["revenue"]
    ending_revenue = last["revenue"]
    revenue_growth = (
        round((ending_revenue - starting_revenue) / starting_revenue * 100, 1)
        if starting_revenue else 0.0
    )

    peak = max(rows, key=lambda row: row["users"])
    trough = min(rows, key=lambda row: row["users"])
    worst_churn = max(rows, key=lambda row: row["churnRate"])

    return {
        "windowStart": first["month"],
        "windowEnd": last["month"],
        "windowLength": len(rows),
        "startingSubscribers": starting,
        "endingSubscribers": ending,
        "subscriberGrowth": growth,
        "startingRevenue": starting_revenue,
        "endingRevenue": ending_revenue,
        "revenueGrowth": revenue_growth,
        "totalRevenue": round(sum(row["revenue"] for row in rows), 2),
        "totalNew": sum(row["new"] for row in rows),
        "totalCancelled": sum(row["cancelled"] for row in rows),
        "averageChurnRate": round(
            sum(row["churnRate"] for row in rows) / len(rows), 2
        ),
        "peakMonth": peak["month"],
        "peakUsers": peak["users"],
        "troughMonth": trough["month"],
        "worstChurnMonth": worst_churn["month"],
        "worstChurnRate": worst_churn["churnRate"],
    }


@router.get("/analytics/range")
def analytics_range():
    """Return the selectable date bounds so the UI can constrain its pickers."""
    customers = get_customers()
    start, end = dataset_bounds(customers)
    return {
        "minDate": start.isoformat(),
        "maxDate": end.isoformat(),
        "granularities": list(GRANULARITIES),
        "totalCustomers": len(customers),
    }


@router.get("/analytics")
def analytics(
    timeframe: str = "Monthly",
    compare: str = "false",
    start: str = Query(None, description="ISO start date, e.g. 2024-01-01"),
    end: str = Query(None, description="ISO end date, e.g. 2024-12-31"),
    compareStart: str = Query(None, description="ISO start of comparison window"),
    compareEnd: str = Query(None, description="ISO end of comparison window"),
    compareYears: int = Query(1, ge=1, le=10),
):
    """Return the trend series for an explicit date range.

    When `compare` is set, a second window is overlaid. That window is either
    given explicitly via compareStart/compareEnd, or derived by shifting the
    primary window back `compareYears` years.
    """
    customers = get_customers()
    granularity = _normalise_granularity(timeframe)
    range_start, range_end = resolve_range(customers, start, end)

    rows, truncated = _build_series(customers, range_start, range_end, granularity)

    if _truthy(compare):
        if compareStart or compareEnd:
            prior_start, prior_end = resolve_range(customers, compareStart, compareEnd)
        else:
            prior_start, prior_end = shift_years(range_start, range_end, compareYears)

        prior_rows, _ = _build_series(customers, prior_start, prior_end, granularity)

        for index, row in enumerate(rows):
            if index < len(prior_rows):
                prior = prior_rows[index]
                row["previousPeriodLabel"] = prior["month"]
                row["previousYearUsers"] = prior["users"]
                row["previousYearRevenue"] = prior["revenue"]
                row["previousYearChurnRate"] = prior["churnRate"]

    return {
        "series": rows,
        "granularity": granularity,
        "start": range_start.isoformat(),
        "end": range_end.isoformat(),
        "truncated": truncated,
    }


@router.get("/analytics/kpis")
def analytics_kpis(
    timeframe: str = "Monthly",
    compare: str = "false",
    start: str = Query(None),
    end: str = Query(None),
    compareStart: str = Query(None),
    compareEnd: str = Query(None),
    compareYears: int = Query(1, ge=1, le=10),
):
    """Return headline KPIs for the selected window, with definitions."""
    customers = get_customers()
    granularity = _normalise_granularity(timeframe)
    range_start, range_end = resolve_range(customers, start, end)

    rows, _ = _build_series(customers, range_start, range_end, granularity)
    metrics = _series_metrics(rows)

    if not metrics:
        return {"kpis": [], "metrics": {}, "note": "No activity in the selected range."}

    prior_metrics = {}
    if _truthy(compare):
        if compareStart or compareEnd:
            prior_start, prior_end = resolve_range(customers, compareStart, compareEnd)
        else:
            prior_start, prior_end = shift_years(range_start, range_end, compareYears)
        prior_rows, _ = _build_series(customers, prior_start, prior_end, granularity)
        prior_metrics = _series_metrics(prior_rows)

    window = f"{metrics['windowStart']} – {metrics['windowEnd']}"

    def _delta(key):
        """Return a formatted change against the comparison window."""
        if not prior_metrics or key not in prior_metrics:
            return None
        previous = prior_metrics[key]
        current = metrics[key]
        if not isinstance(previous, (int, float)):
            return None
        return round(current - previous, 2)

    kpis = [
        {
            "id": "subscriberGrowth",
            "label": "Subscriber Growth",
            "value": f"{metrics['subscriberGrowth']:+.1f}%",
            "definition": (
                f"Change in active subscribers from {metrics['windowStart']} "
                f"({metrics['startingSubscribers']:,}) to {metrics['windowEnd']} "
                f"({metrics['endingSubscribers']:,}), counted from signup and "
                "cancellation dates."
            ),
            "window": window,
            "tone": "up" if metrics["subscriberGrowth"] >= 0 else "down",
            "supporting": (
                f"{metrics['totalNew']:,} joined, {metrics['totalCancelled']:,} "
                "cancelled in this window."
            ),
            "delta": _delta("subscriberGrowth"),
        },
        {
            "id": "revenueTrend",
            "label": "Revenue Trend",
            "value": f"{metrics['revenueGrowth']:+.1f}%",
            "definition": (
                f"Change in monthly recurring revenue from RM "
                f"{metrics['startingRevenue']:,.0f} to RM "
                f"{metrics['endingRevenue']:,.0f}, at RM {AVERAGE_MONTHLY_VALUE} "
                "average per paid subscriber."
            ),
            "window": window,
            "tone": "up" if metrics["revenueGrowth"] >= 0 else "down",
            "supporting": f"Cumulative revenue: RM {metrics['totalRevenue']:,.0f}.",
            "delta": _delta("revenueGrowth"),
        },
        {
            "id": "averageChurn",
            "label": f"Avg {granularity.rstrip('ly').title()} Churn Rate",
            "value": f"{metrics['averageChurnRate']}%",
            "definition": (
                f"Mean of {metrics['windowLength']} period churn rates across "
                f"{window}. Each rate is cancellations divided by the population "
                "exposed to churn in that period."
            ),
            "window": window,
            "tone": "down",
            "supporting": (
                f"Worst period: {metrics['worstChurnMonth']} at "
                f"{metrics['worstChurnRate']}%."
            ),
            "delta": _delta("averageChurnRate"),
        },
        {
            "id": "peakMonth",
            "label": "Peak Subscriber Period",
            "value": metrics["peakMonth"],
            "definition": (
                f"Period with the highest active subscriber count "
                f"({metrics['peakUsers']:,}) within {window}."
            ),
            "window": window,
            "tone": "up",
            "supporting": f"Lowest point was {metrics['troughMonth']}.",
            "delta": None,
        },
    ]

    return {
        "kpis": kpis,
        "metrics": metrics,
        "comparisonMetrics": prior_metrics,
        "granularity": granularity,
        "start": range_start.isoformat(),
        "end": range_end.isoformat(),
        "note": (
            "Figures are computed from signup_date and cancel_date on each "
            "customer record for the selected window."
        ),
    }


@router.get("/analytics/distributions")
def distributions(start: str = Query(None), end: str = Query(None)):
    """Return distributions for customers active in the selected window."""
    customers = get_customers()
    range_start, range_end = resolve_range(customers, start, end)
    cohort = active_between(customers, range_start, range_end)

    return {
        "start": range_start.isoformat(),
        "end": range_end.isoformat(),
        "cohortSize": len(cohort),
        "subscriptionDistribution": _distribution(cohort, "spotify_subscription_plan"),
        "deviceDistribution": _distribution(cohort, "spotify_listening_device"),
        "genreDistribution": _distribution(cohort, "fav_music_genre"),
        "listeningFrequency": _distribution(cohort, "music_lis_frequency"),
        "genderDistribution": _distribution(cohort, "Gender"),
    }


@router.get("/analytics/summary")
def analytics_summary(
    timeframe: str = "Monthly",
    start: str = Query(None),
    end: str = Query(None),
):
    """Return an AI-written executive summary for the selected window."""
    customers = get_customers()
    granularity = _normalise_granularity(timeframe)
    range_start, range_end = resolve_range(customers, start, end)

    cohort = active_between(customers, range_start, range_end)
    total = len(cohort)
    if not total:
        return {
            "summary": SUMMARY_FALLBACK,
            "aiGenerated": False,
            "start": range_start.isoformat(),
            "end": range_end.isoformat(),
        }

    rows, _ = _build_series(customers, range_start, range_end, granularity)
    metrics = _series_metrics(rows)

    high_risk = sum(1 for c in cohort if c["risk_level"] == "High Risk")
    moderate = sum(1 for c in cohort if c["risk_level"] == "Moderate Risk")
    paid = sum(1 for c in cohort if _paid(c))
    daily = sum(1 for c in cohort if c.get("music_lis_frequency") == "Daily")
    average_health = round(sum(c["health_score"] for c in cohort) / total, 1)

    prompt = f"""Analyse this subscription cohort and write an executive summary
for a customer success leader.

Reporting window: {range_start.isoformat()} to {range_end.isoformat()} ({granularity})

Cohort active in this window:
Total customers: {total}
High risk: {high_risk} ({round(high_risk / total * 100, 1)}%)
Moderate risk: {moderate} ({round(moderate / total * 100, 1)}%)
Paid subscribers: {paid} ({round(paid / total * 100, 1)}%)
Daily listeners: {daily} ({round(daily / total * 100, 1)}%)
Average health score: {average_health}/100

Observed movement in this window:
Subscriber growth: {metrics.get('subscriberGrowth')}%
Revenue growth: {metrics.get('revenueGrowth')}%
New signups: {metrics.get('totalNew')}
Cancellations: {metrics.get('totalCancelled')}
Average churn rate: {metrics.get('averageChurnRate')}%
Peak period: {metrics.get('peakMonth')}, weakest: {metrics.get('troughMonth')}
Worst churn period: {metrics.get('worstChurnMonth')} at {metrics.get('worstChurnRate')}%

Write exactly 2 paragraphs. Paragraph 1 states the position in this window
citing specific numbers. Paragraph 2 identifies the single biggest risk and
gives one concrete recommended action. Return a JSON array of 2 strings and
nothing else."""

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
        "start": range_start.isoformat(),
        "end": range_end.isoformat(),
        "granularity": granularity,
    }