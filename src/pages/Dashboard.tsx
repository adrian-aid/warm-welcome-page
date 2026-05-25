import {
  TrendingUp,
  TrendingDown,
  Minus,
  Percent,
  Users,
  DollarSign,
  Calendar,
  FileText,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CashRateChart } from "@/components/charts/CashRateChart";
import { CPIChart } from "@/components/charts/CPIChart";
import { EmploymentChart } from "@/components/charts/EmploymentChart";
import {
  useDashboardSummary,
  useCashRate,
  useCPI,
  useEmployment,
  useRBASchedule,
  useBudget,
} from "@/hooks/useDashboardData";
import type { KPIValue } from "@/types/api";

// ─── Trend arrow helper ────────────────────────────────────────────────────────
function TrendIcon({ trend, positive }: { trend?: string | null; positive?: "up" | "down" }) {
  if (!trend || trend === "flat") return <Minus className="h-3 w-3 text-muted-foreground" />;
  const isGood =
    positive === "up" ? trend === "up" :
    positive === "down" ? trend === "down" :
    true;
  if (trend === "up") return <TrendingUp className={`h-3 w-3 ${isGood ? "text-green-400" : "text-red-400"}`} />;
  return <TrendingDown className={`h-3 w-3 ${isGood ? "text-green-400" : "text-red-400"}`} />;
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KPICard({
  kpi,
  icon: Icon,
  color,
  trendPositive,
  description,
}: {
  kpi: (KPIValue & { trend?: string; description?: string }) | undefined;
  icon: React.ElementType;
  color: string;
  trendPositive?: "up" | "down";
  description?: string;
}) {
  if (!kpi) return <Skeleton className="h-28 w-full rounded-xl" />;
  const value =
    kpi.value !== null && kpi.value !== undefined
      ? `${typeof kpi.value === "number" && kpi.unit === "k"
          ? kpi.value.toLocaleString()
          : kpi.value}${kpi.unit}`
      : "—";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Card className="group cursor-default transition-all duration-200 hover:border-primary/40 hover:shadow-md">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground truncate">{kpi.label}</p>
                <p className="mt-1 text-2xl font-bold tracking-tight" style={{ color }}>
                  {value}
                </p>
                <div className="mt-1 flex items-center gap-1.5">
                  <TrendIcon trend={kpi.trend} positive={trendPositive} />
                  {kpi.date && (
                    <p className="text-xs text-muted-foreground">
                      {kpi.date.slice(0, 7)}
                    </p>
                  )}
                </div>
              </div>
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-110"
                style={{ background: `${color}18` }}
              >
                <Icon className="h-4 w-4" style={{ color }} />
              </div>
            </div>
          </CardContent>
        </Card>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-48 text-xs">
        {kpi.description || description || kpi.label}
      </TooltipContent>
    </Tooltip>
  );
}

