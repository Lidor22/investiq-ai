import { useState, useEffect } from 'react';
import { Moon, Sun, TrendingUp, Sparkles, BarChart3, Newspaper, Brain } from 'lucide-react';
import { useStockQuote, useBrief, useGenerateBrief } from './hooks/useStock';
import { useTheme } from './hooks/useTheme';
import { StockSearch } from './components/stock/StockSearch';
import { StockQuoteCard } from './components/stock/StockQuoteCard';
import { BriefDisplay } from './components/brief/BriefDisplay';
import { WatchlistPanel } from './components/watchlist/WatchlistPanel';
import { NewsPanel } from './components/news/NewsPanel';
import { PriceChart, TechnicalIndicators, AnalystPanel } from './components/technical';
import { EarningsChart, FinancialRatiosPanel } from './components/financial';
import { LoadingSpinner } from './components/shared/LoadingSpinner';
import { ErrorMessage } from './components/shared/ErrorMessage';

type Tab = 'overview' | 'financials' | 'news' | 'brief';

function App() {
  const [ticker, setTicker] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const { toggleTheme, isDark } = useTheme();

  const {
    data: quote,
    isLoading: isLoadingQuote,
    error: quoteError,
    refetch: refetchQuote,
  } = useStockQuote(ticker);

  // Auto-load cached brief
  const {
    data: cachedBrief,
    isLoading: isLoadingBrief,
  } = useBrief(ticker);

  const generateBriefMutation = useGenerateBrief();

  // Current brief is either from mutation or cache
  const brief = generateBriefMutation.data || cachedBrief;

  const handleSearch = (newTicker: string) => {
    setTicker(newTicker);
    generateBriefMutation.reset();
    setActiveTab('overview');
  };

  const handleGenerateBrief = (forceRegenerate = false) => {
    if (!ticker) return;
    generateBriefMutation.mutate(
      { ticker, forceRegenerate },
      {
        onSuccess: () => {
          setActiveTab('brief');
        },
      }
    );
  };

  // Auto-switch to brief tab if cached brief exists when loading a new ticker
  useEffect(() => {
    if (cachedBrief && !generateBriefMutation.data && activeTab === 'overview') {
      // Brief exists in cache - enable the tab but don't auto-switch
    }
  }, [cachedBrief, generateBriefMutation.data, activeTab]);

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: BarChart3 },
    { id: 'financials' as const, label: 'Financials', icon: TrendingUp },
    { id: 'news' as const, label: 'News', icon: Newspaper },
    { id: 'brief' as const, label: 'AI Brief', icon: Brain, badge: brief?.cached ? 'Cached' : undefined },
  ];

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <header className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900">
        {/* Decorative elements */}
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:32px_32px]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative mx-auto max-w-7xl px-4 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-400 to-purple-500 shadow-lg shadow-blue-500/25">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight">
                  InvestIQ
                </h1>
                <p className="text-xs text-blue-200/70">AI-Powered Investment Research</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <StockSearch onSearch={handleSearch} isLoading={isLoadingQuote} />

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white/80 hover:bg-white/20 hover:text-white transition-all"
                aria-label="Toggle theme"
              >
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="flex gap-6">
          {/* Sidebar - Watchlist */}
          <aside className="w-64 shrink-0">
            <WatchlistPanel
              onSelectTicker={handleSearch}
              selectedTicker={ticker}
            />
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 min-w-0">
            {/* Loading State */}
            {isLoadingQuote && (
              <div className="flex justify-center py-12">
                <LoadingSpinner size="lg" message={`Loading ${ticker}...`} />
              </div>
            )}

            {/* Error State */}
            {quoteError && (
              <div className="max-w-md mx-auto">
                <ErrorMessage
                  message={
                    (quoteError as Error).message?.includes('404')
                      ? `Ticker "${ticker}" not found`
                      : `Failed to load stock data`
                  }
                  onRetry={() => refetchQuote()}
                />
              </div>
            )}

            {/* Stock Content */}
            {quote && !isLoadingQuote && (
              <div className="space-y-6">
                {/* Quote Card */}
                <StockQuoteCard
                  quote={quote}
                  onGenerateBrief={() => handleGenerateBrief(false)}
                  isGeneratingBrief={generateBriefMutation.isPending}
                />

                {/* Tabs */}
                <div className={`rounded-xl border ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'} p-1 shadow-sm`}>
                  <nav className="flex gap-1">
                    {tabs.map((tab) => {
                      const Icon = tab.icon;
                      const isDisabled = tab.id === 'brief' && !brief && !generateBriefMutation.isPending && !isLoadingBrief;
                      const isActive = activeTab === tab.id;

                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          disabled={isDisabled}
                          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                            isActive
                              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                              : isDark
                              ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                          } ${isDisabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                        >
                          <Icon className="h-4 w-4" />
                          {tab.label}
                          {tab.badge && (
                            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                              isActive ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-600'
                            }`}>
                              {tab.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </nav>
                </div>

                {/* Tab Content */}
                <div className="animate-in fade-in duration-300">
                  {activeTab === 'overview' && (
                    <div className="space-y-4">
                      {/* Price Chart */}
                      <PriceChart ticker={ticker} />

                      {/* Technical Indicators & Analyst Data */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <TechnicalIndicators ticker={ticker} />
                        <AnalystPanel ticker={ticker} />
                      </div>

                      {/* Company Summary */}
                      <div className={`rounded-xl border ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'} p-6 shadow-sm card-hover`}>
                        <h3 className={`font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Company Summary</h3>
                        <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>
                          {quote.name} ({quote.ticker}) is currently trading at ${quote.price.toFixed(2)}.
                          {quote.market_cap && (
                            <> Market cap: ${(quote.market_cap / 1e9).toFixed(2)}B.</>
                          )}
                          {quote.pe_ratio && (
                            <> P/E ratio: {quote.pe_ratio.toFixed(2)}.</>
                          )}
                        </p>
                        <p className={`text-sm mt-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          Select the "News" tab to see recent news with AI summaries, or click
                          "Generate AI Brief" for a comprehensive investment analysis.
                        </p>
                      </div>
                    </div>
                  )}

                  {activeTab === 'financials' && (
                    <div className="space-y-4">
                      <EarningsChart ticker={ticker} />
                      <FinancialRatiosPanel ticker={ticker} />
                    </div>
                  )}

                  {activeTab === 'news' && (
                    <NewsPanel ticker={ticker} companyName={quote.name} />
                  )}

                  {activeTab === 'brief' && (
                    <>
                      {(generateBriefMutation.isPending || isLoadingBrief) && (
                        <div className="flex justify-center py-12">
                          <LoadingSpinner size="lg" message={generateBriefMutation.isPending ? "Generating AI investment brief..." : "Loading cached brief..."} />
                        </div>
                      )}
                      {generateBriefMutation.isError && (
                        <ErrorMessage
                          message={`Failed to generate brief: ${(generateBriefMutation.error as Error).message}`}
                          onRetry={() => handleGenerateBrief(true)}
                        />
                      )}
                      {brief && !generateBriefMutation.isPending && !isLoadingBrief && (
                        <BriefDisplay
                          brief={brief}
                          onRegenerate={() => handleGenerateBrief(true)}
                          isRegenerating={generateBriefMutation.isPending}
                        />
                      )}
                      {!brief && !generateBriefMutation.isPending && !isLoadingBrief && !generateBriefMutation.isError && (
                        <div className={`rounded-xl border ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'} p-8 text-center shadow-sm`}>
                          <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                            Click "Generate AI Brief" to create an investment analysis.
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Empty State */}
            {!ticker && !isLoadingQuote && (
              <div className={`rounded-2xl border-2 border-dashed ${isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-white/50'} p-12 text-center`}>
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/25 mb-6">
                  <TrendingUp className="h-8 w-8 text-white" />
                </div>
                <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Welcome to InvestIQ
                </h2>
                <p className={`max-w-md mx-auto mb-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Your AI-powered investment research assistant. Search for any stock to get comprehensive analysis, technical indicators, and AI-generated insights.
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {['NVDA', 'AAPL', 'MSFT', 'GOOGL', 'TSLA'].map((t) => (
                    <button
                      key={t}
                      onClick={() => handleSearch(t)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        isDark
                          ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default App;
