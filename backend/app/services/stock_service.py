"""Stock data service using yfinance."""

from datetime import datetime

import yfinance as yf

from app.models.schemas import StockNotFoundError, StockQuote
from app.services.yf_session import yf_session


class StockService:
    """Service for fetching stock data from yfinance."""

    async def get_quote(self, ticker: str) -> StockQuote:
        """Fetch current stock quote from yfinance.

        Args:
            ticker: Stock ticker symbol (e.g., "AAPL")

        Returns:
            StockQuote with current price and metrics

        Raises:
            StockNotFoundError: If ticker doesn't exist or has no data
        """
        ticker = ticker.upper()
        stock = yf.Ticker(ticker, session=yf_session)
        info = stock.info

        # Check if we got valid data
        if not info or info.get("regularMarketPrice") is None:
            # Try alternative price field
            current_price = info.get("currentPrice")
            if current_price is None:
                raise StockNotFoundError(ticker)
        else:
            current_price = info.get("regularMarketPrice")

        previous_close = info.get("previousClose") or info.get("regularMarketPreviousClose", 0)
        change = current_price - previous_close if previous_close else 0
        change_percent = (change / previous_close * 100) if previous_close else 0

        return StockQuote(
            ticker=ticker,
            name=info.get("longName") or info.get("shortName") or ticker,
            price=current_price,
            change=round(change, 2),
            change_percent=round(change_percent, 2),
            volume=info.get("volume") or info.get("regularMarketVolume") or 0,
            market_cap=info.get("marketCap"),
            pe_ratio=info.get("trailingPE"),
            eps=info.get("trailingEps"),
            week_52_high=info.get("fiftyTwoWeekHigh") or 0,
            week_52_low=info.get("fiftyTwoWeekLow") or 0,
            updated_at=datetime.utcnow(),
        )
