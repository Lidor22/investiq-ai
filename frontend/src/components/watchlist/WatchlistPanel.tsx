import { useState } from 'react';
import { Plus, Trash2, Star, X } from 'lucide-react';
import { useWatchlist, useAddToWatchlist, useRemoveFromWatchlist } from '../../hooks/useWatchlist';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import type { WatchlistItem } from '../../types';

interface WatchlistPanelProps {
  onSelectTicker: (ticker: string) => void;
  selectedTicker?: string;
}

export function WatchlistPanel({ onSelectTicker, selectedTicker }: WatchlistPanelProps) {
  const [newTicker, setNewTicker] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  const { data: watchlist, isLoading } = useWatchlist();
  const addMutation = useAddToWatchlist();
  const removeMutation = useRemoveFromWatchlist();

  const handleAdd = () => {
    const ticker = newTicker.trim().toUpperCase();
    if (!ticker) return;

    addMutation.mutate(
      { ticker },
      {
        onSuccess: () => {
          setNewTicker('');
          setShowAdd(false);
        },
      }
    );
  };

  const handleRemove = (ticker: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeMutation.mutate(ticker);
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden dark:border-gray-700 dark:bg-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 shadow-md shadow-amber-500/25">
            <Star className="h-4 w-4 text-white" />
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white">Watchlist</h3>
          {watchlist?.length ? (
            <span className="text-xs text-gray-500 dark:text-gray-400">({watchlist.length})</span>
          ) : null}
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all ${
            showAdd
              ? 'bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-300'
              : 'bg-white text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600 dark:hover:text-white'
          } shadow-sm`}
        >
          {showAdd ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
        </button>
      </div>

      {/* Add ticker form */}
      {showAdd && (
        <div className="border-b border-gray-200 p-3 bg-gray-50 dark:bg-gray-700/50 dark:border-gray-700">
          <div className="flex gap-2">
            <input
              type="text"
              value={newTicker}
              onChange={(e) => setNewTicker(e.target.value.toUpperCase())}
              placeholder="Enter ticker..."
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              autoFocus
            />
            <button
              onClick={handleAdd}
              disabled={!newTicker.trim() || addMutation.isPending}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {addMutation.isPending ? '...' : 'Add'}
            </button>
          </div>
          {addMutation.isError && (
            <p className="mt-2 text-xs text-red-600 dark:text-red-400">
              {(addMutation.error as Error).message || 'Failed to add'}
            </p>
          )}
        </div>
      )}

      {/* Watchlist items */}
      <div className="max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner size="sm" />
          </div>
        ) : !watchlist?.length ? (
          <div className="py-8 text-center">
            <Star className="h-8 w-8 text-gray-300 mx-auto mb-2 dark:text-gray-600" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No stocks in watchlist
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Click + to add your first stock
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-700">
            {watchlist.map((item: WatchlistItem) => (
              <li
                key={item.id}
                onClick={() => onSelectTicker(item.ticker)}
                className={`group flex cursor-pointer items-center justify-between px-4 py-3 transition-all ${
                  selectedTicker === item.ticker
                    ? 'bg-blue-50 border-l-2 border-l-blue-500 dark:bg-blue-900/20'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 border-l-2 border-l-transparent'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className={`font-semibold ${
                    selectedTicker === item.ticker
                      ? 'text-blue-700 dark:text-blue-400'
                      : 'text-gray-900 dark:text-white'
                  }`}>
                    {item.ticker}
                  </p>
                  {item.name && (
                    <p className="text-xs text-gray-500 truncate dark:text-gray-400">
                      {item.name}
                    </p>
                  )}
                </div>
                <button
                  onClick={(e) => handleRemove(item.ticker, e)}
                  disabled={removeMutation.isPending}
                  className="rounded-lg p-1.5 text-gray-400 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-all"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
