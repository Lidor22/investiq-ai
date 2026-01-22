import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getWatchlist, addToWatchlist, removeFromWatchlist, getWatchlistCategories } from '../services/api';
import type { WatchlistItemCreate } from '../types';

/** Hook for fetching watchlist */
export function useWatchlist(category?: string) {
  return useQuery({
    queryKey: ['watchlist', category],
    queryFn: () => getWatchlist(category),
    staleTime: 1000 * 60, // 1 minute
  });
}

/** Hook for fetching watchlist categories */
export function useWatchlistCategories() {
  return useQuery({
    queryKey: ['watchlist', 'categories'],
    queryFn: getWatchlistCategories,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/** Hook for adding to watchlist */
export function useAddToWatchlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (item: WatchlistItemCreate) => addToWatchlist(item),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
    },
  });
}

/** Hook for removing from watchlist */
export function useRemoveFromWatchlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ticker: string) => removeFromWatchlist(ticker),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
    },
  });
}
