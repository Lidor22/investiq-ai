"""News API routes."""

from fastapi import APIRouter, HTTPException

from app.models.schemas import NewsSummary, StockNotFoundError
from app.services.news_service import NewsService
from app.services.stock_service import StockService
from app.services.ai_service import AIService, AIServiceError

router = APIRouter(prefix="/news", tags=["news"])

news_service = NewsService()
stock_service = StockService()


@router.get("/{ticker}", response_model=NewsSummary)
async def get_news(
    ticker: str,
    days: int = 7,
    limit: int = 20,
) -> NewsSummary:
    """Get recent news for a ticker.

    Args:
        ticker: Stock ticker symbol
        days: Number of days to look back (default: 7)
        limit: Maximum number of articles (default: 20)
    """
    ticker = ticker.upper()

    try:
        news = await news_service.get_news(ticker, days=days, limit=limit)
        return news
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching news: {e}")


@router.get("/{ticker}/summary", response_model=NewsSummary)
async def get_news_summary(
    ticker: str,
    days: int = 7,
) -> NewsSummary:
    """Get AI-summarized news for a ticker.

    Args:
        ticker: Stock ticker symbol
        days: Number of days to look back (default: 7)
    """
    ticker = ticker.upper()

    # Get the stock name for context
    try:
        quote = await stock_service.get_quote(ticker)
        company_name = quote.name
    except StockNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e.message))
    except Exception:
        company_name = ticker  # Fallback to ticker if quote fails

    # Get news
    try:
        news = await news_service.get_news(ticker, days=days, limit=15)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching news: {e}")

    if not news.articles:
        return news  # Return empty news if no articles found

    # Generate AI summary
    try:
        ai_service = AIService()
        news = await ai_service.summarize_news(news, company_name)
    except AIServiceError as e:
        # Return news without summary if AI fails
        news.ai_summary = f"Summary unavailable: {e.message}"

    return news
