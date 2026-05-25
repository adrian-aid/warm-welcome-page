# AUS Banking Intelligence — Analytics Showcase

An end-to-end AI analytics platform demonstrating LLM-assisted financial data analysis, built entirely on free Australian regulatory and market data sources. Built as a portfolio project for an analytics specialist role in Australian banking.

## What This Project Demonstrates

| Feature | Technology |
|---|---|
| Natural language data queries | LangChain `create_pandas_dataframe_agent` |
| Executive insight generation | LangChain `LLMChain` + `PromptTemplate` |
| Free LLM inference | Groq API — `llama-3.3-70b-versatile` |
| Economic data visualisation | Recharts via shadcn/ui chart wrapper |
| REST API | Python FastAPI |
| Reactive frontend | React 18 + TypeScript + TanStack Query |

## Data Sources (all free)

- **RBA** — Cash Rate Target history (rba.gov.au)
- **ABS** — CPI, Employment, GDP via indicator.data.abs.gov.au JSON API
- **APRA** — Monthly ADI balance sheet statistics (apra.gov.au)
- **ASX** — Bank stock prices: WBC, CBA, NAB, ANZ, MQG via `yfinance`
- **News** — RBA, APRA, ASIC and ABC Business RSS feeds

## Architecture

```
┌─────────────────────────────────────┐
│  React Frontend (Vite, port 8080)   │
│  Dashboard │ AI Analyst │ Insights  │
│  Banking Sector │ News Feed         │
└──────────────┬──────────────────────┘
               │ /api/* (Vite proxy)
┌──────────────▼──────────────────────┐
│  FastAPI Backend (Python, port 8000)│
│  LangChain Agent + Insights Chain   │
│  Data fetchers → local CSV cache    │
└──────────────┬──────────────────────┘
               │
   ┌───────────┼────────────┐
   ▼           ▼            ▼
  RBA       ABS/APRA     Groq API
 (Excel)   (JSON/Excel)  (Llama 3.3)
```

## Setup

### Prerequisites

- Node.js 18+
- Python 3.9+
- Free [Groq API key](https://console.groq.com/) (takes 1 minute to register)

### 1. Frontend

```bash
npm install
```

### 2. Backend

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Edit .env and add your GROQ_API_KEY
```

### 3. Run both services

**Terminal 1 — Backend:**
```bash
cd backend
uvicorn main:app --reload --port 8000
```

**Terminal 2 — Frontend:**
```bash
npm run dev
```

Open http://localhost:8080

### Demo Mode (no API key needed)

Set `DEMO_MODE=true` in `backend/.env` to use pre-computed responses. The app will still show all charts and UI — only live LangChain calls are bypassed.

## Pages

| Route | Description |
|---|---|
| `/` | Economic dashboard — KPI cards + RBA, CPI and employment charts |
| `/analyst` | AI Data Analyst — LangChain agent chat over all datasets |
| `/insights` | Insights generator — LLM produces Westpac-framed executive narrative |
| `/banking` | Banking sector — APRA stats, ASX stock comparison, news feed |

## Project Structure

```
warm-welcome-page/
├── backend/              # Python FastAPI + LangChain
│   ├── main.py
│   ├── agents/           # LangChain agent + insights chain
│   ├── data/fetchers/    # RBA, ABS, APRA, yfinance, news
│   ├── routers/          # API endpoints
│   └── utils/            # Groq LLM singleton
├── src/                  # React TypeScript frontend
│   ├── components/       # Navbar, charts, chat, insight card
│   ├── hooks/            # TanStack Query + chat state hooks
│   ├── pages/            # Dashboard, AIAnalyst, Insights, Banking
│   ├── services/         # Typed API client
│   └── types/            # API response TypeScript interfaces
└── CLAUDE.md             # Development guidelines
```
