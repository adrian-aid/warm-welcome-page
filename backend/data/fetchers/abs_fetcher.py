"""
ABS (Australian Bureau of Statistics) data fetcher.

Sources (all free JSON API via indicator.data.abs.gov.au):
  CPI:        Quarterly CPI All Groups, Australia
  Employment: Monthly employed persons
  GDP:        Quarterly GDP chain volume measure
"""
import logging
from datetime import datetime, timedelta
from pathlib import Path
import time

import requests
import pandas as pd

logger = logging.getLogger(__name__)

CACHE_DIR = Path(__file__).parent.parent / "cache"
CACHE_TTL_HOURS = 24


def _is_cache_fresh(path: Path) -> bool:
    if not path.exists():
        return False
    age = time.time() - path.stat().st_mtime
    return age < CACHE_TTL_HOURS * 3600


# ---------------------------------------------------------------------------
# Fallback static data (used when live fetch fails)
# ---------------------------------------------------------------------------
CPI_FALLBACK = [
    {"date": "2020-03-01", "value": 116.6, "yoy_change": 2.2},
    {"date": "2020-06-01", "value": 114.4, "yoy_change": -0.3},
    {"date": "2020-09-01", "value": 115.4, "yoy_change": 0.7},
    {"date": "2020-12-01", "value": 116.2, "yoy_change": 0.9},
    {"date": "2021-03-01", "value": 117.9, "yoy_change": 1.1},
    {"date": "2021-06-01", "value": 118.8, "yoy_change": 3.8},
    {"date": "2021-09-01", "value": 120.3, "yoy_change": 3.0},
    {"date": "2021-12-01", "value": 121.3, "yoy_change": 3.5},
    {"date": "2022-03-01", "value": 123.9, "yoy_change": 5.1},
    {"date": "2022-06-01", "value": 127.4, "yoy_change": 6.1},
    {"date": "2022-09-01", "value": 130.2, "yoy_change": 7.3},
    {"date": "2022-12-01", "value": 132.1, "yoy_change": 7.8},
    {"date": "2023-03-01", "value": 133.4, "yoy_change": 7.0},
    {"date": "2023-06-01", "value": 134.2, "yoy_change": 6.0},
    {"date": "2023-09-01", "value": 135.6, "yoy_change": 5.4},
    {"date": "2023-12-01", "value": 136.1, "yoy_change": 4.1},
    {"date": "2024-03-01", "value": 137.3, "yoy_change": 3.6},
    {"date": "2024-06-01", "value": 138.3, "yoy_change": 3.8},
    {"date": "2024-09-01", "value": 139.0, "yoy_change": 2.8},
    {"date": "2024-12-01", "value": 139.9, "yoy_change": 2.4},
]

EMPLOYMENT_FALLBACK = [
    {"date": "2022-01-01", "employed_thousands": 13072},
    {"date": "2022-04-01", "employed_thousands": 13210},
    {"date": "2022-07-01", "employed_thousands": 13344},
    {"date": "2022-10-01", "employed_thousands": 13452},
    {"date": "2023-01-01", "employed_thousands": 13489},
    {"date": "2023-04-01", "employed_thousands": 13568},
    {"date": "2023-07-01", "employed_thousands": 13634},
    {"date": "2023-10-01", "employed_thousands": 13710},
    {"date": "2024-01-01", "employed_thousands": 13742},
    {"date": "2024-04-01", "employed_thousands": 13798},
    {"date": "2024-07-01", "employed_thousands": 13856},
    {"date": "2024-10-01", "employed_thousands": 13901},
]

GDP_FALLBACK = [
    {"date": "2020-03-01", "gdp_billions": 489.2, "qoq_change": -0.3},
    {"date": "2020-06-01", "gdp_billions": 456.1, "qoq_change": -6.9},
    {"date": "2020-09-01", "gdp_billions": 487.3, "qoq_change": 3.6},
    {"date": "2020-12-01", "gdp_billions": 502.1, "qoq_change": 3.1},
    {"date": "2021-03-01", "gdp_billions": 498.7, "qoq_change": 1.1},
    {"date": "2021-06-01", "gdp_billions": 507.2, "qoq_change": 0.7},
    {"date": "2021-09-01", "gdp_billions": 497.1, "qoq_change": -1.9},
    {"date": "2021-12-01", "gdp_billions": 522.6, "qoq_change": 3.6},
    {"date": "2022-03-01", "gdp_billions": 527.8, "qoq_change": 0.8},
    {"date": "2022-06-01", "gdp_billions": 535.2, "qoq_change": 0.9},
    {"date": "2022-09-01", "gdp_billions": 541.0, "qoq_change": 0.6},
    {"date": "2022-12-01", "gdp_billions": 548.7, "qoq_change": 0.5},
    {"date": "2023-03-01", "gdp_billions": 550.1, "qoq_change": 0.2},
    {"date": "2023-06-01", "gdp_billions": 552.8, "qoq_change": 0.4},
    {"date": "2023-09-01", "gdp_billions": 554.3, "qoq_change": 0.2},
    {"date": "2023-12-01", "gdp_billions": 556.9, "qoq_change": 0.2},
    {"date": "2024-03-01", "gdp_billions": 558.4, "qoq_change": 0.1},
    {"date": "2024-06-01", "gdp_billions": 560.2, "qoq_change": 0.2},
    {"date": "2024-09-01", "gdp_billions": 563.1, "qoq_change": 0.3},
    {"date": "2024-12-01", "gdp_billions": 567.4, "qoq_change": 0.5},
]


