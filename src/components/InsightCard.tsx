import { Clock, Database, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Props {
  insights: string;
  generatedAt: string;
  demoMode: boolean;
  dataSources: string[];
}

function renderMarkdown(text: string) {
  // Simple bold (**text**) and bullet conversion for the insight text
  const lines = text.split("\n");
  return lines.map((line, i) => {
    const boldLine = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    if (boldLine.startsWith("•")) {
      return (
        <li
          key={i}
          className="ml-4 list-disc text-sm text-muted-foreground leading-relaxed"
          dangerouslySetInnerHTML={{ __html: boldLine.slice(1).trim() }}
        />
      );
    }
    if (boldLine.trim() === "") return <div key={i} className="h-2" />;
    return (
      <p
        key={i}
        className="text-sm leading-relaxed"
        dangerouslySetInnerHTML={{ __html: boldLine }}
      />
    );
  });
}

export function InsightCard({ insights, generatedAt, demoMode, dataSources }: Props) {
  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Sparkles className="h-4 w-4 text-primary" />
            Executive Insight Report
          </CardTitle>
          <div className="flex items-center gap-2">
            {demoMode && (
              <Badge variant="outline" className="text-xs text-muted-foreground">
                Demo
              </Badge>
            )}
            <Badge variant="secondary" className="flex items-center gap-1 text-xs">
              <Clock className="h-3 w-3" />
              {generatedAt}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {renderMarkdown(insights)}

        {/* Data sources */}
        <div className="mt-4 border-t border-border pt-3">
          <p className="mb-1.5 flex items-center gap-1 text-xs font-medium text-muted-foreground">
            <Database className="h-3 w-3" />
            Data sources
          </p>
          <div className="flex flex-wrap gap-1">
            {dataSources.map((src) => (
              <Badge key={src} variant="outline" className="text-xs text-muted-foreground">
                {src}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
