import { Area, AreaChart, XAxis, YAxis, CartesianGrid } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import type { EmploymentPoint } from "@/types/api";

interface Props {
  data: EmploymentPoint[] | undefined;
  isLoading: boolean;
}

const chartConfig = {
  employed_thousands: {
    label: "Employed (thousands)",
    color: "hsl(145 60% 45%)",
  },
};

export function EmploymentChart({ data, isLoading }: Props) {
  if (isLoading) return <Skeleton className="h-64 w-full" />;

  const chartData = (data ?? []).map((d) => ({
    date: d.date.slice(0, 7),
    employed_thousands: d.employed_thousands,
  }));

  const tickIndices = new Set(
    chartData.map((_, i) => i).filter((i) => i % Math.max(1, Math.floor(chartData.length / 8)) === 0),
  );

  const minVal = Math.min(...chartData.map((d) => d.employed_thousands)) * 0.995;

  return (
    <ChartContainer config={chartConfig} className="h-64 w-full">
      <AreaChart data={chartData} margin={{ top: 8, right: 16, left: -8, bottom: 0 }}>
        <defs>
          <linearGradient id="empGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(145 60% 45%)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="hsl(145 60% 45%)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v, i) => (tickIndices.has(i) ? v : "")}
        />
        <YAxis
          domain={[minVal, "auto"]}
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `${Math.round(v / 1000)}M`}
          width={42}
        />
        <ChartTooltip
          content={<ChartTooltipContent />}
          formatter={(v) => [`${Number(v).toLocaleString()}k`, "Employed"]}
        />
        <Area
          type="monotone"
          dataKey="employed_thousands"
          stroke="hsl(145 60% 45%)"
          strokeWidth={2}
          fill="url(#empGrad)"
          dot={false}
        />
      </AreaChart>
    </ChartContainer>
  );
}
