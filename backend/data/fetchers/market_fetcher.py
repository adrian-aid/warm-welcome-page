"""
ASX bank stock price fetcher using yfinance.

Tickers: WBC.AX, NAB.AX, ANZ.AX, CBA.AX, MQG.AX
Window:  6 months of daily closing prices
"""
import logging
import time
from datetime import datetime, timedelta
from pathlib import Path

import pandas as pd

logger = logging.getLogger(__name__)

CACHE_DIR = Path(__file__).parent.parent / "cache"
CACHE_PATH = CACHE_DIR / "asx_bank_stocks.csv"
CACHE_TTL_HOURS = 6  # Refresh stock data more frequently than macro data

TICKERS = {
    "WBC.AX": "Westpac",
    "CBA.AX": "CommBank",
    "NAB.AX": "NAB",
    "ANZ.AX": "ANZ",
    "MQG.AX": "Macquarie",
}

# Fallback stock data (approximate values — replace on live fetch)
def _build_fallback() -> list[dict]:
    """Generate synthetic 6-month daily closes for fallback display."""
    import random
    random.seed(42)
    base_prices = {"WBC.AX": 26.50, "CBA.AX": 138.20, "NAB.AX": 35.80, "ANZ.AX": 27.40, "MQG.AX": 212.50}
    records = []
    end = datetime.now()
    start = end - timedelta(days=180)
    current = start
    prices = dict(base_prices)
    while current <= end:
        if current.weekday() < 5:
            for ticker in TICKERS:
                delta = random.gauss(0, 0.008) * prices[ticker]
                prices[ticker] = max(prices[ticker] + delta, 1.0)
                records.append({
                    "date": current.strftime("%Y-%m-%d"),
                    "ticker": ticker,
                    "name": TICKERS[ticker],
                    "close": round(prices[ticker], 2),
                })
        current += timedelta(days=1)
    return records


def _is_cache_fresh() -> bool:
    if not CACHE_PATH.exists():
        return False
    return (time.time() - CACHE_PATH.stat().st_mtime) < CACHE_TTL_HOURS * 3600


def fetch_bank_stocks() -> list[dict]:
    """
    Return 6-month daily closing prices for the 5 major ASX-listed banks.
    Returns: [{date, ticker, name, close}]
    """
    if _is_cache_fresh():
        df = pd.read_csv(CACHE_PATH)
        return df.to_dict(orient="records")

    try:
        import yfinance as yf

        end_date = datetime.now()
        start_date = end_date - timedelta(days=180)

        records = []
        for ticker, name in TICKERS.items():
            try:
                hist = yf.download(
                    ticker,
                    start=start_date.strftime("%Y-%m-%d"),
                    end=end_date.strftime("%Y-%m-%d"),
                    progress=False,
                    auto_adjust=True,
                )
                if hist.empty:
                    logger.warning(f"yfinance returned empty data for {ticker}")
                    continue
                hist = hist.reset_index()
                hist["ticker"] = ticker
                hist["name"] = name
                hist["date"] = hist["Date"].dt.strftime("%Y-%m-%d")
                hist["close"] = hist["Close"].round(2)
                records.extend(hist[["date", "ticker", "name", "close"]].to_dict(orient="records"))
            except Exception as exc:
                logger.warning(f"yfinance error for {ticker}: {exc}")

        if records:
            CACHE_DIR.mkdir(parents=True, exist_ok=True)
            pd.DataFrame(records).to_csv(CACHE_PATH, index=False)
            logger.info(f"Cached {len(records)} stock price records")
            return records

    except ImportError:
        logger.warning("yfinance not installed")
    except Exception as exc:
        logger.warning(f"Stock fetch failed: {exc}")

    logger.info("Using fallback stock data")
    fallback = _build_fallback()
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    pd.DataFrame(fallback).to_csv(CACHE_PATH, index=False)
    return fallback


def fetch_stock_summary() -> list[dict]:
    """
    Return latest price + 52w metrics for each bank.
    Returns: [{ticker, name, current_price, change_pct_6m, week52_high, week52_low, pe_ratio}]
    """
    try:
        import yfinance as yf
        summaries = []
        for ticker, name in TICKERS.items():
            try:
                info = yf.Ticker(ticker).info
                summaries.append({
                    "ticker": ticker,
                    "name": name,
                    "current_price": info.get("currentPrice") or info.get("regularMarketPrice"),
                    "week52_high": info.get("fiftyTwoWeekHigh"),
                    "week52_low": info.get("fiftyTwoWeekLow"),
                    "pe_ratio": info.get("trailingPE"),
                    "market_cap_b": round((info.get("marketCap") or 0) / 1e9, 1),
                    "dividend_yield": round((info.get("dividendYield") or 0) * 100, 2),
                })
            except Exception as exc:
                logger.warning(f"Summary fetch failed for {ticker}: {exc}")
        return summaries
    except Exception as exc:
        logger.warning(f"Stock summary fetch failed: {exc}")
        return []
