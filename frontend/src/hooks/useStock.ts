import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getStockQuote, getBrief, generateBrief } from '../services/api';

/** Hook for fetching stock quote */
export function useStockQuote(ticker: string) {
  return useQuery({
    queryKey: ['stock', ticker, 'quote'],
    queryFn: () => getStockQuote(ticker),
    enabled: !!ticker && ticker.length > 0,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  });
}

/** Hook for fetching cached brief */
export function useBrief(ticker: string) {
  return useQuery({
    queryKey: ['brief', ticker],
    queryFn: () => getBrief(ticker),
    enabled: !!ticker && ticker.length > 0,
    staleTime: 1000 * 60 * 60, // 1 hour - briefs are more stable
    retry: 1,
  });
}

/** Hook for generating investment brief */
export function useGenerateBrief() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ticker, forceRegenerate = false }: { ticker: string; forceRegenerate?: boolean }) =>
      generateBrief(ticker, forceRegenerate),
    onSuccess: (data, variables) => {
      // Update the cached brief query
      queryClient.setQueryData(['brief', variables.ticker], data);
    },
  });
}
