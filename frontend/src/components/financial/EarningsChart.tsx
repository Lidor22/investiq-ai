import { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ComposedChart,
} from 'recharts';
import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { useEarnings } from '../../hooks/useFinancial';
import { LoadingSpinner } from '../shared/LoadingSpinner';

interface EarningsChartProps {
  ticker: string;
}

type View = 'quarterly' | 'annual';
type ChartType = 'eps' | 'revenue';

// Format large numbers to billions/millions
function formatRevenue(value: number): string {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(1)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
  return `$${value.toFixed(0)}`;
}

export function EarningsChart({ ticker }: EarningsChartProps) {
  const [view, setView] = useState<View>('quarterly');
  const [chartType, setChartType] = useState<ChartType>('eps');
  const { data, isLoading, error } = useEarnings(ticker);

  // Check for dark mode
  const isDark = document.documentElement.classList.contains('dark');

  // Check if annual data is available
  const hasAnnualData = useMemo(() => {
    if (!data) return false;
    return data.annual_earnings.length > 0 &&
      data.annual_earnings.some(a => (a.earnings ?? a.actual) !== null || a.revenue !== null);
  }, [data]);

  // Check if revenue data is available
  const hasRevenueData = useMemo(() => {
    if (!data) return false;
    if (view === 'quarterly') {
      return data.quarterly_earnings.some(q => q.revenue !== null);
    } else {
      return data.annual_earnings.some(a => a.revenue !== null);
    }
  }, [data, view]);

  if (isLoading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="flex justify-center py-12">
          <LoadingSpinner message="Loading earnings..." />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="text-center py-12">
          <DollarSign className="h-12 w-12 text-gray-300 mx-auto mb-3 dark:text-gray-600" />
          <p className="text-gray-500 dark:text-gray-400">Unable to load earnings data</p>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const chartData = view === 'quarterly'
    ? data.quarterly_earnings.map((q) => ({
        period: q.quarter ? q.quarter.substring(0, 7) : 'N/A', // YYYY-MM format
        actual: q.earnings ?? q.actual ?? null,
        estimate: q.estimate ?? null,
        revenue: q.revenue ?? null,
        surprise: q.surprise ?? null,
        surprisePercent: q.surprise_percent ?? null,
      })).reverse()
    : data.annual_earnings.map((a) => ({
        period: a.year,
        actual: a.earnings ?? a.actual ?? null,
        estimate: a.estimate ?? null,
        revenue: a.revenue ?? null,
        surprise: null,
        surprisePercent: null,
      }));

  const hasEpsData = chartData.length > 0 && chartData.some((d) => d.actual !== null || d.estimate !== null);
  const hasData = hasEpsData || (hasRevenueData && chartData.some(d => d.revenue !== null));

  // Theme-aware colors
  const gridColor = isDark ? '#374151' : '#f0f0f0';
  const textColor = isDark ? '#9ca3af' : '#6b7280';
  const tooltipBg = isDark ? '#1f2937' : 'white';
  const tooltipBorder = isDark ? '#374151' : '#e5e7eb';

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden dark:border-gray-700 dark:bg-gray-800">
      {/* Gradient accent bar */}
      <div className="h-1 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500" />

      <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/25">
            <DollarSign className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Earnings</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {chartType === 'eps' ? 'EPS Actual vs Estimate' : 'Quarterly Revenue'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Chart type toggle - only show if revenue data available */}
          {hasRevenueData && (
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1 dark:bg-gray-700 mr-2">
              <button
                onClick={() => setChartType('eps')}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-all ${
                  chartType === 'eps'
                    ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-600 dark:text-white'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                }`}
              >
                EPS
              </button>
              <button
                onClick={() => setChartType('revenue')}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-all ${
                  chartType === 'revenue'
                    ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-600 dark:text-white'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                }`}
              >
                Revenue
              </button>
            </div>
          )}
          {/* Period toggle - only show Annual if data available */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1 dark:bg-gray-700">
            <button
              onClick={() => setView('quarterly')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                view === 'quarterly'
                  ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-600 dark:text-white'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
              }`}
            >
              Quarterly
            </button>
            {hasAnnualData && (
              <button
                onClick={() => setView('annual')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  view === 'annual'
                    ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-600 dark:text-white'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                }`}
              >
                Annual
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="p-5">
        {hasData ? (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'eps' ? (
                <BarChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis
                    dataKey="period"
                    tick={{ fontSize: 11, fill: textColor }}
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    axisLine={{ stroke: gridColor }}
                    tickLine={{ stroke: gridColor }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: textColor }}
                    tickFormatter={(value) => `$${Number(value).toFixed(2)}`}
                    width={55}
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
                    formatter={(value, name) => {
                      if (value === null || value === undefined) return ['N/A', name];
                      return [`$${Number(value).toFixed(2)}`, name];
                    }}
                    labelStyle={{ color: isDark ? '#f3f4f6' : '#111827', fontWeight: 600, marginBottom: 4 }}
                    itemStyle={{ color: isDark ? '#d1d5db' : '#4b5563' }}
                  />
                  <Legend
                    wrapperStyle={{ paddingTop: '20px' }}
                    formatter={(value) => <span style={{ color: textColor, fontSize: '12px' }}>{value}</span>}
                  />
                  <Bar dataKey="actual" name="Actual EPS" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="estimate" name="Estimated EPS" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              ) : (
                <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis
                    dataKey="period"
                    tick={{ fontSize: 11, fill: textColor }}
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    axisLine={{ stroke: gridColor }}
                    tickLine={{ stroke: gridColor }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: textColor }}
                    tickFormatter={(value) => formatRevenue(Number(value))}
                    width={65}
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
                    formatter={(value, name) => {
                      if (value === null || value === undefined) return ['N/A', name];
                      return [formatRevenue(Number(value)), name];
                    }}
                    labelStyle={{ color: isDark ? '#f3f4f6' : '#111827', fontWeight: 600, marginBottom: 4 }}
                    itemStyle={{ color: isDark ? '#d1d5db' : '#4b5563' }}
                  />
                  <Legend
                    wrapperStyle={{ paddingTop: '20px' }}
                    formatter={(value) => <span style={{ color: textColor, fontSize: '12px' }}>{value}</span>}
                  />
                  <Bar dataKey="revenue" name="Revenue" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </ComposedChart>
              )}
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-center py-12">
            <DollarSign className="h-12 w-12 text-gray-300 mx-auto mb-3 dark:text-gray-600" />
            <p className="text-gray-500 dark:text-gray-400">No earnings data available</p>
          </div>
        )}

        {/* Earnings Estimates */}
        {data.earnings_estimate && (
          <div className="mt-5 pt-5 border-t border-gray-200 dark:border-gray-700">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 dark:text-gray-400">
              Earnings Estimates
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <MetricBox
                label="Current EPS"
                value={data.earnings_estimate.current_eps}
                format="currency"
              />
              <MetricBox
                label="Forward EPS"
                value={data.earnings_estimate.forward_eps}
                format="currency"
              />
              <MetricBox
                label="Earnings Growth"
                value={data.earnings_estimate.earnings_growth}
                format="percent"
              />
              <MetricBox
                label="Revenue Growth"
                value={data.earnings_estimate.revenue_growth}
                format="percent"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MetricBox({
  label,
  value,
  format,
}: {
  label: string;
  value: number | null;
  format: 'currency' | 'percent' | 'number';
}) {
  let displayValue = 'N/A';
  let colorClass = 'text-gray-700 dark:text-gray-300';
  let Icon = null;

  if (value !== null) {
    if (format === 'currency') {
      displayValue = `$${value.toFixed(2)}`;
    } else if (format === 'percent') {
      // Finnhub returns percentages as whole numbers (e.g., 26.92 for 26.92%)
      displayValue = `${value.toFixed(1)}%`;
      colorClass = value >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
      Icon = value >= 0 ? TrendingUp : TrendingDown;
    } else {
      displayValue = value.toFixed(2);
    }
  }

  return (
    <div className="bg-gradient-to-br from-gray-50 to-slate-50 border border-gray-200 rounded-xl p-3 text-center dark:from-gray-700/50 dark:to-slate-700/50 dark:border-gray-600">
      <p className="text-xs text-gray-500 mb-1 dark:text-gray-400">{label}</p>
      <div className="flex items-center justify-center gap-1">
        {Icon && <Icon className={`h-4 w-4 ${colorClass}`} />}
        <p className={`font-bold ${colorClass}`}>{displayValue}</p>
      </div>
    </div>
  );
}
