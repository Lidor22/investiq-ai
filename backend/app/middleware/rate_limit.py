"""Rate limiting middleware for API protection."""

import asyncio
from collections import defaultdict
from datetime import datetime, timedelta
from typing import Callable

from fastapi import Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware


class RateLimiter:
    """
    Token bucket rate limiter.

    Allows bursts up to max_requests, then limits to requests_per_second.
    """

    def __init__(
        self,
        requests_per_second: float = 10.0,
        max_requests: int = 50,
        window_seconds: int = 60,
    ):
        self.requests_per_second = requests_per_second
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._requests: dict[str, list[datetime]] = defaultdict(list)
        self._lock = asyncio.Lock()

    async def is_allowed(self, client_id: str) -> tuple[bool, dict]:
        """
        Check if request is allowed for client.

        Returns (is_allowed, rate_limit_info)
        """
        async with self._lock:
            now = datetime.utcnow()
            window_start = now - timedelta(seconds=self.window_seconds)

            # Clean old requests
            self._requests[client_id] = [
                req_time for req_time in self._requests[client_id]
                if req_time > window_start
            ]

            current_count = len(self._requests[client_id])
            remaining = max(0, self.max_requests - current_count)

            # Calculate reset time
            if self._requests[client_id]:
                oldest_request = min(self._requests[client_id])
                reset_time = oldest_request + timedelta(seconds=self.window_seconds)
                reset_seconds = int((reset_time - now).total_seconds())
            else:
                reset_seconds = self.window_seconds

            rate_info = {
                "X-RateLimit-Limit": str(self.max_requests),
                "X-RateLimit-Remaining": str(remaining),
                "X-RateLimit-Reset": str(reset_seconds),
            }

            if current_count >= self.max_requests:
                return False, rate_info

            # Record this request
            self._requests[client_id].append(now)
            rate_info["X-RateLimit-Remaining"] = str(remaining - 1)

            return True, rate_info

    async def cleanup(self) -> int:
        """Remove old entries. Returns count of clients cleaned."""
        async with self._lock:
            now = datetime.utcnow()
            window_start = now - timedelta(seconds=self.window_seconds)
            cleaned = 0

            empty_clients = []
            for client_id, requests in self._requests.items():
                self._requests[client_id] = [
                    req_time for req_time in requests
                    if req_time > window_start
                ]
                if not self._requests[client_id]:
                    empty_clients.append(client_id)

            for client_id in empty_clients:
                del self._requests[client_id]
                cleaned += 1

            return cleaned


# Global rate limiter instance
rate_limiter = RateLimiter(
    requests_per_second=10.0,
    max_requests=100,  # 100 requests per minute
    window_seconds=60,
)


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Middleware to apply rate limiting to all requests."""

    def __init__(self, app, limiter: RateLimiter | None = None):
        super().__init__(app)
        self.limiter = limiter or rate_limiter

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Skip rate limiting for health checks and docs
        if request.url.path in ["/health", "/docs", "/redoc", "/openapi.json", "/"]:
            return await call_next(request)

        # Get client identifier (IP address or forwarded IP)
        client_ip = request.client.host if request.client else "unknown"
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            client_ip = forwarded.split(",")[0].strip()

        # Check rate limit
        allowed, rate_info = await self.limiter.is_allowed(client_ip)

        if not allowed:
            return JSONResponse(
                status_code=429,
                content={
                    "error": "rate_limit_exceeded",
                    "message": "Too many requests. Please slow down.",
                    "retry_after": int(rate_info["X-RateLimit-Reset"]),
                },
                headers=rate_info,
            )

        # Process request and add rate limit headers
        response = await call_next(request)
        for header, value in rate_info.items():
            response.headers[header] = value

        return response
