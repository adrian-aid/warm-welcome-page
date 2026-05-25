# Legal, Compliance & Boundaries — AUS Banking Intelligence

**Version:** 1.0 | **Audience:** All users, managers, legal reviewers | **Last updated:** 2026-05

---

## 1. Not Financial Advice — Mandatory Disclaimer

> **⚠️ IMPORTANT — READ BEFORE USING**
>
> This application and all content it produces, including AI-generated analysis, data summaries, trend interpretations, and "Insights" reports, is provided **for informational and demonstration purposes only**.
>
> **Nothing in this application constitutes:**
> - Financial advice as defined under the *Corporations Act 2001* (Cth)
> - Investment advice, trading recommendations, or portfolio guidance
> - Credit advice under the *National Consumer Credit Protection Act 2009* (Cth)
> - Any form of licensed financial services
>
> **Do not make financial, investment, lending, or business decisions based on outputs from this application.**
>
> The author of this application is not a licensed financial adviser, credit representative, or Australian Financial Services (AFS) Licence holder.

---

## 2. AI-Generated Content Disclaimer

This application uses large language models (LLMs) — specifically Meta's Llama 3.3 70B running on Groq infrastructure — to generate text outputs in the **AI Analyst** and **Insights** features.

### Known limitations of AI-generated outputs

| Risk | Description |
|---|---|
| **Hallucination** | LLMs can state incorrect facts with high apparent confidence. All numerical outputs should be independently verified against primary sources. |
| **Stale knowledge** | The LLM's training data has a knowledge cutoff. It cannot know about events after that date unless provided in the current data summary. |
| **Calculation errors** | The pandas agent may produce incorrect intermediate calculations, especially on multi-step reasoning. Verify any derived statistics. |
| **Context window limits** | The agent receives a structured summary of data, not the full raw datasets. Very specific or granular queries may be answered with less accuracy. |
| **Prompt sensitivity** | Small changes in question phrasing can produce materially different answers. Results are not deterministic. |
| **Westpac-framed outputs** | The Insights feature uses a prompt framed as "a senior Westpac data analyst." This is a rhetorical device for demonstration purposes only. It does not represent the views of Westpac Banking Corporation. |

**Guidance:** Treat all AI-generated outputs as a starting point for analysis, not a conclusion. Cross-check every factual claim against the primary data sources listed in §3.

---

## 3. Data Sources — Licensing and Attribution

### 3.1 Reserve Bank of Australia (RBA)

