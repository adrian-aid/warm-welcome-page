import { useState, useCallback, useRef } from "react";
import { sendChatMessage, clearChatSession } from "@/services/api";
import type { ChatMessage } from "@/types/api";

export interface ChatEntry {
  role: "user" | "assistant";
  content: string;
  steps?: string[];
  demo_mode?: boolean;
  followups?: string[];
  isLoading?: boolean;
}

/** Generate or retrieve a stable session ID for this browser session. */
function getOrCreateSessionId(): string {
  const key = "aus_banking_session_id";
  let id = sessionStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(key, id);
  }
  return id;
}

export function useChat() {
  const [messages, setMessages] = useState<ChatEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sessionIdRef = useRef<string>(getOrCreateSessionId());

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;

      setError(null);
      const userEntry: ChatEntry = { role: "user", content: text };

      // Optimistically add user message + loading placeholder
      setMessages((prev) => [
        ...prev,
        userEntry,
        { role: "assistant", content: "", isLoading: true },
      ]);
      setIsLoading(true);

      try {
        // Build history from current messages (excluding loading placeholder)
        const history: ChatMessage[] = messages
          .filter((m) => !m.isLoading)
          .map((m) => ({ role: m.role, content: m.content }));

        const response = await sendChatMessage(
          text,
          sessionIdRef.current,
          history,
        );

        setMessages((prev) => [
          ...prev.slice(0, -1), // remove loading placeholder
          {
            role: "assistant",
            content: response.answer,
            steps: response.steps,
            demo_mode: response.demo_mode,
            followups: response.followups,
          },
        ]);
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Failed to get a response";
        setError(msg);
        setMessages((prev) => [
          ...prev.slice(0, -1),
          {
            role: "assistant",
            content: `⚠️ ${msg}\n\nCheck that the backend is running: \`make backend\` or \`uvicorn backend.main:app --port 8000\``,
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [messages, isLoading],
  );

  const clearMessages = useCallback(async () => {
    // Clear server-side memory for this session
    try {
      await clearChatSession(sessionIdRef.current);
    } catch {
      // Non-critical — clear UI regardless
    }
    // Reset session ID so the next conversation starts fresh
    const newId = crypto.randomUUID();
    sessionStorage.setItem("aus_banking_session_id", newId);
    sessionIdRef.current = newId;
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
    sessionId: sessionIdRef.current,
  };
}
