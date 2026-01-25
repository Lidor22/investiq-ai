"""FastAPI application entry point."""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import auth, brief, export, financial, news, search, stock, technical, watchlist
from app.config import settings
from app.models.database import init_db
from app.middleware.rate_limit import RateLimitMiddleware
from app.services.cache import cache

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize database on startup."""
    logger.info("Starting InvestIQ API...")

    # Initialize database
    await init_db()
    logger.info("Database initialized")

    # Log yfinance session type
    from app.services.yf_session import yf_session
    session_type = type(yf_session).__module__ if yf_session else "None"
    logger.info(f"YFinance session type: {session_type}")

    yield
    # Cleanup on shutdown
    await cache.clear()
    logger.info("InvestIQ API shutdown complete")


app = FastAPI(
    title="InvestIQ API",
    description="Investment Research Assistant API",
    version="0.3.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Add rate limiting middleware (before CORS)
app.add_middleware(RateLimitMiddleware)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/v1")
app.include_router(stock.router, prefix="/api/v1")
app.include_router(brief.router, prefix="/api/v1")
app.include_router(watchlist.router, prefix="/api/v1")
app.include_router(news.router, prefix="/api/v1")
app.include_router(technical.router, prefix="/api/v1")
app.include_router(financial.router, prefix="/api/v1")
app.include_router(export.router, prefix="/api/v1")
app.include_router(search.router, prefix="/api/v1")


@app.get("/health")
async def health_check() -> dict:
    """Health check endpoint for Render."""
    return {"status": "ok"}


@app.get("/")
async def root() -> dict:
    """Root endpoint with API info."""
    return {
        "name": "InvestIQ API",
        "version": "0.3.0",
        "docs": "/docs",
    }
