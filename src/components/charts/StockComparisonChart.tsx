import { Line, LineChart, XAxis, YAxis, CartesianGrid } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import type { StockPoint } from "@/types/api";

interface Props {
  data: Record<string, StockPoint[]> | undefined;
  tickers: string[];
  isLoading: boolean;
}

const TICKER_COLORS: Record<string, string> = {
  "WBC.AX": "hsl(var(--primary))",
  "CBA.AX": "hsl(35 90% 50%)",
  "NAB.AX": "hsl(200 80% 55%)",
  "ANZ.AX": "hsl(145 60% 45%)",
  "MQG.AX": "hsl(270 60% 65%)",
};

const TICKER_NAMES: Record<string, string> = {
  "WBC.AX": "Westpac",
  "CBA.AX": "CommBank",
  "NAB.AX": "NAB",
  "ANZ.AX": "ANZ",
  "MQG.AX": "Macquarie",
};

export function StockComparisonChart({ data, tickers, isLoading }: Props) {
  if (isLoading) return <Skeleton className="h-72 w-full" />;
  if (!data || tickers.length === 0) return null;

  // Merge all tickers into a single date-keyed array
  const dateMap: Record<string, Record<string, number>> = {};
  for (const ticker of tickers) {
    const points = data[ticker] ?? [];
    // Normalise to base-100 for comparison
    const first = points[0]?.close ?? 1;
    for (const p of points) {
      if (!dateMap[p.date]) dateMap[p.date] = {};
      dateMap[p.date][ticker] = parseFloat(((p.close / first) * 100).toFixed(2));
    }
  }

  const chartData = Object.entries(dateMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, values]) => ({ date: date.slice(0, 7), ...values }));

  // Deduplicate by month
  const seen = new Set<string>();
  const deduped = chartData.filter((d) => {
    if (seen.has(d.date)) return false;
    seen.add(d.date);
    return true;
  });

  const chartConfig = Object.fromEntries(
    tickers.map((t) => [
      t,
      { label: TICKER_NAMES[t] ?? t, color: TICKER_COLORS[t] ?? "hsl(var(--primary))" },
    ]),
  );

  const tickIndices = new Set(
    deduped.map((_, i) => i).filter((i) => i % Math.max(1, Math.floor(deduped.length / 6)) === 0),
  );

  return (
    <ChartContainer config={chartConfig} className="h-72 w-full">
      <LineChart data={deduped} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v, i) => (tickIndices.has(i) ? v : "")}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `${v}`}
          width={42}
        />
        <ChartTooltip
          content={<ChartTooltipContent />}
          formatter={(v, name) => [`${v} (indexed)`, TICKER_NAMES[name as string] ?? name]}
        />
        <ChartLegend content={<ChartLegendContent />} />
        {tickers.map((ticker) => (
          <Line
            key={ticker}
            type="monotone"
            dataKey={ticker}
            stroke={TICKER_COLORS[ticker] ?? "hsl(var(--primary))"}
            strokeWidth={ticker === "WBC.AX" ? 2.5 : 1.5}
            dot={false}
            activeDot={{ r: 3 }}
          />
        ))}
      </LineChart>
    </ChartContainer>
  );
}
