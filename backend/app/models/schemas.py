"""Pydantic models for API request/response schemas."""

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


class Sentiment(str, Enum):
    """Sentiment classification for analysis."""

    BULLISH = "bullish"
    BEARISH = "bearish"
    NEUTRAL = "neutral"


class StockQuote(BaseModel):
    """Current stock quote with key metrics."""

    ticker: str = Field(..., description="Stock ticker symbol")
    name: str = Field(..., description="Company name")
    price: float = Field(..., description="Current price")
    change: float = Field(..., description="Price change from previous close")
    change_percent: float = Field(..., description="Percentage change from previous close")
    volume: int = Field(..., description="Trading volume")
    market_cap: float | None = Field(None, description="Market capitalization")
    pe_ratio: float | None = Field(None, description="Price-to-earnings ratio")
    eps: float | None = Field(None, description="Earnings per share")
    week_52_high: float = Field(..., description="52-week high price")
    week_52_low: float = Field(..., description="52-week low price")
    updated_at: datetime = Field(default_factory=datetime.utcnow, description="Quote timestamp")

    model_config = {"json_schema_extra": {"example": {
        "ticker": "NVDA",
        "name": "NVIDIA Corporation",
        "price": 142.50,
        "change": 3.25,
        "change_percent": 2.33,
        "volume": 45000000,
        "market_cap": 3500000000000,
        "pe_ratio": 65.2,
        "eps": 2.19,
        "week_52_high": 152.89,
        "week_52_low": 76.32,
        "updated_at": "2025-01-20T14:30:00Z"
    }}}


class StockNotFoundError(Exception):
    """Raised when a stock ticker is not found."""

    def __init__(self, ticker: str):
        self.ticker = ticker
        self.message = f"Stock ticker '{ticker}' not found"
        super().__init__(self.message)


class APIErrorResponse(BaseModel):
    """Standard error response format."""

    error: str = Field(..., description="Error code")
    message: str = Field(..., description="Human-readable error message")


class InvestmentBrief(BaseModel):
    """AI-generated investment brief combining all analysis."""

    ticker: str = Field(..., description="Stock ticker symbol")
    company_name: str = Field(..., description="Company name")
    generated_at: datetime = Field(default_factory=datetime.utcnow)

    # Summary
    executive_summary: str = Field(..., description="2-3 sentence overview")

    # Analysis sections
    bull_case: list[str] = Field(..., description="3-5 bullish points")
    bear_case: list[str] = Field(..., description="3-5 bearish points")
    key_risks: list[str] = Field(..., description="3-5 key risks")
    catalysts: list[str] = Field(..., description="2-4 upcoming catalysts")

    # Component summaries
    technical_outlook: str = Field(..., description="Technical analysis summary")
    financial_health: str = Field(..., description="Financial health assessment")
    recent_developments: str = Field(..., description="Recent news summary")

    # Conclusion
    conclusion: str = Field(..., description="2-3 sentence final assessment")
    sentiment: Sentiment = Field(..., description="Overall sentiment")

    # Cache metadata
    cached: bool = Field(default=False, description="Whether this brief was loaded from cache")


class BriefGenerateRequest(BaseModel):
    """Request body for brief generation."""

    include_news: bool = Field(default=True, description="Include news analysis")
    include_technicals: bool = Field(default=True, description="Include technical analysis")
    force_regenerate: bool = Field(default=False, description="Force regeneration, bypass cache")


# User/Auth Models
class UserBase(BaseModel):
    """Base user schema."""

    email: str
    name: str | None = None
    picture: str | None = None


class UserCreate(UserBase):
    """Schema for creating a user from Google OAuth."""

    google_id: str


class UserResponse(UserBase):
    """User response schema."""

    id: int
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    """JWT token response."""

    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# Watchlist Models
class WatchlistItemCreate(BaseModel):
    """Request body for adding a ticker to watchlist."""

    ticker: str = Field(..., min_length=1, max_length=10, description="Stock ticker symbol")
    category: str | None = Field(None, description="Category (e.g., 'Tech', 'Energy')")
    notes: str | None = Field(None, description="Personal notes")


class WatchlistItemUpdate(BaseModel):
    """Request body for updating a watchlist item."""

    category: str | None = Field(None, description="Category")
    notes: str | None = Field(None, description="Personal notes")


class WatchlistItem(BaseModel):
    """Watchlist item response."""

    id: int
    ticker: str
    name: str | None
    category: str | None
    notes: str | None
    added_at: datetime

    model_config = {"from_attributes": True}


# News Models
class NewsArticle(BaseModel):
    """Single news article."""

    title: str
    source: str
    url: str
    published_at: datetime
    description: str | None = None
    sentiment: Sentiment | None = None


