import { PieChart, TrendingUp, Wallet, BarChart3, Coins } from 'lucide-react';
import { useFinancialRatios } from '../../hooks/useFinancial';
import { LoadingSpinner } from '../shared/LoadingSpinner';

interface FinancialRatiosPanelProps {
  ticker: string;
}

export function FinancialRatiosPanel({ ticker }: FinancialRatiosPanelProps) {
  const { data, isLoading, error } = useFinancialRatios(ticker);

  if (isLoading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="flex justify-center py-8">
          <LoadingSpinner size="sm" message="Loading ratios..." />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="text-center py-8">
          <PieChart className="h-10 w-10 text-gray-300 mx-auto mb-2 dark:text-gray-600" />
          <p className="text-gray-500 dark:text-gray-400">Unable to load financial ratios</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Valuation */}
      <RatioSection
        icon={<PieChart className="h-4 w-4 text-white" />}
        iconGradient="from-blue-500 to-indigo-600"
        iconShadow="shadow-blue-500/25"
        headerGradient="from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20"
        title="Valuation"
        metrics={[
          { label: 'P/E Ratio', value: data.valuation.pe_ratio, format: 'number' },
          { label: 'Forward P/E', value: data.valuation.forward_pe, format: 'number' },
          { label: 'PEG Ratio', value: data.valuation.peg_ratio, format: 'number' },
          { label: 'P/B Ratio', value: data.valuation.price_to_book, format: 'number' },
          { label: 'P/S Ratio', value: data.valuation.price_to_sales, format: 'number' },
          { label: 'EV/EBITDA', value: data.valuation.ev_to_ebitda, format: 'number' },
        ]}
      />

      {/* Profitability */}
      <RatioSection
        icon={<TrendingUp className="h-4 w-4 text-white" />}
        iconGradient="from-green-500 to-emerald-600"
        iconShadow="shadow-green-500/25"
        headerGradient="from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20"
        title="Profitability"
        metrics={[
          { label: 'Profit Margin', value: data.profitability.profit_margin, format: 'percent' },
          { label: 'Operating Margin', value: data.profitability.operating_margin, format: 'percent' },
          { label: 'Gross Margin', value: data.profitability.gross_margin, format: 'percent' },
          { label: 'ROA', value: data.profitability.return_on_assets, format: 'percent' },
          { label: 'ROE', value: data.profitability.return_on_equity, format: 'percent' },
        ]}
      />

      {/* Liquidity & Growth */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <RatioSection
          icon={<Wallet className="h-4 w-4 text-white" />}
          iconGradient="from-purple-500 to-violet-600"
          iconShadow="shadow-purple-500/25"
          headerGradient="from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20"
          title="Liquidity"
          metrics={[
            { label: 'Current Ratio', value: data.liquidity.current_ratio, format: 'number' },
            { label: 'Quick Ratio', value: data.liquidity.quick_ratio, format: 'number' },
            { label: 'Debt/Equity', value: data.liquidity.debt_to_equity, format: 'number' },
          ]}
          compact
        />

        <RatioSection
          icon={<BarChart3 className="h-4 w-4 text-white" />}
          iconGradient="from-orange-500 to-amber-600"
          iconShadow="shadow-orange-500/25"
          headerGradient="from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20"
          title="Growth"
          metrics={[
            { label: 'Revenue Growth', value: data.growth.revenue_growth, format: 'percent' },
            { label: 'Earnings Growth', value: data.growth.earnings_growth, format: 'percent' },
            { label: 'Q/Q Revenue', value: data.growth.quarterly_revenue_growth, format: 'percent' },
          ]}
          compact
        />
      </div>

      {/* Dividends */}
      {(data.dividends.dividend_yield !== null || data.dividends.dividend_rate !== null) && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center gap-3 border-b border-gray-200 px-4 py-3 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 dark:border-gray-700">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-yellow-600 shadow-md shadow-amber-500/25">
              <Coins className="h-4 w-4 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Dividends</h3>
          </div>
          <div className="p-4 grid grid-cols-3 gap-3">
            <MetricCard
              label="Dividend Rate"
              value={data.dividends.dividend_rate}
              format="currency"
            />
            <MetricCard
              label="Dividend Yield"
              value={data.dividends.dividend_yield}
              format="percent"
            />
            <MetricCard
              label="Payout Ratio"
              value={data.dividends.payout_ratio}
              format="percent"
            />
          </div>
        </div>
      )}
    </div>
  );
}

interface Metric {
  label: string;
  value: number | null;
  format: 'number' | 'percent' | 'currency';
}

function RatioSection({
  icon,
  iconGradient,
  iconShadow,
  headerGradient,
  title,
  metrics,
  compact = false,
}: {
  icon: React.ReactNode;
  iconGradient: string;
  iconShadow: string;
  headerGradient: string;
  title: string;
  metrics: Metric[];
  compact?: boolean;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden dark:border-gray-700 dark:bg-gray-800">
      <div className={`flex items-center gap-3 border-b border-gray-200 px-4 py-3 bg-gradient-to-r ${headerGradient} dark:border-gray-700`}>
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br ${iconGradient} shadow-md ${iconShadow}`}>
          {icon}
        </div>
        <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
      </div>
      <div className={`p-4 grid gap-3 ${compact ? 'grid-cols-3' : 'grid-cols-3 sm:grid-cols-6'}`}>
        {metrics.map((metric, i) => (
          <MetricCard key={i} {...metric} />
        ))}
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  format,
}: Metric) {
  let displayValue = 'N/A';
  let colorClass = 'text-gray-700 dark:text-gray-300';

  if (value !== null && !isNaN(value)) {
    if (format === 'currency') {
      displayValue = `$${value.toFixed(2)}`;
    } else if (format === 'percent') {
      displayValue = `${(value * 100).toFixed(1)}%`;
      colorClass = value >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
    } else {
      displayValue = value.toFixed(2);
    }
  }

  return (
    <div className="bg-gradient-to-br from-gray-50 to-slate-50 border border-gray-100 rounded-lg p-2.5 text-center dark:from-gray-700/50 dark:to-slate-700/50 dark:border-gray-600">
      <p className="text-xs text-gray-500 mb-1 truncate dark:text-gray-400">{label}</p>
      <p className={`font-bold text-sm ${colorClass}`}>{displayValue}</p>
    </div>
  );
}