- **Data:** Cash Rate Target, exchange rates, credit aggregates
- **Source:** [rba.gov.au/statistics](https://www.rba.gov.au/statistics/)
- **Licence:** [Creative Commons Attribution 4.0 International (CC BY 4.0)](https://www.rba.gov.au/disclaimer.html)
- **Attribution required:** "Source: Reserve Bank of Australia"
- **Terms:** RBA data is freely available for reuse with attribution. Commercial use is permitted under CC BY 4.0.
- **Caveat:** RBA may amend or discontinue publications at any time. Verify currency with the primary source.

### 3.2 Australian Bureau of Statistics (ABS)

- **Data:** CPI (All Groups), Labour Force (employment), National Accounts (GDP)
- **Source:** [abs.gov.au](https://www.abs.gov.au/) via the ABS Indicator JSON API
- **Licence:** [Creative Commons Attribution 4.0 International (CC BY 4.0)](https://www.abs.gov.au/copyright)
- **Attribution required:** "Source: Australian Bureau of Statistics"
- **Terms:** ABS data is published under CC BY 4.0. Redistribution and adaptation are permitted with attribution.
- **Caveat:** ABS revises historical data series periodically. The values shown may differ from revised publications.

### 3.3 Australian Prudential Regulation Authority (APRA)

- **Data:** Monthly Authorised Deposit-taking Institution (ADI) Statistics — balance sheet summaries
- **Source:** [apra.gov.au/monthly-authorised-deposit-taking-institution-statistics](https://www.apra.gov.au/monthly-authorised-deposit-taking-institution-statistics)
- **Licence:** [Creative Commons Attribution 4.0 International (CC BY 4.0)](https://www.apra.gov.au/copyright-and-disclaimer)
- **Attribution required:** "Source: Australian Prudential Regulation Authority (APRA)"
- **Terms:** APRA statistical publications are freely available. The data represents aggregated institutional statistics, not confidential supervisory information.
- **Caveat:** The APRA data shown in v1.0 is a curated static snapshot. Live programmatic download from APRA is not yet implemented. See Engineering Guide §10.

### 3.4 ASX Bank Stock Prices (via yfinance / Yahoo Finance)

- **Data:** Daily closing prices for WBC.AX, CBA.AX, NAB.AX, ANZ.AX, MQG.AX
- **Source:** Yahoo Finance API, accessed via the `yfinance` open-source Python library
- **Licence:** Yahoo Finance data is subject to [Yahoo's Terms of Service](https://legal.yahoo.com/us/en/yahoo/terms/otos/index.html)
- **Key restrictions:**
  - Yahoo Finance data is licensed for **personal and non-commercial use** only
  - Redistribution of Yahoo Finance data is **not permitted** without a commercial data licence
  - Automated scraping beyond personal use may violate Yahoo's terms
- **⚠️ Commercial use warning:** If this application is used in a commercial context (e.g., a client-facing product, commercial intelligence platform), a licensed market data feed (ASX, Refinitiv, Bloomberg) **must** replace the yfinance integration before deployment.
- **Caveat:** yfinance is an unofficial library. Yahoo may break compatibility or block access without notice.

### 3.5 News Feeds (RSS)

- **Sources:** RBA media releases RSS, APRA media RSS, ASIC news RSS, ABC News Business RSS
- **RBA/APRA/ASIC:** Government publications under CC BY 4.0 or open crown copyright
- **ABC News:** Sourced from ABC's public RSS feed. ABC content is subject to [ABC's terms](https://help.abc.net.au/hc/en-au/articles/360001548096). RSS aggregation for personal/non-commercial use is generally accepted; commercial redistribution requires permission.
- **Caveat:** RSS feed URLs and formats may change without notice.

---

## 4. Third-Party AI Services — Groq API

This application uses [Groq Cloud](https://groq.com/) to run the Llama 3.3 70B language model.

| Consideration | Detail |
|---|---|
| **Service provider** | Groq, Inc. (USA) |
| **Model** | Meta Llama 3.3 70B Versatile (open-weight model) |
| **Data sent to Groq** | Chat messages, data summaries, prompts — no PII if used as intended |
| **Groq terms of service** | [groq.com/terms](https://groq.com/terms-of-service) |
| **Groq privacy policy** | [groq.com/privacy](https://groq.com/privacy-policy) |
| **Data residency** | Groq operates in the United States. By using this application, data sent in prompts may be processed on servers located in the US. |
| **Data retention** | Per Groq's privacy policy, query data may be retained for service improvement. Review Groq's current policy for enterprise data retention commitments. |

### ⚠️ Considerations for regulated environments

In a production banking context (e.g., Westpac internal tooling), use of external cloud LLM APIs requires:

1. **Information Security review** — All prompt content is treated as data leaving the organisation's control
2. **Third-party risk assessment** — Groq must be assessed as a vendor under the organisation's third-party risk framework
3. **APRA CPS 234 compliance** — Material service providers must meet information security standards
4. **Data classification check** — Confirm no customer data, confidential supervisory data, or material non-public information (MNPI) is included in prompts
5. **Alternative:** Consider on-premise model deployment (Ollama, vLLM) or Azure OpenAI Service (data boundary within Australia/Azure regions)

---

## 5. Privacy

### What data this application collects

| Data type | Collected? | Notes |
|---|---|---|
| Personal information | ❌ No | No login, no registration, no user accounts |
| Chat messages | ⚠️ Partial | Messages are sent to Groq API for processing (see §4). Not stored by this application. |
| Usage analytics | ❌ No | No tracking, no analytics, no cookies |
| IP addresses | ❌ No | Not logged by this application (may be logged by hosting infrastructure) |
| Financial data | ❌ No | Only public aggregate data; no individual account data |

### Australian Privacy Act 1988 (Cth)

This application does not collect personal information as defined under the *Privacy Act 1988* (Cth). No Australian Privacy Principles (APPs) are engaged by the current implementation. If the application were extended to include user accounts, authentication logs, or behavioural analytics, a Privacy Impact Assessment (PIA) would be required.

---

## 6. Intellectual Property

### This application's codebase

The codebase of this application is original work produced for portfolio demonstration purposes. No licence is currently granted for commercial use, redistribution, or derivative works without the author's permission.

### Third-party open-source components

This application incorporates open-source software. Key licences:

| Package | Licence | Notes |
|---|---|---|
| React | MIT | Facebook Open Source |
| FastAPI | MIT | Sebastián Ramírez |
| LangChain | MIT | LangChain AI |
| shadcn/ui | MIT | shadcn |
| Recharts | MIT | recharts org |
| yfinance | Apache 2.0 | Ran Aroussi |
| feedparser | MIT | Kurt McKee |
| Tailwind CSS | MIT | Tailwind Labs |
| Radix UI | MIT | WorkOS |

A full dependency list with licences can be generated with:
```bash
# Frontend
npx license-checker --summary

# Backend
pip-licenses --from=mixed
```

### Westpac references

This application references Westpac Banking Corporation (ASX: WBC) in analytical content and prompts for demonstration purposes only. This application has no affiliation with, endorsement from, or relationship with Westpac Banking Corporation. Westpac's name, ASX ticker, and logo are trademarks of Westpac Banking Corporation.

### Meta Llama model

Llama 3.3 is released by Meta under the [Llama 3 Community Licence](https://llama.meta.com/llama3/license/). Use is subject to Meta's acceptable use policy. Commercial deployment at scale may require a separate Meta licence.

---

## 7. System Boundaries — What This Application Is and Is Not

### What it IS

| ✅ In scope | Description |
|---|---|
| Portfolio demonstration | Showcases AI and data engineering capabilities |
| Data aggregation layer | Collects and normalises public Australian economic data |
| Conversational data explorer | Natural language interface over structured datasets |
| Insight generation prototype | LLM-assisted narrative from data summaries |
| Interview showcase tool | Demonstrates LangChain, FastAPI, React, TypeScript skills |

### What it IS NOT

| ❌ Out of scope | Why |
|---|---|
| Financial advice platform | Not licensed; outputs not suitable for investment decisions |
| Trading system | No real-time prices; no execution capability |
| Compliance or regulatory tool | Not validated for regulatory reporting; APRA data is a static snapshot |
| Internal Westpac system | No affiliation with Westpac; not connected to any bank's systems |
| Production banking application | Not production-ready (see Engineering Guide §10) |
| Surveillance or monitoring tool | No ongoing monitoring; no alerting; no SLA |
| Replacement for Bloomberg/Refinitiv | Intentionally free-tier; significant data quality gaps vs professional terminals |

### Explicit data exclusions

The following data types are **deliberately excluded** from this application:

- Individual customer account data
- Credit scores or creditworthiness assessments
- Mortgage or loan book details (other than APRA aggregate totals)
- Internal bank performance metrics
- Material non-public information (MNPI)
- APRA supervisory data (confidential)
- Insider information of any kind

---

## 8. Caveats — Accuracy and Reliability

### Data accuracy

| Source | Known limitations |
|---|---|
| RBA cash rate | Accurate; official data. Layout of XLS file may change without notice. |
| ABS CPI/employment/GDP | ABS revises historical series; values shown may differ from latest revision |
| APRA ADI statistics | v1.0 uses a curated static snapshot, not live data |
| ASX stock prices | Yahoo Finance data; unofficial API; no SLA on accuracy or uptime |
| News feed | RSS parsing; summary text may be truncated; links may expire |

### AI output accuracy

AI-generated content is explicitly **not fact-checked** by the application. The LangChain agent:
- Runs Python code against the cached dataframes — code may contain errors
- Interprets results in plain language — interpretation may be incorrect
- Has no mechanism to know what it doesn't know

**Always verify numerical outputs** against the primary data sources listed in §3.

### Uptime and availability

This is a local development application with no uptime commitment. In the event of:
- Groq API outage: switch to `DEMO_MODE=true`
- ABS/RBA website maintenance: cached data is served automatically
- yfinance rate limiting: synthetic fallback stock data is used

---

## 9. Regulatory Context — Australian Banking Sector

This application references and analyses data from the Australian banking regulatory ecosystem. For context:

| Regulator | Role | Relevance to this app |
|---|---|---|
| **RBA** | Monetary policy, financial system stability | Cash rate data source |
| **APRA** | Prudential supervision of ADIs | Banking statistics source |
| **ASIC** | Market conduct, financial services licensing | News feed source |
| **ACCC** | Competition regulation | Not currently integrated |
| **AUSTRAC** | Anti-money laundering, counter-terrorism financing | Not applicable to this tool |

This application does not interact with, report to, or operate under the supervision of any of these regulators.

---

## 10. Contact and Reporting Issues

For issues with data accuracy, legal concerns, or data source attributions, please raise a GitHub issue on this repository. For urgent concerns about potential misuse of this application, contact the repository owner directly.

---

*This document is provided for transparency and should be reviewed before any use of this application beyond personal portfolio review.*
