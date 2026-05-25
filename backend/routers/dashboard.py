"""Dashboard API routes — macroeconomic data endpoints."""
from fastapi import APIRouter, HTTPException
from backend.data.fetchers.rba_fetcher import fetch_cash_rate
from backend.data.fetchers.abs_fetcher import fetch_cpi, fetch_employment, fetch_gdp

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


@router.get("/summary")
async def get_summary():
    """Single endpoint returning all KPI values for the dashboard cards."""
    try:
        cash_rate_data = fetch_cash_rate()
        cpi_data = fetch_cpi()
        employment_data = fetch_employment()
        gdp_data = fetch_gdp()

        latest_rate = cash_rate_data[-1] if cash_rate_data else {}
        latest_cpi = cpi_data[-1] if cpi_data else {}
        latest_emp = employment_data[-1] if employment_data else {}
        latest_gdp = gdp_data[-1] if gdp_data else {}

        return {
            "cash_rate": {
                "value": latest_rate.get("rate"),
                "date": latest_rate.get("date"),
                "label": "RBA Cash Rate",
                "unit": "%",
            },
            "cpi": {
                "value": latest_cpi.get("yoy_change"),
                "date": latest_cpi.get("date"),
                "label": "CPI (YoY)",
                "unit": "%",
            },
            "employment": {
                "value": latest_emp.get("employed_thousands"),
                "date": latest_emp.get("date"),
                "label": "Employed Persons",
                "unit": "k",
            },
            "gdp_growth": {
                "value": latest_gdp.get("qoq_change"),
                "date": latest_gdp.get("date"),
                "label": "GDP Growth (QoQ)",
                "unit": "%",
            },
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
