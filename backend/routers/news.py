"""News API route — RBA, APRA, ASIC and ABC Business RSS feeds."""
from fastapi import APIRouter, HTTPException

from backend.data.fetchers.news_fetcher import fetch_news

router = APIRouter(prefix="/api", tags=["news"])


@router.get("/news")
async def get_news():
    """
    Latest news from RBA, APRA, ASIC and ABC Business.
    Returns up to 20 items sorted newest-first.
    """
    try:
        return {"data": fetch_news()}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
