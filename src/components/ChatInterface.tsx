import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, ChevronDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import type { ChatEntry } from "@/hooks/useChat";

interface Props {
  messages: ChatEntry[];
  isLoading: boolean;
  onSend: (text: string) => void;
}

export function ChatInterface({ messages, isLoading, onSend }: Props) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput("");
    onSend(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-full flex-col">
      <ScrollArea className="flex-1 pr-2">
        <div className="space-y-4 pb-4">
          {messages.length === 0 && (
            <div className="py-12 text-center text-muted-foreground">
              <Bot className="mx-auto mb-3 h-10 w-10 opacity-30" />
              <p className="text-sm">Ask anything about Australian economic data</p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
            >
              {/* Avatar */}
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground"
                }`}
              >
                {msg.role === "user" ? (
                  <User className="h-3.5 w-3.5" />
                ) : (
                  <Bot className="h-3.5 w-3.5" />
                )}
              </div>

              {/* Bubble */}
              <div
                className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm ${
                  msg.role === "user"
                    ? "bg-primary/15 text-foreground"
                    : "bg-secondary text-foreground"
                }`}
              >
                {msg.isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : (
                  <>
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>

                    {/* Thinking steps */}
                    {msg.steps && msg.steps.length > 0 && (
                      <Collapsible className="mt-2">
                        <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                          <ChevronDown className="h-3 w-3" />
                          Show reasoning ({msg.steps.length} steps)
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="mt-1.5 space-y-1 rounded-md bg-muted/50 p-2 text-xs text-muted-foreground">
                            {msg.steps.map((step, si) => (
                              <p key={si} className="font-mono leading-snug">{step}</p>
                            ))}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    )}

                    {msg.demo_mode && (
                      <Badge variant="outline" className="mt-2 text-xs opacity-60">
                        Demo mode
                      </Badge>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Input row */}
      <div className="mt-3 flex gap-2 border-t border-border pt-3">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about the cash rate, CPI, bank performance…"
          className="min-h-0 resize-none py-2 text-sm"
          rows={2}
          disabled={isLoading}
        />
        <Button
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          size="sm"
          className="self-end"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
