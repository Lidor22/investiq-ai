# Investment Research Assistant - System Design Specification

## Project Overview

**Name:** InvestIQ (or choose your own)

**Purpose:** A personal investment research assistant that aggregates news, financial data, and technical analysis for stocks, then uses AI to generate actionable investment briefs.

**Target User:** Individual investor who wants consolidated research on their watchlist without manually checking multiple sources.

**Platform:** Web application (can be wrapped as desktop app later with Tauri)

---

## Core Features

### 1. Watchlist Management
- Add/remove tickers to personal watchlist
- Organize by categories (e.g., "Nuclear", "Semiconductors", "Data Centers")
- Persist watchlist in local storage/database

### 2. Company Dashboard
- Real-time price and change (daily, weekly, YTD)
- Key metrics: Market Cap, P/E, EPS, 52-week range
- Quick actions: Generate Brief, View News, View Technicals

### 3. News Intelligence
- Aggregate recent news from multiple sources (last 7 days)
- AI-powered summarization: "What happened this week"
- Sentiment analysis per article and overall
- Source attribution and links to original articles

### 4. Quarterly Reports Analysis
- Latest quarterly financial data (revenue, EPS, margins)
- Quarter-over-quarter and year-over-year comparisons
- AI summary of earnings: key takeaways, guidance, concerns
- Historical trend visualization

### 5. Technical Analysis
- Interactive price chart with configurable timeframes
- Technical indicators: SMA (20, 50, 200), RSI, MACD, Volume
- AI interpretation of technical setup
- Support/resistance level identification

### 6. AI Investment Brief
- Comprehensive analysis combining all data sources
- Structured output: Bull Case, Bear Case, Key Risks, Catalysts
- Confidence score or conviction level
- Suggested position sizing considerations (informational only)

---

## System Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                        Frontend (React)                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │Watchlist │ │Dashboard │ │  Charts  │ │AI Brief  │          │
│  │  View    │ │  View    │ │  View    │ │  View    │          │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘          │
│       └────────────┴────────────┴────────────┘                 │
│                           │                                     │
│                    React Query / TanStack Query                 │
└───────────────────────────┬────────────────────────────────────┘
                            │ HTTP/REST
┌───────────────────────────▼────────────────────────────────────┐
│                    Backend (Python FastAPI)                     │
│                                                                 │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐              │
│  │   Stock     │ │    News     │ │     AI      │              │
│  │  Service    │ │   Service   │ │   Service   │              │
│  └──────┬──────┘ └──────┬──────┘ └──────┬──────┘              │
│         │               │               │                      │
│  ┌──────▼──────┐ ┌──────▼──────┐ ┌──────▼──────┐              │
│  │  yfinance   │ │  NewsAPI /  │ │   Claude    │              │
│  │Alpha Vantage│ │   Finnhub   │ │    API      │              │
│  └─────────────┘ └─────────────┘ └─────────────┘              │
│                                                                 │
│  ┌─────────────────────────────────────────────┐              │
│  │              SQLite Database                 │              │
│  │  - Watchlist    - Cached Data   - Briefs    │              │
│  └─────────────────────────────────────────────┘              │
└────────────────────────────────────────────────────────────────┘
```

---

## Data Models

### Database Schema (SQLite)

```sql
-- Watchlist table
CREATE TABLE watchlist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticker VARCHAR(10) NOT NULL UNIQUE,
    name VARCHAR(255),
    category VARCHAR(100),
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);

-- Cached stock data (to reduce API calls)
CREATE TABLE stock_cache (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticker VARCHAR(10) NOT NULL,
    data_type VARCHAR(50) NOT NULL, -- 'quote', 'financials', 'technicals'
    data JSON NOT NULL,
    fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    UNIQUE(ticker, data_type)
);

