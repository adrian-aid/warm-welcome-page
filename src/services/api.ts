/**
 * API client layer — all requests go to /api/* which is proxied to the
 * FastAPI backend (http://localhost:8000) via Vite's server.proxy config.
 */
import type {
  CashRatePoint,
  CPIPoint,
  EmploymentPoint,
  GDPPoint,
  DashboardSummary,
  APRAInstitution,
  StockPoint,
  StockSummary,
  NewsItem,
  ChatMessage,
  ChatResponse,
  InsightsResponse,
  RBASchedule,
  BudgetData,
} from "@/types/api";

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => res.statusText);
    throw new ApiError(res.status, detail);
  }
  return res.json() as Promise<T>;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export const getDashboardSummary = (): Promise<DashboardSummary> =>
  apiFetch<DashboardSummary>("/api/dashboard/summary");

export const getCashRate = (): Promise<{ data: CashRatePoint[] }> =>
  apiFetch<{ data: CashRatePoint[] }>("/api/dashboard/cash-rate");

export const getCPI = (): Promise<{ data: CPIPoint[] }> =>
  apiFetch<{ data: CPIPoint[] }>("/api/dashboard/cpi");

export const getEmployment = (): Promise<{ data: EmploymentPoint[] }> =>
  apiFetch<{ data: EmploymentPoint[] }>("/api/dashboard/employment");

export const getGDP = (): Promise<{ data: GDPPoint[] }> =>
  apiFetch<{ data: GDPPoint[] }>("/api/dashboard/gdp");

// ─── Banking ──────────────────────────────────────────────────────────────────

export const getAPRAStats = (): Promise<{ data: APRAInstitution[] }> =>
  apiFetch<{ data: APRAInstitution[] }>("/api/banking/apra");

export const getBankStocks = (): Promise<{
  data: Record<string, StockPoint[]>;
  tickers: string[];
}> =>
  apiFetch<{ data: Record<string, StockPoint[]>; tickers: string[] }>(
    "/api/banking/stocks",
  );

export const getStockSummary = (): Promise<{ data: StockSummary[] }> =>
  apiFetch<{ data: StockSummary[] }>("/api/banking/stocks/summary");

// ─── News ─────────────────────────────────────────────────────────────────────

export const getNews = (): Promise<{ data: NewsItem[] }> =>
  apiFetch<{ data: NewsItem[] }>("/api/news");

// ─── RBA Schedule ─────────────────────────────────────────────────────────────

export const getRBASchedule = (): Promise<RBASchedule> =>
  apiFetch<RBASchedule>("/api/dashboard/rba-schedule");

// ─── Budget ───────────────────────────────────────────────────────────────────

export const getBudgetData = (): Promise<BudgetData> =>
  apiFetch<BudgetData>("/api/dashboard/budget");

// ─── AI Chat ──────────────────────────────────────────────────────────────────

export const sendChatMessage = (
  message: string,
  sessionId: string,
  history: ChatMessage[],
): Promise<ChatResponse> =>
  apiFetch<ChatResponse>("/api/chat", {
    method: "POST",
    body: JSON.stringify({ message, session_id: sessionId, history }),
  });

export const clearChatSession = (sessionId: string): Promise<void> =>
  apiFetch<void>("/api/chat/clear", {
    method: "POST",
    body: JSON.stringify({ session_id: sessionId }),
  });

// ─── Insights ─────────────────────────────────────────────────────────────────

export const getInsights = (): Promise<InsightsResponse> =>
  apiFetch<InsightsResponse>("/api/insights");
