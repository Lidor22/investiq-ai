import { TrendingUp, TrendingDown, Sparkles, Activity, Star, Check, AlertCircle } from 'lucide-react';
import type { StockQuote } from '../../types';
import { ExportMenu } from '../shared/ExportMenu';
import { RefreshButton } from '../shared/RefreshButton';
import { useWatchlist, useAddToWatchlist } from '../../hooks/useWatchlist';
import { useAuth } from '../../contexts/AuthContext';

interface StockQuoteCardProps {
  quote: StockQuote;
  onGenerateBrief?: () => void;
  isGeneratingBrief?: boolean;
}

function formatNumber(num: number | null, decimals = 2): string {
  if (num === null) return 'N/A';
  return num.toLocaleString('en-US', { maximumFractionDigits: decimals });
}

function formatMarketCap(num: number | null): string {
  if (num === null) return 'N/A';
  if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  return `$${num.toLocaleString()}`;
}

function formatVolume(num: number): string {
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
  return num.toString();
}

export function StockQuoteCard({ quote, onGenerateBrief, isGeneratingBrief }: StockQuoteCardProps) {
  const isPositive = quote.change >= 0;
  const { isAuthenticated } = useAuth();
  const { data: watchlist } = useWatchlist();
  const addToWatchlist = useAddToWatchlist();

  const isInWatchlist = watchlist?.some((item) => item.ticker === quote.ticker);

  const handleAddToWatchlist = () => {
    if (!isInWatchlist) {
      addToWatchlist.reset(); // Clear any previous error state
      addToWatchlist.mutate({ ticker: quote.ticker });
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden card-hover dark:border-gray-700 dark:bg-gray-800">
      {/* Top accent bar */}
      <div className={`h-1 ${isPositive ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-gradient-to-r from-red-400 to-rose-500'}`} />

      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            {/* Stock Icon */}
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${
              isPositive
                ? 'bg-gradient-to-br from-green-400 to-emerald-500'
                : 'bg-gradient-to-br from-red-400 to-rose-500'
            } shadow-lg ${isPositive ? 'shadow-green-500/25' : 'shadow-red-500/25'}`}>
              {isPositive ? (
                <TrendingUp className="h-6 w-6 text-white" />
              ) : (
                <TrendingDown className="h-6 w-6 text-white" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{quote.ticker}</h2>
                <div className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-green-500 pulse-dot" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">Live</span>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-400">{quote.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <button
                onClick={handleAddToWatchlist}
                disabled={isInWatchlist || addToWatchlist.isPending}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                  addToWatchlist.isError
                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    : isInWatchlist
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                    : 'bg-gray-100 text-gray-700 hover:bg-amber-100 hover:text-amber-700 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-amber-900/30 dark:hover:text-amber-400'
                }`}
                title={addToWatchlist.isError ? 'Failed to add - click to retry' : isInWatchlist ? 'Already in watchlist' : 'Add to watchlist'}
              >
                {addToWatchlist.isError ? (
                  <>
                    <AlertCircle className="h-4 w-4" />
                    <span className="hidden sm:inline">Failed</span>
                  </>
                ) : isInWatchlist ? (
                  <>
                    <Check className="h-4 w-4" />
                    <span className="hidden sm:inline">Watching</span>
                  </>
                ) : (
                  <>
                    <Star className={`h-4 w-4 ${addToWatchlist.isPending ? 'animate-pulse' : ''}`} />
                    <span className="hidden sm:inline">Watch</span>
                  </>
                )}
              </button>
            )}
            <RefreshButton ticker={quote.ticker} />
            <ExportMenu ticker={quote.ticker} />
            {onGenerateBrief && (
              <button
                onClick={onGenerateBrief}
                disabled={isGeneratingBrief}
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-500/25 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <Sparkles className={`h-4 w-4 ${isGeneratingBrief ? 'animate-pulse' : ''}`} />
                {isGeneratingBrief ? 'Generating...' : 'Generate AI Brief'}
              </button>
            )}
          </div>
        </div>

        {/* Price Section */}
        <div className="mt-6 flex items-end gap-4">
          <span className="text-5xl font-bold text-gray-900 tabular-nums dark:text-white">
            ${formatNumber(quote.price)}
          </span>
          <div className={`flex items-center gap-2 pb-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            <div className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-semibold ${
              isPositive ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'
            }`}>
              {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              {isPositive ? '+' : ''}{formatNumber(quote.change)}
            </div>
            <span className={`text-sm font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              ({isPositive ? '+' : ''}{formatNumber(quote.change_percent)}%)
            </span>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="mt-6 grid grid-cols-3 gap-4 sm:grid-cols-6">
          <MetricItem label="Market Cap" value={formatMarketCap(quote.market_cap)} />
          <MetricItem label="P/E Ratio" value={formatNumber(quote.pe_ratio)} />
          <MetricItem label="EPS" value={quote.eps !== null ? `$${formatNumber(quote.eps)}` : 'N/A'} />
          <MetricItem label="Volume" value={formatVolume(quote.volume)} icon={<Activity className="h-3 w-3" />} />
          <MetricItem label="52W High" value={`$${formatNumber(quote.week_52_high)}`} highlight="high" />
          <MetricItem label="52W Low" value={`$${formatNumber(quote.week_52_low)}`} highlight="low" />
        </div>
      </div>
    </div>
  );
}

function MetricItem({
  label,
  value,
  icon,
  highlight,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  highlight?: 'high' | 'low';
}) {
  return (
    <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-700/50">
      <div className="flex items-center gap-1">
        {icon && <span className="text-gray-400">{icon}</span>}
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide dark:text-gray-400">{label}</p>
      </div>
      <p className={`mt-1 text-lg font-semibold tabular-nums ${
        highlight === 'high'
          ? 'text-green-600 dark:text-green-400'
          : highlight === 'low'
          ? 'text-red-600 dark:text-red-400'
          : 'text-gray-900 dark:text-white'
      }`}>
        {value}
      </p>
    </div>
  );
}
