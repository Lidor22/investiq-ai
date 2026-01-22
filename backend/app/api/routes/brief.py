"""Investment brief API routes."""

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database import Brief, get_db
from app.models.schemas import (
    BriefGenerateRequest,
    InvestmentBrief,
    StockNotFoundError,
)
from app.services.ai_service import AIService, AIServiceError
from app.services.stock_service import StockService

router = APIRouter(prefix="/brief", tags=["brief"])

# Service instances
stock_service = StockService()


def get_ai_service() -> AIService:
    """Get AI service instance, handling missing API key gracefully."""
    try:
        return AIService()
    except AIServiceError as e:
        raise HTTPException(status_code=503, detail=str(e.message))


@router.get("/{ticker}", response_model=InvestmentBrief | None)
async def get_cached_brief(
    ticker: str,
    db: AsyncSession = Depends(get_db),
) -> InvestmentBrief | None:
    """Get cached brief for a ticker if available.

    Args:
        ticker: Stock ticker symbol

    Returns:
        Cached InvestmentBrief or null if not found
    """
    ticker = ticker.upper()

    # Query for the most recent brief
    result = await db.execute(
        select(Brief)
        .where(Brief.ticker == ticker)
        .order_by(desc(Brief.generated_at))
        .limit(1)
    )
    cached = result.scalar_one_or_none()

    if not cached:
        return None

    # Reconstruct InvestmentBrief from cached data (copy to avoid mutating original)
    brief_data = {**cached.content}
    brief_data["cached"] = True
    brief_data["generated_at"] = cached.generated_at
    return InvestmentBrief(**brief_data)


@router.post("/{ticker}/generate", response_model=InvestmentBrief)
async def generate_brief(
    ticker: str,
    request: BriefGenerateRequest | None = None,
    db: AsyncSession = Depends(get_db),
) -> InvestmentBrief:
    """Generate an AI investment brief for a ticker.

    Args:
        ticker: Stock ticker symbol (e.g., AAPL, NVDA, MSFT)
        request: Optional configuration for brief generation

    Returns:
        InvestmentBrief with AI-generated analysis
    """
    ticker = ticker.upper()
    force_regenerate = request.force_regenerate if request else False

    # Check cache first (unless force_regenerate)
    if not force_regenerate:
        result = await db.execute(
            select(Brief)
            .where(Brief.ticker == ticker)
            .order_by(desc(Brief.generated_at))
            .limit(1)
        )
        cached = result.scalar_one_or_none()

        if cached:
            brief_data = {**cached.content}
            brief_data["cached"] = True
            brief_data["generated_at"] = cached.generated_at
            return InvestmentBrief(**brief_data)

    # Get stock quote first
    try:
        quote = await stock_service.get_quote(ticker)
    except StockNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e.message))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching stock data: {e}")

    # Generate brief
    ai_service = get_ai_service()
    try:
        brief = await ai_service.generate_brief(quote)

        # Save to database (use mode='json' to serialize datetimes as strings)
        brief_record = Brief(
            ticker=ticker,
            brief_type="full",
            content=brief.model_dump(mode="json", exclude={"cached", "generated_at"}),
        )
        db.add(brief_record)
        await db.commit()

        brief.cached = False
        return brief
    except AIServiceError as e:
        raise HTTPException(status_code=500, detail=str(e.message))
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Error saving brief: {str(e)}")
