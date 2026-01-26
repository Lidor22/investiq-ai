"""Finnhub API client for stock market data."""

import httpx
from typing import Any
from datetime import datetime, timedelta

from app.config import settings

FINNHUB_BASE_URL = "https://finnhub.io/api/v1"


class FinnhubClient:
    """Client for Finnhub API requests."""

    def __init__(self):
        self.api_key = settings.finnhub_api_key
        self.base_url = FINNHUB_BASE_URL

    def _get_headers(self) -> dict:
        return {"X-Finnhub-Token": self.api_key}

    async def _request(self, endpoint: str, params: dict | None = None) -> dict | list:
        """Make an async request to Finnhub API."""
        async with httpx.AsyncClient() as client:
            url = f"{self.base_url}{endpoint}"
            # Add token as query parameter (required for some endpoints on free tier)
            if params is None:
                params = {}
            params["token"] = self.api_key
            response = await client.get(
                url,
                params=params,
                headers=self._get_headers(),
                timeout=30.0
            )
            response.raise_for_status()
            return response.json()

    async def get_quote(self, symbol: str) -> dict[str, Any]:
        """Get real-time quote for a symbol.

        Returns: c (current), d (change), dp (percent change), h (high), l (low),
                 o (open), pc (previous close), t (timestamp)
        """
        return await self._request("/quote", {"symbol": symbol.upper()})

    async def get_company_profile(self, symbol: str) -> dict[str, Any]:
        """Get company profile information.

        Returns: name, ticker, exchange, industry, logo, marketCapitalization, etc.
        """
        return await self._request("/stock/profile2", {"symbol": symbol.upper()})

    async def get_basic_financials(self, symbol: str) -> dict[str, Any]:
        """Get basic financial metrics.

        Returns: metric dict with PE ratios, margins, growth rates, etc.
        """
        return await self._request("/stock/metric", {"symbol": symbol.upper(), "metric": "all"})

    async def get_company_news(
        self,
        symbol: str,
        from_date: str | None = None,
        to_date: str | None = None
    ) -> list[dict[str, Any]]:
        """Get company news articles.

        Args:
            symbol: Stock ticker
            from_date: Start date (YYYY-MM-DD)
            to_date: End date (YYYY-MM-DD)
        """
        if not from_date:
            from_date = (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d")
        if not to_date:
            to_date = datetime.now().strftime("%Y-%m-%d")

        return await self._request("/company-news", {
            "symbol": symbol.upper(),
            "from": from_date,
            "to": to_date
        })

    async def get_candles(
        self,
        symbol: str,
        resolution: str = "D",
        from_ts: int | None = None,
        to_ts: int | None = None
    ) -> dict[str, Any]:
        """Get OHLCV candle data.

        Args:
            symbol: Stock ticker
            resolution: Candle resolution (1, 5, 15, 30, 60, D, W, M)
            from_ts: Unix timestamp for start
            to_ts: Unix timestamp for end

        Returns: c (close), h (high), l (low), o (open), v (volume), t (timestamps), s (status)
        """
        if not to_ts:
            to_ts = int(datetime.now().timestamp())
        if not from_ts:
            # Default to 6 months of data
            from_ts = int((datetime.now() - timedelta(days=180)).timestamp())

        return await self._request("/stock/candle", {
            "symbol": symbol.upper(),
            "resolution": resolution,
            "from": from_ts,
            "to": to_ts
        })

    async def get_recommendation_trends(self, symbol: str) -> list[dict[str, Any]]:
        """Get analyst recommendation trends.

        Returns list with buy, hold, sell, strongBuy, strongSell counts by period.
        """
        return await self._request("/stock/recommendation", {"symbol": symbol.upper()})

    async def get_price_target(self, symbol: str) -> dict[str, Any]:
        """Get analyst price targets.

        Returns: targetHigh, targetLow, targetMean, targetMedian
        """
        return await self._request("/stock/price-target", {"symbol": symbol.upper()})

    async def get_earnings(self, symbol: str) -> list[dict[str, Any]]:
        """Get earnings history and estimates.

        Returns list with actual, estimate, period, surprise, surprisePercent
        """
        return await self._request("/stock/earnings", {"symbol": symbol.upper()})

    async def search_symbol(self, query: str) -> dict[str, Any]:
        """Search for symbols matching a query.

        Returns: count, result (list of matches with description, symbol, type)
        """
        return await self._request("/search", {"q": query})


# Singleton instance
finnhub_client = FinnhubClient()
