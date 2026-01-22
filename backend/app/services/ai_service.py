"""AI service for generating investment briefs using Groq."""

import json
from datetime import datetime
from pathlib import Path

from groq import Groq

from app.config import settings
from app.models.schemas import InvestmentBrief, NewsSummary, Sentiment, StockQuote


class AIServiceError(Exception):
    """Raised when AI service encounters an error."""

    def __init__(self, message: str):
        self.message = message
        super().__init__(self.message)


class AIService:
    """Service for AI-powered analysis using Groq."""

    MODEL = "llama-3.3-70b-versatile"

    def __init__(self):
        api_key = settings.groq_api_key
        if not api_key:
            raise AIServiceError("API key not configured. Set GROQ_API_KEY in .env")
        self.client = Groq(api_key=api_key)
        self._prompts_dir = Path(__file__).parent / "prompts"

    def _load_prompt(self, name: str) -> str:
        """Load a prompt template from file."""
        prompt_path = self._prompts_dir / f"{name}.txt"
        if not prompt_path.exists():
            raise AIServiceError(f"Prompt template '{name}' not found")
        return prompt_path.read_text()

    async def generate_brief(self, quote: StockQuote) -> InvestmentBrief:
        """Generate an investment brief for a stock.

        Args:
            quote: Current stock quote with metrics

        Returns:
            InvestmentBrief with AI-generated analysis

        Raises:
            AIServiceError: If generation fails
        """
        # Build the prompt
        template = self._load_prompt("brief")
        prompt = template.format(
            company_name=quote.name,
            ticker=quote.ticker,
            quote_json=quote.model_dump_json(indent=2),
        )

        try:
            response = self.client.chat.completions.create(
                model=self.MODEL,
                max_tokens=2000,
                messages=[{"role": "user", "content": prompt}],
            )

            # Parse the JSON response
            response_text = response.choices[0].message.content

            # Handle potential markdown code blocks
            if "```json" in response_text:
                response_text = response_text.split("```json")[1].split("```")[0]
            elif "```" in response_text:
                response_text = response_text.split("```")[1].split("```")[0]

            result = json.loads(response_text.strip())

            # Validate sentiment value
            sentiment_value = result.get("sentiment", "neutral").lower()
            if sentiment_value not in ["bullish", "bearish", "neutral"]:
                sentiment_value = "neutral"

            return InvestmentBrief(
                ticker=quote.ticker,
                company_name=quote.name,
                generated_at=datetime.utcnow(),
                executive_summary=result["executive_summary"],
                bull_case=result["bull_case"],
                bear_case=result["bear_case"],
                key_risks=result["key_risks"],
                catalysts=result["catalysts"],
                technical_outlook=result["technical_outlook"],
                financial_health=result["financial_health"],
                recent_developments=result["recent_developments"],
                conclusion=result["conclusion"],
                sentiment=Sentiment(sentiment_value),
            )

        except json.JSONDecodeError as e:
            raise AIServiceError(f"Failed to parse AI response as JSON: {e}")
        except KeyError as e:
            raise AIServiceError(f"AI response missing required field: {e}")
        except Exception as e:
            raise AIServiceError(f"Groq API error: {e}")

    async def summarize_news(self, news: NewsSummary, company_name: str) -> NewsSummary:
        """Generate AI summary of news articles.

        Args:
            news: NewsSummary with articles to summarize
            company_name: Company name for context

        Returns:
            NewsSummary with AI-generated summary and sentiment
        """
        if not news.articles:
            return news  # Nothing to summarize

        # Build articles JSON for the prompt
        articles_data = [
            {
                "title": a.title,
                "source": a.source,
                "published": a.published_at.isoformat(),
                "description": a.description or "",
            }
            for a in news.articles[:10]  # Limit to 10 articles
        ]

        template = self._load_prompt("news_summary")
        prompt = template.format(
            company_name=company_name,
            ticker=news.ticker,
            articles_json=json.dumps(articles_data, indent=2),
        )

        try:
            response = self.client.chat.completions.create(
                model=self.MODEL,
                max_tokens=1000,
                messages=[{"role": "user", "content": prompt}],
            )

            response_text = response.choices[0].message.content

            # Handle markdown code blocks
            if "```json" in response_text:
                response_text = response_text.split("```json")[1].split("```")[0]
            elif "```" in response_text:
                response_text = response_text.split("```")[1].split("```")[0]

            result = json.loads(response_text.strip())

            # Validate sentiment
            sentiment_value = result.get("sentiment", "neutral").lower()
            if sentiment_value not in ["bullish", "bearish", "neutral"]:
                sentiment_value = "neutral"

            # Update the news summary with AI-generated content
            news.ai_summary = result.get("summary", "")
            news.overall_sentiment = Sentiment(sentiment_value)
            news.key_themes = result.get("key_themes", [])

            return news

        except Exception as e:
            # Return news without summary if AI fails
            news.ai_summary = f"Summary unavailable: {str(e)}"
            return news
