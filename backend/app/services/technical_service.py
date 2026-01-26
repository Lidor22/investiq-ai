"""Technical analysis service for calculating indicators and fetching price history."""

from datetime import datetime, timedelta
from typing import Any
import logging

import yfinance as yf
import httpx

from app.services.finnhub_client import finnhub_client

logger = logging.getLogger(__name__)


async def _get_price_history_yfinance(ticker: str, period: str, interval: str) -> dict[str, Any]:
    """Fallback to yfinance for historical price data."""
    try:
        stock = yf.Ticker(ticker)
        hist = stock.history(period=period, interval=interval)

        if hist.empty:
            return {"dates": [], "open": [], "high": [], "low": [], "close": [], "volume": []}

        dates = [d.strftime("%Y-%m-%d") for d in hist.index]

        return {
            "dates": dates,
            "open": [round(p, 2) for p in hist["Open"].tolist()],
            "high": [round(p, 2) for p in hist["High"].tolist()],
            "low": [round(p, 2) for p in hist["Low"].tolist()],
            "close": [round(p, 2) for p in hist["Close"].tolist()],
            "volume": [int(v) for v in hist["Volume"].tolist()],
        }
    except Exception as e:
        logger.warning(f"yfinance fallback failed for {ticker}: {e}")
        return {"dates": [], "open": [], "high": [], "low": [], "close": [], "volume": []}


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

    # Try Finnhub first
    try:
        candles = await finnhub_client.get_candles(ticker, resolution, from_ts, to_ts)

        if candles.get("s") == "ok" and candles.get("t"):
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
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 403:
            logger.info(f"Finnhub candle endpoint returned 403 for {ticker}, falling back to yfinance")
        else:
            logger.warning(f"Finnhub candle request failed for {ticker}: {e}")
    except Exception as e:
        logger.warning(f"Finnhub candle request failed for {ticker}: {e}")

    # Fallback to yfinance
    logger.info(f"Using yfinance fallback for {ticker} price history")
    return await _get_price_history_yfinance(ticker, period, interval)


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


def _calculate_ema_series(prices: list[float], period: int) -> list[float]:
    """Calculate EMA series for all prices (returns list of EMA values)."""
    if len(prices) < period:
        return []

    multiplier = 2 / (period + 1)
    ema_values = []
    ema = sum(prices[:period]) / period  # Start with SMA
    ema_values.append(ema)

    for price in prices[period:]:
        ema = (price * multiplier) + (ema * (1 - multiplier))
        ema_values.append(ema)

    return ema_values


def _calculate_macd(prices: list[float]) -> dict[str, float | None]:
    """Calculate MACD indicator (12, 26, 9 periods).

    Returns dict with macd_line, signal_line, and histogram.
    """
    if len(prices) < 26:
        return {"macd_line": None, "signal_line": None, "histogram": None}

    # Calculate EMA series
    ema_12_series = _calculate_ema_series(prices, 12)
    ema_26_series = _calculate_ema_series(prices, 26)

    if not ema_12_series or not ema_26_series:
        return {"macd_line": None, "signal_line": None, "histogram": None}

    # MACD line = EMA12 - EMA26 (align the series)
    # EMA26 series starts 14 periods later than EMA12
    offset = 26 - 12  # 14
    macd_line_series = []
    for i, ema26 in enumerate(ema_26_series):
        ema12 = ema_12_series[i + offset]
        macd_line_series.append(ema12 - ema26)

    if len(macd_line_series) < 9:
        return {"macd_line": macd_line_series[-1] if macd_line_series else None,
                "signal_line": None, "histogram": None}

    # Signal line = 9-period EMA of MACD line
    signal_line = _calculate_ema(macd_line_series, 9)
    macd_line = macd_line_series[-1]
    histogram = (macd_line - signal_line) if signal_line else None

    return {
        "macd_line": macd_line,
        "signal_line": signal_line,
        "histogram": histogram
    }


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


async def _get_candle_data_for_indicators(ticker: str) -> dict[str, Any] | None:
    """Get candle data for technical indicators, with yfinance fallback."""
    # Get 1 year of daily data for calculations
    to_ts = int(datetime.now().timestamp())
    from_ts = int((datetime.now() - timedelta(days=365)).timestamp())

    # Try Finnhub first
    try:
        candles = await finnhub_client.get_candles(ticker, "D", from_ts, to_ts)
        if candles.get("s") == "ok" and candles.get("c") and len(candles["c"]) >= 50:
            return {"c": candles["c"], "h": candles["h"], "l": candles["l"]}
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 403:
            logger.info(f"Finnhub candle endpoint returned 403 for {ticker}, falling back to yfinance")
        else:
            logger.warning(f"Finnhub candle request failed for {ticker}: {e}")
    except Exception as e:
        logger.warning(f"Finnhub candle request failed for {ticker}: {e}")

    # Fallback to yfinance
    try:
        logger.info(f"Using yfinance fallback for {ticker} indicator data")
        stock = yf.Ticker(ticker)
        hist = stock.history(period="1y", interval="1d")

        if hist.empty or len(hist) < 50:
            return None

        return {
            "c": hist["Close"].tolist(),
            "h": hist["High"].tolist(),
            "l": hist["Low"].tolist(),
        }
    except Exception as e:
        logger.warning(f"yfinance fallback failed for {ticker}: {e}")
        return None


async def calculate_technical_indicators(ticker: str) -> dict[str, Any]:
    """
    Calculate technical indicators for a stock.

    Returns moving averages, RSI, MACD, and support/resistance levels.
    """
    candle_data = await _get_candle_data_for_indicators(ticker)

    if not candle_data:
        return {}

    close = candle_data["c"]
    high = candle_data["h"]
    low = candle_data["l"]

    # Moving Averages
    sma_20 = _calculate_sma(close, 20)
    sma_50 = _calculate_sma(close, 50)
    sma_200 = _calculate_sma(close, 200) if len(close) >= 200 else None

    ema_12 = _calculate_ema(close, 12)
    ema_26 = _calculate_ema(close, 26)

    # RSI (14-period)
    rsi_value = _calculate_rsi(close, 14)

    # MACD (using proper calculation: signal line is EMA of MACD line, not price)
    macd_data = _calculate_macd(close)
    macd_line = macd_data["macd_line"]
    signal_line = macd_data["signal_line"]
    macd_histogram = macd_data["histogram"]

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
