"""
Admin router — privileged operations for cache management.

Endpoints:
  POST /api/admin/refresh-cache   Force-refresh all live data sources
  GET  /api/admin/cache-status    Show age and size of all cache files

Protection: requests must include the X-Admin-Key header matching ADMIN_SECRET
env var. If ADMIN_SECRET is not set, this key check is skipped (useful for
local dev). Set ADMIN_SECRET in production environments.
"""
import logging
import os
import time
from pathlib import Path

from fastapi import APIRouter, HTTPException, Header

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/admin", tags=["admin"])

CACHE_DIR = Path(__file__).parent.parent / "data" / "cache"


def _check_auth(x_admin_key: str | None) -> None:
    secret = os.getenv("ADMIN_SECRET", "")
    if secret and x_admin_key != secret:
        raise HTTPException(status_code=401, detail="Invalid or missing X-Admin-Key header")


def _cache_file_info(path: Path) -> dict:
    if not path.exists():
        return {"exists": False, "age_minutes": None, "size_kb": None}
    age_seconds = time.time() - path.stat().st_mtime
    return {
        "exists": True,
        "age_minutes": round(age_seconds / 60, 1),
        "size_kb": round(path.stat().st_size / 1024, 1),
    }


@router.get("/cache-status")
async def cache_status(x_admin_key: str | None = Header(default=None)):
    """Return age and size of every cached data file."""
    _check_auth(x_admin_key)

    files = {
        "rba_cash_rate":   CACHE_DIR / "rba_cash_rate.csv",
        "abs_cpi":         CACHE_DIR / "abs_cpi.csv",
        "abs_employment":  CACHE_DIR / "abs_employment.csv",
        "abs_gdp":         CACHE_DIR / "abs_gdp.csv",
        "apra_banking":    CACHE_DIR / "apra_banking.csv",
        "asx_bank_stocks": CACHE_DIR / "asx_bank_stocks.csv",
        "insights_cache":  CACHE_DIR / "_insights_cache.txt",
    }

    return {
        "cache_dir": str(CACHE_DIR),
        "files": {name: _cache_file_info(path) for name, path in files.items()},
    }


@router.post("/refresh-cache")
async def refresh_cache(
    sources: list[str] | None = None,
    x_admin_key: str | None = Header(default=None),
):
    """
    Force-refresh data from live sources by deleting cache files and re-fetching.

    Args:
        sources: Optional list of source names to refresh. Omit to refresh all.
                 Valid values: rba, cpi, employment, gdp, apra, stocks, insights
    """
    _check_auth(x_admin_key)

    demo_mode = os.getenv("DEMO_MODE", "false").lower() == "true"
    if demo_mode:
        return {"status": "skipped", "reason": "DEMO_MODE=true — no live data to refresh"}

    ALL_SOURCES = ["rba", "cpi", "employment", "gdp", "apra", "stocks", "insights"]
    targets = sources if sources else ALL_SOURCES

    # Validate requested sources
    invalid = [s for s in targets if s not in ALL_SOURCES]
    if invalid:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown sources: {invalid}. Valid: {ALL_SOURCES}",
        )

    # Map source name → cache path(s) to delete before re-fetching
    cache_map = {
        "rba":        [CACHE_DIR / "rba_cash_rate.csv", CACHE_DIR / "rba_f01hist.xls"],
        "cpi":        [CACHE_DIR / "abs_cpi.csv"],
        "employment": [CACHE_DIR / "abs_employment.csv"],
        "gdp":        [CACHE_DIR / "abs_gdp.csv"],
        "apra":       [CACHE_DIR / "apra_banking.csv"],
        "stocks":     [CACHE_DIR / "asx_bank_stocks.csv"],
        "insights":   [CACHE_DIR / "_insights_cache.txt"],
    }

    # Fetcher functions (only import when needed — avoids circular imports)
    def _fetch_rba():
        from backend.data.fetchers.rba_fetcher import fetch_cash_rate
        return fetch_cash_rate()

    def _fetch_cpi():
        from backend.data.fetchers.abs_fetcher import fetch_cpi
        return fetch_cpi()

    def _fetch_employment():
        from backend.data.fetchers.abs_fetcher import fetch_employment
        return fetch_employment()

    def _fetch_gdp():
        from backend.data.fetchers.abs_fetcher import fetch_gdp
        return fetch_gdp()

    def _fetch_apra():
        from backend.data.fetchers.apra_fetcher import fetch_apra_stats
        return fetch_apra_stats()

    def _fetch_stocks():
        from backend.data.fetchers.market_fetcher import fetch_bank_stocks
        return fetch_bank_stocks()

    fetch_map = {
        "rba": _fetch_rba,
        "cpi": _fetch_cpi,
        "employment": _fetch_employment,
        "gdp": _fetch_gdp,
        "apra": _fetch_apra,
        "stocks": _fetch_stocks,
        "insights": None,  # insights cache is invalidated-only (re-generated on next GET /api/insights)
    }

    refreshed = []
    errors = []
    skipped = []

    CACHE_DIR.mkdir(parents=True, exist_ok=True)

    for source in targets:
        # Delete stale cache files
        for cache_path in cache_map.get(source, []):
            if cache_path.exists():
                cache_path.unlink()
                logger.info(f"Deleted cache: {cache_path.name}")

        fetch_fn = fetch_map.get(source)
        if fetch_fn is None:
            # Insights cache: invalidation only — will regenerate on next request
            skipped.append({"source": source, "reason": "cache invalidated; will regenerate on next request"})
            continue

        try:
            result = fetch_fn()
            count = len(result) if isinstance(result, list) else "n/a"
            refreshed.append({"source": source, "records": count})
            logger.info(f"Refreshed {source}: {count} records")
        except Exception as exc:
            errors.append({"source": source, "error": str(exc)})
            logger.warning(f"Refresh failed for {source}: {exc}")

    return {
        "status": "ok" if not errors else "partial",
        "refreshed": refreshed,
        "skipped": skipped,
        "errors": errors,
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }
