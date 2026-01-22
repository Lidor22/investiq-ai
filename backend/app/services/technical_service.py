"""Technical analysis service for calculating indicators and fetching price history."""

from datetime import datetime, timedelta
from typing import Any

import yfinance as yf


async def get_price_history(
    ticker: str,
    period: str = "6mo",
    interval: str = "1d"
) -> dict[str, Any]:
    """
    Fetch historical price data for a ticker.

    Args:
        ticker: Stock ticker symbol
        period: Time period (1mo, 3mo, 6mo, 1y, 2y, 5y)
        interval: Data interval (1d, 1wk, 1mo)

    Returns:
        Dictionary with dates and OHLCV data
    """
    stock = yf.Ticker(ticker)
    hist = stock.history(period=period, interval=interval)

    if hist.empty:
        return {"dates": [], "prices": [], "volumes": []}

    return {
        "dates": [d.strftime("%Y-%m-%d") for d in hist.index],
        "open": hist["Open"].round(2).tolist(),
        "high": hist["High"].round(2).tolist(),
        "low": hist["Low"].round(2).tolist(),
        "close": hist["Close"].round(2).tolist(),
        "volume": hist["Volume"].tolist(),
    }


async def calculate_technical_indicators(ticker: str) -> dict[str, Any]:
    """
    Calculate technical indicators for a stock.

    Returns moving averages, RSI, MACD, and support/resistance levels.
    """
    stock = yf.Ticker(ticker)
    hist = stock.history(period="1y", interval="1d")

    if hist.empty or len(hist) < 50:
        return {}

    close = hist["Close"]
    high = hist["High"]
    low = hist["Low"]

    # Moving Averages
    sma_20 = close.rolling(window=20).mean().iloc[-1]
    sma_50 = close.rolling(window=50).mean().iloc[-1]
    sma_200 = close.rolling(window=200).mean().iloc[-1] if len(close) >= 200 else None

    ema_12 = close.ewm(span=12, adjust=False).mean().iloc[-1]
    ema_26 = close.ewm(span=26, adjust=False).mean().iloc[-1]

    # RSI (14-period)
    delta = close.diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
    rs = gain / loss
    rsi = 100 - (100 / (1 + rs))
    rsi_value = rsi.iloc[-1]

    # MACD
    macd_line = ema_12 - ema_26
    signal_line = close.ewm(span=9, adjust=False).mean().iloc[-1]
    macd_histogram = macd_line - signal_line

    # Support and Resistance (simple pivot points)
    recent_high = high.tail(20).max()
    recent_low = low.tail(20).min()
    pivot = (recent_high + recent_low + close.iloc[-1]) / 3
    resistance_1 = 2 * pivot - recent_low
    support_1 = 2 * pivot - recent_high

    # Trend determination
    current_price = close.iloc[-1]
    trend = "neutral"
    if current_price > sma_50 and sma_50 > (sma_200 or sma_50):
        trend = "bullish"
    elif current_price < sma_50 and sma_50 < (sma_200 or sma_50):
        trend = "bearish"

    # RSI interpretation
    rsi_signal = "neutral"
    if rsi_value > 70:
        rsi_signal = "overbought"
    elif rsi_value < 30:
        rsi_signal = "oversold"

    return {
        "moving_averages": {
            "sma_20": round(sma_20, 2),
            "sma_50": round(sma_50, 2),
            "sma_200": round(sma_200, 2) if sma_200 else None,
            "ema_12": round(ema_12, 2),
            "ema_26": round(ema_26, 2),
        },
        "rsi": {
            "value": round(rsi_value, 2),
            "signal": rsi_signal,
        },
        "macd": {
            "macd_line": round(macd_line, 4),
            "signal_line": round(signal_line, 2),
            "histogram": round(macd_histogram, 4),
        },
        "support_resistance": {
            "support_1": round(support_1, 2),
            "pivot": round(pivot, 2),
            "resistance_1": round(resistance_1, 2),
        },
        "trend": trend,
        "current_price": round(current_price, 2),
    }


async def get_analyst_recommendations(ticker: str) -> dict[str, Any]:
    """
    Get analyst recommendations and price targets.
    """
    stock = yf.Ticker(ticker)

    # Get analyst recommendations
    recommendations = {}
    try:
        rec = stock.recommendations
        if rec is not None and not rec.empty:
            # Get the most recent recommendations
            recent = rec.tail(10)
            recommendations["history"] = [
                {
                    "date": r.name.strftime("%Y-%m-%d") if hasattr(r.name, 'strftime') else str(r.name),
                    "firm": r.get("Firm", "Unknown"),
                    "to_grade": r.get("To Grade", r.get("toGrade", "")),
                    "from_grade": r.get("From Grade", r.get("fromGrade", "")),
                    "action": r.get("Action", r.get("action", "")),
                }
                for _, r in recent.iterrows()
            ]
    except Exception:
        pass

    # Get price targets from info
    info = stock.info
    price_targets = {
        "current": info.get("currentPrice"),
        "target_high": info.get("targetHighPrice"),
        "target_low": info.get("targetLowPrice"),
        "target_mean": info.get("targetMeanPrice"),
        "target_median": info.get("targetMedianPrice"),
        "number_of_analysts": info.get("numberOfAnalystOpinions"),
        "recommendation": info.get("recommendationKey"),
        "recommendation_mean": info.get("recommendationMean"),
    }

    # Calculate upside/downside potential
    if price_targets["current"] and price_targets["target_mean"]:
        price_targets["upside_potential"] = round(
            ((price_targets["target_mean"] - price_targets["current"]) / price_targets["current"]) * 100,
            2
        )

    return {
        "price_targets": price_targets,
        "recommendations": recommendations,
    }
