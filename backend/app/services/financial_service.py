"""Financial data service for earnings, metrics, and ratios using Finnhub."""

from typing import Any

from app.services.finnhub_client import finnhub_client


async def get_earnings_data(ticker: str) -> dict[str, Any]:
    """
    Get earnings history and estimates for a ticker.
    """
    result = {
        "quarterly_earnings": [],
        "annual_earnings": [],
        "earnings_estimate": None,
        "earnings_history": [],
    }

    try:
        # Get earnings from Finnhub
        earnings = await finnhub_client.get_earnings(ticker)

        if earnings:
            # Process earnings history
            for e in earnings[:8]:  # Last 8 quarters
                result["quarterly_earnings"].append({
                    "quarter": e.get("period", ""),
                    "revenue": None,  # Finnhub earnings endpoint doesn't include revenue
                    "earnings": e.get("actual"),
                    "estimate": e.get("estimate"),
                    "surprise": e.get("surprise"),
                    "surprise_percent": e.get("surprisePercent"),
                })

        # Get additional metrics from basic financials
        financials = await finnhub_client.get_basic_financials(ticker)
        metrics = financials.get("metric", {})

        result["earnings_estimate"] = {
            "current_eps": metrics.get("epsBasicExclExtraItemsTTM"),
            "forward_eps": metrics.get("epsNormalizedAnnual"),
            "peg_ratio": metrics.get("pegRatio"),
            "earnings_growth": metrics.get("epsGrowthTTMYoy"),
            "revenue_growth": metrics.get("revenueGrowthTTMYoy"),
        }

    except Exception:
        pass

    return result


async def get_income_statement(ticker: str, quarterly: bool = False) -> dict[str, Any]:
    """
    Get income statement data from Finnhub metrics.
    Note: Finnhub free tier provides metrics but not full statements.
    """
    try:
        financials = await finnhub_client.get_basic_financials(ticker)
        metrics = financials.get("metric", {})

        # Extract income statement related metrics
        data = {
            "total_revenue": [metrics.get("revenueTTM")] if metrics.get("revenueTTM") else [],
            "gross_profit": [metrics.get("grossMarginTTM", 0) * metrics.get("revenueTTM", 0) / 100] if metrics.get("revenueTTM") else [],
            "operating_income": [metrics.get("operatingMarginTTM", 0) * metrics.get("revenueTTM", 0) / 100] if metrics.get("revenueTTM") else [],
            "net_income": [metrics.get("netProfitMarginTTM", 0) * metrics.get("revenueTTM", 0) / 100] if metrics.get("revenueTTM") else [],
            "basic_eps": [metrics.get("epsBasicExclExtraItemsTTM")],
        }

        return {
            "periods": ["TTM"],
            "data": data,
            "quarterly": quarterly,
        }
    except Exception:
        return {"periods": [], "data": {}, "quarterly": quarterly}


async def get_balance_sheet(ticker: str, quarterly: bool = False) -> dict[str, Any]:
    """
    Get balance sheet data from Finnhub metrics.
    Note: Finnhub free tier provides metrics but not full statements.
    """
    try:
        financials = await finnhub_client.get_basic_financials(ticker)
        metrics = financials.get("metric", {})

        data = {
            "total_assets": [metrics.get("totalAssets")],
            "total_liabilities": [metrics.get("totalLiabilities")],
            "total_equity": [metrics.get("totalEquity")],
            "cash_and_cash_equivalents": [metrics.get("cashPerShareAnnual", 0) * metrics.get("shareOutstanding", 0)] if metrics.get("shareOutstanding") else [],
            "total_debt": [metrics.get("totalDebt")],
            "net_debt": [metrics.get("netDebtAnnual")],
        }

        return {
            "periods": ["Latest"],
            "data": data,
            "quarterly": quarterly,
        }
    except Exception:
        return {"periods": [], "data": {}, "quarterly": quarterly}


async def get_cash_flow(ticker: str, quarterly: bool = False) -> dict[str, Any]:
    """
    Get cash flow statement data from Finnhub metrics.
    Note: Finnhub free tier provides metrics but not full statements.
    """
    try:
        financials = await finnhub_client.get_basic_financials(ticker)
        metrics = financials.get("metric", {})

        data = {
            "operating_cash_flow": [metrics.get("cashFlowPerShareTTM", 0) * metrics.get("shareOutstanding", 0)] if metrics.get("shareOutstanding") else [],
            "free_cash_flow": [metrics.get("freeCashFlowTTM")],
            "capital_expenditure": [metrics.get("capexTTM")],
        }

        return {
            "periods": ["TTM"],
            "data": data,
            "quarterly": quarterly,
        }
    except Exception:
        return {"periods": [], "data": {}, "quarterly": quarterly}


async def get_financial_ratios(ticker: str) -> dict[str, Any]:
    """
    Get key financial ratios from Finnhub.
    """
    try:
        financials = await finnhub_client.get_basic_financials(ticker)
        metrics = financials.get("metric", {})

        return {
            "valuation": {
                "pe_ratio": metrics.get("peBasicExclExtraTTM"),
                "forward_pe": metrics.get("peExclExtraNormalizedAnnual"),
                "peg_ratio": metrics.get("pegRatio"),
                "price_to_book": metrics.get("pbAnnual"),
                "price_to_sales": metrics.get("psTTM"),
                "enterprise_value": metrics.get("enterpriseValue"),
                "ev_to_revenue": metrics.get("evToRevenueTTM"),
                "ev_to_ebitda": metrics.get("enterpriseValueEbitdaTTM"),
            },
            "profitability": {
                "profit_margin": metrics.get("netProfitMarginTTM"),
                "operating_margin": metrics.get("operatingMarginTTM"),
                "gross_margin": metrics.get("grossMarginTTM"),
                "return_on_assets": metrics.get("roaTTM"),
                "return_on_equity": metrics.get("roeTTM"),
            },
            "liquidity": {
                "current_ratio": metrics.get("currentRatioAnnual"),
                "quick_ratio": metrics.get("quickRatioAnnual"),
                "debt_to_equity": metrics.get("totalDebtToEquityAnnual"),
            },
            "growth": {
                "revenue_growth": metrics.get("revenueGrowthTTMYoy"),
                "earnings_growth": metrics.get("epsGrowthTTMYoy"),
                "quarterly_revenue_growth": metrics.get("revenueGrowthQuarterlyYoy"),
                "quarterly_earnings_growth": metrics.get("epsGrowthQuarterlyYoy"),
            },
            "dividends": {
                "dividend_rate": metrics.get("dividendPerShareAnnual"),
                "dividend_yield": metrics.get("dividendYieldIndicatedAnnual"),
                "payout_ratio": metrics.get("payoutRatioAnnual"),
                "ex_dividend_date": None,  # Not available in basic metrics
            },
        }
    except Exception:
        return {
            "valuation": {},
            "profitability": {},
            "liquidity": {},
            "growth": {},
            "dividends": {},
        }
