import { Line, LineChart, XAxis, YAxis, CartesianGrid, ReferenceLine } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import type { CashRatePoint } from "@/types/api";

interface Props {
  data: CashRatePoint[] | undefined;
  isLoading: boolean;
}

const chartConfig = {
  rate: {
    label: "Cash Rate %",
    color: "hsl(var(--primary))",
  },
};

export function CashRateChart({ data, isLoading }: Props) {
  if (isLoading) return <Skeleton className="h-64 w-full" />;

  const chartData = (data ?? []).map((d) => ({
    date: d.date.slice(0, 7), // YYYY-MM
    rate: d.rate,
  }));

  // Show every 6th label to avoid crowding
  const tickIndices = new Set(
    chartData
      .map((_, i) => i)
      .filter((i) => i % Math.max(1, Math.floor(chartData.length / 8)) === 0),
  );

  return (
    <ChartContainer config={chartConfig} className="h-64 w-full">
      <LineChart data={chartData} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v, i) => (tickIndices.has(i) ? v : "")}
        />
        <YAxis
          domain={["auto", "auto"]}
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `${v}%`}
          width={42}
        />
        <ChartTooltip content={<ChartTooltipContent />} formatter={(v) => [`${v}%`, "Cash Rate"]} />
        <ReferenceLine y={2.5} stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" strokeOpacity={0.5} />
        <Line
          type="stepAfter"
          dataKey="rate"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: "hsl(var(--primary))" }}
        />
      </LineChart>
    </ChartContainer>
  );
}
