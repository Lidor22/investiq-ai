"""Simple in-memory cache with TTL support."""

import asyncio
from datetime import datetime, timedelta
from typing import Any, TypeVar, Callable
from functools import wraps

T = TypeVar("T")


class Cache:
    """Thread-safe in-memory cache with TTL."""

    def __init__(self):
        self._cache: dict[str, tuple[Any, datetime]] = {}
        self._lock = asyncio.Lock()

    async def get(self, key: str) -> Any | None:
        """Get a value from cache if not expired."""
        async with self._lock:
            if key not in self._cache:
                return None

            value, expires_at = self._cache[key]
            if datetime.utcnow() > expires_at:
                del self._cache[key]
                return None

            return value

    async def set(self, key: str, value: Any, ttl_seconds: int = 300) -> None:
        """Set a value in cache with TTL."""
        async with self._lock:
            expires_at = datetime.utcnow() + timedelta(seconds=ttl_seconds)
            self._cache[key] = (value, expires_at)

    async def delete(self, key: str) -> None:
        """Delete a key from cache."""
        async with self._lock:
            self._cache.pop(key, None)

    async def clear(self) -> None:
        """Clear all cached values."""
        async with self._lock:
            self._cache.clear()

    async def cleanup_expired(self) -> int:
        """Remove expired entries. Returns count of removed entries."""
        async with self._lock:
            now = datetime.utcnow()
            expired_keys = [
                key for key, (_, expires_at) in self._cache.items()
                if now > expires_at
            ]
            for key in expired_keys:
                del self._cache[key]
            return len(expired_keys)

    @property
    def size(self) -> int:
        """Get current cache size."""
        return len(self._cache)


# Global cache instance
cache = Cache()


def cached(ttl_seconds: int = 300, key_prefix: str = ""):
    """
    Decorator to cache async function results.

    Args:
        ttl_seconds: Time to live in seconds (default 5 minutes)
        key_prefix: Prefix for cache keys
    """
    def decorator(func: Callable[..., T]) -> Callable[..., T]:
        @wraps(func)
        async def wrapper(*args, **kwargs) -> T:
            # Build cache key from function name and arguments
            key_parts = [key_prefix or func.__name__]
            key_parts.extend(str(arg) for arg in args)
            key_parts.extend(f"{k}={v}" for k, v in sorted(kwargs.items()))
            cache_key = ":".join(key_parts)

            # Try to get from cache
            cached_value = await cache.get(cache_key)
            if cached_value is not None:
                return cached_value

            # Call function and cache result
            result = await func(*args, **kwargs)
            await cache.set(cache_key, result, ttl_seconds)
            return result

        return wrapper
    return decorator


# Cache TTL constants (in seconds)
class CacheTTL:
    """Standard cache TTL values."""

    QUOTE = 60  # 1 minute for real-time quotes
    NEWS = 1800  # 30 minutes for news
    TECHNICAL = 300  # 5 minutes for technical indicators
    FINANCIAL = 3600  # 1 hour for financial data
    BRIEF = 7200  # 2 hours for AI briefs
