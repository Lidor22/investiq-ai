import { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, TrendingDown, LineChart } from 'lucide-react';
import { usePriceHistory } from '../../hooks/useTechnical';
import { LoadingSpinner } from '../shared/LoadingSpinner';

interface PriceChartProps {
  ticker: string;
}

type Period = '1d' | '5d' | '1mo' | '3mo' | '6mo' | '1y' | '2y';

const periodOptions: { value: Period; label: string }[] = [
  { value: '1d', label: '1D' },
  { value: '5d', label: '1W' },
  { value: '1mo', label: '1M' },
  { value: '3mo', label: '3M' },
  { value: '6mo', label: '6M' },
  { value: '1y', label: '1Y' },
  { value: '2y', label: '2Y' },
];

export function PriceChart({ ticker }: PriceChartProps) {
  const [period, setPeriod] = useState<Period>('6mo');
  const { data, isLoading, error } = usePriceHistory(ticker, period);

  // Check for dark mode
  const isDark = document.documentElement.classList.contains('dark');

  if (isLoading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="flex justify-center py-12">
          <LoadingSpinner message="Loading chart..." />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="text-center py-12">
          <LineChart className="h-12 w-12 text-gray-300 mx-auto mb-3 dark:text-gray-600" />
          <p className="text-gray-500 dark:text-gray-400">Unable to load price chart</p>
        </div>
      </div>
    );
  }

  // Transform data for recharts
  const chartData = data.dates.map((date, i) => ({
    date,
    price: data.close[i],
    volume: data.volume[i],
  }));

  const minPrice = Math.min(...data.close) * 0.98;
  const maxPrice = Math.max(...data.close) * 1.02;

  // Calculate price change
  const firstPrice = data.close[0];
  const lastPrice = data.close[data.close.length - 1];
  const priceChange = lastPrice - firstPrice;
  const priceChangePercent = ((priceChange / firstPrice) * 100).toFixed(2);
  const isPositive = priceChange >= 0;

  // Theme-aware colors
  const gridColor = isDark ? '#374151' : '#f0f0f0';
  const textColor = isDark ? '#9ca3af' : '#6b7280';
  const tooltipBg = isDark ? '#1f2937' : 'white';
  const tooltipBorder = isDark ? '#374151' : '#e5e7eb';

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden dark:border-gray-700 dark:bg-gray-800">
      {/* Gradient accent bar */}
      <div className={`h-1 ${isPositive ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-gradient-to-r from-red-400 to-rose-500'}`} />

      <div className="p-5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
              isPositive
                ? 'bg-gradient-to-br from-green-400 to-emerald-500 shadow-lg shadow-green-500/25'
                : 'bg-gradient-to-br from-red-400 to-rose-500 shadow-lg shadow-red-500/25'
            }`}>
              {isPositive ? (
                <TrendingUp className="h-5 w-5 text-white" />
              ) : (
                <TrendingDown className="h-5 w-5 text-white" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Price History</h3>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {isPositive ? '+' : ''}{priceChangePercent}%
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {periodOptions.find(p => p.value === period)?.label} change
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1 dark:bg-gray-700">
            {periodOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setPeriod(opt.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  period === opt.value
                    ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-600 dark:text-white'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={isPositive ? '#10b981' : '#ef4444'}
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor={isPositive ? '#10b981' : '#ef4444'}
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: textColor }}
                tickFormatter={(value) => {
                  // Check if it's intraday data (has time component)
                  if (value.includes(':')) {
                    const date = new Date(value);
                    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
                  }
                  const date = new Date(value);
                  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                }}
                interval="preserveStartEnd"
                minTickGap={50}
                axisLine={{ stroke: gridColor }}
                tickLine={{ stroke: gridColor }}
              />
              <YAxis
                domain={[minPrice, maxPrice]}
                tick={{ fontSize: 11, fill: textColor }}
                tickFormatter={(value) => `$${value.toFixed(0)}`}
                width={60}
                axisLine={{ stroke: gridColor }}
                tickLine={{ stroke: gridColor }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: tooltipBg,
                  border: `1px solid ${tooltipBorder}`,
                  borderRadius: '12px',
                  fontSize: '12px',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                }}
                formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Price']}
                labelFormatter={(label) => {
                  const date = new Date(label);
                  if (label.includes(':')) {
                    return date.toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    });
                  }
                  return date.toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  });
                }}
                labelStyle={{ color: isDark ? '#f3f4f6' : '#111827', fontWeight: 600, marginBottom: 4 }}
                itemStyle={{ color: isDark ? '#d1d5db' : '#4b5563' }}
              />
              <Area
                type="monotone"
                dataKey="price"
                stroke={isPositive ? '#10b981' : '#ef4444'}
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorPrice)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
