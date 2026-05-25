import { useState, useCallback } from "react";
import { sendChatMessage } from "@/services/api";
import type { ChatMessage } from "@/types/api";

export interface ChatEntry {
  role: "user" | "assistant";
  content: string;
  steps?: string[];
  demo_mode?: boolean;
  isLoading?: boolean;
}

export function useChat() {
  const [messages, setMessages] = useState<ChatEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        const history: ChatMessage[] = messages
          .filter((m) => !m.isLoading)
          .map((m) => ({ role: m.role, content: m.content }));

        const response = await sendChatMessage(text, history);

        setMessages((prev) => [
          ...prev.slice(0, -1), // remove loading placeholder
          {
            role: "assistant",
            content: response.answer,
            steps: response.steps,
            demo_mode: response.demo_mode,
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
            content: `⚠️ Error: ${msg}. Please check that the backend is running.`,
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [messages, isLoading],
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return { messages, isLoading, error, sendMessage, clearMessages };
}
