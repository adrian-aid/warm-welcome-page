import { TrendingUp, Percent, Users, DollarSign, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CashRateChart } from "@/components/charts/CashRateChart";
import { CPIChart } from "@/components/charts/CPIChart";
import { EmploymentChart } from "@/components/charts/EmploymentChart";
import {
  useDashboardSummary,
  useCashRate,
  useCPI,
  useEmployment,
} from "@/hooks/useDashboardData";
import type { KPIValue } from "@/types/api";

function KPICard({ kpi, icon: Icon, color }: { kpi: KPIValue | undefined; icon: React.ElementType; color: string }) {
  if (!kpi) return <Skeleton className="h-28 w-full" />;
  const value = kpi.value !== null && kpi.value !== undefined ? `${kpi.value}${kpi.unit}` : "—";
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{kpi.label}</p>
            <p className="mt-1 text-2xl font-bold" style={{ color }}>{value}</p>
            {kpi.date && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                as of {kpi.date.slice(0, 7)}
              </p>
            )}
          </div>
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg"
            style={{ background: `${color}20` }}
          >
            <Icon className="h-4 w-4" style={{ color }} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
  isError,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  isError?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
        {isError && (
          <div className="flex items-center gap-1 text-xs text-destructive">
            <AlertCircle className="h-3 w-3" />
            Using cached data
          </div>
        )}
      </CardHeader>
      <CardContent className="pb-4">{children}</CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { data: summary, isLoading: summaryLoading } = useDashboardSummary();
  const { data: cashRate, isLoading: crLoading, isError: crError } = useCashRate();
  const { data: cpi, isLoading: cpiLoading, isError: cpiError } = useCPI();
  const { data: employment, isLoading: empLoading, isError: empError } = useEmployment();

  const kpis = [
    {
      kpi: summaryLoading ? undefined : summary?.cash_rate,
      icon: Percent,
      color: "hsl(var(--primary))",
    },
    {
      kpi: summaryLoading ? undefined : summary?.cpi,
      icon: TrendingUp,
      color: "hsl(35 90% 50%)",
    },
    {
      kpi: summaryLoading ? undefined : summary?.employment,
      icon: Users,
      color: "hsl(145 60% 45%)",
    },
    {
      kpi: summaryLoading ? undefined : summary?.gdp_growth,
      icon: DollarSign,
      color: "hsl(270 60% 65%)",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
      {/* Context banner */}
      <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Australian Economic Dashboard</span>
          {" — "}
          Live macro data from RBA, ABS and APRA. Charts update every 24 hours.
          Switch to{" "}
          <span className="text-primary">AI Analyst</span> to query the data in natural language.
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {kpis.map((k, i) => (
          <KPICard key={i} {...k} />
        ))}
      </div>

      {/* Charts grid */}
      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <ChartCard
          title="RBA Cash Rate Target"
          subtitle="Reserve Bank of Australia — monthly"
          isError={crError}
        >
          <CashRateChart data={cashRate} isLoading={crLoading} />
        </ChartCard>

        <ChartCard
          title="CPI Inflation (YoY)"
          subtitle="ABS All Groups quarterly — dashed lines = RBA 2–3% target"
          isError={cpiError}
        >
          <CPIChart data={cpi} isLoading={cpiLoading} />
        </ChartCard>

        <ChartCard
          title="Total Employed Persons"
          subtitle="ABS Labour Force — quarterly"
          isError={empError}
        >
          <EmploymentChart data={employment} isLoading={empLoading} />
        </ChartCard>
      </div>
    </div>
  );
}
