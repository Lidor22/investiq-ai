"""Application configuration using pydantic-settings."""

from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # API Keys
    groq_api_key: str = ""
    finnhub_api_key: str = ""
    news_api_key: str = ""
    alpha_vantage_key: str = ""

    # Database
    database_url: str = "sqlite:///./data/investiq.db"

    # App Settings
    debug: bool = True
    cache_ttl_minutes: int = 15

    # Google OAuth
    google_client_id: str = ""
    google_client_secret: str = ""

    # JWT Settings
    jwt_secret: str = "dev-secret-key-change-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24 * 7  # 7 days

    # Frontend URL for OAuth redirects
    frontend_url: str = "http://localhost:5173"

    # CORS - includes localhost, Render, and Vercel domains
    cors_origins: list[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "https://investiq.onrender.com",
        "https://investiq-api.onrender.com",
        "https://investiq-ai.vercel.app",
    ]


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


settings = get_settings()
