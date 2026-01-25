"""News aggregation service using Finnhub API."""

from datetime import datetime, timedelta

from app.models.schemas import NewsArticle, NewsSummary
from app.services.finnhub_client import finnhub_client


class NewsService:
    """Service for fetching news about stocks."""

    async def get_news(
        self,
        ticker: str,
        days: int = 7,
        limit: int = 20,
    ) -> NewsSummary:
        """Fetch recent news for a ticker using Finnhub.

        Args:
            ticker: Stock ticker symbol
            days: Number of days to look back
            limit: Maximum number of articles

        Returns:
            NewsSummary with articles (no AI summary yet)
        """
        ticker = ticker.upper()

        # Calculate date range
        to_date = datetime.now().strftime("%Y-%m-%d")
        from_date = (datetime.now() - timedelta(days=days)).strftime("%Y-%m-%d")

        # Get news from Finnhub
        news_items = await finnhub_client.get_company_news(ticker, from_date, to_date)

        articles: list[NewsArticle] = []

        for item in news_items[:limit]:
            try:
                # Parse publish time (Unix timestamp)
                pub_timestamp = item.get("datetime", 0)
                if pub_timestamp:
                    pub_date = datetime.fromtimestamp(pub_timestamp)
                else:
                    pub_date = datetime.now()

                article = NewsArticle(
                    title=item.get("headline", "No title"),
                    source=item.get("source", "Unknown"),
                    url=item.get("url", ""),
                    published_at=pub_date,
                    description=item.get("summary"),
                    sentiment=None,  # Will be filled by AI later
                )
                articles.append(article)

            except Exception:
                continue  # Skip malformed articles

        return NewsSummary(
            ticker=ticker,
            articles=articles,
            ai_summary=None,
            overall_sentiment=None,
            key_themes=[],
            fetched_at=datetime.utcnow(),
        )
