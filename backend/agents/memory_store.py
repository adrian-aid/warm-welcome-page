"""
Session-based conversation memory store.

Maintains per-session conversation history in memory so the LangChain
agent can reference previous turns in the same chat session.

Design:
  - Session IDs are UUID4 strings generated client-side
  - History is stored as a list of {question, answer, timestamp} dicts
  - Sessions expire after SESSION_TTL_MINUTES of inactivity
  - Max MAX_TURNS per session to bound memory usage
  - Thread-safe via a simple lock (suitable for single-worker uvicorn)

For production: replace with Redis (TTL-based expiry, multi-worker safe).
"""
import logging
import time
import threading
from datetime import datetime
from collections import deque

logger = logging.getLogger(__name__)

SESSION_TTL_MINUTES = 60   # Sessions expire after 60 min of inactivity
MAX_TURNS = 20              # Max conversation turns kept per session
MAX_SESSIONS = 500          # Evict oldest if exceeded


class MemoryStore:
    """In-process session memory store with TTL eviction."""

    def __init__(self):
        self._sessions: dict[str, dict] = {}
        self._lock = threading.Lock()

    def _evict_expired(self):
        """Remove sessions that have been inactive beyond TTL."""
        cutoff = time.time() - SESSION_TTL_MINUTES * 60
        expired = [sid for sid, s in self._sessions.items() if s["last_access"] < cutoff]
        for sid in expired:
            del self._sessions[sid]
        if expired:
            logger.debug(f"Evicted {len(expired)} expired sessions")

    def get_history(self, session_id: str) -> list[dict]:
        """Return conversation history for session_id, or []."""
        with self._lock:
            self._evict_expired()
            session = self._sessions.get(session_id)
            if session is None:
                return []
            session["last_access"] = time.time()
            return list(session["turns"])

    def add_turn(self, session_id: str, question: str, answer: str, steps: list[str]):
        """Append a question/answer turn to the session history."""
        with self._lock:
            if session_id not in self._sessions:
                # Evict oldest if at capacity
                if len(self._sessions) >= MAX_SESSIONS:
                    oldest = min(self._sessions, key=lambda k: self._sessions[k]["last_access"])
                    del self._sessions[oldest]
                    logger.warning(f"Session store at capacity — evicted oldest session")
                self._sessions[session_id] = {
                    "turns": deque(maxlen=MAX_TURNS),
                    "created": time.time(),
                    "last_access": time.time(),
                }
            session = self._sessions[session_id]
            session["turns"].append({
                "question": question,
                "answer": answer,
                "steps": steps,
                "timestamp": datetime.now().isoformat(),
            })
            session["last_access"] = time.time()

    def clear_session(self, session_id: str):
        """Clear history for a session (used by the 'Clear' button)."""
        with self._lock:
            self._sessions.pop(session_id, None)

    def session_stats(self) -> dict:
        """Return current store stats for the /health endpoint."""
        with self._lock:
            return {
                "active_sessions": len(self._sessions),
                "max_sessions": MAX_SESSIONS,
                "ttl_minutes": SESSION_TTL_MINUTES,
            }


# Module-level singleton — shared across all requests in the process
memory_store = MemoryStore()
