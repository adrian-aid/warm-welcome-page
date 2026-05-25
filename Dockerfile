# ─── AUS Banking Intelligence — Backend Dockerfile ───────────────────────────
# Multi-stage build: keeps final image lean by excluding build tools.
# Target runtime: Render, Railway, Fly.io, Google Cloud Run, or any Docker host.

# ─── Stage 1: dependency resolution ──────────────────────────────────────────
FROM python:3.11-slim AS builder

WORKDIR /app

# Install build deps needed by some Python packages (pandas, etc.)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# ─── Stage 2: runtime ─────────────────────────────────────────────────────────
FROM python:3.11-slim AS runtime

WORKDIR /app

# Copy installed packages from builder
COPY --from=builder /install /usr/local

# Copy application code
COPY backend/ ./backend/

# Create the cache directory (will be populated at runtime)
RUN mkdir -p backend/data/cache

# Non-root user for security
RUN adduser --disabled-password --gecos "" appuser && \
    chown -R appuser:appuser /app
USER appuser

# Environment defaults (override at deploy time)
ENV PYTHONUNBUFFERED=1
ENV DEMO_MODE=false
ENV PORT=8000

# Health check (used by container platforms to determine readiness)
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:${PORT}/health')"

EXPOSE ${PORT}

CMD ["sh", "-c", "uvicorn backend.main:app --host 0.0.0.0 --port ${PORT}"]
