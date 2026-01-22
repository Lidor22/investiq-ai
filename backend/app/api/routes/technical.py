"""Technical analysis API routes."""

from fastapi import APIRouter, HTTPException, Query

from app.models.schemas import (
    TechnicalIndicators,
    PriceHistory,
    AnalystData,
    MovingAverages,
    RSIIndicator,
    MACDIndicator,
    SupportResistance,
    PriceTargets,
    AnalystRecommendation,
)
from app.services.technical_service import (
    get_price_history,
    calculate_technical_indicators,
    get_analyst_recommendations,
)

router = APIRouter(prefix="/technical", tags=["technical"])


@router.get("/{ticker}/indicators", response_model=TechnicalIndicators)
async def get_technical_indicators(ticker: str):
    """
    Get technical indicators for a stock.

    Returns moving averages, RSI, MACD, support/resistance, and trend analysis.
    """
    ticker = ticker.upper()

    try:
        data = await calculate_technical_indicators(ticker)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to calculate indicators: {str(e)}")

    if not data:
        raise HTTPException(status_code=404, detail=f"Insufficient data for {ticker}")

    return TechnicalIndicators(
        ticker=ticker,
        moving_averages=MovingAverages(**data["moving_averages"]),
        rsi=RSIIndicator(**data["rsi"]),
        macd=MACDIndicator(**data["macd"]),
        support_resistance=SupportResistance(**data["support_resistance"]),
        trend=data["trend"],
        current_price=data["current_price"],
    )


@router.get("/{ticker}/history", response_model=PriceHistory)
async def get_historical_prices(
    ticker: str,
    period: str = Query("6mo", pattern="^(1mo|3mo|6mo|1y|2y|5y)$"),
    interval: str = Query("1d", pattern="^(1d|1wk|1mo)$"),
):
    """
    Get historical price data for charts.

    Args:
        ticker: Stock ticker symbol
        period: Time period (1mo, 3mo, 6mo, 1y, 2y, 5y)
        interval: Data interval (1d, 1wk, 1mo)
    """
    ticker = ticker.upper()

    try:
        data = await get_price_history(ticker, period, interval)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch price history: {str(e)}")

    if not data.get("dates"):
        raise HTTPException(status_code=404, detail=f"No price history found for {ticker}")

    return PriceHistory(
        ticker=ticker,
        period=period,
        interval=interval,
        **data,
    )


@router.get("/{ticker}/analyst", response_model=AnalystData)
async def get_analyst_data(ticker: str):
    """
    Get analyst recommendations and price targets.
    """
    ticker = ticker.upper()

    try:
        data = await get_analyst_recommendations(ticker)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch analyst data: {str(e)}")

    recommendations = []
    if data.get("recommendations", {}).get("history"):
        recommendations = [
            AnalystRecommendation(**rec)
            for rec in data["recommendations"]["history"]
        ]

    return AnalystData(
        ticker=ticker,
        price_targets=PriceTargets(**data["price_targets"]),
        recommendations=recommendations,
    )
