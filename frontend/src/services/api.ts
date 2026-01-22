import axios from 'axios';
import type {
  StockQuote,
  InvestmentBrief,
  WatchlistItem,
  WatchlistItemCreate,
  NewsSummary,
  TechnicalIndicators,
  PriceHistory,
  AnalystData,
  EarningsData,
  FinancialStatement,
  FinancialRatios,
} from '../types';

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Stock endpoints
export async function getStockQuote(ticker: string): Promise<StockQuote> {
  const response = await api.get<StockQuote>(`/stock/${ticker}/quote`);
  return response.data;
}

// Brief endpoints
export async function getBrief(ticker: string): Promise<InvestmentBrief | null> {
  const response = await api.get<InvestmentBrief | null>(`/brief/${ticker}`);
  return response.data;
}

export async function generateBrief(ticker: string, forceRegenerate = false): Promise<InvestmentBrief> {
  const response = await api.post<InvestmentBrief>(`/brief/${ticker}/generate`, {
    force_regenerate: forceRegenerate,
  });
  return response.data;
}

// Watchlist endpoints
export async function getWatchlist(category?: string): Promise<WatchlistItem[]> {
  const params = category ? { category } : {};
  const response = await api.get<WatchlistItem[]>('/watchlist', { params });
  return response.data;
}

export async function addToWatchlist(item: WatchlistItemCreate): Promise<WatchlistItem> {
  const response = await api.post<WatchlistItem>('/watchlist', item);
  return response.data;
}

export async function removeFromWatchlist(ticker: string): Promise<void> {
  await api.delete(`/watchlist/${ticker}`);
}

export async function getWatchlistCategories(): Promise<string[]> {
  const response = await api.get<string[]>('/watchlist/categories');
  return response.data;
}

// News endpoints
export async function getNews(ticker: string, days?: number): Promise<NewsSummary> {
  const params = days ? { days } : {};
  const response = await api.get<NewsSummary>(`/news/${ticker}`, { params });
  return response.data;
}

export async function getNewsSummary(ticker: string, days?: number): Promise<NewsSummary> {
  const params = days ? { days } : {};
  const response = await api.get<NewsSummary>(`/news/${ticker}/summary`, { params });
  return response.data;
}

// Technical analysis endpoints
export async function getTechnicalIndicators(ticker: string): Promise<TechnicalIndicators> {
  const response = await api.get<TechnicalIndicators>(`/technical/${ticker}/indicators`);
  return response.data;
}

export async function getPriceHistory(
  ticker: string,
  period: string = '6mo',
  interval: string = '1d'
): Promise<PriceHistory> {
  const response = await api.get<PriceHistory>(`/technical/${ticker}/history`, {
    params: { period, interval },
  });
  return response.data;
}

export async function getAnalystData(ticker: string): Promise<AnalystData> {
  const response = await api.get<AnalystData>(`/technical/${ticker}/analyst`);
  return response.data;
}

// Financial data endpoints
export async function getEarnings(ticker: string): Promise<EarningsData> {
  const response = await api.get<EarningsData>(`/financial/${ticker}/earnings`);
  return response.data;
}

export async function getIncomeStatement(ticker: string, quarterly = false): Promise<FinancialStatement> {
  const response = await api.get<FinancialStatement>(`/financial/${ticker}/income`, {
    params: { quarterly },
  });
  return response.data;
}

export async function getBalanceSheet(ticker: string, quarterly = false): Promise<FinancialStatement> {
  const response = await api.get<FinancialStatement>(`/financial/${ticker}/balance`, {
    params: { quarterly },
  });
  return response.data;
}

export async function getCashFlow(ticker: string, quarterly = false): Promise<FinancialStatement> {
  const response = await api.get<FinancialStatement>(`/financial/${ticker}/cashflow`, {
    params: { quarterly },
  });
  return response.data;
}

export async function getFinancialRatios(ticker: string): Promise<FinancialRatios> {
  const response = await api.get<FinancialRatios>(`/financial/${ticker}/ratios`);
  return response.data;
}

// Export endpoints - these return download URLs
export function getExportSummaryUrl(ticker: string): string {
  return `/api/v1/export/${ticker}/summary.csv`;
}

export function getExportPriceHistoryUrl(ticker: string, period = '6mo'): string {
  return `/api/v1/export/${ticker}/price-history.csv?period=${period}`;
}

export function getExportFinancialsUrl(ticker: string): string {
  return `/api/v1/export/${ticker}/financials.json`;
}

// Search endpoints
export interface StockSearchResult {
  ticker: string;
  name: string;
  exchange: string;
  type: string;
}

export async function searchStocks(query: string, limit = 10): Promise<StockSearchResult[]> {
  const response = await api.get<StockSearchResult[]>('/search/stocks', {
    params: { q: query, limit },
  });
  return response.data;
}

export default api;
