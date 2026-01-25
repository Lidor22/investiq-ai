"""Database models and setup (supports PostgreSQL and SQLite)."""

from datetime import datetime
from typing import AsyncGenerator

from sqlalchemy import String, Text, DateTime, JSON, func, ForeignKey, UniqueConstraint
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

from app.config import settings


def get_async_database_url(url: str) -> str:
    """Convert database URL to async driver format."""
    if url.startswith("postgres://"):
        # Render uses postgres:// but SQLAlchemy needs postgresql+asyncpg://
        return url.replace("postgres://", "postgresql+asyncpg://", 1)
    elif url.startswith("postgresql://"):
        # Standard PostgreSQL URL
        return url.replace("postgresql://", "postgresql+asyncpg://", 1)
    elif url.startswith("sqlite:///"):
        # SQLite for local development
        return url.replace("sqlite:///", "sqlite+aiosqlite:///", 1)
    return url


def is_postgres_url(url: str) -> bool:
    """Check if URL is for PostgreSQL."""
    return url.startswith(("postgres://", "postgresql://", "postgresql+asyncpg://"))


DATABASE_URL = get_async_database_url(settings.database_url)

# No SSL config needed for Render internal connections
engine = create_async_engine(DATABASE_URL, echo=settings.debug)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    """Base class for all models."""
    pass


class User(Base):
    """User account from Google OAuth."""

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    google_id: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    name: Mapped[str | None] = mapped_column(String(255))
    picture: Mapped[str | None] = mapped_column(String(500))
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    last_login: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationship to watchlist items
    watchlist_items: Mapped[list["Watchlist"]] = relationship("Watchlist", back_populates="user", cascade="all, delete-orphan")


class Watchlist(Base):
    """Watchlist items table."""

    __tablename__ = "watchlist"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    ticker: Mapped[str] = mapped_column(String(10), nullable=False, index=True)
    name: Mapped[str | None] = mapped_column(String(255))
    category: Mapped[str | None] = mapped_column(String(100))
    notes: Mapped[str | None] = mapped_column(Text)
    added_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    # Relationship to user
    user: Mapped["User | None"] = relationship("User", back_populates="watchlist_items")

    __table_args__ = (
        # Each user can only have a ticker once in their watchlist
        UniqueConstraint("user_id", "ticker", name="uq_user_ticker"),
    )


class StockCache(Base):
    """Cached stock data to reduce API calls."""

    __tablename__ = "stock_cache"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    ticker: Mapped[str] = mapped_column(String(10), nullable=False, index=True)
    data_type: Mapped[str] = mapped_column(String(50), nullable=False)  # 'quote', 'financials', 'technicals'
    data: Mapped[dict] = mapped_column(JSON, nullable=False)
    fetched_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    expires_at: Mapped[datetime | None] = mapped_column(DateTime)

    __table_args__ = (
        # Unique constraint on ticker + data_type
        {"sqlite_autoincrement": True},
    )


class NewsCache(Base):
    """Cached news articles and summaries."""

    __tablename__ = "news_cache"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    ticker: Mapped[str] = mapped_column(String(10), nullable=False, index=True)
    articles: Mapped[dict] = mapped_column(JSON, nullable=False)
    summary: Mapped[str | None] = mapped_column(Text)
    sentiment: Mapped[str | None] = mapped_column(String(20))
    fetched_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class Brief(Base):
    """Generated investment briefs."""

    __tablename__ = "briefs"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    ticker: Mapped[str] = mapped_column(String(10), nullable=False, index=True)
    brief_type: Mapped[str] = mapped_column(String(50), default="full")
    content: Mapped[dict] = mapped_column(JSON, nullable=False)
    generated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


async def run_migrations(conn) -> None:
    """Run manual migrations for schema changes."""
    from sqlalchemy import text, inspect

    # Check if we're on PostgreSQL
    if is_postgres_url(settings.database_url):
        # Check if user_id column exists in watchlist table
        result = await conn.execute(text("""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'watchlist' AND column_name = 'user_id'
        """))
        column_exists = result.fetchone() is not None

        if not column_exists:
            print("Migration: Adding user_id column to watchlist table...")
            # Add user_id column
            await conn.execute(text("""
                ALTER TABLE watchlist
                ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE
            """))
            # Add index for user_id
            await conn.execute(text("""
                CREATE INDEX IF NOT EXISTS ix_watchlist_user_id ON watchlist(user_id)
            """))
            print("Migration: user_id column added successfully")

        # Check if unique constraint exists
        result = await conn.execute(text("""
            SELECT constraint_name
            FROM information_schema.table_constraints
            WHERE table_name = 'watchlist' AND constraint_name = 'uq_user_ticker'
        """))
        constraint_exists = result.fetchone() is not None

        if not constraint_exists:
            print("Migration: Adding unique constraint for user_id + ticker...")
            # First, remove any duplicate entries (keep the oldest)
            await conn.execute(text("""
                DELETE FROM watchlist w1
                USING watchlist w2
                WHERE w1.id > w2.id
                AND w1.user_id IS NOT DISTINCT FROM w2.user_id
                AND w1.ticker = w2.ticker
            """))
            # Add unique constraint
            await conn.execute(text("""
                ALTER TABLE watchlist
                ADD CONSTRAINT uq_user_ticker UNIQUE (user_id, ticker)
            """))
            print("Migration: Unique constraint added successfully")


async def init_db() -> None:
    """Initialize database and create tables."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        # Run migrations after creating tables
        await run_migrations(conn)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency for getting database session."""
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
