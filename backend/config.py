"""Environment-backed configuration for the Crowd-RAG backend.

All secrets come from environment variables (loaded from .env in local dev).
Thresholds and model IDs are tunable here without touching service code.
"""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )

    # --- Google AI Studio (Gemini) ---
    google_api_key: str = ""
    gemini_chat_model: str = "gemini-2.5-flash"
    gemini_embed_model: str = "gemini-embedding-001"
    embed_dim: int = 3072

    # --- Pinecone ---
    pinecone_api_key: str = ""
    pinecone_index_name: str = "products"
    pinecone_cloud: str = "aws"
    pinecone_region: str = "us-east-1"

    # --- Brave Search ---
    brave_api_key: str = ""

    # --- GitHub data ledger ---
    github_token: str = ""
    github_repo_owner: str = ""
    github_repo_name: str = ""

    # --- Orchestration ---
    confidence_threshold: float = 0.70
    top_k: int = 5
    fallback_to_web: bool = True
    enable_data_contribution: bool = True

    # --- HTTP / CORS ---
    # Comma-separated list of allowed origins for the browser frontend.
    allowed_origins: str = "http://localhost:3000,http://localhost:5173"

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
