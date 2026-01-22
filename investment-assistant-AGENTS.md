# AGENTS.md - Investment Research Assistant

## Project Overview

This is a personal investment research assistant web application. It aggregates stock data, news, and technical analysis, then uses Groq AI (Llama 3.3 70B) to generate investment briefs.

**Tech Stack:**
- Backend: Python 3.11+, FastAPI, SQLite, yfinance
- Frontend: React 18+, TypeScript, Vite, Tailwind CSS, TanStack Query
- AI: Groq API (Llama 3.3 70B)

## Repository Structure

```
investment-assistant/
├── backend/           # FastAPI Python backend
│   ├── app/
│   │   ├── main.py   # Entry point
│   │   ├── api/      # Route handlers
│   │   ├── services/ # Business logic
│   │   └── models/   # Pydantic + DB models
│   └── tests/
├── frontend/          # React TypeScript frontend
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── hooks/
│       └── services/
└── docs/             # Documentation
```

## Coding Standards

### Python (Backend)

- Use Python 3.11+ features
- All functions must have type hints
- Use Pydantic for all data validation
- Use async/await for I/O operations
- Format with `ruff format`, lint with `ruff check`
- Docstrings for public functions (Google style)

```python
# Good example
async def get_stock_quote(ticker: str) -> StockQuote:
    """Fetch current stock quote from yfinance.
    
    Args:
        ticker: Stock ticker symbol (e.g., "AAPL")
        
    Returns:
        StockQuote with current price and metrics
        
    Raises:
        StockNotFoundError: If ticker doesn't exist
    """
    ...
```

### TypeScript (Frontend)

- Strict TypeScript, no `any` types
- Functional components with hooks
- Use TanStack Query for all API calls
- Tailwind for styling (no CSS files)
- Format with Prettier

```typescript
// Good example
interface StockCardProps {
  ticker: string;
  quote: StockQuote;
  onSelect: (ticker: string) => void;
}

export function StockCard({ ticker, quote, onSelect }: StockCardProps) {
  // ...
}
```

## Key Patterns

### Backend API Pattern

All routes follow this pattern:

```python
from fastapi import APIRouter, Depends, HTTPException
from app.services.stock_service import StockService
from app.models.schemas import StockQuote

router = APIRouter(prefix="/stock", tags=["stock"])

@router.get("/{ticker}/quote", response_model=StockQuote)
async def get_quote(
    ticker: str,
    stock_service: StockService = Depends()
) -> StockQuote:
    try:
        return await stock_service.get_quote(ticker.upper())
    except StockNotFoundError:
        raise HTTPException(status_code=404, detail=f"Ticker {ticker} not found")
```

### Frontend Data Fetching Pattern

Use TanStack Query hooks:

```typescript
// hooks/useStock.ts
export function useStockQuote(ticker: string) {
  return useQuery({
    queryKey: ['stock', ticker, 'quote'],
    queryFn: () => api.getStockQuote(ticker),
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!ticker,
  });
}

// Usage in component
function StockDetail({ ticker }: { ticker: string }) {
  const { data: quote, isLoading, error } = useStockQuote(ticker);
  
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  
  return <StockQuoteDisplay quote={quote} />;
}
```

### Groq AI Integration Pattern

```python
# services/ai_service.py
from groq import Groq
from app.config import settings

class AIService:
    MODEL = "llama-3.3-70b-versatile"

    def __init__(self):
        self.client = Groq(api_key=settings.groq_api_key)

    async def generate_brief(self, ticker: str, data: dict) -> InvestmentBrief:
        prompt = self._build_brief_prompt(ticker, data)

        response = self.client.chat.completions.create(
            model=self.MODEL,
            max_tokens=2000,
            messages=[{"role": "user", "content": prompt}]
        )

        result = json.loads(response.choices[0].message.content)
        return InvestmentBrief(ticker=ticker, **result)

    def _build_brief_prompt(self, ticker: str, data: dict) -> str:
        # Load prompt template from file
        template = (Path(__file__).parent / "prompts" / "brief.txt").read_text()
        return template.format(ticker=ticker, **data)
```

## Important Implementation Notes

### Caching Strategy

Cache all external API responses to respect rate limits:

```python
# Cache TTLs
QUOTE_CACHE_TTL = 60 * 15      # 15 minutes for quotes
NEWS_CACHE_TTL = 60 * 60       # 1 hour for news
FINANCIALS_CACHE_TTL = 60 * 60 * 24  # 24 hours for quarterly data
```

### Error Handling

Backend should return structured errors:

```python
class APIError(Exception):
    def __init__(self, message: str, code: str, status_code: int = 400):
        self.message = message
        self.code = code
        self.status_code = status_code

# In exception handler
@app.exception_handler(APIError)
async def api_error_handler(request: Request, exc: APIError):
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.code, "message": exc.message}
    )
```

### Environment Variables

Required env vars (backend):
- `GROQ_API_KEY` - Groq API key (free at console.groq.com)
- `NEWS_API_KEY` - NewsAPI key (optional)
- `DATABASE_URL` - SQLite path (default: `sqlite:///./data/investiq.db`)

Required env vars (frontend):
- `VITE_API_BASE_URL` - Backend URL (default: `http://localhost:8000/api/v1`)

## Task Breakdown

When implementing features, follow this order:

### Phase 1: Backend Foundation
1. Set up FastAPI with CORS, error handling
2. Create SQLite database with migrations
3. Implement `/stock/{ticker}/quote` endpoint with yfinance
4. Add basic caching

### Phase 2: Frontend Foundation  
1. Set up Vite + React + TypeScript + Tailwind
2. Create API client service
3. Build StockSearch component
4. Build StockQuote display component

### Phase 3: AI Integration
1. Create AIService with Groq client
2. Implement brief generation endpoint
3. Build BriefDisplay frontend component
4. Add loading states for generation

### Phase 4: News & Technicals
1. Add news aggregation service
2. Add technical indicators calculation
3. Build news and technicals UI tabs
4. Integrate into brief generation

### Phase 5: Watchlist
1. Implement watchlist CRUD in backend
2. Build watchlist management UI
3. Add category filtering
4. Create dashboard overview

## Common Commands

```bash
# Backend
cd backend
uv run uvicorn app.main:app --reload

# Frontend  
cd frontend
npm run dev

# Run both (from root)
make dev  # if Makefile exists

# Format/lint
cd backend && ruff format . && ruff check . --fix
cd frontend && npm run lint:fix
```

## Testing Guidelines

- Backend: pytest with async support
- Frontend: Vitest + React Testing Library
- Always mock external APIs in tests
- Test happy path + error cases

```python
# Example backend test
@pytest.mark.asyncio
async def test_get_stock_quote(mock_yfinance):
    mock_yfinance.return_value = {"currentPrice": 150.0, ...}
    
    service = StockService()
    quote = await service.get_quote("AAPL")
    
    assert quote.ticker == "AAPL"
    assert quote.price == 150.0
```

## Do Not

- ❌ Use `any` type in TypeScript
- ❌ Make direct API calls without caching consideration
- ❌ Store API keys in code
- ❌ Skip error handling on external API calls
- ❌ Use CSS files (use Tailwind classes)
- ❌ Create components without TypeScript interfaces
- ❌ Ignore rate limits on financial APIs

## Reference Files

When implementing, refer to these spec sections:
- Data models: See "Pydantic Models" section in spec
- API endpoints: See "API Endpoints" section in spec
- AI prompts: See "AI Integration" section in spec
- Component tree: See "Frontend Components" section in spec
