"""
Australian Federal Budget data.

Sources:
  Budget papers:  https://budget.gov.au/
  Treasury:       https://treasury.gov.au/

Budget 2025-26 delivered: 25 March 2025 (Treasurer Jim Chalmers)
MYEFO 2024-25 released: December 2024

This module provides structured budget headline metrics and economic forecasts
for use in dashboard displays and LangChain agent context.

Note: Live scraping of budget.gov.au is complex (PDF-based).
These are curated key metrics from the official budget papers.
Update this file after each annual budget and MYEFO release.
"""
import logging
from datetime import date

logger = logging.getLogger(__name__)

# ─── 2025-26 Budget (delivered 25 March 2025) ────────────────────────────────
BUDGET_2025_26 = {
    "budget_year": "2025-26",
    "delivered_date": "2025-03-25",
    "treasurer": "Jim Chalmers",
    "fiscal_position": {
        "underlying_cash_balance_b": -26.9,   # A$B deficit
        "revenue_b": 751.2,                    # A$B
        "expenditure_b": 778.1,                # A$B
        "net_debt_pct_gdp": 19.2,              # % of GDP
        "gross_debt_b": 1002.0,                # A$B
        "label": "Deficit of $26.9B (-1.0% of GDP)",
    },
    "economic_forecasts": {
        # Treasury Budget forecasts (2025-26 year)
        "gdp_growth_pct": 2.25,                # Real GDP growth %
        "cpi_pct": 2.75,                       # CPI inflation %
        "unemployment_pct": 4.25,              # Unemployment rate %
        "wages_growth_pct": 3.25,              # WPI Wage Price Index %
        "terms_of_trade_change_pct": -3.0,     # % change
        "nominal_gdp_b": 2778.0,               # A$B
    },
    "key_measures": [
        {
            "measure": "Energy Bill Relief",
            "cost_b": 1.8,
            "description": "Extension of $300 household energy rebate into 2025-26",
        },
        {
            "measure": "Stage 3 Tax Cuts (ongoing)",
            "cost_b": 17.1,
            "description": "Full-year cost of legislated personal income tax cuts",
        },
        {
            "measure": "HELP debt indexation relief",
            "cost_b": 3.0,
            "description": "Reduction in outstanding HELP debt by 20% for eligible debtors",
        },
        {
            "measure": "Housing Australia Future Fund",
            "cost_b": 10.0,
            "description": "Increased funding for social and affordable housing",
        },
        {
            "measure": "Medicare & Health",
            "cost_b": 8.4,
            "description": "Bulk billing incentive extension and Strengthening Medicare",
        },
    ],
    "banking_implications": [
        "Housing expenditure supports mortgage market volume but adds inflationary pressure on construction",
        "Tax cuts increase household disposable income, supporting consumer spending and debt serviceability",
        "Deficit spending is modest (-1.0% GDP) — unlikely to drive RBA rate response",
        "HELP debt reduction reduces graduate debt burden, improving borrowing capacity for young Australians",
        "Energy rebates reduce CPI in short term, supporting RBA's return-to-target trajectory",
    ],
    "source_url": "https://budget.gov.au/content/overview.htm",
}

# ─── MYEFO 2024-25 (released December 2024) ──────────────────────────────────
MYEFO_2024_25 = {
    "publication": "MYEFO 2024-25",
    "released_date": "2024-12-18",
    "underlying_cash_balance_b": -26.1,
    "note": "Revised from surplus to small deficit vs 2024-25 Budget forecast of -$28.3B",
    "economic_forecasts": {
        "gdp_growth_pct": 1.75,
        "cpi_pct": 3.0,
        "unemployment_pct": 4.25,
    },
    "source_url": "https://treasury.gov.au/publication/myefo/myefo-2024-25",
}

# ─── Historical budget positions ─────────────────────────────────────────────
HISTORICAL_FISCAL = [
    {"year": "2019-20", "balance_b": -85.3, "pct_gdp": -4.3, "note": "COVID-19 response"},
    {"year": "2020-21", "balance_b": -134.2, "pct_gdp": -6.5, "note": "COVID-19 peak deficit"},
    {"year": "2021-22", "balance_b": -32.0, "pct_gdp": -1.4, "note": "Recovery"},
    {"year": "2022-23", "balance_b": 22.1, "pct_gdp": 0.9, "note": "First surplus in 15 years"},
    {"year": "2023-24", "balance_b": 15.8, "pct_gdp": 0.6, "note": "Second consecutive surplus"},
    {"year": "2024-25", "balance_b": -26.1, "pct_gdp": -1.0, "note": "MYEFO estimate"},
    {"year": "2025-26", "balance_b": -26.9, "pct_gdp": -1.0, "note": "Budget estimate"},
]


def get_budget_data() -> dict:
    """
    Return structured Australian Budget data for dashboard display.

    Returns combined 2025-26 Budget + MYEFO + historical fiscal position.
    """
    return {
        "current_budget": BUDGET_2025_26,
        "myefo": MYEFO_2024_25,
        "historical_fiscal": HISTORICAL_FISCAL,
        "data_note": (
            "Data sourced from Australian Federal Budget papers and Treasury publications. "
            "Update after each annual Budget (typically March/May) and MYEFO (December). "
            "See: https://budget.gov.au/"
        ),
        "as_of": date.today().isoformat(),
    }
