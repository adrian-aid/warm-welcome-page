"""Groq LLM singleton for LangChain integration."""
import os
from functools import lru_cache
from langchain_groq import ChatGroq


@lru_cache(maxsize=1)
def get_llm(temperature: float = 0.1) -> ChatGroq:
    """Return a cached ChatGroq instance using llama-3.3-70b-versatile."""
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise ValueError(
            "GROQ_API_KEY environment variable not set. "
            "Get a free key at https://console.groq.com/ and add it to backend/.env"
        )
    return ChatGroq(
        api_key=api_key,
        model="llama-3.3-70b-versatile",
        temperature=temperature,
    )
