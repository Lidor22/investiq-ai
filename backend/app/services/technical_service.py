"""Technical analysis service for calculating indicators and fetching price history."""

from datetime import datetime, timedelta
from typing import Any

from app.services.finnhub_client import finnhub_client


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
    # Map period to days
    period_days = {
        "1mo": 30,
        "3mo": 90,
        "6mo": 180,
        "1y": 365,
        "2y": 730,
        "5y": 1825,
    }
    days = period_days.get(period, 180)

    # Map interval to Finnhub resolution
    resolution_map = {
        "1d": "D",
        "1wk": "W",
        "1mo": "M",
    }
    resolution = resolution_map.get(interval, "D")

    # Calculate timestamps
    to_ts = int(datetime.now().timestamp())
    from_ts = int((datetime.now() - timedelta(days=days)).timestamp())

    candles = await finnhub_client.get_candles(ticker, resolution, from_ts, to_ts)

    if candles.get("s") != "ok" or not candles.get("t"):
        return {"dates": [], "prices": [], "volumes": []}

    # Convert timestamps to dates
    dates = [datetime.fromtimestamp(ts).strftime("%Y-%m-%d") for ts in candles["t"]]

    return {
        "dates": dates,
        "open": [round(p, 2) for p in candles.get("o", [])],
        "high": [round(p, 2) for p in candles.get("h", [])],
        "low": [round(p, 2) for p in candles.get("l", [])],
        "close": [round(p, 2) for p in candles.get("c", [])],
        "volume": candles.get("v", []),
    }


def _calculate_sma(prices: list[float], period: int) -> float | None:
    """Calculate Simple Moving Average."""
    if len(prices) < period:
        return None
    return sum(prices[-period:]) / period


def _calculate_ema(prices: list[float], period: int) -> float | None:
    """Calculate Exponential Moving Average."""
    if len(prices) < period:
        return None

    multiplier = 2 / (period + 1)
    ema = sum(prices[:period]) / period  # Start with SMA

    for price in prices[period:]:
        ema = (price * multiplier) + (ema * (1 - multiplier))

    return ema


def _calculate_rsi(prices: list[float], period: int = 14) -> float | None:
    """Calculate Relative Strength Index."""
    if len(prices) < period + 1:
        return None

    deltas = [prices[i] - prices[i-1] for i in range(1, len(prices))]
    gains = [d if d > 0 else 0 for d in deltas]
    losses = [-d if d < 0 else 0 for d in deltas]

    avg_gain = sum(gains[-period:]) / period
    avg_loss = sum(losses[-period:]) / period

    if avg_loss == 0:
        return 100

    rs = avg_gain / avg_loss
    return 100 - (100 / (1 + rs))


