"""Insights API route — LangChain LLMChain for narrative generation."""
from fastapi import APIRouter, HTTPException

from backend.agents.insights_chain import generate_insights

router = APIRouter(prefix="/api", tags=["insights"])


@router.get("/insights")
async def get_insights():
    """
    Generate (or return cached) executive-level insight report.

    Response is cached server-side for 1 hour to manage Groq rate limits.
    Set DEMO_MODE=true to skip LLM calls and return static example insights.
    """
    try:
        return generate_insights()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
