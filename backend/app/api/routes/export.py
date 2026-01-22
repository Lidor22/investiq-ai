"""Export API routes for downloading data as CSV/JSON."""

import csv
import io
import json
from datetime import datetime

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from app.services.stock_service import StockService
from app.services.technical_service import (
    get_price_history,
    calculate_technical_indicators,
    get_analyst_recommendations,
)
from app.services.financial_service import (
    get_earnings_data,
    get_income_statement,
    get_balance_sheet,
    get_financial_ratios,
)

stock_service = StockService()

router = APIRouter(prefix="/export", tags=["export"])


@router.get("/{ticker}/summary.csv")
async def export_summary_csv(ticker: str):
    """Export stock summary as CSV."""
    ticker = ticker.upper()

    try:
        quote = await stock_service.get_quote(ticker)
        indicators = await calculate_technical_indicators(ticker)
        analyst = await get_analyst_recommendations(ticker)
        ratios = await get_financial_ratios(ticker)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch data: {str(e)}")

    output = io.StringIO()
    writer = csv.writer(output)

    # Header
    writer.writerow(["InvestIQ Stock Summary"])
    writer.writerow([f"Ticker: {ticker}"])
    writer.writerow([f"Generated: {datetime.utcnow().isoformat()}"])
    writer.writerow([])

    # Quote data
    writer.writerow(["Price Data"])
    writer.writerow(["Metric", "Value"])
    writer.writerow(["Price", f"${quote.price:.2f}"])
    writer.writerow(["Change", f"${quote.change:.2f}"])
    writer.writerow(["Change %", f"{quote.change_percent:.2f}%"])
    writer.writerow(["Volume", f"{quote.volume:,}"])
    if quote.market_cap:
        writer.writerow(["Market Cap", f"${quote.market_cap / 1e9:.2f}B"])
    if quote.pe_ratio:
        writer.writerow(["P/E Ratio", f"{quote.pe_ratio:.2f}"])
    writer.writerow(["52W High", f"${quote.week_52_high:.2f}"])
    writer.writerow(["52W Low", f"${quote.week_52_low:.2f}"])
    writer.writerow([])

    # Technical indicators
    if indicators:
        writer.writerow(["Technical Indicators"])
        writer.writerow(["Indicator", "Value"])
        writer.writerow(["Trend", indicators.get("trend", "N/A")])
        ma = indicators.get("moving_averages", {})
        writer.writerow(["SMA 20", f"${ma.get('sma_20', 0):.2f}"])
        writer.writerow(["SMA 50", f"${ma.get('sma_50', 0):.2f}"])
        if ma.get("sma_200"):
            writer.writerow(["SMA 200", f"${ma.get('sma_200', 0):.2f}"])
        rsi = indicators.get("rsi", {})
        writer.writerow(["RSI", f"{rsi.get('value', 0):.1f} ({rsi.get('signal', 'N/A')})"])
        sr = indicators.get("support_resistance", {})
        writer.writerow(["Support", f"${sr.get('support_1', 0):.2f}"])
        writer.writerow(["Resistance", f"${sr.get('resistance_1', 0):.2f}"])
        writer.writerow([])

    # Analyst data
    pt = analyst.get("price_targets", {})
    if pt.get("target_mean"):
        writer.writerow(["Analyst Price Targets"])
        writer.writerow(["Metric", "Value"])
        writer.writerow(["Target Low", f"${pt.get('target_low', 0):.2f}"])
        writer.writerow(["Target Mean", f"${pt.get('target_mean', 0):.2f}"])
        writer.writerow(["Target High", f"${pt.get('target_high', 0):.2f}"])
        if pt.get("upside_potential"):
            writer.writerow(["Upside Potential", f"{pt.get('upside_potential', 0):.1f}%"])
        if pt.get("recommendation"):
            writer.writerow(["Recommendation", pt.get("recommendation")])
        writer.writerow([])

    # Key ratios
    writer.writerow(["Key Financial Ratios"])
    writer.writerow(["Category", "Metric", "Value"])
    val = ratios.get("valuation", {})
    if val.get("pe_ratio"):
        writer.writerow(["Valuation", "P/E Ratio", f"{val.get('pe_ratio'):.2f}"])
    if val.get("price_to_book"):
        writer.writerow(["Valuation", "P/B Ratio", f"{val.get('price_to_book'):.2f}"])
    prof = ratios.get("profitability", {})
    if prof.get("profit_margin"):
        writer.writerow(["Profitability", "Profit Margin", f"{prof.get('profit_margin') * 100:.1f}%"])
    if prof.get("return_on_equity"):
        writer.writerow(["Profitability", "ROE", f"{prof.get('return_on_equity') * 100:.1f}%"])
    growth = ratios.get("growth", {})
    if growth.get("revenue_growth"):
        writer.writerow(["Growth", "Revenue Growth", f"{growth.get('revenue_growth') * 100:.1f}%"])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={ticker}_summary.csv"},
    )


@router.get("/{ticker}/price-history.csv")
async def export_price_history_csv(ticker: str, period: str = "6mo"):
    """Export price history as CSV."""
    ticker = ticker.upper()

    try:
        data = await get_price_history(ticker, period)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch data: {str(e)}")

    if not data.get("dates"):
        raise HTTPException(status_code=404, detail="No price data available")

    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow(["Date", "Open", "High", "Low", "Close", "Volume"])
    for i, date in enumerate(data["dates"]):
        writer.writerow([
            date,
            f"{data['open'][i]:.2f}",
            f"{data['high'][i]:.2f}",
            f"{data['low'][i]:.2f}",
            f"{data['close'][i]:.2f}",
            data["volume"][i],
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={ticker}_prices_{period}.csv"},
    )


@router.get("/{ticker}/financials.json")
async def export_financials_json(ticker: str):
    """Export all financial data as JSON."""
    ticker = ticker.upper()

    try:
        quote = await stock_service.get_quote(ticker)
        indicators = await calculate_technical_indicators(ticker)
        analyst = await get_analyst_recommendations(ticker)
        earnings = await get_earnings_data(ticker)
        income = await get_income_statement(ticker)
        balance = await get_balance_sheet(ticker)
        ratios = await get_financial_ratios(ticker)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch data: {str(e)}")

    export_data = {
        "ticker": ticker,
        "generated_at": datetime.utcnow().isoformat(),
        "quote": {
            "price": quote.price,
            "change": quote.change,
            "change_percent": quote.change_percent,
            "volume": quote.volume,
            "market_cap": quote.market_cap,
            "pe_ratio": quote.pe_ratio,
            "week_52_high": quote.week_52_high,
            "week_52_low": quote.week_52_low,
        },
        "technical": indicators,
        "analyst": analyst,
        "earnings": earnings,
        "income_statement": income,
        "balance_sheet": balance,
        "ratios": ratios,
    }

    json_output = json.dumps(export_data, indent=2, default=str)

    return StreamingResponse(
        iter([json_output]),
        media_type="application/json",
        headers={"Content-Disposition": f"attachment; filename={ticker}_financials.json"},
    )
