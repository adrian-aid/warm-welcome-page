import { Bot } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChatInterface } from "@/components/ChatInterface";
import { useChat } from "@/hooks/useChat";

const EXAMPLE_PROMPTS = [
  "What is the current RBA cash rate?",
  "Compare Westpac and CBA by total assets",
  "What was the peak inflation rate and when did it occur?",
  "How has employment changed over the last 2 years?",
  "Which bank has the highest deposit base?",
  "What is the GDP growth trend over the past year?",
];

export default function AIAnalyst() {
  const { messages, isLoading, sendMessage, clearMessages } = useChat();

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6">
      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        {/* Chat panel */}
        <Card className="flex flex-col" style={{ height: "calc(100vh - 140px)", minHeight: 520 }}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Bot className="h-4 w-4 text-primary" />
                AI Data Analyst
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  LangChain + Llama 3.3 70B
                </Badge>
                {messages.length > 0 && (
                  <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={clearMessages}>
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col overflow-hidden pb-4">
            <ChatInterface
              messages={messages}
              isLoading={isLoading}
              onSend={sendMessage}
            />
          </CardContent>
        </Card>

        {/* Sidebar — example prompts + context */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Example Questions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {EXAMPLE_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  disabled={isLoading}
                  className="w-full rounded-md border border-border bg-muted/30 px-3 py-2 text-left text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-foreground disabled:opacity-50"
                >
                  {prompt}
                </button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Available Datasets</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                <li>• RBA Cash Rate history</li>
                <li>• ABS CPI (quarterly)</li>
                <li>• ABS Employment (monthly)</li>
                <li>• ABS GDP growth</li>
                <li>• APRA major bank balance sheets</li>
                <li>• ASX bank stock prices</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
