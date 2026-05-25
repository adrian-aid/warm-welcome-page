"""Banking sector API routes — APRA stats and ASX bank stocks."""
from fastapi import APIRouter, HTTPException

from backend.data.fetchers.apra_fetcher import fetch_apra_stats
from backend.data.fetchers.market_fetcher import fetch_bank_stocks, fetch_stock_summary

router = APIRouter(prefix="/api/banking", tags=["banking"])


@router.get("/apra")
async def get_apra_stats():
    """APRA monthly ADI statistics — major bank balance sheet summary."""
    try:
        return {"data": fetch_apra_stats()}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/stocks")
async def get_bank_stocks():
    """
    6-month daily closing prices for WBC, CBA, NAB, ANZ, MQG.
    Indexed by ticker for charting.
    """
    try:
        records = fetch_bank_stocks()
        # Group by ticker for easier frontend consumption
        grouped: dict[str, list] = {}
        for r in records:
            ticker = r["ticker"]
            if ticker not in grouped:
                grouped[ticker] = []
            grouped[ticker].append({"date": r["date"], "close": r["close"], "name": r["name"]})
        return {"data": grouped, "tickers": list(grouped.keys())}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/stocks/summary")
async def get_stock_summary():
    """Latest price + 52-week metrics for each major bank."""
    try:
        return {"data": fetch_stock_summary()}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
