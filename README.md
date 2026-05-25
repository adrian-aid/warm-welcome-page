# AUS Banking Intelligence — Analytics Showcase

> ⚠️ **Demonstration project only. Not financial advice. See [Legal & Boundaries](docs/LEGAL_AND_BOUNDARIES.md).**

An end-to-end AI analytics platform demonstrating LLM-assisted financial data analysis, built on free Australian regulatory and market data. Portfolio project for an analytics specialist role in Australian banking.

---

## Documentation

| Document | Audience | Contents |
|---|---|---|
| [User Guide](docs/USER_GUIDE.md) | All users | Setup, page guide, troubleshooting, FAQ |
| [Engineering Guide](docs/ENGINEERING.md) | Engineers / managers | Architecture, ADRs, CI/CD, quality standards, production gap analysis |
| [Legal & Boundaries](docs/LEGAL_AND_BOUNDARIES.md) | All users, legal | Disclaimers, data licences, privacy, IP, system boundaries |

---

## What This Project Demonstrates

| Feature | Technology |
|---|---|
| Natural language data queries | LangChain `create_pandas_dataframe_agent` |
| Executive insight generation | LangChain `LLMChain` + `PromptTemplate` |
| Free LLM inference | Groq API — `llama-3.3-70b-versatile` |
| Economic data visualisation | Recharts via shadcn/ui chart wrapper |
| REST API | Python FastAPI |
| Reactive frontend | React 18 + TypeScript + TanStack Query |

## Data Sources (all free, CC BY 4.0 licensed)

| Source | Data | Refresh |
|---|---|---|
| RBA (rba.gov.au) | Cash Rate Target history | 24h |
| ABS (abs.gov.au) | CPI, Employment, GDP | 24h |
| APRA (apra.gov.au) | Monthly ADI balance sheet stats | 24h |
| Yahoo Finance (yfinance) | ASX bank stocks: WBC, CBA, NAB, ANZ, MQG | 6h |
| RBA / APRA / ASIC / ABC RSS | News and media releases | 2h |

---

## Quick Start

### Prerequisites

- Node.js 18+ · Python 3.9+ · Free [Groq API key](https://console.groq.com/) (60 seconds to register)

### With Make (recommended)

```bash
make install        # Install all dependencies
make setup-env      # Create backend/.env from template
# → Edit backend/.env and add GROQ_API_KEY

# Then in two terminals:
make backend        # FastAPI on :8000
make frontend       # Vite on :8080
```

### Without Make

```bash
# Terminal 1 — backend
pip install -r backend/requirements.txt
cp backend/.env.example backend/.env   # add GROQ_API_KEY
uvicorn backend.main:app --reload --port 8000

# Terminal 2 — frontend
npm install && npm run dev
```

Open **http://localhost:8080**

### Demo mode (no API key required)

```bash
# Set DEMO_MODE=true in backend/.env, then:
make demo           # or: DEMO_MODE=true uvicorn backend.main:app --port 8000
```

---

## Pages

| Route | Description |
|---|---|
| `/` | Economic dashboard — KPI cards + RBA cash rate, CPI, employment charts |
| `/analyst` | AI Data Analyst — LangChain agent chat over all 6 Australian datasets |
| `/insights` | Insights generator — LLM produces Westpac-framed executive narrative |
| `/banking` | Banking sector — APRA stats table, ASX stock comparison, news feed |

---

## Architecture

```
┌─────────────────────────────────────┐
│  React 18 + TypeScript (Vite :8080) │
│  Dashboard │ AI Analyst │ Insights  │
│  Banking Sector                     │
└──────────────┬──────────────────────┘
               │ /api/* (Vite proxy)
┌──────────────▼──────────────────────┐
│  FastAPI (Python :8000)             │
│  LangChain Agent + LLMChain         │
│  Data fetchers → CSV cache          │
└────┬──────────────────┬─────────────┘
     │                  │
  RBA/ABS/APRA       Groq API
  yfinance/RSS       (Llama 3.3 70B)
```

See [Engineering Guide](docs/ENGINEERING.md) for full architecture diagrams, ADRs, and production gap analysis.

---

## Developer Commands

```bash
make help        # All available targets
make check       # lint + typecheck + build (run before pushing)
make lint        # ESLint + Ruff
make typecheck   # tsc + mypy
make test        # pytest
make build       # vite build
make audit       # npm audit + pip-audit
make clear-cache # Force data re-fetch on next backend start
make clean       # Remove build artifacts
```

---

## CI/CD

GitHub Actions pipeline runs on every PR and push to `main`:
- **Frontend:** ESLint lint → TypeScript type check → Vite build
- **Backend:** Ruff lint → Mypy type check → Pytest → pip-audit (advisory)
- **Dependabot:** Weekly dependency update PRs (npm + pip)

See `.github/workflows/ci.yml` for the full pipeline definition.

---

## Project Structure

```
warm-welcome-page/
├── backend/                  # Python FastAPI + LangChain
│   ├── main.py               # App entry point
│   ├── requirements.txt      # Pinned Python dependencies
│   ├── .env.example          # Environment template
│   ├── agents/               # LangChain pandas agent + LLMChain
│   ├── data/fetchers/        # RBA, ABS, APRA, yfinance, news
│   ├── routers/              # API route groups
│   └── utils/                # Groq LLM singleton
├── src/                      # React TypeScript frontend
│   ├── components/           # Navbar, charts, chat UI, insight card
│   ├── hooks/                # TanStack Query + chat state hooks
│   ├── pages/                # Dashboard, AIAnalyst, Insights, Banking
│   ├── services/             # Typed fetch API client
│   └── types/                # TypeScript interfaces for API shapes
├── docs/                     # Full documentation
│   ├── USER_GUIDE.md
│   ├── ENGINEERING.md
│   └── LEGAL_AND_BOUNDARIES.md
├── .github/
│   ├── workflows/ci.yml      # CI/CD pipeline
│   ├── dependabot.yml        # Automated dependency updates
│   └── PULL_REQUEST_TEMPLATE.md
├── Makefile                  # Developer convenience targets
├── pyproject.toml            # Python tooling config (ruff, mypy, pytest)
└── CLAUDE.md                 # AI assistant behavioural guidelines
```
