import { Activity, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useTechnicalIndicators } from '../../hooks/useTechnical';
import { LoadingSpinner } from '../shared/LoadingSpinner';

interface TechnicalIndicatorsProps {
  ticker: string;
}

export function TechnicalIndicators({ ticker }: TechnicalIndicatorsProps) {
  const { data, isLoading, error } = useTechnicalIndicators(ticker);

  if (isLoading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="flex justify-center py-8">
          <LoadingSpinner size="sm" message="Loading indicators..." />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="text-center py-8">
          <Activity className="h-10 w-10 text-gray-300 mx-auto mb-2 dark:text-gray-600" />
          <p className="text-gray-500 dark:text-gray-400">Unable to load technical indicators</p>
        </div>
      </div>
    );
  }

  const TrendIcon = data.trend === 'bullish' ? TrendingUp : data.trend === 'bearish' ? TrendingDown : Minus;
  const trendStyles = {
    bullish: {
      color: 'text-green-600',
      bg: 'bg-green-100 dark:bg-green-900/30',
      gradient: 'from-green-400 to-emerald-500',
      shadow: 'shadow-green-500/25',
    },
    bearish: {
      color: 'text-red-600',
      bg: 'bg-red-100 dark:bg-red-900/30',
      gradient: 'from-red-400 to-rose-500',
      shadow: 'shadow-red-500/25',
    },
    neutral: {
      color: 'text-gray-600',
      bg: 'bg-gray-100 dark:bg-gray-700',
      gradient: 'from-gray-400 to-gray-500',
      shadow: 'shadow-gray-500/25',
    },
  };
  const trend = trendStyles[data.trend];

  const rsiColor = data.rsi.signal === 'overbought' ? 'text-red-600' : data.rsi.signal === 'oversold' ? 'text-green-600' : 'text-blue-600';

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden dark:border-gray-700 dark:bg-gray-800">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-gray-200 px-4 py-3 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 dark:border-gray-700">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 shadow-md shadow-purple-500/25">
          <Activity className="h-4 w-4 text-white" />
        </div>
        <h3 className="font-semibold text-gray-900 dark:text-white">Technical Indicators</h3>
        <div className={`ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full ${trend.bg}`}>
          <TrendIcon className={`h-4 w-4 ${trend.color}`} />
          <span className={`text-xs font-semibold capitalize ${trend.color}`}>{data.trend}</span>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Moving Averages */}
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2.5 dark:text-gray-400">Moving Averages</h4>
          <div className="grid grid-cols-3 gap-2">
            <IndicatorBox
              label="SMA 20"
              value={`$${data.moving_averages.sma_20.toFixed(2)}`}
              signal={data.current_price > data.moving_averages.sma_20 ? 'bullish' : 'bearish'}
            />
            <IndicatorBox
              label="SMA 50"
              value={`$${data.moving_averages.sma_50.toFixed(2)}`}
              signal={data.current_price > data.moving_averages.sma_50 ? 'bullish' : 'bearish'}
            />
            <IndicatorBox
              label="SMA 200"
              value={data.moving_averages.sma_200 ? `$${data.moving_averages.sma_200.toFixed(2)}` : 'N/A'}
              signal={data.moving_averages.sma_200 && data.current_price > data.moving_averages.sma_200 ? 'bullish' : 'bearish'}
            />
          </div>
        </div>

        {/* RSI */}
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2.5 dark:text-gray-400">RSI (14)</h4>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-gray-200 rounded-full h-2.5 dark:bg-gray-600 overflow-hidden">
              <div
                className={`h-2.5 rounded-full transition-all ${
                  data.rsi.value > 70 ? 'bg-gradient-to-r from-red-400 to-red-500' :
                  data.rsi.value < 30 ? 'bg-gradient-to-r from-green-400 to-green-500' :
                  'bg-gradient-to-r from-blue-400 to-blue-500'
                }`}
                style={{ width: `${data.rsi.value}%` }}
              />
            </div>
            <span className={`text-sm font-bold ${rsiColor}`}>
              {data.rsi.value.toFixed(1)}
            </span>
            <span className={`text-xs font-medium capitalize px-2 py-0.5 rounded-full ${
              data.rsi.signal === 'overbought' ? 'bg-red-100 text-red-700 dark:bg-red-900/30' :
              data.rsi.signal === 'oversold' ? 'bg-green-100 text-green-700 dark:bg-green-900/30' :
              'bg-blue-100 text-blue-700 dark:bg-blue-900/30'
            }`}>
              {data.rsi.signal}
            </span>
          </div>
        </div>

        {/* Support & Resistance */}
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2.5 dark:text-gray-400">Support & Resistance</h4>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-2.5 text-center dark:from-green-900/20 dark:to-emerald-900/20 dark:border-green-800">
              <p className="text-xs font-medium text-green-600 dark:text-green-400">Support</p>
              <p className="font-bold text-green-700 dark:text-green-300">${data.support_resistance.support_1.toFixed(2)}</p>
            </div>
            <div className="bg-gradient-to-br from-gray-50 to-slate-50 border border-gray-200 rounded-lg p-2.5 text-center dark:from-gray-700/50 dark:to-slate-700/50 dark:border-gray-600">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Pivot</p>
              <p className="font-bold text-gray-800 dark:text-gray-200">${data.support_resistance.pivot.toFixed(2)}</p>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-rose-50 border border-red-200 rounded-lg p-2.5 text-center dark:from-red-900/20 dark:to-rose-900/20 dark:border-red-800">
              <p className="text-xs font-medium text-red-600 dark:text-red-400">Resistance</p>
              <p className="font-bold text-red-700 dark:text-red-300">${data.support_resistance.resistance_1.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* MACD */}
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2.5 dark:text-gray-400">MACD</h4>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-center dark:bg-gray-700/50 dark:border-gray-600">
              <p className="text-xs text-gray-500 dark:text-gray-400">MACD Line</p>
              <p className={`font-bold ${data.macd.macd_line >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {data.macd.macd_line.toFixed(4)}
              </p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-center dark:bg-gray-700/50 dark:border-gray-600">
              <p className="text-xs text-gray-500 dark:text-gray-400">Signal</p>
              <p className="font-bold text-gray-700 dark:text-gray-300">{data.macd.signal_line.toFixed(2)}</p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-center dark:bg-gray-700/50 dark:border-gray-600">
              <p className="text-xs text-gray-500 dark:text-gray-400">Histogram</p>
              <p className={`font-bold ${data.macd.histogram >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {data.macd.histogram.toFixed(4)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function IndicatorBox({
  label,
  value,
  signal,
}: {
  label: string;
  value: string;
  signal: 'bullish' | 'bearish' | 'neutral';
}) {
  const styles = {
    bullish: {
      bg: 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20',
      border: 'border-green-200 dark:border-green-800',
      text: 'text-green-700 dark:text-green-300',
    },
    bearish: {
      bg: 'bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20',
      border: 'border-red-200 dark:border-red-800',
      text: 'text-red-700 dark:text-red-300',
    },
    neutral: {
      bg: 'bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-700/50 dark:to-slate-700/50',
      border: 'border-gray-200 dark:border-gray-600',
      text: 'text-gray-700 dark:text-gray-300',
    },
  };

  const s = styles[signal];

  return (
    <div className={`${s.bg} ${s.border} border rounded-lg p-2.5 text-center`}>
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className={`font-bold ${s.text}`}>{value}</p>
    </div>
  );
}
