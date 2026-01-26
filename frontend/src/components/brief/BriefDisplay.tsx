import { TrendingUp, TrendingDown, AlertTriangle, Zap, BarChart3, DollarSign, Newspaper, RefreshCw, Clock, Brain, Sparkles } from 'lucide-react';
import type { InvestmentBrief } from '../../types';
import { SentimentBadge } from '../shared/SentimentBadge';

interface BriefDisplayProps {
  brief: InvestmentBrief;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
}

export function BriefDisplay({ brief, onRegenerate, isRegenerating }: BriefDisplayProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden dark:border-gray-700 dark:bg-gray-800">
      {/* Header */}
      <div className="border-b border-gray-200 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 px-6 py-5 dark:from-indigo-900/20 dark:via-purple-900/20 dark:to-pink-900/20 dark:border-gray-700">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-lg shadow-purple-500/25">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                AI Investment Brief: {brief.ticker}
              </h3>
              <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  {new Date(brief.generated_at).toLocaleString()}
                </span>
                {brief.cached && (
                  <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                    Cached
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {onRegenerate && (
              <button
                onClick={onRegenerate}
                disabled={isRegenerating}
                className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-600"
              >
                <RefreshCw className={`h-4 w-4 ${isRegenerating ? 'animate-spin' : ''}`} />
                {isRegenerating ? 'Regenerating...' : 'Regenerate'}
              </button>
            )}
            <SentimentBadge sentiment={brief.sentiment} />
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Executive Summary */}
        <div className="rounded-xl bg-gradient-to-r from-gray-50 to-slate-50 p-5 border border-gray-100 dark:from-gray-800 dark:to-gray-800 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-5 w-5 text-purple-500" />
            <h4 className="font-semibold text-gray-900 dark:text-white">Executive Summary</h4>
          </div>
          <p className="text-gray-700 leading-relaxed dark:text-gray-300">{brief.executive_summary}</p>
        </div>

        {/* Bull & Bear Case */}
        <div className="grid gap-4 md:grid-cols-2">
          <BulletSection
            title="Bull Case"
            items={brief.bull_case}
            icon={<TrendingUp className="h-5 w-5 text-white" />}
            color="green"
          />
          <BulletSection
            title="Bear Case"
            items={brief.bear_case}
            icon={<TrendingDown className="h-5 w-5 text-white" />}
            color="red"
          />
        </div>

        {/* Risks & Catalysts */}
        <div className="grid gap-4 md:grid-cols-2">
          <BulletSection
            title="Key Risks"
            items={brief.key_risks}
            icon={<AlertTriangle className="h-5 w-5 text-white" />}
            color="amber"
          />
          <BulletSection
            title="Catalysts"
            items={brief.catalysts}
            icon={<Zap className="h-5 w-5 text-white" />}
            color="blue"
          />
        </div>

        {/* Analysis Sections */}
        <div className="grid gap-4 md:grid-cols-3">
          <AnalysisCard
            title="Technical Outlook"
            content={brief.technical_outlook}
            icon={<BarChart3 className="h-5 w-5 text-purple-500" />}
            gradient="from-purple-500 to-indigo-500"
          />
          <AnalysisCard
            title="Financial Health"
            content={brief.financial_health}
            icon={<DollarSign className="h-5 w-5 text-emerald-500" />}
            gradient="from-emerald-500 to-teal-500"
          />
          <AnalysisCard
            title="Recent Developments"
            content={brief.recent_developments}
            icon={<Newspaper className="h-5 w-5 text-sky-500" />}
            gradient="from-sky-500 to-blue-500"
          />
        </div>

        {/* Conclusion */}
        <div className="rounded-xl bg-gradient-to-r from-slate-100 to-gray-100 p-5 border border-gray-200 dark:from-gray-800 dark:to-gray-800 dark:border-gray-700">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 dark:text-white">
            <span className="h-2 w-2 rounded-full bg-blue-500" />
            Conclusion
          </h4>
          <p className="text-gray-700 leading-relaxed dark:text-gray-300">{brief.conclusion}</p>
        </div>
      </div>
    </div>
  );
}

function BulletSection({
  title,
  items,
  icon,
  color,
}: {
  title: string;
  items: string[];
  icon: React.ReactNode;
  color: 'green' | 'red' | 'amber' | 'blue';
}) {
  const colors = {
    green: {
      bg: 'bg-green-50 dark:bg-gray-800',
      border: 'border-green-200 dark:border-green-700',
      iconBg: 'bg-gradient-to-br from-green-400 to-emerald-500',
      bullet: 'bg-green-500 dark:bg-green-400',
      shadow: 'shadow-green-500/25',
    },
    red: {
      bg: 'bg-red-50 dark:bg-gray-800',
      border: 'border-red-200 dark:border-red-700',
      iconBg: 'bg-gradient-to-br from-red-400 to-rose-500',
      bullet: 'bg-red-500 dark:bg-red-400',
      shadow: 'shadow-red-500/25',
    },
    amber: {
      bg: 'bg-amber-50 dark:bg-gray-800',
      border: 'border-amber-200 dark:border-amber-700',
      iconBg: 'bg-gradient-to-br from-amber-400 to-orange-500',
      bullet: 'bg-amber-500 dark:bg-amber-400',
      shadow: 'shadow-amber-500/25',
    },
    blue: {
      bg: 'bg-blue-50 dark:bg-gray-800',
      border: 'border-blue-200 dark:border-blue-700',
      iconBg: 'bg-gradient-to-br from-blue-400 to-indigo-500',
      bullet: 'bg-blue-500 dark:bg-blue-400',
      shadow: 'shadow-blue-500/25',
    },
  };

  const c = colors[color];

  return (
    <div className={`rounded-xl p-5 border ${c.bg} ${c.border}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${c.iconBg} shadow-md ${c.shadow}`}>
          {icon}
        </div>
        <h4 className="font-semibold text-gray-900 dark:text-white">{title}</h4>
      </div>
      <ul className="space-y-2.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300">
            <span className={`mt-2 h-1.5 w-1.5 rounded-full ${c.bullet} shrink-0`} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function AnalysisCard({
  title,
  content,
  icon,
  gradient,
}: {
  title: string;
  content: string;
  icon: React.ReactNode;
  gradient: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden hover:shadow-md hover:border-gray-300 transition-all dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600">
      <div className={`h-1 bg-gradient-to-r ${gradient}`} />
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          {icon}
          <h4 className="font-semibold text-gray-900 text-sm dark:text-white">{title}</h4>
        </div>
        <p className="text-sm text-gray-700 leading-relaxed dark:text-gray-300">{content}</p>
      </div>
    </div>
  );
}
