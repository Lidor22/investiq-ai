/** Stock quote with key metrics */
export interface StockQuote {
  ticker: string;
  name: string;
  price: number;
  change: number;
  change_percent: number;
  volume: number;
  market_cap: number | null;
  pe_ratio: number | null;
  eps: number | null;
  week_52_high: number;
  week_52_low: number;
  updated_at: string;
}

/** Sentiment classification */
export type Sentiment = 'bullish' | 'bearish' | 'neutral';

/** AI-generated investment brief */
export interface InvestmentBrief {
  ticker: string;
  company_name: string;
  generated_at: string;
  executive_summary: string;
  bull_case: string[];
  bear_case: string[];
  key_risks: string[];
  catalysts: string[];
  technical_outlook: string;
  financial_health: string;
  recent_developments: string;
  conclusion: string;
  sentiment: Sentiment;
  cached?: boolean;
}

/** API error response */
export interface ApiError {
  detail: string;
}

/** Watchlist item */
export interface WatchlistItem {
  id: number;
  ticker: string;
  name: string | null;
  category: string | null;
  notes: string | null;
  added_at: string;
}

/** Create watchlist item request */
export interface WatchlistItemCreate {
  ticker: string;
  category?: string;
  notes?: string;
}

/** News article */
export interface NewsArticle {
  title: string;
  source: string;
  url: string;
  published_at: string;
  description: string | null;
  sentiment: Sentiment | null;
}

/** News summary for a ticker */
export interface NewsSummary {
  ticker: string;
  articles: NewsArticle[];
  ai_summary: string | null;
  overall_sentiment: Sentiment | null;
  key_themes: string[];
  fetched_at: string;
}

/** Technical Analysis Types */
export interface MovingAverages {
  sma_20: number;
  sma_50: number;
  sma_200: number | null;
  ema_12: number;
  ema_26: number;
}

export interface RSIIndicator {
  value: number;
  signal: 'overbought' | 'oversold' | 'neutral';
}

export interface MACDIndicator {
  macd_line: number;
  signal_line: number;
  histogram: number;
}

export interface SupportResistance {
  support_1: number;
  pivot: number;
  resistance_1: number;
}

export interface TechnicalIndicators {
  ticker: string;
  moving_averages: MovingAverages;
  rsi: RSIIndicator;
  macd: MACDIndicator;
  support_resistance: SupportResistance;
  trend: 'bullish' | 'bearish' | 'neutral';
  current_price: number;
}

export interface PriceHistory {
  ticker: string;
  period: string;
  interval: string;
  dates: string[];
  open: number[];
  high: number[];
  low: number[];
  close: number[];
  volume: number[];
}

export interface PriceTargets {
  current: number | null;
  target_high: number | null;
  target_low: number | null;
  target_mean: number | null;
  target_median: number | null;
  number_of_analysts: number | null;
  recommendation: string | null;
  recommendation_mean: number | null;
  upside_potential: number | null;
}

export interface AnalystRecommendation {
  date: string;
  firm: string;
  to_grade: string;
  from_grade: string | null;
  action: string | null;
}

export interface AnalystData {
  ticker: string;
  price_targets: PriceTargets;
  recommendations: AnalystRecommendation[];
}

/** Financial Data Types */
export interface EarningsEstimate {
  current_eps: number | null;
  forward_eps: number | null;
  peg_ratio: number | null;
  earnings_growth: number | null;
  revenue_growth: number | null;
}

export interface QuarterlyEarning {
  quarter: string;
  revenue: number | null;
  earnings: number | null; // This is the actual EPS from Finnhub
  actual?: number | null; // Alias for earnings (Finnhub returns as 'actual')
  estimate?: number | null; // EPS estimate
  surprise?: number | null; // Earnings surprise
  surprise_percent?: number | null; // Earnings surprise percentage
}

export interface AnnualEarning {
  year: string;
  revenue: number | null;
  earnings: number | null;
}

export interface EarningsData {
  ticker: string;
  quarterly_earnings: QuarterlyEarning[];
  annual_earnings: AnnualEarning[];
  earnings_estimate: EarningsEstimate | null;
}

export interface FinancialStatement {
  ticker: string;
  periods: string[];
  data: Record<string, (number | null)[]>;
  quarterly: boolean;
}

export interface ValuationRatios {
  pe_ratio: number | null;
  forward_pe: number | null;
  peg_ratio: number | null;
  price_to_book: number | null;
  price_to_sales: number | null;
  enterprise_value: number | null;
  ev_to_revenue: number | null;
  ev_to_ebitda: number | null;
}

export interface ProfitabilityRatios {
  profit_margin: number | null;
  operating_margin: number | null;
  gross_margin: number | null;
  return_on_assets: number | null;
  return_on_equity: number | null;
}

export interface LiquidityRatios {
  current_ratio: number | null;
  quick_ratio: number | null;
  debt_to_equity: number | null;
}

export interface GrowthMetrics {
  revenue_growth: number | null;
  earnings_growth: number | null;
  quarterly_revenue_growth: number | null;
  quarterly_earnings_growth: number | null;
}

export interface DividendInfo {
  dividend_rate: number | null;
  dividend_yield: number | null;
  payout_ratio: number | null;
  ex_dividend_date: number | null;
}

export interface FinancialRatios {
  ticker: string;
  valuation: ValuationRatios;
  profitability: ProfitabilityRatios;
  liquidity: LiquidityRatios;
  growth: GrowthMetrics;
  dividends: DividendInfo;
}