-- News cache
CREATE TABLE news_cache (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticker VARCHAR(10) NOT NULL,
    articles JSON NOT NULL,
    summary TEXT,
    sentiment VARCHAR(20),
    fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Generated briefs
CREATE TABLE briefs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticker VARCHAR(10) NOT NULL,
    brief_type VARCHAR(50) DEFAULT 'full', -- 'full', 'news_only', 'technical_only'
    content JSON NOT NULL,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User preferences
CREATE TABLE preferences (
    key VARCHAR(100) PRIMARY KEY,
    value JSON NOT NULL
);
```

### Pydantic Models (Backend)

```python
from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
from enum import Enum

class Sentiment(str, Enum):
    BULLISH = "bullish"
    BEARISH = "bearish"
    NEUTRAL = "neutral"

# Stock Models
class StockQuote(BaseModel):
    ticker: str
    name: str
    price: float
    change: float
    change_percent: float
    volume: int
    market_cap: Optional[float]
    pe_ratio: Optional[float]
    eps: Optional[float]
    week_52_high: float
    week_52_low: float
    updated_at: datetime

class FinancialData(BaseModel):
    ticker: str
    quarter: str  # e.g., "Q3 2024"
    revenue: float
    revenue_growth_yoy: Optional[float]
    net_income: float
    eps: float
    eps_growth_yoy: Optional[float]
    gross_margin: Optional[float]
    operating_margin: Optional[float]

class TechnicalIndicators(BaseModel):
    ticker: str
    timeframe: str
    sma_20: Optional[float]
    sma_50: Optional[float]
    sma_200: Optional[float]
    rsi_14: Optional[float]
    macd: Optional[float]
    macd_signal: Optional[float]
    macd_histogram: Optional[float]
    volume_avg_20: Optional[int]
    support_levels: List[float]
    resistance_levels: List[float]

# News Models
class NewsArticle(BaseModel):
    title: str
    source: str
    url: str
    published_at: datetime
    summary: Optional[str]
    sentiment: Optional[Sentiment]

class NewsSummary(BaseModel):
    ticker: str
    articles: List[NewsArticle]
    ai_summary: str
    overall_sentiment: Sentiment
    fetched_at: datetime

# AI Brief Models
class InvestmentBrief(BaseModel):
    ticker: str
    company_name: str
    generated_at: datetime
    
    # Summary
    executive_summary: str
    
    # Analysis sections
    bull_case: List[str]
    bear_case: List[str]
    key_risks: List[str]
    catalysts: List[str]
    
    # Technical summary
    technical_outlook: str
    
    # News summary
    recent_developments: str
    
    # Financials summary
    financial_health: str
    
    # Overall
    conclusion: str
    sentiment: Sentiment

# Watchlist Models
class WatchlistItem(BaseModel):
    id: int
    ticker: str
    name: Optional[str]
    category: Optional[str]
    added_at: datetime
    notes: Optional[str]

class WatchlistCreate(BaseModel):
    ticker: str
    category: Optional[str] = None
    notes: Optional[str] = None

# API Response Models
class StockDashboard(BaseModel):
    quote: StockQuote
    financials: List[FinancialData]
    technicals: TechnicalIndicators
    news: NewsSummary
```

---

## API Endpoints

### Base URL: `/api/v1`

### Watchlist Endpoints

```
GET    /watchlist                    - Get all watchlist items
POST   /watchlist                    - Add ticker to watchlist
DELETE /watchlist/{ticker}           - Remove ticker from watchlist
PATCH  /watchlist/{ticker}           - Update ticker (category, notes)
GET    /watchlist/categories         - Get all categories
```

### Stock Data Endpoints

```
GET    /stock/{ticker}/quote         - Get current quote
GET    /stock/{ticker}/financials    - Get quarterly financials
GET    /stock/{ticker}/technicals    - Get technical indicators
GET    /stock/{ticker}/history       - Get price history
       Query params: period (1d, 5d, 1mo, 3mo, 6mo, 1y, 5y)
GET    /stock/{ticker}/dashboard     - Get all data combined
```

### News Endpoints

```
GET    /news/{ticker}                - Get recent news for ticker
       Query params: days (default: 7), limit (default: 20)
GET    /news/{ticker}/summary        - Get AI-summarized news
```

### AI Brief Endpoints

```
POST   /brief/{ticker}/generate      - Generate new investment brief
       Body: { "include_news": true, "include_technicals": true }
GET    /brief/{ticker}/latest        - Get most recent brief
GET    /brief/{ticker}/history       - Get all briefs for ticker
```

### Search Endpoints

```
GET    /search?q={query}             - Search for tickers/companies
```

---

## Frontend Components

### Component Tree

```
App
├── Layout
│   ├── Sidebar
│   │   ├── Logo
│   │   ├── Navigation
│   │   └── WatchlistQuickView
│   └── MainContent
│       └── [Routes]
│
├── Pages
│   ├── DashboardPage
│   │   ├── WatchlistOverview
│   │   └── MarketSummary
│   │
│   ├── StockDetailPage
│   │   ├── StockHeader (price, change, key metrics)
│   │   ├── TabNavigation
│   │   ├── OverviewTab
│   │   │   ├── PriceChart
│   │   │   ├── KeyMetricsCard
│   │   │   └── QuickBriefCard
│   │   ├── NewsTab
│   │   │   ├── NewsSummaryCard
│   │   │   └── NewsArticleList
│   │   ├── FinancialsTab
│   │   │   ├── QuarterlyTable
│   │   │   └── FinancialCharts
│   │   ├── TechnicalsTab
│   │   │   ├── AdvancedChart
│   │   │   ├── IndicatorsPanel
│   │   │   └── TechnicalSummary
│   │   └── BriefTab
│   │       ├── BriefGenerator
│   │       └── BriefDisplay
│   │
│   ├── WatchlistPage
│   │   ├── CategoryFilter
│   │   ├── WatchlistTable
│   │   └── AddTickerModal
│   │
│   └── SettingsPage
│       ├── APIKeysForm
│       └── PreferencesForm
│
└── Shared Components
    ├── StockCard
    ├── SentimentBadge
    ├── LoadingSpinner
    ├── ErrorBoundary
    └── Charts
        ├── PriceChart (lightweight-charts or recharts)
        └── FinancialChart
```

### Key UI States

Each data-fetching component should handle:
- **Loading**: Skeleton or spinner
- **Error**: Error message with retry button
- **Empty**: Helpful empty state
- **Success**: Data display

---

## External Data Sources

### 1. Yahoo Finance (via yfinance)
- **Use for:** Price quotes, historical data, basic financials
- **Rate limits:** Unofficial API, be respectful (cache aggressively)
- **Installation:** `pip install yfinance`

```python
import yfinance as yf

def get_stock_quote(ticker: str) -> dict:
    stock = yf.Ticker(ticker)
    info = stock.info
    return {
        "price": info.get("currentPrice"),
        "change": info.get("currentPrice") - info.get("previousClose"),
        "market_cap": info.get("marketCap"),
        "pe_ratio": info.get("trailingPE"),
        # ... etc
    }

def get_price_history(ticker: str, period: str = "1y") -> pd.DataFrame:
    stock = yf.Ticker(ticker)
    return stock.history(period=period)
```

### 2. Alpha Vantage (backup/additional data)
- **Use for:** More detailed financials, earnings data
- **Rate limits:** 5 calls/min (free tier), 75 calls/day
- **API Key:** Required (free)

### 3. NewsAPI
- **Use for:** News aggregation
- **Rate limits:** 100 requests/day (free tier)
- **API Key:** Required (free)

```python
import requests

def get_news(ticker: str, company_name: str, days: int = 7) -> list:
    url = "https://newsapi.org/v2/everything"
    params = {
        "q": f"{ticker} OR {company_name}",
        "sortBy": "publishedAt",
        "language": "en",
        "from": (datetime.now() - timedelta(days=days)).isoformat(),
        "apiKey": NEWS_API_KEY
    }
    response = requests.get(url, params=params)
    return response.json().get("articles", [])
```

### 4. Finnhub (alternative news source)
- **Use for:** Company news, sentiment
- **Rate limits:** 60 calls/min (free tier)
- **API Key:** Required (free)

### 5. SEC EDGAR
- **Use for:** Official filings (10-K, 10-Q, 8-K)
- **Rate limits:** 10 requests/second
- **API Key:** Not required (use User-Agent header)

---

## AI Integration (Claude API)

### System Prompts

#### News Summarization Prompt

```
You are a financial analyst assistant. Summarize the following news articles about {company_name} ({ticker}).

Provide:
1. A 2-3 sentence executive summary of what happened this week
2. Overall sentiment (bullish/bearish/neutral) with brief justification
3. Key themes or topics covered

Articles:
{articles_json}

Respond in JSON format:
{
  "summary": "...",
  "sentiment": "bullish|bearish|neutral",
  "sentiment_reasoning": "...",
  "key_themes": ["theme1", "theme2"]
}
```

#### Technical Analysis Interpretation Prompt

```
You are a technical analyst. Interpret the following technical indicators for {ticker}:

Current Price: ${price}
SMA 20: ${sma_20}
SMA 50: ${sma_50}
SMA 200: ${sma_200}
RSI (14): {rsi}
MACD: {macd}
MACD Signal: {macd_signal}
Volume vs 20-day avg: {volume_ratio}%

Provide a brief technical outlook (2-3 sentences) covering:
- Current trend (bullish/bearish/sideways)
- Key levels to watch
- Any notable signals or divergences

Keep it concise and actionable.
```

#### Full Investment Brief Prompt

```
You are a senior equity research analyst. Generate a comprehensive investment brief for {company_name} ({ticker}).

## Available Data

### Current Quote
{quote_json}

### Recent Quarterly Financials
{financials_json}

### Technical Indicators
{technicals_json}

### Recent News Summary
{news_summary}

## Instructions

Generate a structured investment brief with the following sections:

1. **Executive Summary** (2-3 sentences)
2. **Bull Case** (3-5 bullet points)
3. **Bear Case** (3-5 bullet points)
4. **Key Risks** (3-5 bullet points)
5. **Upcoming Catalysts** (2-4 bullet points)
6. **Technical Outlook** (1-2 sentences)
7. **Financial Health Assessment** (1-2 sentences)
8. **Recent Developments** (1-2 sentences based on news)
9. **Conclusion** (2-3 sentences with overall stance)

Respond in JSON format matching this structure:
{
  "executive_summary": "...",
  "bull_case": ["...", "..."],
  "bear_case": ["...", "..."],
  "key_risks": ["...", "..."],
  "catalysts": ["...", "..."],
  "technical_outlook": "...",
  "financial_health": "...",
  "recent_developments": "...",
  "conclusion": "...",
  "sentiment": "bullish|bearish|neutral"
}

Be specific, cite numbers where available, and avoid generic statements.
```

### Claude API Integration

```python
import anthropic

client = anthropic.Anthropic(api_key=CLAUDE_API_KEY)

async def generate_brief(ticker: str, data: dict) -> InvestmentBrief:
    prompt = BRIEF_PROMPT_TEMPLATE.format(
        company_name=data["quote"]["name"],
        ticker=ticker,
        quote_json=json.dumps(data["quote"]),
        financials_json=json.dumps(data["financials"]),
        technicals_json=json.dumps(data["technicals"]),
        news_summary=data["news"]["summary"]
    )
    
    message = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=2000,
        messages=[
            {"role": "user", "content": prompt}
        ]
    )
    
    result = json.loads(message.content[0].text)
    return InvestmentBrief(ticker=ticker, **result)
