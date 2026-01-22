"""Financial data service for earnings, income statements, and balance sheets."""

from typing import Any
import yfinance as yf


async def get_earnings_data(ticker: str) -> dict[str, Any]:
    """
    Get earnings history and estimates for a ticker.
    """
    stock = yf.Ticker(ticker)

    result = {
        "quarterly_earnings": [],
        "annual_earnings": [],
        "earnings_estimate": None,
        "earnings_history": [],
    }

    # Quarterly earnings
    try:
        earnings = stock.quarterly_earnings
        if earnings is not None and not earnings.empty:
            result["quarterly_earnings"] = [
                {
                    "quarter": idx.strftime("%Y-%m-%d") if hasattr(idx, 'strftime') else str(idx),
                    "revenue": float(row.get("Revenue", 0)) if row.get("Revenue") else None,
                    "earnings": float(row.get("Earnings", 0)) if row.get("Earnings") else None,
                }
                for idx, row in earnings.tail(8).iterrows()
            ]
    except Exception:
        pass

    # Annual earnings
    try:
        earnings = stock.earnings
        if earnings is not None and not earnings.empty:
            result["annual_earnings"] = [
                {
                    "year": str(idx),
                    "revenue": float(row.get("Revenue", 0)) if row.get("Revenue") else None,
                    "earnings": float(row.get("Earnings", 0)) if row.get("Earnings") else None,
                }
                for idx, row in earnings.tail(5).iterrows()
            ]
    except Exception:
        pass

    # Earnings estimates from info
    info = stock.info
    result["earnings_estimate"] = {
        "current_eps": info.get("trailingEps"),
        "forward_eps": info.get("forwardEps"),
        "peg_ratio": info.get("pegRatio"),
        "earnings_growth": info.get("earningsGrowth"),
        "revenue_growth": info.get("revenueGrowth"),
    }

    return result


async def get_income_statement(ticker: str, quarterly: bool = False) -> dict[str, Any]:
    """
    Get income statement data.
    """
    stock = yf.Ticker(ticker)

    try:
        if quarterly:
            stmt = stock.quarterly_income_stmt
        else:
            stmt = stock.income_stmt

        if stmt is None or stmt.empty:
            return {"periods": [], "data": {}}

        # Get column names (dates) and convert to strings
        periods = [col.strftime("%Y-%m-%d") if hasattr(col, 'strftime') else str(col) for col in stmt.columns[:4]]

        # Key metrics to extract
        metrics = [
            "Total Revenue",
            "Gross Profit",
            "Operating Income",
            "Net Income",
            "EBITDA",
            "Basic EPS",
            "Diluted EPS",
        ]

        data = {}
        for metric in metrics:
            if metric in stmt.index:
                values = stmt.loc[metric].head(4).tolist()
                data[metric.lower().replace(" ", "_")] = [
                    float(v) if v and not (isinstance(v, float) and v != v) else None
                    for v in values
                ]

        return {
            "periods": periods,
            "data": data,
            "quarterly": quarterly,
        }
    except Exception:
        return {"periods": [], "data": {}, "quarterly": quarterly}


async def get_balance_sheet(ticker: str, quarterly: bool = False) -> dict[str, Any]:
    """
    Get balance sheet data.
    """
    stock = yf.Ticker(ticker)

    try:
        if quarterly:
            stmt = stock.quarterly_balance_sheet
        else:
            stmt = stock.balance_sheet

        if stmt is None or stmt.empty:
            return {"periods": [], "data": {}}

        periods = [col.strftime("%Y-%m-%d") if hasattr(col, 'strftime') else str(col) for col in stmt.columns[:4]]

        metrics = [
            "Total Assets",
            "Total Liabilities Net Minority Interest",
            "Total Equity Gross Minority Interest",
            "Cash And Cash Equivalents",
            "Total Debt",
            "Net Debt",
            "Working Capital",
        ]

        data = {}
        for metric in metrics:
            if metric in stmt.index:
                values = stmt.loc[metric].head(4).tolist()
                key = metric.lower().replace(" ", "_").replace("_net_minority_interest", "").replace("_gross_minority_interest", "")
                data[key] = [
                    float(v) if v and not (isinstance(v, float) and v != v) else None
                    for v in values
                ]

        return {
            "periods": periods,
            "data": data,
            "quarterly": quarterly,
        }
    except Exception:
        return {"periods": [], "data": {}, "quarterly": quarterly}


async def get_cash_flow(ticker: str, quarterly: bool = False) -> dict[str, Any]:
    """
    Get cash flow statement data.
    """
    stock = yf.Ticker(ticker)

    try:
        if quarterly:
            stmt = stock.quarterly_cashflow
        else:
            stmt = stock.cashflow

        if stmt is None or stmt.empty:
            return {"periods": [], "data": {}}

        periods = [col.strftime("%Y-%m-%d") if hasattr(col, 'strftime') else str(col) for col in stmt.columns[:4]]

        metrics = [
            "Operating Cash Flow",
            "Investing Cash Flow",
            "Financing Cash Flow",
            "Free Cash Flow",
            "Capital Expenditure",
        ]

        data = {}
        for metric in metrics:
            if metric in stmt.index:
                values = stmt.loc[metric].head(4).tolist()
                data[metric.lower().replace(" ", "_")] = [
                    float(v) if v and not (isinstance(v, float) and v != v) else None
                    for v in values
                ]

        return {
            "periods": periods,
            "data": data,
            "quarterly": quarterly,
        }
    except Exception:
        return {"periods": [], "data": {}, "quarterly": quarterly}


async def get_financial_ratios(ticker: str) -> dict[str, Any]:
    """
    Get key financial ratios.
    """
    stock = yf.Ticker(ticker)
    info = stock.info

    return {
        "valuation": {
            "pe_ratio": info.get("trailingPE"),
            "forward_pe": info.get("forwardPE"),
            "peg_ratio": info.get("pegRatio"),
            "price_to_book": info.get("priceToBook"),
            "price_to_sales": info.get("priceToSalesTrailing12Months"),
            "enterprise_value": info.get("enterpriseValue"),
            "ev_to_revenue": info.get("enterpriseToRevenue"),
            "ev_to_ebitda": info.get("enterpriseToEbitda"),
        },
        "profitability": {
            "profit_margin": info.get("profitMargins"),
            "operating_margin": info.get("operatingMargins"),
            "gross_margin": info.get("grossMargins"),
            "return_on_assets": info.get("returnOnAssets"),
            "return_on_equity": info.get("returnOnEquity"),
        },
        "liquidity": {
            "current_ratio": info.get("currentRatio"),
            "quick_ratio": info.get("quickRatio"),
            "debt_to_equity": info.get("debtToEquity"),
        },
        "growth": {
            "revenue_growth": info.get("revenueGrowth"),
            "earnings_growth": info.get("earningsGrowth"),
            "quarterly_revenue_growth": info.get("revenueQuarterlyGrowth"),
            "quarterly_earnings_growth": info.get("earningsQuarterlyGrowth"),
        },
        "dividends": {
            "dividend_rate": info.get("dividendRate"),
            "dividend_yield": info.get("dividendYield"),
            "payout_ratio": info.get("payoutRatio"),
            "ex_dividend_date": info.get("exDividendDate"),
        },
    }
