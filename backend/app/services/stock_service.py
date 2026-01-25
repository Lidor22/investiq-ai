"""Stock data service using Finnhub API."""

from datetime import datetime

from app.models.schemas import StockNotFoundError, StockQuote
from app.services.finnhub_client import finnhub_client


class StockService:
    """Service for fetching stock data from Finnhub."""

    async def get_quote(self, ticker: str) -> StockQuote:
        """Fetch current stock quote from Finnhub.

        Args:
            ticker: Stock ticker symbol (e.g., "AAPL")

        Returns:
            StockQuote with current price and metrics

        Raises:
            StockNotFoundError: If ticker doesn't exist or has no data
        """
        ticker = ticker.upper()

        try:
            # Fetch quote and profile in parallel
            quote = await finnhub_client.get_quote(ticker)
            profile = await finnhub_client.get_company_profile(ticker)

            # Check if we got valid data
            if not quote or quote.get("c") is None or quote.get("c") == 0:
                raise StockNotFoundError(ticker)

            current_price = quote.get("c", 0)
            previous_close = quote.get("pc", 0)
            change = quote.get("d", 0) or (current_price - previous_close if previous_close else 0)
            change_percent = quote.get("dp", 0) or (
                (change / previous_close * 100) if previous_close else 0
            )

            # Get additional metrics from basic financials
            try:
                financials = await finnhub_client.get_basic_financials(ticker)
                metrics = financials.get("metric", {})
            except Exception:
                metrics = {}

            return StockQuote(
                ticker=ticker,
                name=profile.get("name") or ticker,
                price=current_price,
                change=round(change, 2) if change else 0,
                change_percent=round(change_percent, 2) if change_percent else 0,
                volume=metrics.get("10DayAverageTradingVolume", 0) * 1_000_000 if metrics.get("10DayAverageTradingVolume") else 0,
                market_cap=profile.get("marketCapitalization", 0) * 1_000_000 if profile.get("marketCapitalization") else None,
                pe_ratio=metrics.get("peBasicExclExtraTTM"),
                eps=metrics.get("epsBasicExclExtraItemsTTM"),
                week_52_high=metrics.get("52WeekHigh", 0),
                week_52_low=metrics.get("52WeekLow", 0),
                updated_at=datetime.utcnow(),
            )

        except StockNotFoundError:
            raise
        except Exception as e:
            raise StockNotFoundError(ticker) from e
