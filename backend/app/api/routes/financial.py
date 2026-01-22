"""Financial data API routes."""

from fastapi import APIRouter, HTTPException, Query

from app.models.schemas import (
    EarningsData,
    EarningsEstimate,
    QuarterlyEarning,
    AnnualEarning,
    FinancialStatement,
    FinancialRatios,
    ValuationRatios,
    ProfitabilityRatios,
    LiquidityRatios,
    GrowthMetrics,
    DividendInfo,
)
from app.services.financial_service import (
    get_earnings_data,
    get_income_statement,
    get_balance_sheet,
    get_cash_flow,
    get_financial_ratios,
)

router = APIRouter(prefix="/financial", tags=["financial"])


@router.get("/{ticker}/earnings", response_model=EarningsData)
async def get_earnings(ticker: str):
    """
    Get earnings history and estimates for a stock.
    """
    ticker = ticker.upper()

    try:
        data = await get_earnings_data(ticker)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch earnings: {str(e)}")

    return EarningsData(
        ticker=ticker,
        quarterly_earnings=[QuarterlyEarning(**q) for q in data.get("quarterly_earnings", [])],
        annual_earnings=[AnnualEarning(**a) for a in data.get("annual_earnings", [])],
        earnings_estimate=EarningsEstimate(**data["earnings_estimate"]) if data.get("earnings_estimate") else None,
    )


@router.get("/{ticker}/income", response_model=FinancialStatement)
async def get_income(
    ticker: str,
    quarterly: bool = Query(False, description="Get quarterly data instead of annual"),
):
    """
    Get income statement data.
    """
    ticker = ticker.upper()

    try:
        data = await get_income_statement(ticker, quarterly)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch income statement: {str(e)}")

    return FinancialStatement(
        ticker=ticker,
        periods=data.get("periods", []),
        data=data.get("data", {}),
        quarterly=quarterly,
    )


@router.get("/{ticker}/balance", response_model=FinancialStatement)
async def get_balance(
    ticker: str,
    quarterly: bool = Query(False, description="Get quarterly data instead of annual"),
):
    """
    Get balance sheet data.
    """
    ticker = ticker.upper()

    try:
        data = await get_balance_sheet(ticker, quarterly)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch balance sheet: {str(e)}")

    return FinancialStatement(
        ticker=ticker,
        periods=data.get("periods", []),
        data=data.get("data", {}),
        quarterly=quarterly,
    )


@router.get("/{ticker}/cashflow", response_model=FinancialStatement)
async def get_cashflow(
    ticker: str,
    quarterly: bool = Query(False, description="Get quarterly data instead of annual"),
):
    """
    Get cash flow statement data.
    """
    ticker = ticker.upper()

    try:
        data = await get_cash_flow(ticker, quarterly)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch cash flow: {str(e)}")

    return FinancialStatement(
        ticker=ticker,
        periods=data.get("periods", []),
        data=data.get("data", {}),
        quarterly=quarterly,
    )


@router.get("/{ticker}/ratios", response_model=FinancialRatios)
async def get_ratios(ticker: str):
    """
    Get key financial ratios.
    """
    ticker = ticker.upper()

    try:
        data = await get_financial_ratios(ticker)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch ratios: {str(e)}")

    return FinancialRatios(
        ticker=ticker,
        valuation=ValuationRatios(**data.get("valuation", {})),
        profitability=ProfitabilityRatios(**data.get("profitability", {})),
        liquidity=LiquidityRatios(**data.get("liquidity", {})),
        growth=GrowthMetrics(**data.get("growth", {})),
        dividends=DividendInfo(**data.get("dividends", {})),
    )
