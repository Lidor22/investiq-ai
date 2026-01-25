"""News aggregation service."""

from datetime import datetime, timedelta

import yfinance as yf

from app.models.schemas import NewsArticle, NewsSummary
from app.services.yf_session import yf_session


class NewsService:
    """Service for fetching news about stocks."""

    async def get_news(
        self,
        ticker: str,
        days: int = 7,
        limit: int = 20,
    ) -> NewsSummary:
        """Fetch recent news for a ticker using yfinance.

        Args:
            ticker: Stock ticker symbol
            days: Number of days to look back
            limit: Maximum number of articles

        Returns:
            NewsSummary with articles (no AI summary yet)
        """
        ticker = ticker.upper()
        stock = yf.Ticker(ticker, session=yf_session)

        # Get news from yfinance
        news_items = stock.news or []

        articles: list[NewsArticle] = []
        cutoff_date = datetime.now() - timedelta(days=days)

        for item in news_items[:limit]:
            try:
                # Handle new yfinance news structure (nested in 'content')
                content = item.get("content", item)  # Fallback to item itself for old structure

                # Parse publish time - new format uses ISO string in 'pubDate'
                pub_date_str = content.get("pubDate")
                if pub_date_str:
                    # Parse ISO format: "2026-01-18T16:05:56Z"
                    pub_date = datetime.fromisoformat(pub_date_str.replace("Z", "+00:00"))
                    pub_date = pub_date.replace(tzinfo=None)  # Remove timezone for comparison
                else:
                    # Fallback to old format
                    pub_timestamp = item.get("providerPublishTime", 0)
                    if pub_timestamp:
                        pub_date = datetime.fromtimestamp(pub_timestamp)
                    else:
                        pub_date = datetime.now()

                # Skip if too old
                if pub_date < cutoff_date:
                    continue

                # Extract fields from new structure
                title = content.get("title") or item.get("title", "No title")

                # Get URL from new structure
                url = ""
                if "canonicalUrl" in content:
                    url = content["canonicalUrl"].get("url", "")
                elif "clickThroughUrl" in content:
                    url = content["clickThroughUrl"].get("url", "")
                else:
                    url = item.get("link", "")

                # Get source/publisher
                source = "Unknown"
                if "provider" in content:
                    source = content["provider"].get("displayName", "Unknown")
                else:
                    source = item.get("publisher", "Unknown")

                # Get description/summary
                description = content.get("summary") or content.get("description") or item.get("summary")

                article = NewsArticle(
                    title=title,
                    source=source,
                    url=url,
                    published_at=pub_date,
                    description=description,
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
