import { useQuery } from '@tanstack/react-query';
import { getNews, getNewsSummary } from '../services/api';

/** Hook for fetching news without AI summary */
export function useNews(ticker: string, days = 7) {
  return useQuery({
    queryKey: ['news', ticker, days],
    queryFn: () => getNews(ticker, days),
    enabled: !!ticker,
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
}

/** Hook for fetching news with AI summary */
export function useNewsSummary(ticker: string, days = 7) {
  return useQuery({
    queryKey: ['news', ticker, 'summary', days],
    queryFn: () => getNewsSummary(ticker, days),
    enabled: !!ticker,
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
}