def _fetch_abs_json(dataflow: str, key: str, params: dict) -> pd.DataFrame | None:
    """Fetch a time series from the ABS JSON API."""
    url = f"https://indicator.data.abs.gov.au/rest/data/{dataflow}/{key}"
    try:
        resp = requests.get(url, params=params, timeout=20)
        resp.raise_for_status()
        data = resp.json()
        obs = data.get("data", {}).get("dataSets", [{}])[0].get("series", {})
        structure = data.get("data", {}).get("structure", {})
        time_periods = [
            dim["values"]
            for dim in structure.get("dimensions", {}).get("observation", [])
            if dim.get("id") == "TIME_PERIOD"
        ]
        if not time_periods or not obs:
            return None
        periods = [v["id"] for v in time_periods[0]]
        records = []
        for series_key, series_data in obs.items():
            for idx_str, val_list in series_data.get("observations", {}).items():
                idx = int(idx_str)
                if idx < len(periods) and val_list:
                    records.append({"date": periods[idx], "value": float(val_list[0])})
        return pd.DataFrame(records).sort_values("date") if records else None
    except Exception as exc:
        logger.warning(f"ABS JSON fetch failed for {dataflow}: {exc}")
        return None


def fetch_cpi() -> list[dict]:
    """Return quarterly CPI data as [{date, value, yoy_change}]."""
    cache_path = CACHE_DIR / "abs_cpi.csv"
    if _is_cache_fresh(cache_path):
        df = pd.read_csv(cache_path)
        return df.to_dict(orient="records")

    df = _fetch_abs_json(
        "ABS,CPI,1.0.0",
        "1.10001.10.Q",
        {"startPeriod": "2019-Q1", "endPeriod": "2025-Q2"},
    )

    if df is not None and not df.empty:
        df["date"] = pd.PeriodIndex(df["date"], freq="Q").to_timestamp().strftime("%Y-%m-%d")
        df["yoy_change"] = df["value"].pct_change(4).mul(100).round(1)
        df = df.rename(columns={"value": "value"})
        CACHE_DIR.mkdir(parents=True, exist_ok=True)
        df.to_csv(cache_path, index=False)
        return df.dropna().to_dict(orient="records")

    logger.warning("CPI fetch failed — using fallback")
    _save_fallback(cache_path, CPI_FALLBACK)
    return CPI_FALLBACK


def fetch_employment() -> list[dict]:
    """Return monthly employed persons as [{date, employed_thousands}]."""
    cache_path = CACHE_DIR / "abs_employment.csv"
    if _is_cache_fresh(cache_path):
        df = pd.read_csv(cache_path)
        return df.to_dict(orient="records")

    df = _fetch_abs_json(
        "ABS,LF,1.0.0",
        "1.M.1.3.15.30.M",
        {"startPeriod": "2022-01", "endPeriod": "2025-06"},
    )

    if df is not None and not df.empty:
        df["date"] = pd.to_datetime(df["date"]).dt.strftime("%Y-%m-%d")
        df = df.rename(columns={"value": "employed_thousands"})
        df["employed_thousands"] = (df["employed_thousands"] / 1000).round(0).astype(int)
        CACHE_DIR.mkdir(parents=True, exist_ok=True)
        # Monthly is noisy — keep quarterly points for chart clarity
        df = df[pd.to_datetime(df["date"]).dt.month.isin([1, 4, 7, 10])]
        df.to_csv(cache_path, index=False)
        return df.to_dict(orient="records")

    logger.warning("Employment fetch failed — using fallback")
    _save_fallback(cache_path, EMPLOYMENT_FALLBACK)
    return EMPLOYMENT_FALLBACK


def fetch_gdp() -> list[dict]:
    """Return quarterly GDP as [{date, gdp_billions, qoq_change}]."""
    cache_path = CACHE_DIR / "abs_gdp.csv"
    if _is_cache_fresh(cache_path):
        df = pd.read_csv(cache_path)
        return df.to_dict(orient="records")

    df = _fetch_abs_json(
        "ABS,NA,1.0.0",
        "1.Q.1.1.1.TOT.Q",
        {"startPeriod": "2019-Q1", "endPeriod": "2025-Q2"},
    )

    if df is not None and not df.empty:
        df["date"] = pd.PeriodIndex(df["date"], freq="Q").to_timestamp().strftime("%Y-%m-%d")
        df = df.rename(columns={"value": "gdp_billions"})
        df["gdp_billions"] = (df["gdp_billions"] / 1000).round(1)
        df["qoq_change"] = df["gdp_billions"].pct_change().mul(100).round(1)
        CACHE_DIR.mkdir(parents=True, exist_ok=True)
        df.to_csv(cache_path, index=False)
        return df.dropna().to_dict(orient="records")

    logger.warning("GDP fetch failed — using fallback")
    _save_fallback(cache_path, GDP_FALLBACK)
    return GDP_FALLBACK


def _save_fallback(path: Path, data: list[dict]):
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    pd.DataFrame(data).to_csv(path, index=False)
