import { useState } from "react";
import { RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InsightCard } from "@/components/InsightCard";
import { getInsights } from "@/services/api";
import type { InsightsResponse } from "@/types/api";

export default function Insights() {
  const [insights, setInsights] = useState<InsightsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getInsights();
      setInsights(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to generate insights — ensure the backend is running.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold">Executive Insights</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          LangChain LLMChain generates a Westpac-framed narrative analysis of
          current Australian macroeconomic conditions. Results are cached for 1 hour.
        </p>
      </div>

      {/* Generate button */}
      <Button onClick={handleGenerate} disabled={isLoading} className="w-full sm:w-auto">
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating insights…
          </>
        ) : (
          <>
            <RefreshCw className="mr-2 h-4 w-4" />
            {insights ? "Regenerate Insights" : "Generate Insights"}
          </>
        )}
      </Button>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Results */}
      {insights && (
        <InsightCard
          insights={insights.insights}
          generatedAt={insights.generated_at}
          demoMode={insights.demo_mode}
          dataSources={insights.data_sources}
        />
      )}

      {/* Empty state */}
      {!insights && !isLoading && !error && (
        <div className="rounded-lg border border-dashed border-border py-16 text-center text-muted-foreground">
          <p className="text-sm">
            Click <span className="text-foreground">Generate Insights</span> to produce an
            AI-generated executive analysis.
          </p>
        </div>
      )}
    </div>
  );
}
