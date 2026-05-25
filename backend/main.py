"""
AUS Banking Intelligence — FastAPI Backend

Runs on port 8000. Frontend Vite dev server proxies /api/* to this service.

Start with:
    cd backend
    pip install -r requirements.txt
    cp .env.example .env   # add your GROQ_API_KEY
    uvicorn main:app --reload --port 8000

Or from the repo root:
    uvicorn backend.main:app --reload --port 8000
"""
import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Load .env from the backend directory
load_dotenv(Path(__file__).parent / ".env")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Warm the data cache on startup so the first request is fast."""
    logger.info("Warming data cache on startup...")
    demo_mode = os.getenv("DEMO_MODE", "false").lower() == "true"
    if not demo_mode:
        try:
            from backend.data.fetchers.rba_fetcher import fetch_cash_rate
            from backend.data.fetchers.abs_fetcher import fetch_cpi, fetch_employment, fetch_gdp
            from backend.data.fetchers.apra_fetcher import fetch_apra_stats
            from backend.data.fetchers.market_fetcher import fetch_bank_stocks

            fetch_cash_rate()
            logger.info("✓ RBA cash rate loaded")
            fetch_cpi()
            logger.info("✓ ABS CPI loaded")
            fetch_employment()
            logger.info("✓ ABS employment loaded")
            fetch_gdp()
            logger.info("✓ ABS GDP loaded")
            fetch_apra_stats()
            logger.info("✓ APRA stats loaded")
            fetch_bank_stocks()
            logger.info("✓ ASX bank stocks loaded")
        except Exception as exc:
            logger.warning(f"Cache warm failed (will retry on first request): {exc}")
    else:
        logger.info("DEMO_MODE=true — skipping live data fetch")

    yield
    logger.info("Shutting down")


app = FastAPI(
    title="AUS Banking Intelligence API",
    description="Australian banking and economic data API with LangChain AI analytics",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — restrict to local frontend only (never use * in a banking demo)
ALLOWED_ORIGINS = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:8080,http://127.0.0.1:8080",
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# Register routers
from backend.routers import dashboard, chat, insights, banking, news  # noqa: E402

app.include_router(dashboard.router)
app.include_router(chat.router)
app.include_router(insights.router)
app.include_router(banking.router)
app.include_router(news.router)


@app.get("/health", tags=["health"])
async def health():
    """Health check — confirms the API is running and reports system state."""
    from backend.agents.memory_store import memory_store
    demo = os.getenv("DEMO_MODE", "false").lower() == "true"
    groq_configured = bool(os.getenv("GROQ_API_KEY"))
    return {
        "status": "ok",
        "demo_mode": demo,
        "groq_configured": groq_configured,
        "version": "1.1.0",
        "session_memory": memory_store.session_stats(),
    }
