"""
LangChain data analyst agent.

Uses create_pandas_dataframe_agent to answer natural language questions
over the cached Australian economic datasets.

Security note: allow_dangerous_code=True is required for the pandas agent.
This endpoint must never be publicly exposed without authentication.
"""
import logging
import os
from pathlib import Path

import pandas as pd
from langchain_experimental.agents import create_pandas_dataframe_agent

from backend.utils.llm import get_llm

logger = logging.getLogger(__name__)

CACHE_DIR = Path(__file__).parent.parent / "data" / "cache"

# Pre-computed demo responses for DEMO_MODE=true
DEMO_RESPONSES = {
    "default": (
        "Based on the available Australian economic data, the RBA cash rate currently stands at 4.10%, "
        "having been held steady since early 2025 after a series of rate hikes that peaked at 4.35% in late 2023. "
        "Inflation (CPI) has moderated to approximately 2.8% year-on-year, within the RBA's 2–3% target band. "
        "Employment remains strong at around 13.9 million persons, while GDP growth is modest at around 0.3–0.5% per quarter.",
    ),
    "cash rate": (
        "The RBA Cash Rate Target is currently 4.10%. It peaked at 4.35% in November 2023 after 13 rate rises "
        "beginning in May 2022 (from a record low of 0.10%). The RBA cut once in February 2025 from 4.35% to 4.10%.",
    ),
    "cpi": (
        "Australia's CPI (All Groups, weighted average of 8 capital cities) was 2.8% year-on-year as of the "
        "December 2024 quarter, down significantly from the peak of 7.8% in December 2022.",
    ),
    "westpac": (
        "Westpac (WBC.AX) is Australia's second-largest bank by assets (~$1.02 trillion). "
        "Per the latest APRA data, Westpac holds ~$698B in gross loans and ~$612B in deposits. "
        "Its share price has traded in a 52-week range consistent with the broader banking sector re-rating "
        "as rate cut expectations have firmed.",
    ),
}


def _load_dataframes() -> dict[str, pd.DataFrame]:
    """Load all cached CSVs into pandas DataFrames for the agent."""
    dfs = {}
    files = {
        "cash_rate": CACHE_DIR / "rba_cash_rate.csv",
        "cpi": CACHE_DIR / "abs_cpi.csv",
        "employment": CACHE_DIR / "abs_employment.csv",
        "gdp": CACHE_DIR / "abs_gdp.csv",
        "apra_banking": CACHE_DIR / "apra_banking.csv",
        "bank_stocks": CACHE_DIR / "asx_bank_stocks.csv",
    }
    for name, path in files.items():
        if path.exists():
            try:
                dfs[name] = pd.read_csv(path)
                logger.debug(f"Loaded {name}: {len(dfs[name])} rows")
            except Exception as exc:
                logger.warning(f"Could not load {name}: {exc}")
    return dfs


def _pick_demo_response(question: str) -> str:
    q_lower = question.lower()
    for keyword, response in DEMO_RESPONSES.items():
        if keyword in q_lower:
            return response[0]
    return DEMO_RESPONSES["default"][0]


def ask_analyst(question: str, history: list[dict] | None = None) -> dict:
    """
    Ask the LangChain pandas agent a question about Australian economic data.

    Args:
        question: Natural language question
        history: Optional list of {"role": "user"|"assistant", "content": "..."}

    Returns:
        {"answer": str, "steps": list[str], "demo_mode": bool}
    """
    demo_mode = os.getenv("DEMO_MODE", "false").lower() == "true"

    if demo_mode:
        return {
            "answer": _pick_demo_response(question),
            "steps": ["[Demo mode — live LangChain agent disabled]"],
            "demo_mode": True,
        }

    dfs = _load_dataframes()
    if not dfs:
        return {
            "answer": "No data available yet. Please wait for the data cache to populate.",
            "steps": [],
            "demo_mode": False,
        }

    # Build context prefix so the agent understands what each DataFrame contains
    df_descriptions = "\n".join([
        "Available DataFrames:",
        "- cash_rate: RBA Cash Rate Target history (columns: date, rate)",
        "- cpi: ABS quarterly CPI (columns: date, value, yoy_change)",
        "- employment: ABS monthly employed persons (columns: date, employed_thousands)",
        "- gdp: ABS quarterly GDP (columns: date, gdp_billions, qoq_change)",
        "- apra_banking: Major ADI balance sheet stats (columns: institution, total_assets_b, gross_loans_b, total_deposits_b)",
        "- bank_stocks: ASX bank daily closing prices (columns: date, ticker, name, close)",
    ])

    enriched_question = f"{df_descriptions}\n\nQuestion: {question}"

    steps = []

    try:
        llm = get_llm(temperature=0)
        df_list = list(dfs.values())

        agent = create_pandas_dataframe_agent(
            llm,
            df_list,
            verbose=True,
            allow_dangerous_code=True,
            max_iterations=10,
            max_execution_time=30,
            return_intermediate_steps=True,
            agent_executor_kwargs={"handle_parsing_errors": True},
        )

        result = agent.invoke({"input": enriched_question})
        answer = result.get("output", "No answer generated")

        # Extract intermediate steps for display
        for action, observation in result.get("intermediate_steps", []):
            tool_input = str(getattr(action, "tool_input", action))
            steps.append(f"🔍 {tool_input[:200]}")

        return {"answer": answer, "steps": steps, "demo_mode": False}

    except Exception as exc:
        logger.error(f"Agent error: {exc}")
        return {
            "answer": f"I encountered an error processing your question: {str(exc)[:200]}. Please try rephrasing.",
            "steps": steps,
            "demo_mode": False,
        }
