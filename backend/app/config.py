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

    # API Keys (accepts CLAUDE_API_KEY or ANTHROPIC_API_KEY)
    claude_api_key: str = ""
    anthropic_api_key: str = ""

    @property
    def ai_api_key(self) -> str:
        """Get the AI API key (supports both naming conventions)."""
        return self.claude_api_key or self.anthropic_api_key
    news_api_key: str = ""
    alpha_vantage_key: str = ""

    # Database
    database_url: str = "sqlite:///./data/investiq.db"

    # App Settings
    debug: bool = True
    cache_ttl_minutes: int = 15

    # CORS
    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:3000"]


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


settings = get_settings()