```

---

## Project Structure

```
investment-assistant/
├── README.md
├── docker-compose.yml          # Optional: for containerized setup
│
├── backend/
│   ├── pyproject.toml          # Python dependencies (use uv or poetry)
│   ├── .env.example
│   │
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py             # FastAPI app entry point
│   │   ├── config.py           # Settings and environment variables
│   │   │
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   ├── routes/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── watchlist.py
│   │   │   │   ├── stock.py
│   │   │   │   ├── news.py
│   │   │   │   ├── brief.py
│   │   │   │   └── search.py
│   │   │   └── deps.py         # Dependency injection
│   │   │
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── database.py     # SQLite models
│   │   │   └── schemas.py      # Pydantic models
│   │   │
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── stock_service.py
│   │   │   ├── news_service.py
│   │   │   ├── technical_service.py
│   │   │   ├── ai_service.py
│   │   │   └── cache_service.py
│   │   │
│   │   └── utils/
│   │       ├── __init__.py
│   │       └── helpers.py
│   │
│   └── tests/
│       ├── __init__.py
│       ├── test_stock.py
│       └── test_brief.py
│
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   ├── .env.example
│   │
│   ├── public/
│   │   └── favicon.ico
│   │
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── index.css
│       │
│       ├── components/
│       │   ├── layout/
│       │   │   ├── Sidebar.tsx
│       │   │   ├── Header.tsx
│       │   │   └── Layout.tsx
│       │   │
│       │   ├── stock/
│       │   │   ├── StockCard.tsx
│       │   │   ├── StockHeader.tsx
│       │   │   ├── PriceChart.tsx
│       │   │   ├── KeyMetrics.tsx
│       │   │   └── TechnicalIndicators.tsx
│       │   │
│       │   ├── news/
│       │   │   ├── NewsSummary.tsx
│       │   │   └── NewsArticle.tsx
│       │   │
│       │   ├── brief/
│       │   │   ├── BriefGenerator.tsx
│       │   │   └── BriefDisplay.tsx
│       │   │
│       │   ├── watchlist/
│       │   │   ├── WatchlistTable.tsx
│       │   │   └── AddTickerModal.tsx
│       │   │
│       │   └── shared/
│       │       ├── SentimentBadge.tsx
│       │       ├── LoadingSpinner.tsx
│       │       └── ErrorMessage.tsx
│       │
│       ├── pages/
│       │   ├── Dashboard.tsx
│       │   ├── StockDetail.tsx
│       │   ├── Watchlist.tsx
│       │   └── Settings.tsx
│       │
│       ├── hooks/
│       │   ├── useStock.ts
│       │   ├── useNews.ts
│       │   ├── useBrief.ts
│       │   └── useWatchlist.ts
│       │
│       ├── services/
│       │   └── api.ts           # API client (axios/fetch)
│       │
│       ├── types/
│       │   └── index.ts         # TypeScript interfaces
│       │
│       └── utils/
│           ├── formatters.ts    # Number/date formatting
│           └── constants.ts
│
└── docs/
    ├── API.md
    └── SETUP.md
