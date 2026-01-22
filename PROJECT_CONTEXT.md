# InvestIQ - Project Context

## Overview
Investment research assistant with FastAPI backend and React/Vite/Tailwind frontend.

## Completed Features

### Phase 1-4: Core Features
- Stock quotes via yfinance
- AI investment briefs via Claude API
- Watchlist with SQLite persistence
- News aggregation (fixed for new yfinance API structure)
- Technical analysis (MA, RSI, MACD, support/resistance)
- Financial data (earnings, income, balance sheet, ratios)

### Phase 5: Enhancements
- Response caching with TTL (`/app/services/cache.py`)
- Rate limiting middleware (`/app/middleware/rate_limit.py`)
- Export endpoints (CSV/JSON) (`/app/api/routes/export.py`)
- ExportMenu and RefreshButton frontend components

### Recent Additions
1. **Ticker Dropdown** - `/frontend/src/components/stock/StockSearch.tsx`
   - Preloaded popular stocks by category (Tech, EV, Finance, Healthcare, Consumer)
   - Dropdown shows on focus with search filtering

2. **News Fix** - `/backend/app/services/news_service.py`
   - Fixed for yfinance's new nested API structure (`item.content.*`)
   - Handles both old and new formats

## Completed: AI Brief Caching

### Implementation
1. **Backend** (`/backend/app/api/routes/brief.py`):
   - Added `GET /{ticker}` endpoint to fetch cached briefs
   - Updated `POST /{ticker}/generate` to check cache first (unless force_regenerate=true)
   - Briefs saved to database after generation
   - Added `cached` field to InvestmentBrief schema
   - Added `force_regenerate` field to BriefGenerateRequest

2. **Frontend**:
   - `/frontend/src/services/api.ts` - Added `getBrief()`, updated `generateBrief(ticker, forceRegenerate)`
   - `/frontend/src/hooks/useStock.ts` - Added `useBrief()` query hook
   - `/frontend/src/components/brief/BriefDisplay.tsx` - Shows "Cached" badge, "Regenerate" button
   - `/frontend/src/App.tsx` - Auto-loads cached briefs, tab shows "(Cached)" indicator

## Key Files

### Backend
- `/backend/app/main.py` - FastAPI app entry
- `/backend/app/models/database.py` - SQLAlchemy models (Watchlist, StockCache, NewsCache, Brief)
- `/backend/app/models/schemas.py` - Pydantic schemas
- `/backend/app/services/ai_service.py` - Claude API integration
- `/backend/app/services/stock_service.py` - yfinance stock data
- `/backend/app/services/news_service.py` - News fetching (recently fixed)
- `/backend/app/api/routes/` - All API endpoints

### Frontend
- `/frontend/src/App.tsx` - Main app component
- `/frontend/src/services/api.ts` - API client functions
- `/frontend/src/hooks/useStock.ts` - TanStack Query hooks
- `/frontend/src/components/stock/StockSearch.tsx` - Ticker search with dropdown
- `/frontend/src/components/brief/BriefDisplay.tsx` - Brief display component

## Environment
- Backend: FastAPI + SQLAlchemy async + aiosqlite
- Frontend: React 18 + TypeScript + Vite + Tailwind + TanStack Query
- AI: Claude API via anthropic SDK
- Data: yfinance

## Running
```bash
# Backend
cd backend && uvicorn app.main:app --reload

# Frontend
cd frontend && npm run dev
```
