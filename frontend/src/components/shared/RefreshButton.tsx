import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

interface RefreshButtonProps {
  ticker: string;
  className?: string;
}

export function RefreshButton({ ticker, className = '' }: RefreshButtonProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const queryClient = useQueryClient();

  const handleRefresh = async () => {
    setIsRefreshing(true);

    // Invalidate all queries for this ticker
    await queryClient.invalidateQueries({
      predicate: (query) => {
        const queryKey = query.queryKey;
        // Check if the query key contains the ticker
        return queryKey.some((key) =>
          typeof key === 'string' && key.toUpperCase() === ticker.toUpperCase()
        );
      },
    });

    // Small delay for visual feedback
    setTimeout(() => setIsRefreshing(false), 500);
  };

  return (
    <button
      onClick={handleRefresh}
      disabled={isRefreshing}
      className={`p-2 rounded-lg border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 dark:hover:text-white ${className}`}
      title="Refresh data"
    >
      <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
    </button>
  );
}
