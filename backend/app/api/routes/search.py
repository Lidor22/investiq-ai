"""Stock search API routes."""

import httpx
from fastapi import APIRouter, Query

router = APIRouter(prefix="/search", tags=["search"])


@router.get("/stocks")
async def search_stocks(
    q: str = Query(..., min_length=1, description="Search query"),
    limit: int = Query(10, ge=1, le=50, description="Max results"),
):
    """Search for stocks using Yahoo Finance autocomplete.

    Returns matching tickers with company names.
    """
    if not q.strip():
        return []

    try:
        # Yahoo Finance autocomplete API
        url = "https://query1.finance.yahoo.com/v1/finance/search"
        params = {
            "q": q,
            "quotesCount": limit,
            "newsCount": 0,
            "enableFuzzyQuery": False,
            "quotesQueryId": "tss_match_phrase_query",
        }
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }

        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params, headers=headers, timeout=5.0)
            response.raise_for_status()
            data = response.json()

        results = []
        for quote in data.get("quotes", []):
            # Only include stocks and ETFs (not indices, currencies, etc.)
            quote_type = quote.get("quoteType", "")
            if quote_type in ("EQUITY", "ETF"):
                results.append({
                    "ticker": quote.get("symbol", ""),
                    "name": quote.get("shortname") or quote.get("longname", ""),
                    "exchange": quote.get("exchange", ""),
                    "type": quote_type,
                })

        return results

    except Exception:
        # Return empty on error - frontend will fall back to local list
        return []
