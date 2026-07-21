"""Date parsing and cohort filtering for the analytics and reports endpoints.

The dataset carries signup_date and cancel_date as ISO strings. Everything in
this module works on those two columns and nothing else, so a customer record
missing either field is simply excluded rather than silently defaulted.
"""

import datetime
import logging

logger = logging.getLogger(__name__)

GRANULARITIES = ("daily", "monthly", "quarterly", "yearly")


def parse_date(value, default=None):
    """Return a date parsed from an ISO string, or `default` if unparseable."""
    if not value:
        return default
    if isinstance(value, datetime.date):
        return value
    try:
        return datetime.date.fromisoformat(str(value)[:10])
    except (ValueError, TypeError):
        return default


def dataset_bounds(customers):
    """Return (earliest_signup, latest_event) across the cohort."""
    signups = [parse_date(c.get("signup_date")) for c in customers]
    signups = [d for d in signups if d]
    cancels = [parse_date(c.get("cancel_date")) for c in customers]
    cancels = [d for d in cancels if d]

    if not signups:
        today = datetime.date.today()
        return today, today

    earliest = min(signups)
    latest = max(signups + cancels) if cancels else max(signups)
    return earliest, latest


def resolve_range(customers, start=None, end=None):
    """Return a concrete (start, end) date pair, falling back to full range."""
    bound_start, bound_end = dataset_bounds(customers)
    resolved_start = parse_date(start, bound_start)
    resolved_end = parse_date(end, bound_end)

    if resolved_start > resolved_end:
        resolved_start, resolved_end = resolved_end, resolved_start

    return resolved_start, resolved_end


def shift_years(start, end, years):
    """Return the same window shifted back by `years`, for comparison mode."""
    def _shift(value):
        try:
            return value.replace(year=value.year - years)
        except ValueError:
            # 29 Feb in a non-leap target year.
            return value.replace(year=value.year - years, day=28)

    return _shift(start), _shift(end)


def active_on(customer, day):
    """Return True if the customer was a subscriber on the given day."""
    signup = parse_date(customer.get("signup_date"))
    if signup is None or signup > day:
        return False
    cancel = parse_date(customer.get("cancel_date"))
    return cancel is None or cancel > day


def signed_up_between(customers, start, end):
    """Return customers whose signup_date falls inside the window."""
    result = []
    for customer in customers:
        signup = parse_date(customer.get("signup_date"))
        if signup and start <= signup <= end:
            result.append(customer)
    return result


def cancelled_between(customers, start, end):
    """Return customers whose cancel_date falls inside the window."""
    result = []
    for customer in customers:
        cancel = parse_date(customer.get("cancel_date"))
        if cancel and start <= cancel <= end:
            result.append(customer)
    return result


def active_between(customers, start, end):
    """Return customers active at any point during the window.

    Used for cohort-level aggregates (health, risk mix) where a customer who
    was present for part of the period should still count.
    """
    result = []
    for customer in customers:
        signup = parse_date(customer.get("signup_date"))
        if signup is None or signup > end:
            continue
        cancel = parse_date(customer.get("cancel_date"))
        if cancel is not None and cancel < start:
            continue
        result.append(customer)
    return result


def period_key(day, granularity):
    """Return the bucket label for a date at the requested granularity."""
    if granularity == "daily":
        return day.isoformat()
    if granularity == "monthly":
        return f"{day.year}-{day.month:02d}"
    if granularity == "quarterly":
        return f"{day.year}-Q{(day.month - 1) // 3 + 1}"
    return str(day.year)


def period_label(day, granularity):
    """Return a human-readable label for a bucket."""
    if granularity == "daily":
        return day.strftime("%d %b %Y")
    if granularity == "monthly":
        return day.strftime("%b %Y")
    if granularity == "quarterly":
        return f"Q{(day.month - 1) // 3 + 1} {day.year}"
    return str(day.year)


def _advance(day, granularity):
    """Return the first day of the next bucket."""
    if granularity == "daily":
        return day + datetime.timedelta(days=1)
    if granularity == "monthly":
        if day.month == 12:
            return datetime.date(day.year + 1, 1, 1)
        return datetime.date(day.year, day.month + 1, 1)
    if granularity == "quarterly":
        quarter_start_month = ((day.month - 1) // 3) * 3 + 1
        if quarter_start_month + 3 > 12:
            return datetime.date(day.year + 1, 1, 1)
        return datetime.date(day.year, quarter_start_month + 3, 1)
    return datetime.date(day.year + 1, 1, 1)


def _bucket_start(day, granularity):
    """Return the first day of the bucket containing `day`."""
    if granularity == "daily":
        return day
    if granularity == "monthly":
        return datetime.date(day.year, day.month, 1)
    if granularity == "quarterly":
        return datetime.date(day.year, ((day.month - 1) // 3) * 3 + 1, 1)
    return datetime.date(day.year, 1, 1)


def iter_periods(start, end, granularity):
    """Yield (bucket_start, bucket_end) pairs covering the window.

    Buckets are clipped to the requested range so a partial first or last
    period reports only the days actually requested.
    """
    if granularity not in GRANULARITIES:
        granularity = "monthly"

    cursor = _bucket_start(start, granularity)
    while cursor <= end:
        next_cursor = _advance(cursor, granularity)
        bucket_start = max(cursor, start)
        bucket_end = min(next_cursor - datetime.timedelta(days=1), end)
        yield bucket_start, bucket_end
        cursor = next_cursor


def cap_periods(periods, limit=400):
    """Truncate an over-long period list, returning (periods, truncated)."""
    periods = list(periods)
    if len(periods) <= limit:
        return periods, False
    logger.warning("Period count %d exceeds limit %d; truncating.", len(periods), limit)
    return periods[-limit:], True