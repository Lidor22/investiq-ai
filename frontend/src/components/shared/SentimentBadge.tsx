import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { Sentiment } from '../../types';

interface SentimentBadgeProps {
  sentiment: Sentiment;
  size?: 'sm' | 'md';
}

export function SentimentBadge({ sentiment, size = 'md' }: SentimentBadgeProps) {
  const config = {
    bullish: {
      bg: 'bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/40 dark:to-emerald-900/40',
      border: 'border-green-200 dark:border-green-800',
      text: 'text-green-700 dark:text-green-300',
      icon: TrendingUp,
      label: 'Bullish',
    },
    bearish: {
      bg: 'bg-gradient-to-r from-red-100 to-rose-100 dark:from-red-900/40 dark:to-rose-900/40',
      border: 'border-red-200 dark:border-red-800',
      text: 'text-red-700 dark:text-red-300',
      icon: TrendingDown,
      label: 'Bearish',
    },
    neutral: {
      bg: 'bg-gradient-to-r from-gray-100 to-slate-100 dark:from-gray-700 dark:to-slate-700',
      border: 'border-gray-200 dark:border-gray-600',
      text: 'text-gray-700 dark:text-gray-300',
      icon: Minus,
      label: 'Neutral',
    },
  };

  const { bg, border, text, icon: Icon, label } = config[sentiment];
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs gap-1' : 'px-3 py-1.5 text-sm gap-1.5';
  const iconSize = size === 'sm' ? 12 : 16;

  return (
    <span className={`inline-flex items-center rounded-full font-semibold border ${bg} ${border} ${text} ${sizeClasses}`}>
      <Icon size={iconSize} />
      {label}
    </span>
  );
}
