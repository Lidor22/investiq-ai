"""Shared yfinance session with Chrome impersonation to bypass rate limiting."""

import logging

logger = logging.getLogger(__name__)

# Try to use curl_cffi for Chrome TLS fingerprint impersonation
# This bypasses Yahoo Finance's rate limiting detection
yf_session = None

try:
    from curl_cffi import requests as curl_requests
    yf_session = curl_requests.Session(impersonate="chrome")
    logger.info("Successfully created curl_cffi session with Chrome impersonation")
except ImportError as e:
    logger.warning(f"curl_cffi not available: {e}. Using standard requests (may be rate limited)")
except Exception as e:
    logger.warning(f"Failed to create curl_cffi session: {e}. Using standard requests")

# If curl_cffi failed, fall back to requests-cache or standard session
if yf_session is None:
    try:
        import requests
        yf_session = requests.Session()
        # Add Chrome-like headers
        yf_session.headers.update({
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
            "Accept-Encoding": "gzip, deflate, br",
        })
        logger.info("Using fallback requests session with Chrome-like headers")
    except Exception as e:
        logger.error(f"Failed to create any session: {e}")
        yf_session = None
