"""News aggregation service using Finnhub API."""

import re
from datetime import datetime, timedelta

from app.models.schemas import NewsArticle, NewsSummary
from app.services.finnhub_client import finnhub_client


# Common company name variations for major tickers
COMPANY_NAMES = {
    "AAPL": ["Apple", "iPhone", "iPad", "Mac"],
    "GOOGL": ["Google", "Alphabet", "Android", "YouTube"],
    "GOOG": ["Google", "Alphabet", "Android", "YouTube"],
    "MSFT": ["Microsoft", "Windows", "Azure", "Xbox"],
    "AMZN": ["Amazon", "AWS", "Prime"],
    "META": ["Meta", "Facebook", "Instagram", "WhatsApp"],
    "TSLA": ["Tesla", "Elon Musk", "EV"],
    "NVDA": ["Nvidia", "GPU", "GeForce"],
    "AMD": ["AMD", "Ryzen", "Radeon"],
    "NFLX": ["Netflix"],
    "DIS": ["Disney", "Marvel", "Pixar"],
    "INTC": ["Intel"],
}


def _is_relevant_article(ticker: str, headline: str, summary: str | None) -> bool:
    """Check if an article is relevant to the specific ticker.

    Returns True if the ticker or company name appears in the headline or summary.
    """
    ticker_upper = ticker.upper()
    text_to_check = (headline + " " + (summary or "")).lower()

    # Check for ticker symbol (with word boundaries to avoid false matches)
    ticker_pattern = rf'\b{ticker_upper.lower()}\b'
    if re.search(ticker_pattern, text_to_check):
        return True

    # Check for company name variations
    company_names = COMPANY_NAMES.get(ticker_upper, [ticker_upper])
    for name in company_names:
        if name.lower() in text_to_check:
            return True

    return False


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

        for item in news_items:
            # Stop if we have enough articles
            if len(articles) >= limit:
                break

            try:
                headline = item.get("headline", "No title")
                summary = item.get("summary")

                # Filter out irrelevant articles that don't mention the company
                if not _is_relevant_article(ticker, headline, summary):
                    continue

                # Parse publish time (Unix timestamp)
                pub_timestamp = item.get("datetime", 0)
                if pub_timestamp:
                    pub_date = datetime.fromtimestamp(pub_timestamp)
                else:
                    pub_date = datetime.now()

                article = NewsArticle(
                    title=headline,
                    source=item.get("source", "Unknown"),
                    url=item.get("url", ""),
                    published_at=pub_date,
                    description=summary,
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
