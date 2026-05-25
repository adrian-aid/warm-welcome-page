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
}

export interface InsightsResponse {
  insights: string;
  generated_at: string;
  demo_mode: boolean;
  data_sources: string[];
}
