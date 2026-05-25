# User Guide — AUS Banking Intelligence

**Version:** 1.0 | **Audience:** End users, analysts, interviewers | **Last updated:** 2026-05

---

## What This Application Does

AUS Banking Intelligence is an analytics demonstration platform that combines live Australian regulatory and market data with an AI assistant powered by a large language model (LLM). It is designed to show how modern AI and data engineering techniques can be applied to Australian banking sector analysis.

> ⚠️ **This application is a portfolio/demonstration project only. Nothing produced by this tool constitutes financial advice. See [Legal & Boundaries](./LEGAL_AND_BOUNDARIES.md) for the full disclaimer.**

---

## Getting Started

### Prerequisites

| Requirement | Version | Notes |
|---|---|---|
| Node.js | 18+ | For the frontend |
| Python | 3.9+ | For the backend |
| Groq API key | Free tier | [console.groq.com](https://console.groq.com) — takes 60 seconds to register |
| Internet access | Required on first run | To fetch live data; fallback data works offline |

### First-time Setup

**Step 1 — Install frontend dependencies:**
```bash
npm install
```

**Step 2 — Install backend dependencies:**
```bash
cd backend
pip install -r requirements.txt
```

**Step 3 — Configure environment:**
```bash
cp backend/.env.example backend/.env
```
Open `backend/.env` and paste your Groq API key:
```
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxx
DEMO_MODE=false
```

**Step 4 — Start both services** (two separate terminals):

Terminal 1 (backend):
```bash
cd backend
uvicorn main:app --reload --port 8000
```

Terminal 2 (frontend):
```bash
npm run dev
```

**Step 5 — Open the app:**

Navigate to [http://localhost:8080](http://localhost:8080)

You should see the Dashboard load with KPI cards. The first load may take 10–20 seconds as data is fetched and cached from live sources.

---

## Offline / Demo Mode

If you don't have internet access or want a stable demo experience without API calls:

1. Set `DEMO_MODE=true` in `backend/.env`
2. Restart the backend

In demo mode:
- All charts display static fallback data (accurate as of early 2025)
- The AI Analyst and Insights features return pre-written responses
- A "Demo" badge appears on AI-generated content
- The app is fully usable without a Groq API key

---

## Application Pages

### 📊 Dashboard (`/`)

The landing page shows a real-time snapshot of the Australian economy.

**KPI Cards** (top row):

| Card | Source | Refreshes |
|---|---|---|
| RBA Cash Rate Target | Reserve Bank of Australia | Daily |
| CPI Year-on-Year % | ABS All Groups Quarterly | Daily |
| Total Employed Persons | ABS Labour Force | Daily |
| GDP Growth (QoQ) | ABS National Accounts | Daily |

**Charts:**

- **RBA Cash Rate** — Step-line chart showing every rate decision since 2020. The dashed reference line at 2.5% marks the long-run neutral rate.
- **CPI Inflation (YoY)** — Quarterly CPI showing the 2022–23 inflation surge and subsequent moderation. Dashed lines mark the RBA's 2–3% target band.
- **Total Employment** — Area chart of employed persons (thousands), filtered to quarterly points for readability.

**Tips:**
- Hover over any chart point to see exact values and dates.
- Data is cached for 24 hours. If you see stale data, restart the backend to force a refresh.

---

### 🤖 AI Analyst (`/analyst`)

A chat interface backed by a **LangChain pandas agent** running on Llama 3.3 70B (via Groq).

The agent has direct access to all six Australian datasets:
- RBA cash rate history
- ABS CPI (quarterly)
- ABS employment (monthly)
- ABS GDP (quarterly)
- APRA major bank balance sheets
- ASX bank stock prices (6 months)

**How to use:**

1. Type a question in the text box (or click an example prompt on the right)
2. Press **Enter** or click the send button
3. The agent will query the relevant dataset and return a plain-language answer
4. Click **"Show reasoning"** beneath an answer to see the LangChain agent's intermediate steps (what code it ran, what it found)

**Example questions to try:**

```
What is the current RBA cash rate?
Which bank has the largest deposit base according to APRA?
Compare Westpac and CBA by total assets
What was the peak CPI inflation rate and when did it occur?
How has employment changed over the past 2 years?
What is the year-on-year trend in Westpac's stock price?
```

**Limitations:**
- The agent can only answer questions about the six datasets listed above. It cannot browse the internet or access real-time prices.
- Complex multi-step calculations may occasionally produce incorrect intermediate reasoning. Always cross-check numerical outputs against primary sources.
- Response time is typically 5–15 seconds depending on Groq API load.
- Groq free tier: ~6,000 tokens/minute. If you hit a rate limit, wait 30 seconds and retry.

---

### 💡 Insights (`/insights`)

Click **"Generate Insights"** to produce an AI-generated executive briefing.

The **LangChain LLMChain** reads the latest values from all cached datasets, builds a structured data summary, and passes it to Llama 3.3 with a prompt framed from the perspective of a senior Westpac data analyst.

**Output sections:**
1. **Economic Outlook** — Current state of growth, inflation, and the labour market
2. **RBA Policy & Interest Rate Implications** — Cash rate trajectory and impact on NIM / mortgage book
3. **Banking Sector Risks & Opportunities** — Data-anchored bullet points
4. **Westpac Strategic Priorities** — Near-term focus areas for analytics and risk teams

**Caching:** Results are cached server-side for 1 hour. The "Generate" button is available immediately but will return the cached version until the hour expires. This is intentional to stay within Groq's free tier rate limits.

**Regenerate:** Click the button again after 1 hour (or restart the backend) to produce fresh insights reflecting the latest data.

---

### 🏦 Banking Sector (`/banking`)

Four tabs covering the competitive landscape:

**Bank Stocks tab:**
- 6-month indexed performance chart (all tickers normalised to base 100)
- Westpac (WBC.AX) is shown with a heavier line
- Hover to compare relative performance at any date
- Data sourced from Yahoo Finance via `yfinance` — 6-hour refresh

**APRA Statistics tab:**
- Major ADI (Authorised Deposit-taking Institution) balance sheet table
- Columns: Total Assets, Gross Loans, Total Deposits (all in A$B)
- Westpac row is highlighted
- Source: APRA Monthly ADI Statistics

**Westpac Focus tab:**
- Side-by-side: Westpac APRA metrics vs CBA (for scale comparison)
- Loan book relative to CBA calculated automatically
- Strategic context narrative
- Link to Westpac Investor Centre

**News Feed tab:**
- Aggregated from RSS feeds: RBA, APRA, ASIC, ABC Business
- Source colour-coded (gold = RBA, amber = APRA, purple = ASIC, blue = ABC)
- Headline links open the original source in a new tab
- Refreshes every 2 hours

---

## Data Freshness Summary

| Dataset | Source | Refresh | Fallback |
|---|---|---|---|
| RBA Cash Rate | rba.gov.au (Excel) | 24h | Static snapshot (Apr 2025) |
| ABS CPI | abs.gov.au (JSON API) | 24h | Static snapshot (Dec 2024) |
| ABS Employment | abs.gov.au (JSON API) | 24h | Static snapshot (Oct 2024) |
| ABS GDP | abs.gov.au (JSON API) | 24h | Static snapshot (Dec 2024) |
| APRA ADI Stats | apra.gov.au | 24h | Static snapshot (Feb 2025) |
| ASX Bank Stocks | Yahoo Finance (yfinance) | 6h | Synthetic (seeded random walk) |
| News Feed | RSS (RBA/APRA/ASIC/ABC) | 2h | 4 static fallback items |

Fallback data is used automatically if the live fetch fails. A "Using cached data" notice appears in the UI when this occurs.

---

## Troubleshooting

| Problem | Likely cause | Fix |
|---|---|---|
| Charts show no data | Backend not running | Start `uvicorn main:app --port 8000` |
| "Failed to get a response" in chat | GROQ_API_KEY not set | Add key to `backend/.env` |
| Chat responses are slow | Groq API latency | Normal — free tier may take up to 30s |
| 429 error from AI Analyst | Groq rate limit hit | Wait 60s and retry; or set `DEMO_MODE=true` |
| Stock chart shows straight lines | yfinance fallback active | Expected — synthetic data is seeded for consistency |
| APRA table shows same data repeatedly | Fallback data in use | Expected — live APRA scraping not yet implemented |

---

## Keyboard Shortcuts

| Key | Action |
|---|---|
| `Enter` | Send chat message |
| `Shift + Enter` | New line in chat input |
| Click example prompt | Sends that prompt immediately |

---

## FAQ

**Q: Can I use this for real investment decisions?**  
No. See [Legal & Boundaries](./LEGAL_AND_BOUNDARIES.md). This is a demonstration tool.

**Q: Does the app store my chat messages?**  
No. Chat history is stored only in browser memory for the duration of your session. Clearing the page resets it. The backend does not log message content.

**Q: Can I add my own data sources?**  
Yes. Add a new fetcher in `backend/data/fetchers/`, register the endpoint in `backend/routers/`, and add a corresponding hook in `src/hooks/`. See [Engineering Guide](./ENGINEERING.md) for the pattern.

**Q: How do I change the LLM?**  
Edit `backend/utils/llm.py`. The Groq API supports multiple Llama variants. Change `model="llama-3.3-70b-versatile"` to any [supported Groq model](https://console.groq.com/docs/models). For local inference, swap `ChatGroq` for `ChatOllama` (requires Ollama running locally).

**Q: Is this production-ready?**  
No. It is a portfolio/interview demonstration. See [Engineering Guide](./ENGINEERING.md) for the work required to make it production-ready.
