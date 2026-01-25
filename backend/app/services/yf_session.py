"""Shared yfinance session with Chrome impersonation to bypass rate limiting."""

from curl_cffi import requests as curl_requests

# Shared session that mimics Chrome's TLS fingerprint
# This bypasses Yahoo Finance's rate limiting detection
yf_session = curl_requests.Session(impersonate="chrome")
