import { Target, Users, TrendingUp, TrendingDown } from 'lucide-react';
import { useAnalystData } from '../../hooks/useTechnical';
import { LoadingSpinner } from '../shared/LoadingSpinner';

interface AnalystPanelProps {
  ticker: string;
}

export function AnalystPanel({ ticker }: AnalystPanelProps) {
  const { data, isLoading, error } = useAnalystData(ticker);

  if (isLoading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="flex justify-center py-8">
          <LoadingSpinner size="sm" message="Loading analyst data..." />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="text-center py-8">
          <Target className="h-10 w-10 text-gray-300 mx-auto mb-2 dark:text-gray-600" />
          <p className="text-gray-500 dark:text-gray-400">Unable to load analyst data</p>
        </div>
      </div>
    );
  }

  const { price_targets } = data;
  const hasTargets = price_targets.target_mean !== null;

  // Map recommendation to display values
  const recommendationDisplay: Record<string, { label: string; color: string; bg: string; darkBg: string }> = {
    strong_buy: { label: 'Strong Buy', color: 'text-green-700 dark:text-green-300', bg: 'bg-green-100', darkBg: 'dark:bg-green-900/40' },
    buy: { label: 'Buy', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50', darkBg: 'dark:bg-green-900/30' },
    hold: { label: 'Hold', color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50', darkBg: 'dark:bg-yellow-900/30' },
    sell: { label: 'Sell', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50', darkBg: 'dark:bg-red-900/30' },
    strong_sell: { label: 'Strong Sell', color: 'text-red-700 dark:text-red-300', bg: 'bg-red-100', darkBg: 'dark:bg-red-900/40' },
  };

  const recInfo = price_targets.recommendation
    ? recommendationDisplay[price_targets.recommendation] || { label: price_targets.recommendation, color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-50', darkBg: 'dark:bg-gray-700' }
    : null;

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden dark:border-gray-700 dark:bg-gray-800">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-gray-200 px-4 py-3 bg-gradient-to-r from-cyan-50 to-teal-50 dark:from-cyan-900/20 dark:to-teal-900/20 dark:border-gray-700">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-teal-600 shadow-md shadow-cyan-500/25">
          <Target className="h-4 w-4 text-white" />
        </div>
        <h3 className="font-semibold text-gray-900 dark:text-white">Analyst Ratings</h3>
        {recInfo && (
          <span className={`ml-auto px-2.5 py-1 rounded-full text-xs font-semibold ${recInfo.bg} ${recInfo.darkBg} ${recInfo.color}`}>
            {recInfo.label}
          </span>
        )}
      </div>

      <div className="p-4 space-y-4">
        {hasTargets ? (
          <>
            {/* Price Target Range */}
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 dark:text-gray-400">Price Target</h4>
              <div className="relative pt-8 pb-4">
                {/* Range bar */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-500 w-16 dark:text-gray-400">${price_targets.target_low?.toFixed(2)}</span>
                  <div className="flex-1 relative">
                    <div className="h-3 bg-gradient-to-r from-red-200 via-yellow-200 to-green-200 rounded-full dark:from-red-900/40 dark:via-yellow-900/40 dark:to-green-900/40" />
                    {/* Current price marker */}
                    {price_targets.current && price_targets.target_low && price_targets.target_high && (
                      <div
                        className="absolute -top-7 transform -translate-x-1/2"
                        style={{
                          left: `${Math.min(100, Math.max(0, ((price_targets.current - price_targets.target_low) / (price_targets.target_high - price_targets.target_low)) * 100))}%`,
                        }}
                      >
                        <div className="flex flex-col items-center">
                          <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/40 px-1.5 py-0.5 rounded">
                            ${price_targets.current.toFixed(2)}
                          </span>
                          <div className="w-0.5 h-4 bg-blue-600 dark:bg-blue-400" />
                        </div>
                      </div>
                    )}
                    {/* Mean target marker */}
                    {price_targets.target_mean && price_targets.target_low && price_targets.target_high && (
                      <div
                        className="absolute -bottom-7 transform -translate-x-1/2"
                        style={{
                          left: `${((price_targets.target_mean - price_targets.target_low) / (price_targets.target_high - price_targets.target_low)) * 100}%`,
                        }}
                      >
                        <div className="flex flex-col items-center">
                          <div className="w-0.5 h-4 bg-green-600 dark:bg-green-400" />
                          <span className="text-xs font-bold text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/40 px-1.5 py-0.5 rounded">
                            ${price_targets.target_mean.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                  <span className="text-xs font-medium text-gray-500 w-16 text-right dark:text-gray-400">${price_targets.target_high?.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Upside/Downside */}
            {price_targets.upside_potential !== null && (
              <div className={`rounded-xl p-4 text-center border ${
                price_targets.upside_potential >= 0
                  ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 dark:from-green-900/20 dark:to-emerald-900/20 dark:border-green-800'
                  : 'bg-gradient-to-br from-red-50 to-rose-50 border-red-200 dark:from-red-900/20 dark:to-rose-900/20 dark:border-red-800'
              }`}>
                <div className="flex items-center justify-center gap-2 mb-1">
                  {price_targets.upside_potential >= 0 ? (
                    <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
                  )}
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Potential to Mean Target</p>
                </div>
                <p className={`text-3xl font-bold ${price_targets.upside_potential >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {price_targets.upside_potential >= 0 ? '+' : ''}{price_targets.upside_potential.toFixed(1)}%
                </p>
              </div>
            )}

            {/* Analyst Count */}
            {price_targets.number_of_analysts && (
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500 py-2 dark:text-gray-400">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
                  <Users className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
                </div>
                <span>Based on {price_targets.number_of_analysts} analyst{price_targets.number_of_analysts > 1 ? 's' : ''}</span>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8">
            <Target className="h-10 w-10 text-gray-300 mx-auto mb-2 dark:text-gray-600" />
            <p className="text-gray-500 dark:text-gray-400">No analyst data available</p>
          </div>
        )}

        {/* Recent Recommendations */}
        {data.recommendations.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2.5 dark:text-gray-400">Recent Ratings</h4>
            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {data.recommendations.slice(0, 5).map((rec, i) => (
                <div key={i} className="flex items-center justify-between text-sm py-2 px-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                  <span className="text-gray-600 truncate max-w-[120px] dark:text-gray-400">{rec.firm}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900 dark:text-white">{rec.to_grade}</span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">{new Date(rec.date).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
