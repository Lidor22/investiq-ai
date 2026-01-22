import { useQuery } from '@tanstack/react-query';
import { getTechnicalIndicators, getPriceHistory, getAnalystData } from '../services/api';

/** Hook for fetching technical indicators */
export function useTechnicalIndicators(ticker: string) {
  return useQuery({
    queryKey: ['technical', ticker, 'indicators'],
    queryFn: () => getTechnicalIndicators(ticker),
    enabled: !!ticker,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/** Hook for fetching price history */
export function usePriceHistory(ticker: string, period = '6mo', interval = '1d') {
  return useQuery({
    queryKey: ['technical', ticker, 'history', period, interval],
    queryFn: () => getPriceHistory(ticker, period, interval),
    enabled: !!ticker,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/** Hook for fetching analyst data */
export function useAnalystData(ticker: string) {
  return useQuery({
    queryKey: ['technical', ticker, 'analyst'],
    queryFn: () => getAnalystData(ticker),
    enabled: !!ticker,
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
}