// ─── RBA Countdown widget ─────────────────────────────────────────────────────
function RBACountdown() {
  const { data: schedule, isLoading } = useRBASchedule();

  if (isLoading) return <Skeleton className="h-16 w-full rounded-xl" />;
  if (!schedule) return null;

  const next = schedule.next_meeting;
  const last = schedule.last_meeting;
  const urgency =
    next && next.days_until <= 7
      ? "border-primary/60 bg-primary/8"
      : next && next.days_until <= 21
      ? "border-amber-500/40 bg-amber-500/5"
      : "border-border";

  return (
    <Card className={`${urgency} transition-colors`}>
      <CardContent className="py-3 px-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* Next meeting */}
          {next && (
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/15">
                <Calendar className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Next RBA Decision</p>
                <p className="text-sm font-semibold">
                  {next.date}{" "}
                  <span className="text-primary">
                    ({next.days_until === 0 ? "today" : `${next.days_until}d`})
                  </span>
                </p>
              </div>
            </div>
          )}

          {/* Divider */}
          <div className="hidden h-8 w-px bg-border sm:block" />

          {/* Last decision */}
          {last && (
            <div>
              <p className="text-xs text-muted-foreground">Last Decision ({last.date.slice(0, 7)})</p>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={`text-xs font-bold ${
                    last.outcome === "CUT"
                      ? "border-green-500/50 text-green-400"
                      : last.outcome === "HIKE"
                      ? "border-red-500/50 text-red-400"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  {last.outcome ?? "—"}
                </Badge>
                {last.rate_after !== null && (
                  <span className="text-sm font-semibold">{last.rate_after}%</span>
                )}
                {last.notes && (
                  <span className="hidden text-xs text-muted-foreground xl:block truncate max-w-48">
                    {last.notes}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Current rate */}
          {schedule.current_rate !== null && (
            <>
              <div className="hidden h-8 w-px bg-border sm:block" />
              <div>
                <p className="text-xs text-muted-foreground">Current Rate</p>
                <p className="text-lg font-bold text-primary">{schedule.current_rate}%</p>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Budget banner ────────────────────────────────────────────────────────────
function BudgetBanner() {
  const { data: budget, isLoading } = useBudget();
  if (isLoading) return null;
  if (!budget) return null;

  const b = budget.current_budget;
  const isDeficit = b.fiscal_position.underlying_cash_balance_b < 0;

  return (
    <Card className="border-border/60 bg-muted/20">
      <CardContent className="py-3 px-4">
        <div className="flex flex-wrap items-start gap-x-6 gap-y-2">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-xs font-semibold text-foreground">
              Budget {b.budget_year}
            </span>
            <Badge variant="outline" className="text-xs text-muted-foreground">
              {b.delivered_date}
            </Badge>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
            <span>
              <span className={`font-semibold ${isDeficit ? "text-amber-400" : "text-green-400"}`}>
                {isDeficit ? "Deficit" : "Surplus"} ${Math.abs(b.fiscal_position.underlying_cash_balance_b).toFixed(1)}B
              </span>{" "}
              ({b.fiscal_position.net_debt_pct_gdp}% GDP net debt)
            </span>
            <span>GDP forecast: <span className="text-foreground font-medium">{b.economic_forecasts.gdp_growth_pct}%</span></span>
            <span>CPI forecast: <span className="text-foreground font-medium">{b.economic_forecasts.cpi_pct}%</span></span>
            <span>Unemployment: <span className="text-foreground font-medium">{b.economic_forecasts.unemployment_pct}%</span></span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Data freshness indicator ─────────────────────────────────────────────────
function FreshnessBar() {
  const sources = [
    { label: "RBA", refresh: "24h", source: "rba.gov.au" },
    { label: "ABS CPI/Employment/GDP", refresh: "24h", source: "abs.gov.au" },
    { label: "APRA Banking", refresh: "24h", source: "apra.gov.au" },
    { label: "ASX Stocks", refresh: "6h", source: "Yahoo Finance" },
    { label: "News", refresh: "2h", source: "RSS feeds" },
  ];
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
      <span className="flex items-center gap-1 font-medium text-foreground/60">
        <RefreshCw className="h-3 w-3" />
        Data refresh:
      </span>
      {sources.map((s) => (
        <Tooltip key={s.label}>
          <TooltipTrigger asChild>
            <span className="cursor-help border-b border-dashed border-muted-foreground/40">
              {s.label} <span className="text-muted-foreground/60">({s.refresh})</span>
            </span>
          </TooltipTrigger>
          <TooltipContent className="text-xs">{s.source}</TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}

// ─── Chart card wrapper ───────────────────────────────────────────────────────
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
          <div className="flex items-center gap-1 text-xs text-amber-400">
            <AlertCircle className="h-3 w-3" />
            Using cached data
          </div>
        )}
      </CardHeader>
      <CardContent className="pb-4">{children}</CardContent>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { data: summary, isLoading: summaryLoading } = useDashboardSummary();
  const { data: cashRate, isLoading: crLoading, isError: crError } = useCashRate();
  const { data: cpi, isLoading: cpiLoading, isError: cpiError } = useCPI();
  const { data: employment, isLoading: empLoading, isError: empError } = useEmployment();

  const kpis = [
    {
      kpi: summaryLoading ? undefined : { ...summary?.cash_rate, trend: (summary as any)?.cash_rate?.trend },
      icon: Percent,
      color: "hsl(var(--primary))",
      trendPositive: "down" as const, // lower rate = easier for borrowers
      description: "Reserve Bank of Australia target cash rate",
    },
    {
      kpi: summaryLoading ? undefined : { ...summary?.cpi, trend: (summary as any)?.cpi?.trend },
      icon: TrendingUp,
      color: "hsl(35 90% 50%)",
      trendPositive: "down" as const, // lower inflation = better
      description: "ABS All Groups CPI year-on-year. RBA target: 2–3%",
    },
    {
      kpi: summaryLoading ? undefined : { ...summary?.employment, trend: (summary as any)?.employment?.trend },
      icon: Users,
      color: "hsl(145 60% 45%)",
      trendPositive: "up" as const, // more employed = better
      description: "Total employed persons (thousands) — ABS Labour Force Survey",
    },
    {
      kpi: summaryLoading ? undefined : { ...summary?.gdp_growth, trend: (summary as any)?.gdp_growth?.trend },
      icon: DollarSign,
      color: "hsl(270 60% 65%)",
      trendPositive: "up" as const,
      description: "Real GDP quarterly growth — ABS National Accounts",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-4 p-4 sm:p-6">
      {/* RBA countdown — most important live indicator */}
      <RBACountdown />

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {kpis.map((k, i) => (
          <KPICard key={i} {...k} />
        ))}
      </div>

      {/* Budget banner */}
      <BudgetBanner />

      {/* Charts grid */}
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <ChartCard
          title="RBA Cash Rate Target"
          subtitle="Reserve Bank of Australia — each step is a board decision"
          isError={crError}
        >
          <CashRateChart data={cashRate} isLoading={crLoading} />
        </ChartCard>

        <ChartCard
          title="CPI Inflation (YoY %)"
          subtitle="ABS All Groups quarterly — dashed lines = 2–3% RBA target band"
          isError={cpiError}
        >
          <CPIChart data={cpi} isLoading={cpiLoading} />
        </ChartCard>

        <ChartCard
          title="Total Employed Persons"
          subtitle="ABS Labour Force — quarterly data points"
          isError={empError}
        >
          <EmploymentChart data={employment} isLoading={empLoading} />
        </ChartCard>
      </div>

      {/* Data freshness footer */}
      <div className="border-t border-border pt-3">
        <FreshnessBar />
      </div>
    </div>
  );
}
