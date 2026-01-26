import { useState, useRef, useEffect, type FormEvent } from 'react';
import { Search, ChevronDown, Loader2 } from 'lucide-react';
import { searchStocks, type StockSearchResult } from '../../services/api';

interface StockSearchProps {
  onSearch: (ticker: string) => void;
  isLoading?: boolean;
}

// Popular stocks organized by category (fallback when no search query)
const POPULAR_STOCKS = {
  'Tech Giants': [
    { ticker: 'AAPL', name: 'Apple Inc.' },
    { ticker: 'MSFT', name: 'Microsoft Corp.' },
    { ticker: 'GOOGL', name: 'Alphabet Inc.' },
    { ticker: 'AMZN', name: 'Amazon.com Inc.' },
    { ticker: 'META', name: 'Meta Platforms' },
    { ticker: 'NVDA', name: 'NVIDIA Corp.' },
  ],
  'EV & Auto': [
    { ticker: 'TSLA', name: 'Tesla Inc.' },
    { ticker: 'RIVN', name: 'Rivian Automotive' },
    { ticker: 'F', name: 'Ford Motor Co.' },
    { ticker: 'GM', name: 'General Motors' },
  ],
  'Finance': [
    { ticker: 'JPM', name: 'JPMorgan Chase' },
    { ticker: 'BAC', name: 'Bank of America' },
    { ticker: 'V', name: 'Visa Inc.' },
    { ticker: 'MA', name: 'Mastercard Inc.' },
  ],
  'Healthcare': [
    { ticker: 'JNJ', name: 'Johnson & Johnson' },
    { ticker: 'UNH', name: 'UnitedHealth Group' },
    { ticker: 'PFE', name: 'Pfizer Inc.' },
    { ticker: 'ABBV', name: 'AbbVie Inc.' },
  ],
  'Consumer': [
    { ticker: 'WMT', name: 'Walmart Inc.' },
    { ticker: 'KO', name: 'Coca-Cola Co.' },
    { ticker: 'PEP', name: 'PepsiCo Inc.' },
    { ticker: 'NKE', name: 'Nike Inc.' },
    { ticker: 'SBUX', name: 'Starbucks Corp.' },
  ],
};

export function StockSearch({ onSearch, isLoading }: StockSearchProps) {
  const [ticker, setTicker] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<StockSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Live search with debounce
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (ticker.trim().length >= 1) {
      setIsSearching(true);
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const results = await searchStocks(ticker.trim(), 15);
          setSearchResults(results);
        } catch {
          // Fall back to empty results on error
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      }, 300); // 300ms debounce
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [ticker]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = ticker.trim().toUpperCase();
    if (trimmed) {
      onSearch(trimmed);
      setIsDropdownOpen(false);
    }
  };

  const handleSelect = (selectedTicker: string) => {
    setTicker(selectedTicker);
    onSearch(selectedTicker);
    setIsDropdownOpen(false);
  };

  return (
    <div className="relative w-full max-w-md" ref={dropdownRef}>
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
            onFocus={() => setIsDropdownOpen(true)}
            placeholder="Search stocks..."
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 pl-11 pr-24 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-500"
            disabled={isLoading}
          />
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="p-1.5 text-gray-400 hover:text-gray-600"
            >
              <ChevronDown className={`h-4 w-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            <button
              type="submit"
              disabled={!ticker.trim() || isLoading}
              className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '...' : 'Go'}
            </button>
          </div>
        </div>
      </form>

      {/* Dropdown */}
      {isDropdownOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 max-h-80 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg z-50 dark:border-gray-600 dark:bg-gray-800">
          {ticker.trim() ? (
            // Show search results
            isSearching ? (
              <div className="flex items-center justify-center gap-2 px-4 py-6 text-sm text-gray-500 dark:text-gray-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                Searching...
              </div>
            ) : searchResults.length > 0 ? (
              <div className="py-1">
                {searchResults.map((stock) => (
                  <button
                    key={stock.ticker}
                    onClick={() => handleSelect(stock.ticker)}
                    className="flex w-full items-center justify-between px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white">{stock.ticker}</span>
                      <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">{stock.name}</span>
                    </div>
                    <span className="text-xs text-gray-400 dark:text-gray-500">{stock.exchange}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                No matches found. Press Enter to search for "{ticker}"
              </div>
            )
          ) : (
            // Show categories when no search query
            <div className="py-2">
              {Object.entries(POPULAR_STOCKS).map(([category, stocks]) => (
                <div key={category}>
                  <div className="px-4 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-700 dark:text-gray-500">
                    {category}
                  </div>
                  {stocks.map((stock) => (
                    <button
                      key={stock.ticker}
                      onClick={() => handleSelect(stock.ticker)}
                      className="flex w-full items-center justify-between px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <div>
                        <span className="font-medium text-gray-900 dark:text-white">{stock.ticker}</span>
                        <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">{stock.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
