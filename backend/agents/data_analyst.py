"""
LangChain data analyst agent with session memory.

Uses create_pandas_dataframe_agent to answer natural language questions
over the cached Australian economic datasets. Conversation history from
the current session is injected into each prompt so the agent can build
on previous answers ("What about last year?" → refers to prior context).

Security note: allow_dangerous_code=True is required by the pandas agent.
This endpoint must never be publicly exposed without authentication.
"""
import logging
import os
from pathlib import Path

import pandas as pd
from langchain_experimental.agents import create_pandas_dataframe_agent

from backend.utils.llm import get_llm
from backend.agents.memory_store import memory_store

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
        "beginning in May 2022 (from a record low of 0.10%). The RBA cut once in February 2025 from 4.35% to 4.10%. "
        "The next RBA Board meeting will decide whether to cut further, hold, or — very unlikely at this stage — raise.",
    ),
    "cpi": (
        "Australia's CPI (All Groups, weighted average of 8 capital cities) was 2.4% year-on-year as of the "
        "December 2024 quarter, down significantly from the peak of 7.8% in December 2022. "
        "The RBA targets 2–3% inflation; the current trajectory supports a gradual easing cycle.",
    ),
    "westpac": (
        "Westpac (WBC.AX) is Australia's second-largest bank by assets (~$1.02 trillion). "
        "Per the latest APRA data, Westpac holds ~$698B in gross loans and ~$612B in deposits. "
        "Its share price has traded in a 52-week range consistent with the broader banking sector re-rating "
        "as rate cut expectations have firmed.",
    ),
    "budget": (
        "The 2025-26 Federal Budget (delivered 25 March 2025 by Treasurer Jim Chalmers) projects a deficit of "
        "$26.9B (-1.0% of GDP), with revenue of $751.2B and expenditure of $778.1B. "
        "Key economic forecasts: GDP 2.25%, CPI 2.75%, unemployment 4.25%. "
        "Key banking-relevant measures include housing expenditure ($10B HAFF), tax cuts ($17.1B ongoing cost), "
        "and energy bill relief ($1.8B). The deficit is modest and unlikely to pressure the RBA.",
    ),
    "trend": (
        "Key Australian economic trends (2024-25): "
        "1) Inflation moderation — CPI fell from 7.8% (2022) to 2.4% (Dec 2024), inside the 2-3% RBA target band. "
        "2) Rate easing cycle begins — RBA cut from 4.35% to 4.10% in Feb 2025, first cut since 2020. "
        "3) Employment resilience — unemployment remains around 4.0-4.25%, below structural estimates. "
        "4) Housing pressure — housing costs remain elevated despite falling headline CPI. "
        "5) Westpac & Big 4 NIM compression — as rate cuts flow through, net interest margins will narrow.",
    ),
}

# Dataset descriptions injected into every prompt
DF_DESCRIPTIONS = "\n".join([
    "You are an Australian banking sector data analyst. Available datasets:",
    "- cash_rate (df1): RBA Cash Rate Target history [date, rate]",
    "- cpi (df2): ABS quarterly CPI [date, value, yoy_change]",
    "- employment (df3): ABS employed persons [date, employed_thousands]",
    "- gdp (df4): ABS quarterly GDP [date, gdp_billions, qoq_change]",
    "- apra_banking (df5): APRA major ADI balance sheets [institution, total_assets_b, gross_loans_b, total_deposits_b]",
    "- bank_stocks (df6): ASX bank prices 6-month [date, ticker, name, close]",
    "",
    "All monetary values are in Australian dollars. Dates are YYYY-MM-DD.",
    "Use dfs[0] for cash_rate, dfs[1] for cpi, etc. when referring to dataframes by index.",
])


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


def _build_history_context(history: list[dict]) -> str:
    """Format the last N conversation turns as context for the agent prompt."""
    if not history:
        return ""
    recent = history[-6:]  # Last 6 turns keeps context useful without overloading
    lines = ["Previous conversation in this session (use this context to answer follow-up questions):"]
    for turn in recent:
        lines.append(f"  Human: {turn['question']}")
        lines.append(f"  Assistant: {turn['answer'][:400]}{'...' if len(turn['answer']) > 400 else ''}")
    lines.append("")
    return "\n".join(lines)


