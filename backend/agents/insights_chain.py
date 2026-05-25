"""
LangChain insights generator.

Uses an LLMChain with a Westpac-framed PromptTemplate to generate
executive-level narrative insights from the latest economic data.

Results are cached server-side for 1 hour to stay within Groq rate limits.
"""
import logging
import os
import time
from datetime import datetime
from pathlib import Path

import pandas as pd
from langchain.chains import LLMChain
from langchain.prompts import PromptTemplate

from backend.utils.llm import get_llm

logger = logging.getLogger(__name__)

CACHE_DIR = Path(__file__).parent.parent / "data" / "cache"
INSIGHTS_CACHE_PATH = CACHE_DIR / "_insights_cache.txt"
INSIGHTS_CACHE_TTL = 3600  # 1 hour

WESTPAC_PROMPT = PromptTemplate(
    input_variables=["data_summary", "current_date"],
    template="""You are a senior data analyst at Westpac Banking Corporation, Australia's second-largest bank.
Your role is to synthesise current Australian macroeconomic data into concise, actionable insights for the executive leadership team.

Today's date: {current_date}

Current data summary:
{data_summary}

Please produce a structured insight report with the following sections:

**1. Economic Outlook (2–3 sentences)**
Summarise the current state of the Australian economy based on the data above, focusing on growth, inflation and labour market.

**2. RBA Policy & Interest Rate Implications (2–3 sentences)**
Interpret the current cash rate setting and its trajectory. What does this mean for Westpac's net interest margin and mortgage book?

**3. Banking Sector Risks & Opportunities (3–4 bullet points)**
Key risks and opportunities for Westpac given the current data. Be specific — reference actual numbers where relevant.

**4. Westpac Strategic Priorities (2–3 sentences)**
Based on the above, what should Westpac's analytics and risk teams focus on in the near term?

Keep the tone professional and data-driven. Avoid generic statements — anchor every claim to the data provided.
""",
)

DEMO_INSIGHTS = """**1. Economic Outlook**
Australia's economy is navigating a soft-landing scenario, with GDP growth recovering modestly to 0.5% QoQ in Q4 2024 after a prolonged period of below-trend growth. Inflation has returned to the RBA's 2–3% target band at 2.4% YoY, while the labour market remains resilient with ~13.9 million employed persons.

**2. RBA Policy & Interest Rate Implications**
The RBA's February 2025 rate cut (4.35% → 4.10%) signals the start of an easing cycle, but the pace will be data-dependent given still-elevated services inflation. For Westpac, a gradual easing cycle benefits mortgage repricing tailwinds while compressing deposit margins — net interest margin management will be the key lever through 2025.

**3. Banking Sector Risks & Opportunities**
• **Mortgage stress moderation**: With rates declining, variable-rate mortgage arrears should stabilise after peaking in H1 2025; early indicators suggest refinancing volumes are recovering.
• **Deposit competition**: As the RBA cuts, the race for term deposits intensifies — Westpac's $612B deposit base requires careful pricing discipline vs. the Big 4 peers.
• **CBA's market share dominance**: CBA's $842B loan book remains ~20% larger than Westpac's $698B — business banking and SME lending are the primary catch-up opportunity.
• **Macquarie's retail growth**: MQG is gaining share in home loans and savings; Westpac must defend its digital customer base with competitive product pricing.

**4. Westpac Strategic Priorities**
Analytics teams should prioritise mortgage portfolio stress-testing under multiple rate scenarios (RBA holds, 2 cuts, 4 cuts by year-end) and quantify the deposit run-off risk at current rate levels. A secondary priority is building a real-time NIM dashboard that incorporates the RBA cash rate and competitor deposit/lending rate moves."""