```

---

## Implementation Phases

### Phase 1: Foundation (MVP)
**Goal:** Single stock lookup with basic data and AI brief

- [ ] Backend: FastAPI skeleton with health check
- [ ] Backend: yfinance integration for quotes
- [ ] Backend: Basic Claude integration for brief generation
- [ ] Frontend: React + Vite + Tailwind setup
- [ ] Frontend: Single stock search and display
- [ ] Frontend: Simple brief display

**Deliverable:** Can search for a stock, see quote, generate basic AI brief

### Phase 2: Core Features
**Goal:** Full watchlist and news integration

- [ ] Backend: SQLite database setup
- [ ] Backend: Watchlist CRUD endpoints
- [ ] Backend: News aggregation service
- [ ] Backend: News summarization with Claude
- [ ] Frontend: Watchlist management UI
- [ ] Frontend: News tab with summary

**Deliverable:** Can manage watchlist, see news summaries

### Phase 3: Technical Analysis
**Goal:** Charts and technical indicators

- [ ] Backend: Technical indicators calculation (pandas-ta)
- [ ] Backend: Price history endpoint
- [ ] Frontend: Interactive price chart (lightweight-charts)
- [ ] Frontend: Technical indicators display
- [ ] Backend: AI technical interpretation

**Deliverable:** Full technical analysis view with AI insights

### Phase 4: Financials & Polish
**Goal:** Quarterly data and polished UI

- [ ] Backend: Quarterly financials from yfinance
- [ ] Frontend: Financials tab with tables/charts
- [ ] Frontend: Full dashboard with overview
- [ ] Backend: Caching layer optimization
- [ ] Frontend: Loading states, error handling
- [ ] Frontend: Responsive design

**Deliverable:** Production-ready application

### Phase 5: Enhancements (Optional)
- [ ] Desktop app with Tauri
- [ ] Alerts/notifications for price movements
- [ ] Portfolio tracking
- [ ] Comparison view (multiple stocks)
- [ ] Export briefs to PDF
- [ ] Historical brief comparison

---

## Environment Variables

### Backend (.env)

```env
# API Keys
CLAUDE_API_KEY=sk-ant-...
NEWS_API_KEY=...
ALPHA_VANTAGE_KEY=...
FINNHUB_KEY=...

