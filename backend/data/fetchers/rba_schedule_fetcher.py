"""
RBA Board Meeting Schedule fetcher.

The RBA publishes its board meeting schedule annually.
This module provides:
  - Full 2025 and 2026 meeting schedule (hardcoded fallback)
  - Next upcoming meeting date and days-until
  - Previous meeting date and outcome (rate decision)

Source: https://www.rba.gov.au/monetary-policy/rba-board-meetings/
"""
import logging
from datetime import datetime, date

logger = logging.getLogger(__name__)

# RBA Board meeting decision dates (the second day of each two-day meeting)
# Source: rba.gov.au/monetary-policy/rba-board-meetings/
# Cash rate outcomes included where known (as of knowledge cutoff)
RBA_SCHEDULE = [
    # ── 2025 ──
    {"date": "2025-02-18", "year": 2025, "outcome": "CUT", "rate_after": 4.10, "notes": "First cut since 2020; from 4.35% to 4.10%"},
    {"date": "2025-04-01", "year": 2025, "outcome": "HOLD", "rate_after": 4.10, "notes": ""},
    {"date": "2025-05-20", "year": 2025, "outcome": "HOLD", "rate_after": 4.10, "notes": ""},
    {"date": "2025-07-08", "year": 2025, "outcome": None, "rate_after": None, "notes": ""},
    {"date": "2025-08-12", "year": 2025, "outcome": None, "rate_after": None, "notes": ""},
    {"date": "2025-09-30", "year": 2025, "outcome": None, "rate_after": None, "notes": ""},
    {"date": "2025-11-04", "year": 2025, "outcome": None, "rate_after": None, "notes": ""},
    {"date": "2025-12-09", "year": 2025, "outcome": None, "rate_after": None, "notes": ""},
    # ── 2026 ──
    {"date": "2026-02-10", "year": 2026, "outcome": None, "rate_after": None, "notes": ""},
    {"date": "2026-03-31", "year": 2026, "outcome": None, "rate_after": None, "notes": ""},
    {"date": "2026-05-19", "year": 2026, "outcome": None, "rate_after": None, "notes": ""},
    {"date": "2026-07-07", "year": 2026, "outcome": None, "rate_after": None, "notes": ""},
    {"date": "2026-08-11", "year": 2026, "outcome": None, "rate_after": None, "notes": ""},
    {"date": "2026-09-29", "year": 2026, "outcome": None, "rate_after": None, "notes": ""},
    {"date": "2026-11-03", "year": 2026, "outcome": None, "rate_after": None, "notes": ""},
    {"date": "2026-12-08", "year": 2026, "outcome": None, "rate_after": None, "notes": ""},
]


def get_rba_schedule() -> dict:
    """
    Return the full RBA meeting schedule plus next/previous meeting metadata.

    Returns:
        {
          "schedule": list of all meetings,
          "next_meeting": {date, days_until, ...},
          "last_meeting": {date, outcome, rate_after, ...},
          "current_rate": float,
        }
    """
    today = date.today()
    today_str = today.isoformat()

    future = [m for m in RBA_SCHEDULE if m["date"] > today_str]
    past = [m for m in RBA_SCHEDULE if m["date"] <= today_str]

    next_meeting = future[0] if future else None
    last_meeting = past[-1] if past else None

    if next_meeting:
        next_date = datetime.strptime(next_meeting["date"], "%Y-%m-%d").date()
        next_meeting = {**next_meeting, "days_until": (next_date - today).days}

    # Current rate = last known rate in schedule
    current_rate = None
    for m in reversed(RBA_SCHEDULE):
        if m["rate_after"] is not None:
            current_rate = m["rate_after"]
            break

    return {
        "schedule": RBA_SCHEDULE,
        "next_meeting": next_meeting,
        "last_meeting": last_meeting,
        "current_rate": current_rate,
        "as_of": today_str,
    }
