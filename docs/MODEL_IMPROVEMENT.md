# Model Improvement Roadmap — LangChain & AI

**Version:** 1.1 | **Audience:** Developers, ML engineers, analytics managers | **Last updated:** 2026-05

---

## Current State

| Capability | Status | Notes |
|---|---|---|
| Structured data queries | ✅ Live | LangChain pandas agent over 6 CSV datasets |
| Session memory | ✅ Live | Server-side per-session history (last 20 turns, 60min TTL) |
| Executive insights | ✅ Live | LangChain LLMChain with Westpac-framed prompt |
| Follow-up suggestions | ✅ Live | Rule-based, triggered from answer keywords |
| Document retrieval (RAG) | ❌ Not yet | Planned — see §3 |
| Persistent cross-session memory | ❌ Not yet | Requires vector store — see §4 |
| Fine-tuning | ❌ Not yet | Requires labelled data — see §6 |
| Feedback collection | ❌ Not yet | See §5 |
| Model evaluation | ❌ Not yet | See §7 |

---

## How the Current AI Works

### 1. Data Analyst Agent

```
User question
     │
     ▼
Conversation history (last 6 turns) injected into prompt
     │
     ▼
LangChain pandas agent (llama-3.3-70b-versatile via Groq)
     │
     ├── Tool: python_repl_ast
     │     Executes pandas code against 6 DataFrames
     │     Returns: data values, calculations, filtered rows
     │
     ▼
Plain-language answer + intermediate steps
     │
     ▼
Follow-up suggestions (rule-based keyword matching)
```

**What it does well:**
- Exact data lookups ("What is the current cash rate?")
- Simple calculations ("Which bank has the highest loan-to-deposit ratio?")
- Comparisons ("Compare Westpac and CBA by assets")

**Known weaknesses:**
- Multi-hop reasoning across datasets (e.g., "How did the rate change affect bank stock prices?")
- Temporal analysis requiring date arithmetic
- Questions requiring knowledge outside the 6 datasets (e.g., news context)
- Occasional hallucinated intermediate pandas code

### 2. Insights Chain

```
Latest values from all cached CSVs
     │
     ▼
Structured data summary (text)
     │
     ▼
LangChain LLMChain → Westpac-framed PromptTemplate
     │
     ▼
Executive narrative (4 sections)
     │
     ▼
Cached for 1 hour server-side
```

---

## How Session Memory Works (v1.1)

The agent now retains conversation context within a session:

```
Browser                          Backend
  │                                │
  │ UUID generated on load          │
  │ (stored in sessionStorage)      │
  │                                │
  │──── POST /api/chat ────────────▶│
  │     {message, session_id}       │
  │                                │
  │                         memory_store.get_history(session_id)
  │                                │
  │                         last 6 turns prepended to prompt
  │                                │
  │                         LangChain agent runs
  │                                │
  │                         memory_store.add_turn(session_id, Q, A)
  │                                │
  │◀─── {answer, steps, followups}─│
```

**Session lifecycle:**
- New session ID on every page load (or after "Clear" button)
- Server evicts sessions after 60 minutes of inactivity
- Max 500 concurrent sessions, 20 turns each
- All memory is in-process — lost on backend restart

---

## Improvement Area 1: Expand Data Sources (Short-term, 1–2 weeks)

### 1a. Australian Budget PDFs (RAG prerequisite)

Currently Budget data is a structured static snapshot. To use the full budget papers:

```bash
pip install pypdf langchain-community
```

```python
from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter

loader = PyPDFLoader("https://budget.gov.au/content/bp1.pdf")
docs = loader.load()
splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
chunks = splitter.split_documents(docs)
```

Budget PDFs to add:
- Budget Paper No. 1 (Budget Strategy & Outlook): `https://budget.gov.au/content/bp1.pdf`
- Budget Paper No. 2 (Budget Measures): `https://budget.gov.au/content/bp2.pdf`

### 1b. RBA Publications (RAG prerequisite)

```python
# RBA Statement on Monetary Policy (quarterly)
SMP_URL = "https://www.rba.gov.au/publications/smp/2025/may/pdf/statement-on-monetary-policy-2025-05.pdf"

# RBA Board Minutes (monthly)
MINUTES_URL = "https://www.rba.gov.au/monetary-policy/rba-board-minutes/2025/2025-04-01.html"

# RBA Governor speeches
SPEECHES_RSS = "https://www.rba.gov.au/rss/rss-cb-speeches.xml"
```