def _generate_followups(question: str, answer: str) -> list[str]:
    """
    Suggest 2-3 relevant follow-up questions based on what was just answered.
    This is rule-based (no LLM call) to avoid extra latency.
    """
    q_lower = (question + " " + answer).lower()
    suggestions = []

    if "cash rate" in q_lower or "rba" in q_lower:
        suggestions += [
            "How does the current cash rate compare to 2022?",
            "What is the next RBA board meeting date?",
            "How has the rate change affected bank net interest margins?",
        ]
    if "cpi" in q_lower or "inflation" in q_lower:
        suggestions += [
            "How does Australian inflation compare to the RBA target band?",
            "Which component of CPI has been most stubborn?",
            "When did inflation peak and what drove it?",
        ]
    if "westpac" in q_lower or "wbc" in q_lower:
        suggestions += [
            "How does Westpac's loan book compare to CBA's?",
            "What is Westpac's deposit-to-loan ratio vs peers?",
            "Show me the 6-month WBC share price trend",
        ]
    if "employment" in q_lower or "jobs" in q_lower or "unemployment" in q_lower:
        suggestions += [
            "How has employment changed since the rate hiking cycle began?",
            "What is the trend in employed persons over the last year?",
        ]
    if "gdp" in q_lower or "growth" in q_lower:
        suggestions += [
            "Is GDP growth above or below the long-run average?",
            "How does current GDP growth compare to the budget forecast of 2.25%?",
        ]
    if "budget" in q_lower or "deficit" in q_lower or "surplus" in q_lower:
        suggestions += [
            "What are the key banking-relevant measures in the 2025-26 budget?",
            "How does the deficit compare to COVID-era spending?",
        ]

    # Deduplicate and limit to 3
    seen = set()
    unique = []
    for s in suggestions:
        if s not in seen:
            seen.add(s)
            unique.append(s)
    return unique[:3]


def ask_analyst(
    question: str,
    session_id: str | None = None,
    history: list[dict] | None = None,
) -> dict:
    """
    Ask the LangChain pandas agent a question about Australian economic data.

    Args:
        question:   Natural language question from the user
        session_id: UUID identifying the chat session (enables cross-turn memory)
        history:    Fallback history from frontend (used if session_id not provided)

    Returns:
        {
          "answer": str,
          "steps": list[str],       # LangChain intermediate reasoning steps
          "demo_mode": bool,
          "followups": list[str],   # Suggested follow-up questions
        }
    """
    demo_mode = os.getenv("DEMO_MODE", "false").lower() == "true"

    if demo_mode:
        answer = _pick_demo_response(question)
        followups = _generate_followups(question, answer)
        return {
            "answer": answer,
            "steps": ["[Demo mode — live LangChain agent disabled]"],
            "demo_mode": True,
            "followups": followups,
        }

    # Resolve conversation history: prefer server-side session memory
    session_history: list[dict] = []
    if session_id:
        session_history = memory_store.get_history(session_id)
    elif history:
        # Convert frontend format to internal format
        pairs = []
        msgs = [m for m in (history or []) if isinstance(m, dict)]
        for i in range(0, len(msgs) - 1, 2):
            if msgs[i].get("role") == "user" and msgs[i + 1].get("role") == "assistant":
                pairs.append({
                    "question": msgs[i]["content"],
                    "answer": msgs[i + 1]["content"],
                })
        session_history = pairs

    dfs = _load_dataframes()
    if not dfs:
        return {
            "answer": "No data available yet. The backend is warming up — please retry in 30 seconds.",
            "steps": [],
            "demo_mode": False,
            "followups": [],
        }

    # Build enriched prompt: dataset descriptions + conversation history + question
    history_context = _build_history_context(session_history)
    enriched_question = f"{DF_DESCRIPTIONS}\n\n{history_context}Current question: {question}"

    steps = []
    answer = ""

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

        # Extract intermediate steps for the "Show reasoning" panel
        for action, observation in result.get("intermediate_steps", []):
            tool_input = str(getattr(action, "tool_input", action))
            steps.append(f"🔍 {tool_input[:200]}")

        # Persist this turn to session memory
        if session_id:
            memory_store.add_turn(session_id, question, answer, steps)

        followups = _generate_followups(question, answer)
        return {"answer": answer, "steps": steps, "demo_mode": False, "followups": followups}

    except Exception as exc:
        logger.error(f"Agent error: {exc}")
        answer = f"I encountered an error analysing your question: {str(exc)[:200]}. Please try rephrasing or ask a simpler version."
        followups = _generate_followups(question, answer)
        return {
            "answer": answer,
            "steps": steps,
            "demo_mode": False,
            "followups": followups,
        }


def clear_session(session_id: str):
    """Clear conversation memory for a session."""
    memory_store.clear_session(session_id)
