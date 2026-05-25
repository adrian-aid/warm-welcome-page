import { useQuery } from "@tanstack/react-query";
import { ExternalLink, TrendingUp, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StockComparisonChart } from "@/components/charts/StockComparisonChart";
import { getAPRAStats, getBankStocks, getNews } from "@/services/api";

const STALE = 5 * 60 * 1000;

function useAPRA() {
  return useQuery({
    queryKey: ["banking", "apra"],
    queryFn: getAPRAStats,
    staleTime: STALE,
    select: (r) => r.data,
  });
}

function useStocks() {
  return useQuery({
    queryKey: ["banking", "stocks"],
    queryFn: getBankStocks,
    staleTime: STALE,
  });
}

function useNews() {
  return useQuery({
    queryKey: ["news"],
    queryFn: getNews,
    staleTime: STALE,
    select: (r) => r.data,
  });
}

const SOURCE_COLORS: Record<string, string> = {
  RBA: "hsl(var(--primary))",
  APRA: "hsl(35 90% 50%)",
  ASIC: "hsl(270 60% 65%)",
  "ABC Business": "hsl(200 80% 55%)",
};

export default function Banking() {
  const { data: apra, isLoading: apraLoading, isError: apraError } = useAPRA();
  const { data: stocks, isLoading: stocksLoading, isError: stocksError } = useStocks();
  const { data: news, isLoading: newsLoading } = useNews();

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
      <Tabs defaultValue="stocks">
        <TabsList className="mb-4">
          <TabsTrigger value="stocks">Bank Stocks</TabsTrigger>
          <TabsTrigger value="apra">APRA Statistics</TabsTrigger>
          <TabsTrigger value="westpac">Westpac Focus</TabsTrigger>
          <TabsTrigger value="news">News Feed</TabsTrigger>
        </TabsList>

        {/* ── Stocks ── */}
        <TabsContent value="stocks">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">
                ASX Bank Stock Performance — 6 Month (Base 100)
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Indexed to 100 at start of window. Westpac (WBC.AX) shown with heavier line.
              </p>
              {stocksError && (
                <div className="flex items-center gap-1 text-xs text-destructive">
                  <AlertCircle className="h-3 w-3" />
                  Using synthetic fallback data
                </div>
              )}
            </CardHeader>
            <CardContent className="pb-4">
              {stocksLoading ? (
                <Skeleton className="h-72 w-full" />
              ) : (
                <StockComparisonChart
                  data={stocks?.data}
                  tickers={stocks?.tickers ?? []}
                  isLoading={false}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── APRA ── */}
        <TabsContent value="apra">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">
                Major ADI Balance Sheet Summary (A$B)
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Source: APRA Monthly Authorised Deposit-taking Institution Statistics
              </p>
            </CardHeader>
            <CardContent>
              {apraLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : apraError ? (
                <p className="text-sm text-destructive">Failed to load APRA data</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Institution</TableHead>
                      <TableHead className="text-right">Total Assets</TableHead>
                      <TableHead className="text-right">Gross Loans</TableHead>
                      <TableHead className="text-right">Deposits</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(apra ?? []).map((row) => (
                      <TableRow
                        key={row.institution}
                        className={row.institution === "Westpac" ? "bg-primary/5" : ""}
                      >
                        <TableCell className="font-medium">
                          {row.institution}
                          {row.institution === "Westpac" && (
                            <Badge className="ml-2 text-xs" variant="outline">
                              WBC
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          ${row.total_assets_b.toFixed(1)}B
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          ${row.gross_loans_b.toFixed(1)}B
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          ${row.total_deposits_b.toFixed(1)}B
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Westpac Focus ── */}
        <TabsContent value="westpac">
          <div className="grid gap-4 sm:grid-cols-2">
            {/* APRA spotlight */}
            <Card className="border-primary/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-primary">
                  Westpac — APRA Snapshot
                </CardTitle>
              </CardHeader>
              <CardContent>
                {apraLoading ? (
                  <Skeleton className="h-32 w-full" />
                ) : (
                  (() => {
                    const wbc = (apra ?? []).find((r) => r.institution === "Westpac");
                    const cba = (apra ?? []).find((r) => r.institution === "Commonwealth Bank");
                    if (!wbc) return <p className="text-sm text-muted-foreground">No data</p>;
                    const loanShare = cba ? ((wbc.gross_loans_b / cba.gross_loans_b) * 100).toFixed(1) : null;
                    return (
                      <dl className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Total Assets</dt>
                          <dd className="font-semibold">${wbc.total_assets_b.toFixed(1)}B</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Gross Loans</dt>
                          <dd className="font-semibold">${wbc.gross_loans_b.toFixed(1)}B</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Total Deposits</dt>
                          <dd className="font-semibold">${wbc.total_deposits_b.toFixed(1)}B</dd>
                        </div>
                        {loanShare && (
                          <div className="flex justify-between border-t border-border pt-2">
                            <dt className="text-muted-foreground">Loans vs CBA</dt>
                            <dd className="font-semibold text-muted-foreground">{loanShare}% of CBA</dd>
                          </div>
                        )}
                      </dl>
                    );
                  })()
                )}
              </CardContent>
            </Card>

            {/* Strategic context */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Strategic Context
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>Westpac is Australia's second-largest bank by assets and one of the "Big Four", alongside CBA, NAB, and ANZ.</p>
                <p>Key strategic priorities include mortgage book quality management, deposit repricing as the RBA easing cycle progresses, and digital customer acquisition.</p>
                <p>Macquarie Bank's growing retail lending presence represents an emerging competitive pressure beyond the traditional Big Four.</p>
                <p className="text-xs mt-3">
                  <a
                    href="https://www.westpac.com.au/about-westpac/investor-centre/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    Westpac Investor Centre
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── News ── */}
        <TabsContent value="news">
          <div className="space-y-3">
            {newsLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))
              : (news ?? []).map((item, i) => (
                  <Card key={i} className="transition-colors hover:border-primary/30">
                    <CardContent className="py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium leading-snug hover:text-primary hover:underline line-clamp-2"
                          >
                            {item.title}
                          </a>
                          {item.summary && (
                            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                              {item.summary.replace(/<[^>]+>/g, "")}
                            </p>
                          )}
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1">
                          <Badge
                            variant="outline"
                            className="text-xs"
                            style={{ color: SOURCE_COLORS[item.source] ?? undefined }}
                          >
                            {item.source}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{item.date}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
