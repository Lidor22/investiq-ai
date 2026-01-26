"""Financial data service for earnings, metrics, and ratios using Finnhub."""

import logging
from typing import Any

import yfinance as yf

from app.services.finnhub_client import finnhub_client

logger = logging.getLogger(__name__)


async def get_earnings_data(ticker: str) -> dict[str, Any]:
    """
    Get earnings history and estimates for a ticker.
    Uses Finnhub for EPS data and yfinance for revenue data.
    """
    result = {
        "quarterly_earnings": [],
        "annual_earnings": [],
        "earnings_estimate": None,
        "earnings_history": [],
    }

    # Get quarterly revenue from yfinance
    quarterly_revenue = {}
    annual_revenue = {}
    try:
        stock = yf.Ticker(ticker)

        # Get quarterly financials for revenue
        quarterly_financials = stock.quarterly_financials
        if quarterly_financials is not None and not quarterly_financials.empty:
            if 'Total Revenue' in quarterly_financials.index:
                for date_col in quarterly_financials.columns:
                    quarter_key = date_col.strftime("%Y-%m")
                    revenue = quarterly_financials.loc['Total Revenue', date_col]
                    if revenue and not (hasattr(revenue, 'isna') and revenue.isna()):
                        quarterly_revenue[quarter_key] = float(revenue)

        # Get annual financials for revenue
        annual_financials = stock.financials
        if annual_financials is not None and not annual_financials.empty:
            if 'Total Revenue' in annual_financials.index:
                for date_col in annual_financials.columns:
                    year_key = str(date_col.year)
                    revenue = annual_financials.loc['Total Revenue', date_col]
                    if revenue and not (hasattr(revenue, 'isna') and revenue.isna()):
                        annual_revenue[year_key] = float(revenue)

        # Get annual EPS from yfinance earnings data
        earnings_annual = stock.earnings
        if earnings_annual is not None and not earnings_annual.empty:
            for year_idx in earnings_annual.index:
                year_str = str(year_idx)
                eps = None
                if 'Earnings' in earnings_annual.columns:
                    eps_val = earnings_annual.loc[year_idx, 'Earnings']
                    if eps_val and not (hasattr(eps_val, 'isna') and eps_val.isna()):
                        eps = float(eps_val)

                rev = annual_revenue.get(year_str)

                result["annual_earnings"].append({
                    "year": year_str,
                    "revenue": rev,
                    "earnings": eps,
                    "actual": eps,
                    "estimate": None,
                })

            # Sort by year descending
            result["annual_earnings"].sort(key=lambda x: x["year"], reverse=True)

    except Exception as e:
        logger.warning(f"yfinance revenue data failed for {ticker}: {e}")

    try:
        # Get earnings from Finnhub (EPS data)
        earnings = await finnhub_client.get_earnings(ticker)

        if earnings:
            # Process earnings history
            for e in earnings[:8]:  # Last 8 quarters
                period = e.get("period", "")
                quarter_key = period[:7] if period else ""  # YYYY-MM format

                # Try to find matching revenue
                revenue = quarterly_revenue.get(quarter_key)

                result["quarterly_earnings"].append({
                    "quarter": period,
                    "revenue": revenue,
                    "earnings": e.get("actual"),  # Actual EPS
                    "estimate": e.get("estimate"),  # Estimated EPS
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
            "revenue_ttm": metrics.get("revenueTTM"),  # TTM Revenue in actual dollars
        }

    except Exception as e:
        logger.warning(f"Finnhub earnings data failed for {ticker}: {e}")

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
