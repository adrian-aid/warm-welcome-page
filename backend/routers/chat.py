"""Chat API route — LangChain data analyst agent."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from backend.agents.data_analyst import ask_analyst

router = APIRouter(prefix="/api", tags=["chat"])


class Message(BaseModel):
    role: str  # "user" | "assistant"
    content: str


class ChatRequest(BaseModel):
    message: str
    history: list[Message] = []


class ChatResponse(BaseModel):
    answer: str
    steps: list[str]
    demo_mode: bool


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Ask the LangChain pandas agent a question about Australian economic data.

    The agent has access to:
    - RBA cash rate history
    - ABS CPI, employment, GDP data
    - APRA major bank statistics
    - ASX bank stock prices
    """
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    try:
        history = [{"role": m.role, "content": m.content} for m in request.history]
        result = ask_analyst(request.message, history)
        return ChatResponse(**result)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
