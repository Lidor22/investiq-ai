"""Stock data API routes."""

from fastapi import APIRouter, HTTPException

from app.models.schemas import StockNotFoundError, StockQuote
from app.services.stock_service import StockService

router = APIRouter(prefix="/stock", tags=["stock"])

# Service instance
stock_service = StockService()


@router.get("/{ticker}/quote", response_model=StockQuote)
async def get_quote(ticker: str) -> StockQuote:
    """Get current stock quote for a ticker.

    Args:
        ticker: Stock ticker symbol (e.g., AAPL, NVDA, MSFT)

    Returns:
        StockQuote with current price and key metrics
    """
    try:
        return await stock_service.get_quote(ticker.upper())
    except StockNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e.message))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching quote: {str(e)}")