async def calculate_technical_indicators(ticker: str) -> dict[str, Any]:
    """
    Calculate technical indicators for a stock.

    Returns moving averages, RSI, MACD, and support/resistance levels.
    """
    # Get 1 year of daily data for calculations
    to_ts = int(datetime.now().timestamp())
    from_ts = int((datetime.now() - timedelta(days=365)).timestamp())

    candles = await finnhub_client.get_candles(ticker, "D", from_ts, to_ts)

    if candles.get("s") != "ok" or not candles.get("c") or len(candles["c"]) < 50:
        return {}

    close = candles["c"]
    high = candles["h"]
    low = candles["l"]

    # Moving Averages
    sma_20 = _calculate_sma(close, 20)
    sma_50 = _calculate_sma(close, 50)
    sma_200 = _calculate_sma(close, 200) if len(close) >= 200 else None

    ema_12 = _calculate_ema(close, 12)
    ema_26 = _calculate_ema(close, 26)

    # RSI (14-period)
    rsi_value = _calculate_rsi(close, 14)

    # MACD
    macd_line = (ema_12 - ema_26) if (ema_12 and ema_26) else None
    signal_line = _calculate_ema(close, 9)
    macd_histogram = (macd_line - signal_line) if (macd_line and signal_line) else None

    # Support and Resistance (simple pivot points)
    recent_high = max(high[-20:])
    recent_low = min(low[-20:])
    current_price = close[-1]
    pivot = (recent_high + recent_low + current_price) / 3
    resistance_1 = 2 * pivot - recent_low
    support_1 = 2 * pivot - recent_high

    # Trend determination
    trend = "neutral"
    if sma_50:
        if current_price > sma_50 and sma_50 > (sma_200 or sma_50):
            trend = "bullish"
        elif current_price < sma_50 and sma_50 < (sma_200 or sma_50):
            trend = "bearish"

    # RSI interpretation
    rsi_signal = "neutral"
    if rsi_value:
        if rsi_value > 70:
            rsi_signal = "overbought"
        elif rsi_value < 30:
            rsi_signal = "oversold"

    return {
        "moving_averages": {
            "sma_20": round(sma_20, 2) if sma_20 else None,
            "sma_50": round(sma_50, 2) if sma_50 else None,
            "sma_200": round(sma_200, 2) if sma_200 else None,
            "ema_12": round(ema_12, 2) if ema_12 else None,
            "ema_26": round(ema_26, 2) if ema_26 else None,
        },
        "rsi": {
            "value": round(rsi_value, 2) if rsi_value else None,
            "signal": rsi_signal,
        },
        "macd": {
            "macd_line": round(macd_line, 4) if macd_line else None,
            "signal_line": round(signal_line, 2) if signal_line else None,
            "histogram": round(macd_histogram, 4) if macd_histogram else None,
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
    Get analyst recommendations and price targets from Finnhub.
    """
    recommendations = {}

    # Get recommendation trends
    try:
        rec_trends = await finnhub_client.get_recommendation_trends(ticker)
        if rec_trends:
            recommendations["history"] = [
                {
                    "date": r.get("period", ""),
                    "firm": "Consensus",
                    "to_grade": f"Buy: {r.get('buy', 0)}, Hold: {r.get('hold', 0)}, Sell: {r.get('sell', 0)}",
                    "from_grade": "",
                    "action": "",
                    "strong_buy": r.get("strongBuy", 0),
                    "buy": r.get("buy", 0),
                    "hold": r.get("hold", 0),
                    "sell": r.get("sell", 0),
                    "strong_sell": r.get("strongSell", 0),
                }
                for r in rec_trends[:10]
            ]
    except Exception:
        pass

    # Get price targets
    price_targets = {
        "current": None,
        "target_high": None,
        "target_low": None,
        "target_mean": None,
        "target_median": None,
        "number_of_analysts": None,
        "recommendation": None,
        "recommendation_mean": None,
        "upside_potential": None,
    }

    try:
        targets = await finnhub_client.get_price_target(ticker)
        if targets:
            price_targets["target_high"] = targets.get("targetHigh")
            price_targets["target_low"] = targets.get("targetLow")
            price_targets["target_mean"] = targets.get("targetMean")
            price_targets["target_median"] = targets.get("targetMedian")

        # Get current price for upside calculation
        quote = await finnhub_client.get_quote(ticker)
        if quote and quote.get("c"):
            price_targets["current"] = quote["c"]

            if price_targets["target_mean"] and price_targets["current"]:
                price_targets["upside_potential"] = round(
                    ((price_targets["target_mean"] - price_targets["current"]) / price_targets["current"]) * 100,
                    2
                )

        # Determine recommendation based on trends
        if recommendations.get("history"):
            latest = recommendations["history"][0]
            total = (latest.get("strong_buy", 0) + latest.get("buy", 0) +
                    latest.get("hold", 0) + latest.get("sell", 0) + latest.get("strong_sell", 0))
            if total > 0:
                price_targets["number_of_analysts"] = total
                buy_pct = (latest.get("strong_buy", 0) + latest.get("buy", 0)) / total
                if buy_pct > 0.6:
                    price_targets["recommendation"] = "buy"
                elif buy_pct > 0.4:
                    price_targets["recommendation"] = "hold"
                else:
                    price_targets["recommendation"] = "sell"

    except Exception:
        pass

    return {
        "price_targets": price_targets,
        "recommendations": recommendations,
    }
