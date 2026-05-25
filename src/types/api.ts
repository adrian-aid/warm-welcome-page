// TypeScript interfaces for all backend API response shapes

export interface CashRatePoint {
  date: string;
  rate: number;
}

export interface CPIPoint {
  date: string;
  value: number;
  yoy_change: number;
}

export interface EmploymentPoint {
  date: string;
  employed_thousands: number;
}

export interface GDPPoint {
  date: string;
  gdp_billions: number;
  qoq_change: number;
}

export interface KPIValue {
  value: number | null;
  date: string | null;
  label: string;
  unit: string;
}

export interface DashboardSummary {
  cash_rate: KPIValue;
  cpi: KPIValue;
  employment: KPIValue;
  gdp_growth: KPIValue;
}

export interface APRAInstitution {
  institution: string;
  total_assets_b: number;
  gross_loans_b: number;
  total_deposits_b: number;
}

export interface StockPoint {
  date: string;
  close: number;
  name: string;
}

export interface StockSummary {
  ticker: string;
  name: string;
  current_price: number | null;
  week52_high: number | null;
  week52_low: number | null;
  pe_ratio: number | null;
  market_cap_b: number;
  dividend_yield: number;
}

export interface NewsItem {
  title: string;
  source: string;
  url: string;
  date: string;
  summary: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatResponse {
  answer: string;
  steps: string[];
  demo_mode: boolean;
  followups: string[];
}

export interface RBAMeeting {
  date: string;
  year: number;
  outcome: "CUT" | "HIKE" | "HOLD" | null;
  rate_after: number | null;
  notes: string;
  days_until?: number;
}

export interface RBASchedule {
  schedule: RBAMeeting[];
  next_meeting: RBAMeeting & { days_until: number } | null;
  last_meeting: RBAMeeting | null;
  current_rate: number | null;
  as_of: string;
}

export interface BudgetFiscalPosition {
  underlying_cash_balance_b: number;
  revenue_b: number;
  expenditure_b: number;
  net_debt_pct_gdp: number;
  gross_debt_b: number;
  label: string;
}

export interface BudgetData {
  current_budget: {
    budget_year: string;
    delivered_date: string;
    treasurer: string;
    fiscal_position: BudgetFiscalPosition;
    economic_forecasts: {
      gdp_growth_pct: number;
      cpi_pct: number;
      unemployment_pct: number;
      wages_growth_pct: number;
    };
    banking_implications: string[];
    source_url: string;
  };
  historical_fiscal: Array<{
    year: string;
    balance_b: number;
    pct_gdp: number;
    note: string;
  }>;
  as_of: string;
}

export interface InsightsResponse {
  insights: string;
  generated_at: string;
  demo_mode: boolean;
  data_sources: string[];
}