def _build_data_summary() -> str:
    """Construct a plain-text summary of the latest cached data for the prompt."""
    lines = []

    def load(filename: str) -> pd.DataFrame | None:
        path = CACHE_DIR / filename
        if path.exists():
            try:
                return pd.read_csv(path)
            except Exception:
                return None
        return None

    # Cash rate
    df = load("rba_cash_rate.csv")
    if df is not None and not df.empty:
        latest = df.iloc[-1]
        lines.append(f"RBA Cash Rate Target: {latest['rate']}% (as of {latest['date']})")
        # Count recent changes
        changes = df[df["rate"] != df["rate"].shift(1)].tail(3)
        if not changes.empty:
            history = ", ".join([f"{r['rate']}% ({r['date'][:7]})" for _, r in changes.iterrows()])
            lines.append(f"Recent rate changes: {history}")

    # CPI
    df = load("abs_cpi.csv")
    if df is not None and not df.empty:
        latest = df.iloc[-1]
        lines.append(f"CPI (YoY): {latest.get('yoy_change', 'N/A')}% (Q ending {latest['date'][:7]})")
        lines.append(f"CPI index level: {latest.get('value', 'N/A')}")

    # Employment
    df = load("abs_employment.csv")
    if df is not None and not df.empty:
        latest = df.iloc[-1]
        lines.append(f"Total employed persons: {latest.get('employed_thousands', 'N/A')}k (as of {latest['date'][:7]})")

    # GDP
    df = load("abs_gdp.csv")
    if df is not None and not df.empty:
        latest = df.iloc[-1]
        lines.append(f"GDP: ${latest.get('gdp_billions', 'N/A')}B, QoQ change: {latest.get('qoq_change', 'N/A')}%")

    # APRA
    df = load("apra_banking.csv")
    if df is not None and not df.empty:
        lines.append("\nMajor ADI Balance Sheet (A$B):")
        for _, row in df.head(5).iterrows():
            lines.append(
                f"  {row['institution']}: Assets={row['total_assets_b']}, "
                f"Loans={row['gross_loans_b']}, Deposits={row['total_deposits_b']}"
            )

    # Bank stocks (latest close)
    df = load("asx_bank_stocks.csv")
    if df is not None and not df.empty:
        latest_prices = df.groupby("ticker").last().reset_index()
        lines.append("\nLatest ASX bank share prices:")
        for _, row in latest_prices.iterrows():
            lines.append(f"  {row.get('name', row['ticker'])} ({row['ticker']}): ${row['close']}")

    return "\n".join(lines) if lines else "No data currently available."


def _is_cache_fresh() -> bool:
    if not INSIGHTS_CACHE_PATH.exists():
        return False
    return (time.time() - INSIGHTS_CACHE_PATH.stat().st_mtime) < INSIGHTS_CACHE_TTL


def generate_insights() -> dict:
    """
    Generate executive-level insight report using LangChain LLMChain.

    Returns:
        {"insights": str, "generated_at": str, "demo_mode": bool, "data_sources": list[str]}
    """
    demo_mode = os.getenv("DEMO_MODE", "false").lower() == "true"
    generated_at = datetime.now().strftime("%Y-%m-%d %H:%M AEST")

    data_sources = [
        "RBA Cash Rate (rba.gov.au)",
        "ABS CPI & Employment (abs.gov.au)",
        "ABS GDP National Accounts (abs.gov.au)",
        "APRA Monthly ADI Statistics (apra.gov.au)",
        "ASX Bank Stocks via yfinance",
    ]

    if demo_mode:
        return {
            "insights": DEMO_INSIGHTS,
            "generated_at": generated_at,
            "demo_mode": True,
            "data_sources": data_sources,
        }

    # Check server-side cache
    if _is_cache_fresh():
        logger.info("Returning cached insights")
        return {
            "insights": INSIGHTS_CACHE_PATH.read_text(),
            "generated_at": generated_at,
            "demo_mode": False,
            "data_sources": data_sources,
        }

    try:
        llm = get_llm(temperature=0.3)
        chain = LLMChain(llm=llm, prompt=WESTPAC_PROMPT)

        data_summary = _build_data_summary()
        result = chain.invoke({
            "data_summary": data_summary,
            "current_date": datetime.now().strftime("%d %B %Y"),
        })
        insights_text = result.get("text", result.get("output", "No insights generated"))

        # Cache to disk
        CACHE_DIR.mkdir(parents=True, exist_ok=True)
        INSIGHTS_CACHE_PATH.write_text(insights_text)

        return {
            "insights": insights_text,
            "generated_at": generated_at,
            "demo_mode": False,
            "data_sources": data_sources,
        }

    except Exception as exc:
        logger.error(f"Insights chain error: {exc}")
        # Fall back to demo insights rather than returning an error
        return {
            "insights": DEMO_INSIGHTS,
            "generated_at": generated_at,
            "demo_mode": True,
            "data_sources": data_sources,
        }