### 1c. APRA Live Data Fetch

Replace the static APRA snapshot by scraping the actual Excel download:

```python
import requests
from bs4 import BeautifulSoup

# APRA publishes a new file each month — find the latest link
page = requests.get("https://www.apra.gov.au/monthly-authorised-deposit-taking-institution-statistics")
soup = BeautifulSoup(page.content, "html.parser")
excel_link = soup.find("a", href=lambda h: h and h.endswith(".xlsx"))
# Download and parse with pandas
```

---

## Improvement Area 2: Add Manual Data Refresh Endpoint (Short-term, 1 day)

The current cache TTL is 24 hours. Add an admin endpoint to force a refresh:

```python
# backend/routers/admin.py
@router.post("/api/admin/refresh-cache")
async def refresh_cache(token: str = Header(None)):
    if token != os.getenv("ADMIN_TOKEN"):
        raise HTTPException(403, "Forbidden")
    # Delete all cache files and re-fetch
    for f in CACHE_DIR.glob("*.csv"):
        f.unlink()
    fetch_cash_rate()
    fetch_cpi()
    # ... etc
    return {"status": "refreshed"}
```

Add `make refresh-cache` target to Makefile:
```bash
curl -X POST http://localhost:8000/api/admin/refresh-cache \
  -H "token: $(cat backend/.env | grep ADMIN_TOKEN | cut -d= -f2)"
```

---

## Improvement Area 3: RAG Pipeline (Medium-term, 2–4 weeks)

RAG (Retrieval-Augmented Generation) lets the agent answer questions using full-text documents (PDFs, HTML, reports) rather than just structured data.

### Architecture

```
Documents (PDFs, HTML)
     │
     ▼
Text chunking (RecursiveCharacterTextSplitter)
     │
     ▼
Embedding model (free: all-MiniLM-L6-v2 via sentence-transformers)
     │
     ▼
FAISS vector store (local, free, no cloud needed)
     │
     ▼
RetrievalQA chain or ConversationalRetrievalChain
     │
     ▼
Answers grounded in source documents
```

### Implementation

```bash
pip install faiss-cpu sentence-transformers langchain-community
```

```python
# backend/agents/rag_chain.py
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain.chains import RetrievalQA

embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
# Build index
vectorstore = FAISS.from_documents(chunks, embeddings)
vectorstore.save_local("backend/data/faiss_index")

# Query
retriever = vectorstore.as_retriever(search_kwargs={"k": 5})
qa_chain = RetrievalQA.from_chain_type(
    llm=get_llm(),
    retriever=retriever,
    return_source_documents=True,
)
result = qa_chain.invoke({"query": "What is the RBA's assessment of housing inflation?"})
```

### Documents to index (priority order)

| Document | Frequency | Notes |
|---|---|---|
| RBA Statement on Monetary Policy | Quarterly | Deep economic analysis |
| RBA Board Minutes | Monthly | Rate decision reasoning |
| Australian Budget Paper No. 1 | Annual (March) | Fiscal strategy |
| RBA Governor speeches | ~Monthly | Forward guidance |
| APRA Banking Insights | Quarterly | Sector analysis |
| AFG/CoreLogic Housing reports | Monthly | Mortgage market context |

### Add `make build-index` target

```makefile
build-index: ## Build the FAISS document index from RBA/Budget PDFs
    python -m backend.agents.rag_chain build
```

---

## Improvement Area 4: Persistent Cross-Session Memory (Medium-term)

Current memory is per-session, in-process only. For persistent memory across sessions and restarts:

### Option A: ChromaDB (free, local vector database)

```bash
pip install chromadb
```

```python
import chromadb
from langchain_community.vectorstores import Chroma

client = chromadb.PersistentClient(path="backend/data/chroma_db")
memory_store = Chroma(
    client=client,
    collection_name="conversation_memory",
    embedding_function=embeddings,
)
```

Store key facts extracted from conversations:
```python
# After each turn, extract key claims and embed them
# "Westpac assets are $1.02T" → stored as embedding
# Later sessions can retrieve: "What did we establish about Westpac?"
```

