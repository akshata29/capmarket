"""
Central configuration — loaded once from .env / environment variables.
Uses pydantic-settings for type-safe access throughout the codebase.
"""
from __future__ import annotations

from functools import lru_cache
from typing import Optional

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )

    # ── Entra ID ──────────────────────────────────────────────────────────────
    azure_tenant_id: str
    azure_client_id: str
    azure_client_secret: str
    azure_subscription_id: str

    # ── Azure AI Foundry ──────────────────────────────────────────────────────
    foundry_project_endpoint: str
    foundry_model_deployment_name: str = "chat4o"
    foundry_agent_name: str = "WealthAdvisorAgent"
    foundry_api_version: str = "2025-05-15-preview"
    foundry_response_timeout_seconds: int = 180
    foundry_max_retries: int = 4
    foundry_reasoning_timeout_seconds: int = 360
    foundry_grounding_timeout_seconds: int = 240

    # ── Per-agent model deployments ───────────────────────────────────────────
    # Meeting Intelligence agents
    agent_transcription_model: str = "chat4o"
    agent_sentiment_model: str = "chat4o"
    agent_profile_model: str = "chat41"
    agent_recommendation_model: str = "chato4mini"
    agent_summary_model: str = "chat41"
    agent_pii_model: str = "chat4o"

    # Advisory & Communication agents
    agent_advisory_model: str = "chato4mini"
    agent_tax_model: str = "chato4mini"
    agent_communication_model: str = "chat41"
    agent_news_model: str = "chat41"

    # Portfolio Intelligence agents
    agent_portfolio_model: str = "chato1"
    agent_backtesting_model: str = "chato4mini"
    agent_rebalance_model: str = "chat41nano"

    # ── Azure OpenAI ──────────────────────────────────────────────────────────
    azure_openai_endpoint: str
    azure_openai_api_key: str
    azure_openai_api_version: str = "2024-10-21"
    azure_openai_chat_deployment_name: str = "chat4o"
    azure_openai_embedding_deployment_name: str = "embedding"

    # ── Azure Speech ──────────────────────────────────────────────────────────
    azure_speech_key: str = ""
    azure_speech_region: str = "eastus"

    # ── Azure Language (optional) ─────────────────────────────────────────────
    azure_language_key: str = ""
    azure_language_endpoint: str = ""

    # ── Azure AI Search ───────────────────────────────────────────────────────
    azure_search_endpoint: str = ""
    azure_search_key: str = ""
    azure_search_index_clients: str = "clients"
    azure_search_index_meetings: str = "meetings"
    azure_search_index_documents: str = "documents"

    # ── Blob Storage ──────────────────────────────────────────────────────────
    azure_storage_connection_string: str
    azure_blob_storage_name: str
    azure_storage_container: str = "advisor"

    # ── Cosmos DB ────────────────────────────────────────────────────────────
    cosmosdb_endpoint: str
    cosmos_db_database: str = "capmarkets"
    cosmos_db_container: str = "portfolio"
    # Optional master key — if set, bypasses Entra ID RBAC requirement.
    # Leave blank to use ClientSecretCredential (SP must have
    # 'Cosmos DB Built-in Data Contributor' data-plane role).
    cosmos_db_key: str = ""

    # ── Bing Grounding ────────────────────────────────────────────────────────
    bing_grounding_connection_id: str = ""
    bing_grounding_connection_name: str = ""

    # ── Application Insights (optional) ──────────────────────────────────────
    applicationinsights_connection_string: str = ""

    # ── CORS ──────────────────────────────────────────────────────────────────
    cors_allowed_origins: str = "http://localhost:3000,http://localhost:5173"

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.cors_allowed_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