# Database
DATABASE_URL=sqlite:///./data/investiq.db

# App Settings
DEBUG=true
CACHE_TTL_MINUTES=15
```

### Frontend (.env)

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

---

## Development Commands

### Backend

```bash
cd backend

# Setup (using uv - recommended)
uv venv
source .venv/bin/activate
uv pip install -e ".[dev]"

# Run development server
uvicorn app.main:app --reload --port 8000

# Run tests
pytest

# Format code
ruff format .
ruff check . --fix
```

### Frontend

```bash
cd frontend

# Setup
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run tests
npm run test
```

---

## Notes for AI Agents

### When implementing this spec:

1. **Start with Phase 1** - Get the basic flow working end-to-end before adding features

2. **Use type hints everywhere** - Both Python (Pydantic) and TypeScript for better AI assistance

3. **Cache aggressively** - Financial APIs have rate limits; cache stock data for 15 min, news for 1 hour

4. **Handle errors gracefully** - APIs fail; always have fallbacks and clear error messages

5. **Keep Claude prompts in separate files** - Easier to iterate on them

6. **Test with real tickers** - Use AAPL, MSFT, NVDA for testing (high liquidity, good data)

7. **Respect rate limits** - Add delays between API calls if needed

### Key decisions made:

- **SQLite over PostgreSQL** - Simpler for personal project, easy to backup
- **FastAPI over Flask** - Better async support, automatic OpenAPI docs
- **React over Vue/Svelte** - Larger ecosystem, more AI training data
- **yfinance as primary** - Free, reliable enough for personal use
- **Claude over GPT** - Better at structured output and financial reasoning

---

## Sample API Responses

### GET /api/v1/stock/NVDA/quote

```json
{
  "ticker": "NVDA",
  "name": "NVIDIA Corporation",
  "price": 142.50,
  "change": 3.25,
  "change_percent": 2.33,
  "volume": 45000000,
  "market_cap": 3500000000000,
  "pe_ratio": 65.2,
  "eps": 2.19,
  "week_52_high": 152.89,
  "week_52_low": 76.32,
  "updated_at": "2025-01-20T14:30:00Z"
}
```

### GET /api/v1/news/NVDA/summary

```json
{
  "ticker": "NVDA",
  "articles": [
    {
      "title": "NVIDIA Announces New AI Chip Architecture",
      "source": "Reuters",
      "url": "https://...",
      "published_at": "2025-01-19T10:00:00Z",
      "sentiment": "bullish"
    }
  ],
  "ai_summary": "NVIDIA dominated headlines this week with the announcement of their next-generation AI chip architecture, promising 2x performance improvements. Analysts raised price targets following the news, while competitors scrambled to respond.",
  "overall_sentiment": "bullish",
  "fetched_at": "2025-01-20T14:00:00Z"
}
```

### POST /api/v1/brief/NVDA/generate

```json
{
  "ticker": "NVDA",
  "company_name": "NVIDIA Corporation",
  "generated_at": "2025-01-20T14:35:00Z",
  "executive_summary": "NVIDIA remains the dominant force in AI infrastructure with strong momentum heading into 2025. Recent product announcements and continued data center demand support the bull case, though elevated valuation and potential competition pose risks.",
  "bull_case": [
    "Unmatched market position in AI/ML training chips with ~80% market share",
    "Data center revenue grew 150% YoY with no signs of slowing",
    "New Blackwell architecture extends technological lead over competitors",
    "Expanding software ecosystem (CUDA) creates significant moat"
  ],
  "bear_case": [
    "Premium valuation (65x P/E) leaves little room for execution missteps",
    "Customer concentration risk with hyperscalers developing custom chips",
    "China export restrictions limit TAM by estimated $5B annually",
    "Cyclical risk if AI investment slows"
  ],
  "key_risks": [
    "AMD and Intel gaining ground in inference chips",
    "Potential antitrust scrutiny of market dominance",
    "Supply chain constraints limiting near-term growth"
  ],
  "catalysts": [
    "Q4 earnings (Feb 21) - guidance for next fiscal year",
    "Blackwell production ramp Q1 2025",
    "GTC Conference announcements (March)"
  ],
  "technical_outlook": "Trading above all major moving averages with RSI at 62. Consolidating near all-time highs with support at $135.",
  "financial_health": "Exceptional fundamentals with 75% gross margins, minimal debt, and $25B cash position.",
  "recent_developments": "This week's architecture announcement and positive analyst revisions drove the stock up 8%.",
  "conclusion": "NVIDIA offers compelling growth but at a premium price. Suitable for long-term AI exposure with understanding of volatility risk. Consider accumulating on pullbacks to $130 support.",
  "sentiment": "bullish"
}
```
