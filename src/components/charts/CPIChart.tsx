import { Line, LineChart, XAxis, YAxis, CartesianGrid, ReferenceLine } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import type { CPIPoint } from "@/types/api";

interface Props {
  data: CPIPoint[] | undefined;
  isLoading: boolean;
}

const chartConfig = {
  yoy_change: {
    label: "CPI YoY %",
    color: "hsl(35 90% 50%)",
  },
};

export function CPIChart({ data, isLoading }: Props) {
  if (isLoading) return <Skeleton className="h-64 w-full" />;

  const chartData = (data ?? [])
    .filter((d) => d.yoy_change !== null && d.yoy_change !== undefined)
    .map((d) => ({
      date: d.date.slice(0, 7),
      yoy_change: Number(d.yoy_change.toFixed(1)),
    }));

  const tickIndices = new Set(
    chartData.map((_, i) => i).filter((i) => i % Math.max(1, Math.floor(chartData.length / 8)) === 0),
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
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `${v}%`}
          width={42}
        />
        <ChartTooltip content={<ChartTooltipContent />} formatter={(v) => [`${v}%`, "CPI YoY"]} />
        {/* RBA target band */}
        <ReferenceLine y={2} stroke="hsl(var(--primary))" strokeDasharray="4 4" strokeOpacity={0.6} label={{ value: "2%", position: "right", fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
        <ReferenceLine y={3} stroke="hsl(var(--primary))" strokeDasharray="4 4" strokeOpacity={0.6} label={{ value: "3%", position: "right", fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
        <Line
          type="monotone"
          dataKey="yoy_change"
          stroke="hsl(35 90% 50%)"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ChartContainer>
  );
}
