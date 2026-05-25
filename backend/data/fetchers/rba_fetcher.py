"""
RBA data fetcher.

Sources:
  Cash Rate Target: https://www.rba.gov.au/statistics/tables/xls/f01hist.xls
  Exchange Rates:   https://www.rba.gov.au/statistics/tables/xls/f11hist.xls

Data is cached locally as CSV. Cache is refreshed if older than 24 hours.
"""
import os
import time
import logging
from pathlib import Path
from datetime import datetime, timedelta

import requests
import pandas as pd

logger = logging.getLogger(__name__)

CACHE_DIR = Path(__file__).parent.parent / "cache"
CACHE_TTL_HOURS = 24

# RBA publishes the cash rate target in f01hist.xls
CASH_RATE_URL = "https://www.rba.gov.au/statistics/tables/xls/f01hist.xls"
CASH_RATE_CACHE = CACHE_DIR / "rba_cash_rate.csv"

# Fallback static data used when live fetch fails (for demo stability)
CASH_RATE_FALLBACK = [
    {"date": "2020-03-19", "rate": 0.50},
    {"date": "2020-03-20", "rate": 0.25},
    {"date": "2022-05-04", "rate": 0.35},
    {"date": "2022-06-08", "rate": 0.85},
    {"date": "2022-07-06", "rate": 1.35},
    {"date": "2022-08-03", "rate": 1.85},
    {"date": "2022-09-07", "rate": 2.35},
    {"date": "2022-10-05", "rate": 2.60},
    {"date": "2022-11-02", "rate": 2.85},
    {"date": "2022-12-07", "rate": 3.10},
    {"date": "2023-02-08", "rate": 3.35},
    {"date": "2023-03-08", "rate": 3.60},
    {"date": "2023-04-05", "rate": 3.60},
    {"date": "2023-05-03", "rate": 3.85},
    {"date": "2023-06-07", "rate": 4.10},
    {"date": "2023-07-05", "rate": 4.10},
    {"date": "2023-08-02", "rate": 4.10},
    {"date": "2023-09-06", "rate": 4.10},
    {"date": "2023-10-04", "rate": 4.10},
    {"date": "2023-11-08", "rate": 4.35},
    {"date": "2023-12-06", "rate": 4.35},
    {"date": "2024-02-07", "rate": 4.35},
    {"date": "2024-03-19", "rate": 4.35},
    {"date": "2024-05-07", "rate": 4.35},
    {"date": "2024-06-18", "rate": 4.35},
    {"date": "2024-08-06", "rate": 4.35},
    {"date": "2024-09-24", "rate": 4.35},
    {"date": "2024-11-05", "rate": 4.35},
    {"date": "2024-12-10", "rate": 4.35},
    {"date": "2025-02-18", "rate": 4.10},
    {"date": "2025-04-01", "rate": 4.10},
]


def _is_cache_fresh(path: Path) -> bool:
    if not path.exists():
        return False
    age = time.time() - path.stat().st_mtime
    return age < CACHE_TTL_HOURS * 3600


def _save_fallback_cache():
    """Write fallback data to cache so other modules can read it as CSV."""
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    df = pd.DataFrame(CASH_RATE_FALLBACK)
    df.to_csv(CASH_RATE_CACHE, index=False)


def fetch_cash_rate() -> list[dict]:
    """
    Return RBA cash rate history as [{date, rate}] list.

    Attempts live fetch from rba.gov.au; falls back to static data on failure.
    """
    if _is_cache_fresh(CASH_RATE_CACHE):
        logger.info("Loading cash rate from cache")
        df = pd.read_csv(CASH_RATE_CACHE, parse_dates=["date"])
        df["date"] = df["date"].dt.strftime("%Y-%m-%d")
        return df.to_dict(orient="records")

    try:
        logger.info("Fetching RBA cash rate from rba.gov.au")
        response = requests.get(CASH_RATE_URL, timeout=15)
        response.raise_for_status()

        CACHE_DIR.mkdir(parents=True, exist_ok=True)
        tmp = CACHE_DIR / "rba_f01hist.xls"
        tmp.write_bytes(response.content)

        # The cash rate target is in column 'Cash Rate Target' after row 10
        # Sheet name varies; use sheet_name=0 (first sheet)
        df = pd.read_excel(tmp, sheet_name=0, header=None, skiprows=10)

        # Column 0 = date, Column 1 = cash rate target
        df = df.iloc[:, [0, 1]].copy()
        df.columns = ["date", "rate"]
        df = df.dropna(subset=["date", "rate"])
        df = df[pd.to_numeric(df["rate"], errors="coerce").notna()]
        df["rate"] = pd.to_numeric(df["rate"])
        df["date"] = pd.to_datetime(df["date"], errors="coerce")
        df = df.dropna().sort_values("date")

        # Keep last 5 years for chart clarity
        cutoff = datetime.now() - timedelta(days=5 * 365)
        df = df[df["date"] >= cutoff]

        df["date"] = df["date"].dt.strftime("%Y-%m-%d")
        df.to_csv(CASH_RATE_CACHE, index=False)
        logger.info(f"Cached {len(df)} cash rate records")
        return df.to_dict(orient="records")

    except Exception as exc:
        logger.warning(f"RBA cash rate fetch failed: {exc} — using fallback data")
        _save_fallback_cache()
        return CASH_RATE_FALLBACK