### Option B: PostgreSQL with pgvector (production path)

```bash
pip install pgvector psycopg2-binary langchain-postgres
```

For a multi-user production environment, PostgreSQL with pgvector supports concurrent reads/writes, TTL-based eviction, and full SQL querying over conversation history.

---

## Improvement Area 5: User Feedback Collection (Medium-term, 1 week)

Currently there is no signal about whether AI answers are correct or useful.

### Thumbs up/down on chat responses

Add to `ChatInterface.tsx`:
```tsx
<div className="flex gap-1 mt-1">
  <button onClick={() => submitFeedback("up", msgId)} title="Helpful">👍</button>
  <button onClick={() => submitFeedback("down", msgId)} title="Not helpful">👎</button>
</div>
```

Add to backend:
```python
# backend/routers/feedback.py
@router.post("/api/feedback")
async def submit_feedback(body: FeedbackRequest):
    # Log to JSONL file or database
    log_path = CACHE_DIR / "feedback.jsonl"
    with log_path.open("a") as f:
        f.write(json.dumps({
            "timestamp": datetime.now().isoformat(),
            "session_id": body.session_id,
            "question": body.question,
            "answer": body.answer,
            "rating": body.rating,  # "up" | "down"
        }) + "\n")
```

### Use feedback to:
1. Identify questions the agent consistently gets wrong
2. Build a test suite of "golden" Q&A pairs
3. Select examples for few-shot prompting
4. Evaluate prompt changes

---

## Improvement Area 6: Prompt Engineering & Few-Shot Learning (Ongoing)

### Current prompt architecture

```
System: "You are an Australian banking sector data analyst..."
Context: DataFrame descriptions (6 datasets)
History: Last 6 conversation turns
Question: [user input]
```

### Improvements to try (in order of effort)

**A. Add few-shot examples to the agent prompt** (1 day)

```python
FEW_SHOT_EXAMPLES = """
Example:
Human: What is the current cash rate?
Thought: I need to find the latest entry in the cash_rate dataframe.
Action: python_repl_ast
Action Input: dfs[0].sort_values('date').tail(1)[['date','rate']].to_string()
Observation: date=2025-04-01, rate=4.10
Answer: The current RBA Cash Rate Target is 4.10%, as of April 2025.
"""
```

**B. Chain-of-thought for complex calculations** (1–2 days)

For multi-dataset questions, add an intermediate step that makes the agent explicitly plan before executing:
```python
"Before writing any pandas code, state which dataframes you will use and why."
```

**C. Domain-specific system prompt for Westpac context** (1 day)

```python
WESTPAC_SYSTEM = """
You are a data analyst at Westpac Banking Corporation.
When answering questions about competitors, always frame relative to Westpac's position.
When discussing RBA rates, consider the impact on Westpac's net interest margin and mortgage book.
Current Westpac facts: #2 bank by assets ($1.02T), mortgage book ~$698B, deposits ~$612B.
"""
```

---

## Improvement Area 7: Model Evaluation Framework (Long-term, 2–4 weeks)

Before making significant changes to prompts or models, establish a baseline evaluation:

### Golden dataset

Create `backend/tests/golden_qa.py`:
```python
GOLDEN_PAIRS = [
    {
        "question": "What is the current RBA cash rate?",
        "expected_contains": ["4.10", "4.1"],
        "expected_source": "cash_rate",
    },
    {
        "question": "Which bank has the largest deposit base?",
        "expected_contains": ["Commonwealth", "CBA"],
        "expected_source": "apra_banking",
    },
    # Add 20–50 pairs covering all datasets
]
```

### Evaluation metrics

| Metric | Measurement | Tool |
|---|---|---|
| Factual accuracy | % golden pairs answered correctly | Custom eval script |
| Latency | P50/P95 response time | Prometheus histogram |
| Tool call efficiency | Avg pandas operations per answer | Count from intermediate_steps |
| Hallucination rate | % answers with fabricated figures | Human review on random sample |
| Follow-up relevance | % follow-ups clicked by users | Frontend analytics |

### Run evaluation

```bash
make eval  # Add to Makefile
# Runs golden dataset against live agent, reports accuracy
```

---

## Model Upgrade Path

