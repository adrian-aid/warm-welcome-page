"""Chat API route — LangChain data analyst agent with session memory."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from backend.agents.data_analyst import ask_analyst, clear_session

router = APIRouter(prefix="/api", tags=["chat"])


class Message(BaseModel):
    role: str  # "user" | "assistant"
    content: str


class ChatRequest(BaseModel):
    message: str
    session_id: str | None = None        # UUID generated client-side, persists session memory
    history: list[Message] = []          # Fallback: frontend sends its own history


class ChatResponse(BaseModel):
    answer: str
    steps: list[str]
    demo_mode: bool
    followups: list[str] = []            # Suggested follow-up questions


class ClearRequest(BaseModel):
    session_id: str


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Ask the LangChain pandas agent a question about Australian economic data.

    Pass `session_id` (a UUID4 string) to enable cross-turn memory.
    The backend stores the last 20 turns per session; sessions expire after
    60 minutes of inactivity.

    Datasets available to the agent:
    - RBA cash rate history
    - ABS CPI, employment, GDP
    - APRA major bank statistics
    - ASX bank stock prices
    """
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    try:
        history = [{"role": m.role, "content": m.content} for m in request.history]
        result = ask_analyst(
            question=request.message,
            session_id=request.session_id,
            history=history,
        )
        return ChatResponse(**result)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/chat/clear")
async def clear_chat(request: ClearRequest):
    """Clear conversation memory for a session."""
    if not request.session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    clear_session(request.session_id)
    return {"status": "cleared", "session_id": request.session_id}
