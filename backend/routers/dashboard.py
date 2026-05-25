"""Dashboard API routes — macroeconomic data endpoints."""
from fastapi import APIRouter, HTTPException
from backend.data.fetchers.rba_fetcher import fetch_cash_rate
from backend.data.fetchers.abs_fetcher import fetch_cpi, fetch_employment, fetch_gdp
from backend.data.fetchers.rba_schedule_fetcher import get_rba_schedule
from backend.data.fetchers.budget_fetcher import get_budget_data

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/cash-rate")
async def get_cash_rate():
    """RBA Cash Rate Target history."""
    try:
        return {"data": fetch_cash_rate()}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/cpi")
async def get_cpi():
    """ABS quarterly CPI data."""
    try:
        return {"data": fetch_cpi()}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/employment")
async def get_employment():
    """ABS monthly employment data."""
    try:
        return {"data": fetch_employment()}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/gdp")
async def get_gdp():
    """ABS quarterly GDP data."""
    try:
        return {"data": fetch_gdp()}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/rba-schedule")
async def get_rba_schedule_endpoint():
    """
    RBA Board meeting schedule with next/previous meeting metadata.
    Returns days until next meeting and last known rate outcome.
    """
    try:
        return get_rba_schedule()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/budget")
async def get_budget():
    """
    Australian Federal Budget headline metrics, economic forecasts and
    banking implications. Updated manually after each budget/MYEFO.
    """
    try:
        return get_budget_data()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/summary")
async def get_summary():
    """
    Single endpoint returning all KPI values, trend direction, and
    data freshness timestamps for the dashboard header cards.
    """
    try:
        cash_rate_data = fetch_cash_rate()
        cpi_data = fetch_cpi()
        employment_data = fetch_employment()
        gdp_data = fetch_gdp()

        def trend(data: list, key: str) -> str | None:
            """Return 'up', 'down', or 'flat' by comparing last two values."""
            vals = [d.get(key) for d in data if d.get(key) is not None]
            if len(vals) < 2:
                return None
            diff = vals[-1] - vals[-2]
            if abs(diff) < 0.01:
                return "flat"
            return "up" if diff > 0 else "down"

        latest_rate = cash_rate_data[-1] if cash_rate_data else {}
        prev_rate = cash_rate_data[-2] if len(cash_rate_data) > 1 else {}
        latest_cpi = cpi_data[-1] if cpi_data else {}
        latest_emp = employment_data[-1] if employment_data else {}
        latest_gdp = gdp_data[-1] if gdp_data else {}

        return {
            "cash_rate": {
                "value": latest_rate.get("rate"),
                "prev_value": prev_rate.get("rate"),
                "date": latest_rate.get("date"),
                "label": "RBA Cash Rate",
                "unit": "%",
                "trend": trend(cash_rate_data, "rate"),
                "description": "Reserve Bank of Australia target rate",
            },
            "cpi": {
                "value": latest_cpi.get("yoy_change"),
                "date": latest_cpi.get("date"),
                "label": "CPI (YoY)",
                "unit": "%",
                "trend": trend(cpi_data, "yoy_change"),
                "target": "2–3% RBA target band",
                "description": "ABS All Groups quarterly",
            },
            "employment": {
                "value": latest_emp.get("employed_thousands"),
                "date": latest_emp.get("date"),
                "label": "Employed Persons",
                "unit": "k",
                "trend": trend(employment_data, "employed_thousands"),
                "description": "ABS Labour Force",
            },
            "gdp_growth": {
                "value": latest_gdp.get("qoq_change"),
                "date": latest_gdp.get("date"),
                "label": "GDP Growth (QoQ)",
                "unit": "%",
                "trend": trend(gdp_data, "qoq_change"),
                "description": "ABS National Accounts",
            },
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