| Phase | LLM | Capability | Cost |
|---|---|---|---|
| Current (v1) | Llama 3.3 70B (Groq) | Strong reasoning, fast | Free |
| Phase 2 | Llama 3.3 70B + RAG | Document-grounded answers | Free |
| Phase 3 | Domain fine-tuned Llama | AU banking specialisation | Training cost only |
| Production | Azure OpenAI / Bedrock | Enterprise SLA, AU data residency | Paid |

### Fine-tuning roadmap (Phase 3)

Fine-tuning a Llama model on Australian financial domain data would improve:
- Terminology accuracy (RBA-specific language, APRA prudential standards)
- Data format understanding (ABS time series formats, APRA table conventions)
- Regulatory awareness (CPS 234, NCCP Act, Corporations Act references)

**Data requirements:**
- ~1,000–5,000 Q&A pairs from RBA, ABS, APRA publications
- Westpac annual reports, investor presentations
- APRA prudential standards documents
- Supervised annotation of correct vs incorrect answers

**Free fine-tuning options:**
- Hugging Face AutoTrain (small models, free tier)
- Google Colab (T4 GPU, free)
- Unsloth (efficient LoRA fine-tuning on consumer GPUs)

---

## Immediate Next Steps (Priority Order)

| Priority | Action | Effort | Impact |
|---|---|---|---|
| 1 | Add `/api/admin/refresh-cache` endpoint | 2h | High — enables on-demand data updates |
| 2 | Implement APRA live data fetch | 4h | High — replaces static snapshot |
| 3 | Add thumbs up/down feedback UI | 4h | High — builds evaluation dataset |
| 4 | Build FAISS index for RBA Statement on Monetary Policy | 1 day | High — grounds answers in policy documents |
| 5 | Add Budget PDF to RAG index | 4h | Medium — adds fiscal context |
| 6 | Write 20 golden Q&A test pairs | 1 day | Medium — enables regression testing |
| 7 | Add few-shot examples to agent prompt | 4h | Medium — improves accuracy |
| 8 | Implement ChromaDB persistent memory | 2 days | Medium — cross-session recall |
| 9 | Add prompt evaluation framework | 2 days | Low — needed before major prompt changes |
| 10 | Explore Llama fine-tuning on AU financial data | 2 weeks | High (long-term) |

---

## Developer Reference: Key Files

| File | Purpose | Edit when |
|---|---|---|
| `backend/agents/data_analyst.py` | Main agent + session memory | Adding datasets, changing prompt, improving follow-ups |
| `backend/agents/memory_store.py` | Session memory store | Changing TTL, storage backend |
| `backend/agents/insights_chain.py` | Insights LLMChain | Changing insight structure, adding sections |
| `backend/utils/llm.py` | LLM singleton | Switching model provider or model version |
| `backend/data/fetchers/` | Data source modules | Adding new data sources |
| `backend/data/fetchers/budget_fetcher.py` | Budget data | After each Budget / MYEFO release |
| `backend/data/fetchers/rba_schedule_fetcher.py` | RBA meeting dates | At start of each year when RBA publishes schedule |

---

## User Guide: Understanding AI Responses

### What "Show reasoning" shows

The collapsible "Show reasoning" panel in the AI Analyst displays the actual Python pandas code that the LangChain agent wrote and executed. For example:

```python
# What you might see in the reasoning panel:
dfs[0].sort_values('date').tail(1)[['date','rate']]
# → This is the agent looking up the latest cash rate
```

This is useful for:
- **Verifying accuracy**: You can check the agent's logic
- **Debugging**: If the answer is wrong, the code shows why
- **Learning**: See how financial questions translate to data operations

### What "Follow-up" suggestions are based on

Follow-up suggestions are generated by the system based on keywords in your question and the answer. They are:
- Not personalised to your specific data context
- Not generated by the LLM (they are rule-based, to avoid extra API calls)
- Intended as prompts to help you explore related topics

To get better follow-up suggestions, phrase your questions more specifically (e.g., "westpac" instead of "the bank").

### When to use AI Analyst vs Insights

| Use case | Recommended feature |
|---|---|
| Specific data lookup ("What is X?") | AI Analyst |
| Comparisons ("Which bank has higher X?") | AI Analyst |
| Trend analysis over time | AI Analyst |
| Executive summary of current conditions | Insights |
| Preparing for a presentation | Insights (then refine in Analyst) |
| Understanding macro context | Insights |
