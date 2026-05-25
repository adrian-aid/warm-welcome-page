# Engineering Guide — AUS Banking Intelligence

**Version:** 1.0 | **Audience:** Senior engineers, engineering managers, technical leads | **Last updated:** 2026-05

---

## 1. Project Classification

| Attribute | Value |
|---|---|
| **Type** | Portfolio / Proof-of-concept |
| **Production-readiness** | ❌ Not production-ready (see §10) |
| **Sensitivity** | Low — no PII, no real financial transactions |
| **Compliance scope** | Public sector open data; no APRA CPS 234 obligations |
| **Primary audience** | Technical interviewers, analytics managers |

This document sets out the engineering standards, CI/CD design, and architecture decisions that would apply if this project were developed further toward production. Where current implementation falls short of a standard, this is explicitly noted.

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│  Browser (React 18, TypeScript, Vite)                    │
│  ┌──────────┐ ┌───────────┐ ┌──────────┐ ┌──────────┐  │
│  │Dashboard │ │AI Analyst │ │ Insights │ │ Banking  │  │
│  └────┬─────┘ └─────┬─────┘ └────┬─────┘ └────┬─────┘  │
│       └─────────────┴────────────┴─────────────┘        │
│                    TanStack Query (cache/fetch)           │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP  /api/*  (Vite proxy → :8000)
┌──────────────────────▼──────────────────────────────────┐
│  FastAPI  (Python 3.9+, uvicorn)                         │
│  ┌─────────────┐  ┌──────────────────┐                  │
│  │ Data Layer  │  │  AI / LangChain  │                  │
│  │ Fetchers → │  │  Pandas Agent    │                  │
│  │ CSV Cache  │  │  LLMChain        │                  │
│  └──────┬──────┘  └────────┬─────────┘                  │
└─────────┼──────────────────┼─────────────────────────────┘
          │                  │
    ┌─────┴──────┐     ┌─────┴────────┐
    │ Data APIs  │     │  Groq API    │
    │ RBA/ABS/   │     │  Llama 3.3   │
    │ APRA/yf/   │     │  70B         │
    │ RSS        │     └──────────────┘
    └────────────┘
```

### Technology choices

| Layer | Technology | Rationale |
|---|---|---|
| Frontend framework | React 18 + TypeScript | Industry standard; type safety; wide shadcn-ui ecosystem |
| Build tool | Vite 5 (SWC) | Fast HMR; native ESM; production-optimised bundling |
| UI components | shadcn/ui + Radix UI | Accessible primitives; no CSS-in-JS runtime cost |
| Data fetching | TanStack Query v5 | Declarative caching, background refetch, error states |
| Charting | Recharts (via shadcn chart wrapper) | Composable; D3-based; integrates with shadcn theme |
| Backend framework | FastAPI | Async-native; auto OpenAPI docs; Pydantic validation |
| AI orchestration | LangChain (Python) | Most mature LangChain ecosystem; experimental pandas agent |
| LLM | Groq / Llama 3.3 70B | Free tier; fastest inference available for open-weight models |
| Data storage | Local CSV cache | Sufficient for a demo; see §10 for production upgrade path |

---

## 3. Architecture Decision Records (ADRs)

### ADR-001: Separate backend process (not serverless functions)

**Decision:** Run FastAPI as a standalone process on port 8000, proxied by Vite during development.

**Rationale:** LangChain pandas agent requires persistent in-memory DataFrames and a warm Python process. Serverless cold starts (Lambda, Vercel Functions) add 3–10s latency per request, unacceptable for a live demo. A persistent process allows data cache warm-up on startup.

**Trade-off:** Requires two processes to run locally. Mitigated by Makefile `make dev` target.

**Production path:** Containerise with Docker; deploy backend behind an API Gateway or on a managed container service (ECS Fargate, Cloud Run).

---

### ADR-002: CSV file cache over a database

**Decision:** Cache fetched data as CSV files in `backend/data/cache/`.

**Rationale:** Zero infrastructure dependencies for a demo. All data is read-only and public. Cache invalidation is time-based (24h/6h per dataset). Files are excluded from git.

**Trade-off:** No concurrent write safety; no query capability without loading the full file into pandas; cache is lost on container restart.

**Production path:** Replace with PostgreSQL (time-series data) or DuckDB (analytical queries). Use Redis for LLM response caching.

---

### ADR-003: Static fallback data in source control

**Decision:** Every data fetcher includes hard-coded fallback data that is used when the live fetch fails.

**Rationale:** Guarantees the app is always demo-able, including in offline interview environments. Eliminates network dependency for demonstrating the UI.

**Trade-off:** Fallback data becomes stale over time. Must be manually updated at major milestones.

**Mitigation:** Fallback data is clearly documented with its snapshot date in each fetcher file.

---

### ADR-004: Groq API over local Ollama

**Decision:** Use Groq API (cloud) rather than Ollama (local) as the default LLM provider.

**Rationale:** Groq's free tier delivers ~500 tokens/second throughput vs Ollama's dependency on local GPU. Ensures consistent demo performance across machines. API key setup takes 60 seconds.

**Trade-off:** Requires internet; subject to Groq's rate limits and terms of service; API key management required.

**Production path:** Evaluate Azure OpenAI, AWS Bedrock, or on-premise Ollama for a regulated banking environment. See also [Legal & Boundaries §4](./LEGAL_AND_BOUNDARIES.md).

---

### ADR-005: Vite proxy for API routing (no hardcoded ports)

**Decision:** All frontend API calls use relative `/api/*` URLs, forwarded by Vite's `server.proxy` to the backend.

**Rationale:** No hardcoded `localhost:8000` in frontend code. Works identically in dev and when both services are behind a reverse proxy in production. CORS is restricted to `localhost:8080` only.

---

## 4. Repository Structure

```
warm-welcome-page/
├── backend/                   # Python FastAPI service
│   ├── main.py                # App entry point, lifespan, CORS
│   ├── requirements.txt       # Pinned Python dependencies
│   ├── .env.example           # Environment variable template
│   ├── agents/                # LangChain agents and chains
│   ├── data/
│   │   ├── fetchers/          # One module per data source
│   │   └── cache/             # Runtime-generated, git-ignored
│   ├── routers/               # FastAPI route groups
│   └── utils/                 # Shared utilities (LLM singleton)
├── src/                       # React TypeScript frontend
│   ├── components/            # UI components (charts, chat, nav)
│   │   └── ui/                # shadcn/ui primitives (do not edit)
│   ├── hooks/                 # TanStack Query + state hooks
│   ├── pages/                 # Page-level components
│   ├── services/              # API client (typed fetch wrappers)
│   └── types/                 # TypeScript interfaces for API shapes
├── docs/                      # This documentation
├── .github/
│   ├── workflows/             # CI/CD pipeline definitions
│   └── PULL_REQUEST_TEMPLATE.md
├── Makefile                   # Developer convenience targets
├── CLAUDE.md                  # AI assistant behavioural guidelines
└── README.md                  # Project overview and quick start
```

### Naming conventions

| Context | Convention | Example |
|---|---|---|
| React components | PascalCase | `CashRateChart.tsx` |
| React hooks | `use` + camelCase | `useDashboardData.ts` |
| Python modules | snake_case | `rba_fetcher.py` |
| API endpoints | kebab-case | `/api/dashboard/cash-rate` |
| CSS variables | kebab-case | `--primary-foreground` |
| Environment variables | SCREAMING_SNAKE_CASE | `GROQ_API_KEY` |

---

## 5. Development Workflow

### Branching strategy (GitHub Flow)

```
main
 └── feature/<ticket>-short-description   (all feature work)
 └── fix/<ticket>-short-description       (bug fixes)
 └── docs/<ticket>-short-description      (documentation only)
 └── chore/<ticket>-short-description     (deps, config, tooling)
```

**Rules:**
- `main` is protected — no direct pushes
- All changes via Pull Request
- PR requires: 1 approving review + CI passing
- Squash-merge to keep main history linear
- Delete feature branch after merge

### Commit message format (Conventional Commits)

```
<type>(<scope>): <subject>

[optional body]
[optional footer]
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

Examples:
```
feat(dashboard): add GDP growth chart
fix(agent): cap max_iterations to prevent runaway LLM calls
docs(legal): add APRA data licence attribution
chore(deps): bump langchain to 0.3.1
```

---

## 6. CI/CD Pipeline

The pipeline is defined in `.github/workflows/ci.yml` and runs on every PR and push to `main`.

### Pipeline stages

```
┌─────────────────────────────────────────────────────────┐
│  Trigger: PR opened / push to main                      │
└──────────────────────┬──────────────────────────────────┘
                       │
          ┌────────────┴────────────┐
          │                         │
    ┌─────▼──────┐           ┌──────▼─────┐
    │  frontend  │           │  backend   │
    │  (Node 20) │           │ (Python 3.11)│
    │            │           │            │
    │ 1. Install │           │ 1. Install │
    │ 2. Lint    │           │ 2. Lint    │
    │ 3. Type    │           │ 3. Type    │
    │    check   │           │    check   │
    │ 4. Build   │           │ 4. Tests   │
    └─────┬──────┘           └──────┬─────┘
          │                         │
          └────────────┬────────────┘
                       │
              ┌────────▼────────┐
              │  All checks     │
              │  passed?        │
              └────────┬────────┘
                       │
              ┌────────▼────────┐
              │  PR can merge   │
              │  (branch        │
              │   protection)   │
              └─────────────────┘
```

### Quality gates (CI must pass before merge)

| Gate | Tool | Config |
|---|---|---|
| Frontend lint | ESLint 9 | `eslint.config.js` |
| Frontend type check | `tsc --noEmit` | `tsconfig.app.json` |
| Frontend build | `vite build` | Must exit 0 |
| Python lint | Ruff | `pyproject.toml` |
| Python type check | Mypy | `pyproject.toml` |
| Python tests | Pytest | `backend/tests/` |

> ⚠️ **Current gap:** No Python tests exist yet. The `pytest` stage will report 0 tests and pass (not fail) until the test suite is written. This is an accepted gap for v1.0 of a demo project. Writing tests is the highest-priority engineering debt item.

### Deployment (future state)

For a production deployment, the pipeline would extend to:

```
[CI passes] → [Build Docker images] → [Push to registry]
           → [Deploy backend to container platform]
           → [Deploy frontend to CDN (Vercel / CloudFront)]
           → [Smoke test against staging]
           → [Promote to production on approval]
```

---

## 7. Code Quality Standards

### Frontend (TypeScript / React)

- **Strict TypeScript:** `"strict": true` in `tsconfig.app.json`. No `any` without an explicit comment explaining why.
- **ESLint:** Configured in `eslint.config.js`. React hooks rules enforced.
- **Component size:** Single responsibility. If a component exceeds ~150 lines, consider splitting.
- **API layer isolation:** All backend calls go through `src/services/api.ts`. No `fetch()` calls inside components or hooks directly.
- **Typed responses:** Every API response shape has a matching interface in `src/types/api.ts`. No `response.data as any`.
- **Error handling:** Every `useQuery` hook exposes `isError`. Every page renders a fallback UI when `isError` is true. No silent failures.
- **Loading states:** Every data-dependent component renders a `<Skeleton>` while `isLoading` is true.

### Backend (Python / FastAPI)

- **Type hints:** All function signatures typed. Return types explicit on all route handlers.
- **Pydantic models:** All request bodies and responses defined as `BaseModel` subclasses.
- **Dependency injection:** LLM singleton via `get_llm()`. Data fetchers injected into agents at call time.
- **Defensive fetching:** Every fetcher wraps the live fetch in `try/except` and falls back to static data. Network errors must never propagate as 500s without a caught fallback.
- **Logging over print:** All modules use `logging.getLogger(__name__)`. No `print()` statements in production paths.
- **Cache validation:** Always check `_is_cache_fresh()` before fetching. TTL constants named and documented per dataset.
- **No secrets in code:** All credentials read from environment variables. `.env` is git-ignored. `.env.example` is committed with placeholder values.

### Security

| Control | Implementation |
|---|---|
| CORS | Restricted to `localhost:8080` (not `*`) |
| API keys | Environment variables only; never in source |
| LangChain agent | `allow_dangerous_code=True` is required by the library; this endpoint must never be publicly exposed without authentication |
| Input validation | FastAPI/Pydantic validates all request bodies |
| No PII | Application collects no personal data |
| Dependency scanning | Dependabot (configured via `.github/dependabot.yml`) |

---

## 8. Dependency Management

### Frontend

Managed with npm. `package-lock.json` is committed.

```bash
# Add a dependency
npm install <package>

# Update all (review changelog first)
npm update

# Check for vulnerabilities
npm audit
```

### Backend

Pinned versions in `requirements.txt`. Do not use `>=` version constraints in `requirements.txt` — always pin to an exact minor version to ensure reproducibility.

```bash
# Add a dependency
pip install <package>==<version>
pip freeze | grep <package> >> requirements.txt

# Audit dependencies
pip-audit  # install with: pip install pip-audit
```

### Upgrade policy

- **Patch versions** (e.g., `1.0.x`): Apply without review if CI passes
- **Minor versions** (e.g., `1.x.0`): Review changelog; test locally before merging
- **Major versions** (e.g., `x.0.0`): Dedicated branch; full regression test; PR review required
- **LangChain specifically:** Pin to exact minor (`0.3.x`). The LangChain ecosystem moves fast and breaking changes between minor versions are common

---

## 9. Observability

### Current state (v1.0 demo)

- Python `logging` module, level `INFO`, format `timestamp [LEVEL] module — message`
- FastAPI auto-generates OpenAPI docs at `http://localhost:8000/docs`
- `/health` endpoint returns: `{status, demo_mode, groq_configured, version}`

### Target state (production)

| Signal | Tool | What to capture |
|---|---|---|
| Structured logs | JSON logging to stdout | Request ID, route, latency, user_id, error type |
| Metrics | Prometheus + Grafana | Request rate, error rate, LLM latency, cache hit rate |
| Traces | OpenTelemetry | End-to-end trace from frontend → FastAPI → LangChain → Groq |
| Alerts | PagerDuty / OpsGenie | Error rate > 5%, LLM latency > 30s, data fetch failure |
| Uptime | Healthcheck endpoint | `/health` polled every 30s by load balancer |

---

## 10. Production Readiness Gap Analysis

The following must be addressed before this application could serve production traffic in a regulated banking environment:

### Critical (blockers)

| Item | Current state | Required action |
|---|---|---|
| Authentication | None | Add OAuth 2.0 / SSO (Azure AD / Okta) |
| LangChain agent security | `allow_dangerous_code=True` | Never expose without auth; add input sanitisation |
| Test coverage | 0% | Target ≥ 80% backend; ≥ 60% frontend |
| Secrets management | `.env` file | Use AWS Secrets Manager / Azure Key Vault |
| HTTPS | HTTP only | TLS termination at load balancer |
| Container isolation | Not containerised | Dockerfile + docker-compose required |

### High priority

| Item | Current state | Required action |
|---|---|---|
| Data persistence | CSV files lost on restart | PostgreSQL or DuckDB with volume mount |
| Rate limiting | Client-side advisory only | API Gateway throttling (e.g., 100 req/min per user) |
| LLM cost controls | Groq free tier | Budget alerts; token quotas per user session |
| Error monitoring | Logs only | Sentry or Datadog APM integration |
| APRA data live fetch | Static fallback | Implement authenticated APRA data download |
| Dependency audit | Manual | Automated Dependabot + `npm audit` in CI |

### Nice to have

| Item | Description |
|---|---|
| Caching layer | Redis for LLM responses and data cache (vs file-based) |
| Background jobs | Celery or APScheduler for periodic data refresh (vs on-demand) |
| WebSocket streaming | Stream LangChain token output to chat in real-time |
| Multi-user sessions | Isolated chat history per authenticated user |
| Data lineage | Track which cache file version powered each insight |

---

## 11. Local Developer Setup (Quick Reference)

```bash
# Clone and install
git clone <repo-url>
cd warm-welcome-page
npm install
pip install -r backend/requirements.txt

# Configure
cp backend/.env.example backend/.env
# Add GROQ_API_KEY to .env

# Run everything (requires make)
make dev

# Run individually
make backend   # uvicorn on :8000
make frontend  # vite on :8080

# Quality checks (run before pushing)
make lint
make typecheck
make build

# See all targets
make help
```

---

## 12. Runbook — Common Incidents

### Backend fails to start

```bash
# Check Python version
python --version  # Must be 3.9+

# Check all packages installed
pip install -r backend/requirements.txt

# Check .env exists and has GROQ_API_KEY
cat backend/.env

# Start with verbose logging
uvicorn backend.main:app --reload --port 8000 --log-level debug
```

### Charts show no data after backend is running

```bash
# Verify backend is reachable
curl http://localhost:8000/health

# Check Vite proxy is configured
grep -A 3 "proxy" vite.config.ts

# Force data cache refresh — while backend is running (no restart needed)
make refresh-cache              # refreshes all sources
make cache-status               # shows age + size of each cache file

# Or target a specific source (POST body is optional JSON {"sources": ["rba","cpi"]})
curl -s -X POST http://localhost:8000/api/admin/refresh-cache \
  -H "Content-Type: application/json" \
  -d '{"sources": ["rba", "stocks"]}'

# If ADMIN_SECRET is set, add the header:
# -H "X-Admin-Key: your-secret"

# Nuclear option: delete everything and restart
rm -f backend/data/cache/*.csv backend/data/cache/_insights_cache.txt
# Then restart backend — it will re-fetch on startup
```

### LLM responses fail or are very slow

```bash
# Verify Groq key is set
cat backend/.env | grep GROQ_API_KEY

# Test Groq connectivity
curl https://api.groq.com/v1/models \
  -H "Authorization: Bearer $(grep GROQ_API_KEY backend/.env | cut -d= -f2)"

# Use demo mode as a fallback
# Set DEMO_MODE=true in backend/.env and restart
```
