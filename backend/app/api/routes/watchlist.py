"""Watchlist CRUD API routes."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, delete, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database import get_db, Watchlist, User
from app.models.schemas import WatchlistItem, WatchlistItemCreate, WatchlistItemUpdate
from app.services.stock_service import StockService
from app.api.dependencies import get_current_user

router = APIRouter(prefix="/watchlist", tags=["watchlist"])
stock_service = StockService()


@router.get("", response_model=list[WatchlistItem])
async def get_watchlist(
    category: str | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_current_user),
) -> list[WatchlistItem]:
    """Get all watchlist items for the current user, optionally filtered by category."""
    # Guest users get empty watchlist
    if not current_user:
        return []

    query = select(Watchlist).where(Watchlist.user_id == current_user.id)
    if category:
        query = query.where(Watchlist.category == category)
    query = query.order_by(Watchlist.added_at.desc())

    result = await db.execute(query)
    items = result.scalars().all()
    return [WatchlistItem.model_validate(item) for item in items]


@router.post("", response_model=WatchlistItem, status_code=201)
async def add_to_watchlist(
    item: WatchlistItemCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_current_user),
) -> WatchlistItem:
    """Add a ticker to the watchlist. Requires authentication."""
    if not current_user:
        raise HTTPException(status_code=401, detail="Login required to add to watchlist")

    ticker = item.ticker.upper()

    # Check if already in user's watchlist
    existing = await db.execute(
        select(Watchlist).where(
            and_(Watchlist.user_id == current_user.id, Watchlist.ticker == ticker)
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail=f"{ticker} is already in your watchlist")

    # Fetch company name from yfinance
    try:
        quote = await stock_service.get_quote(ticker)
        name = quote.name
    except Exception:
        name = None  # Still add to watchlist even if we can't get the name

    # Create watchlist entry
    watchlist_item = Watchlist(
        user_id=current_user.id,
        ticker=ticker,
        name=name,
        category=item.category,
        notes=item.notes,
    )
    db.add(watchlist_item)
    await db.flush()
    await db.refresh(watchlist_item)

    return WatchlistItem.model_validate(watchlist_item)


@router.delete("/{ticker}", status_code=204)
async def remove_from_watchlist(
    ticker: str,
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_current_user),
) -> None:
    """Remove a ticker from the watchlist. Requires authentication."""
    if not current_user:
        raise HTTPException(status_code=401, detail="Login required to modify watchlist")

    ticker = ticker.upper()
    result = await db.execute(
        delete(Watchlist).where(
            and_(Watchlist.user_id == current_user.id, Watchlist.ticker == ticker)
        )
    )
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail=f"{ticker} not found in watchlist")


@router.patch("/{ticker}", response_model=WatchlistItem)
async def update_watchlist_item(
    ticker: str,
    updates: WatchlistItemUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_current_user),
) -> WatchlistItem:
    """Update a watchlist item's category or notes. Requires authentication."""
    if not current_user:
        raise HTTPException(status_code=401, detail="Login required to modify watchlist")

    ticker = ticker.upper()

    result = await db.execute(
        select(Watchlist).where(
            and_(Watchlist.user_id == current_user.id, Watchlist.ticker == ticker)
        )
    )
    item = result.scalar_one_or_none()

    if not item:
        raise HTTPException(status_code=404, detail=f"{ticker} not found in watchlist")

    if updates.category is not None:
        item.category = updates.category
    if updates.notes is not None:
        item.notes = updates.notes

    await db.flush()
    await db.refresh(item)

    return WatchlistItem.model_validate(item)


@router.get("/categories", response_model=list[str])
async def get_categories(
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_current_user),
) -> list[str]:
    """Get all unique categories in the user's watchlist."""
    if not current_user:
        return []

    result = await db.execute(
        select(Watchlist.category)
        .where(
            and_(
                Watchlist.user_id == current_user.id,
                Watchlist.category.isnot(None)
            )
        )
        .distinct()
    )
    categories = [row[0] for row in result.all() if row[0]]
    return sorted(categories)
