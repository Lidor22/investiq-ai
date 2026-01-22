import { useState } from 'react';
import { Newspaper, ExternalLink, Sparkles, Clock } from 'lucide-react';
import { useNewsSummary } from '../../hooks/useNews';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { SentimentBadge } from '../shared/SentimentBadge';
import { ErrorMessage } from '../shared/ErrorMessage';
import type { NewsArticle } from '../../types';

interface NewsPanelProps {
  ticker: string;
  companyName?: string;
}

export function NewsPanel({ ticker, companyName }: NewsPanelProps) {
  const [showAllArticles, setShowAllArticles] = useState(false);

  const { data: news, isLoading, error, refetch } = useNewsSummary(ticker);

  if (isLoading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-sky-400 to-blue-500 shadow-md shadow-sky-500/25">
            <Newspaper className="h-4 w-4 text-white" />
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white">News</h3>
        </div>
        <div className="flex justify-center py-8">
          <LoadingSpinner message="Loading news with AI summary..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <ErrorMessage
          message="Failed to load news"
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  if (!news || !news.articles.length) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-sky-400 to-blue-500 shadow-md shadow-sky-500/25">
            <Newspaper className="h-4 w-4 text-white" />
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white">News</h3>
        </div>
        <div className="text-center py-8">
          <Newspaper className="h-12 w-12 text-gray-300 mx-auto mb-3 dark:text-gray-600" />
          <p className="text-gray-500 dark:text-gray-400">
            No recent news found for {ticker}
          </p>
        </div>
      </div>
    );
  }

  const visibleArticles = showAllArticles ? news.articles : news.articles.slice(0, 5);

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden dark:border-gray-700 dark:bg-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 bg-gradient-to-r from-sky-50 to-blue-50 dark:from-sky-900/20 dark:to-blue-900/20 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-blue-500 shadow-lg shadow-sky-500/25">
            <Newspaper className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              News for {companyName || ticker}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">{news.articles.length} articles</p>
          </div>
        </div>
        {news.overall_sentiment && (
          <SentimentBadge sentiment={news.overall_sentiment} size="sm" />
        )}
      </div>

      {/* AI Summary */}
      {news.ai_summary && (
        <div className="border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50 p-5 dark:from-purple-900/20 dark:to-blue-900/20 dark:border-gray-700">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-purple-400 to-purple-600 shadow-md shadow-purple-500/25 shrink-0">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-purple-900 mb-1.5 dark:text-purple-300">AI Summary</p>
              <p className="text-sm text-gray-700 leading-relaxed dark:text-gray-300">{news.ai_summary}</p>
              {news.key_themes.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {news.key_themes.map((theme, i) => (
                    <span
                      key={i}
                      className="inline-block rounded-full bg-white/80 px-2.5 py-1 text-xs font-medium text-purple-700 shadow-sm dark:bg-purple-900/40 dark:text-purple-300"
                    >
                      {theme}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Articles List */}
      <div className="divide-y divide-gray-100 dark:divide-gray-700">
        {visibleArticles.map((article: NewsArticle, i: number) => (
          <ArticleItem key={i} article={article} />
        ))}
      </div>

      {/* Show more */}
      {news.articles.length > 5 && (
        <div className="border-t border-gray-200 px-4 py-3 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
          <button
            onClick={() => setShowAllArticles(!showAllArticles)}
            className="w-full text-center text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
          >
            {showAllArticles
              ? 'Show less'
              : `Show ${news.articles.length - 5} more articles`}
          </button>
        </div>
      )}
    </div>
  );
}

function ArticleItem({ article }: { article: NewsArticle }) {
  const timeAgo = getTimeAgo(new Date(article.published_at));

  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block px-6 py-4 hover:bg-gray-50 transition-colors dark:hover:bg-gray-700/50"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-900 leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors dark:text-white dark:group-hover:text-blue-400">
            {article.title}
          </h4>
          <div className="mt-2 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <span className="font-medium text-gray-600 dark:text-gray-300">{article.source}</span>
            <span className="text-gray-300 dark:text-gray-600">•</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {timeAgo}
            </span>
          </div>
        </div>
        <ExternalLink className="h-4 w-4 text-gray-400 shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity dark:text-gray-500" />
      </div>
    </a>
  );
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
}