class NewsSummary(BaseModel):
    """News summary for a ticker."""

    ticker: str
    articles: list[NewsArticle]
    ai_summary: str | None = None
    overall_sentiment: Sentiment | None = None
    key_themes: list[str] = []
    fetched_at: datetime


# Technical Analysis Models
class MovingAverages(BaseModel):
    """Moving average values."""

    sma_20: float
    sma_50: float
    sma_200: float | None = None
    ema_12: float
    ema_26: float


class RSIIndicator(BaseModel):
    """RSI indicator with signal."""

    value: float
    signal: str  # overbought, oversold, neutral


class MACDIndicator(BaseModel):
    """MACD indicator values."""

    macd_line: float
    signal_line: float
    histogram: float


class SupportResistance(BaseModel):
    """Support and resistance levels."""

    support_1: float
    pivot: float
    resistance_1: float


class TechnicalIndicators(BaseModel):
    """Complete technical indicators response."""

    ticker: str
    moving_averages: MovingAverages
    rsi: RSIIndicator
    macd: MACDIndicator
    support_resistance: SupportResistance
    trend: str  # bullish, bearish, neutral
    current_price: float


class PriceHistory(BaseModel):
    """Historical price data."""

    ticker: str
    period: str
    interval: str
    dates: list[str]
    open: list[float]
    high: list[float]
    low: list[float]
    close: list[float]
    volume: list[int]


class PriceTargets(BaseModel):
    """Analyst price targets."""

    current: float | None
    target_high: float | None
    target_low: float | None
    target_mean: float | None
    target_median: float | None
    number_of_analysts: int | None
    recommendation: str | None
    recommendation_mean: float | None
    upside_potential: float | None = None


class AnalystRecommendation(BaseModel):
    """Single analyst recommendation."""

    date: str
    firm: str
    to_grade: str
    from_grade: str | None = None
    action: str | None = None


class AnalystData(BaseModel):
    """Complete analyst data response."""

    ticker: str
    price_targets: PriceTargets
    recommendations: list[AnalystRecommendation] = []


# Financial Data Models
class EarningsEstimate(BaseModel):
    """Earnings estimates and growth metrics."""

    current_eps: float | None = None
    forward_eps: float | None = None
    peg_ratio: float | None = None
    earnings_growth: float | None = None
    revenue_growth: float | None = None


class QuarterlyEarning(BaseModel):
    """Single quarter earnings data."""

    quarter: str
    revenue: float | None = None
    earnings: float | None = None


class AnnualEarning(BaseModel):
    """Single year earnings data."""

    year: str
    revenue: float | None = None
    earnings: float | None = None


class EarningsData(BaseModel):
    """Complete earnings data response."""

    ticker: str
    quarterly_earnings: list[QuarterlyEarning] = []
    annual_earnings: list[AnnualEarning] = []
    earnings_estimate: EarningsEstimate | None = None


class FinancialStatement(BaseModel):
    """Financial statement data."""

    ticker: str
    periods: list[str] = []
    data: dict[str, list[float | None]] = {}
    quarterly: bool = False


class ValuationRatios(BaseModel):
    """Valuation ratios."""

    pe_ratio: float | None = None
    forward_pe: float | None = None
    peg_ratio: float | None = None
    price_to_book: float | None = None
    price_to_sales: float | None = None
    enterprise_value: float | None = None
    ev_to_revenue: float | None = None
    ev_to_ebitda: float | None = None


class ProfitabilityRatios(BaseModel):
    """Profitability ratios."""

    profit_margin: float | None = None
    operating_margin: float | None = None
    gross_margin: float | None = None
    return_on_assets: float | None = None
    return_on_equity: float | None = None


class LiquidityRatios(BaseModel):
    """Liquidity ratios."""

    current_ratio: float | None = None
    quick_ratio: float | None = None
    debt_to_equity: float | None = None


class GrowthMetrics(BaseModel):
    """Growth metrics."""

    revenue_growth: float | None = None
    earnings_growth: float | None = None
    quarterly_revenue_growth: float | None = None
    quarterly_earnings_growth: float | None = None


class DividendInfo(BaseModel):
    """Dividend information."""

    dividend_rate: float | None = None
    dividend_yield: float | None = None
    payout_ratio: float | None = None
    ex_dividend_date: int | None = None


class FinancialRatios(BaseModel):
    """Complete financial ratios response."""

    ticker: str
    valuation: ValuationRatios
    profitability: ProfitabilityRatios
    liquidity: LiquidityRatios
    growth: GrowthMetrics
    dividends: DividendInfo
