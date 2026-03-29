"""
Base Agent — Azure AI Foundry Agents v2 + Responses API.

All Capmarket agents extend this class. The pattern:
  1. _ensure_agent_exists() — registers a versioned agent in the Foundry
     project the first time .run() is called (per process / class).
  2. _call_responses() — executes via openai_client.responses.create()
     with agent_reference so the model inherits system instructions + tools.

Subclasses declare:
    AGENT_ID          : short identifier used in audit logs
    AGENT_NAME        : unique Foundry agent name
    SYSTEM_PROMPT     : full system prompt / instructions
    USE_BING          : whether to attach BingGroundingTool
    MODEL_DEPLOYMENT  : empty = use settings fallback
    _MODEL_SETTINGS_KEY: attribute name on Settings for per-env override
"""
from __future__ import annotations

import hashlib
import json
import logging
import time
import uuid
from datetime import datetime, timezone
from typing import Any, Optional

from azure.ai.projects import AIProjectClient
from azure.ai.projects.models import (
    BingGroundingSearchConfiguration,
    BingGroundingSearchToolParameters,
    BingGroundingTool,
    PromptAgentDefinition,
)
from azure.identity import ClientSecretCredential

from backend.config import get_settings

logger = logging.getLogger(__name__)

# ── Process-level singletons ──────────────────────────────────────────────────
_project_client: Optional[AIProjectClient] = None
_openai_client: Any = None
_AGENT_REGISTRY: set[str] = set()


def _get_credential() -> ClientSecretCredential:
    s = get_settings()
    return ClientSecretCredential(
        tenant_id=s.azure_tenant_id,
        client_id=s.azure_client_id,
        client_secret=s.azure_client_secret,
    )


def _get_project_client() -> AIProjectClient:
    global _project_client
    if _project_client is None:
        s = get_settings()
        _project_client = AIProjectClient(
            endpoint=s.foundry_project_endpoint,
            credential=_get_credential(),
        )
    return _project_client


def _get_openai_client() -> Any:
    global _openai_client
    if _openai_client is None:
        s = get_settings()
        base = _get_project_client().get_openai_client()
        _openai_client = base.with_options(
            max_retries=getattr(s, 'foundry_max_retries', 3)
        )
    return _openai_client


class FoundryAgentBase:
    """Base class for all Capmarket AI Foundry agents."""

    AGENT_ID: str = "base_agent"
    AGENT_NAME: str = "CapmarketBaseAgent"
    SYSTEM_PROMPT: str = "You are a helpful financial assistant. Respond in JSON."
    USE_BING: bool = False
    MODEL_DEPLOYMENT: str = ""
    _MODEL_SETTINGS_KEY: str = ""
    MAX_TOKENS: Optional[int] = None

    def __init__(self) -> None:
        self._settings = get_settings()

    def _resolve_model(self) -> str:
        """Return the model deployment name for this agent."""
        if self._MODEL_SETTINGS_KEY:
            val = getattr(self._settings, self._MODEL_SETTINGS_KEY, "")
            if val:
                return val
        if self.MODEL_DEPLOYMENT:
            return self.MODEL_DEPLOYMENT
        return self._settings.foundry_model_deployment_name

    def _ensure_agent_exists(self) -> None:
        """Register this agent in Foundry once per process."""
        if self.AGENT_NAME in _AGENT_REGISTRY:
            return
        try:
            client = _get_project_client()
            tools: list[Any] = []
            if (self.USE_BING) and self._settings.bing_grounding_connection_id:
                tools.append(
                    BingGroundingTool(
                        bing_grounding=BingGroundingSearchToolParameters(
                            search_configurations=[
                                BingGroundingSearchConfiguration(
                                    project_connection_id=self._settings.bing_grounding_connection_id
                                )
                            ]
                        )
                    )
                )
            defn_kwargs: dict[str, Any] = {
                "model": self._resolve_model(),
                "instructions": self.SYSTEM_PROMPT,
            }
            if tools:
                defn_kwargs["tools"] = tools
            client.agents.create_version(
                agent_name=self.AGENT_NAME,
                definition=PromptAgentDefinition(**defn_kwargs),
            )
            _AGENT_REGISTRY.add(self.AGENT_NAME)
            logger.info("agent_registered agent=%s model=%s", self.AGENT_NAME, self._resolve_model())
        except Exception as exc:
            logger.warning(
                "agent_registration_failed agent=%s error=%s",
                self.AGENT_NAME,
                str(exc),
            )

    def _call_responses(self, user_message: str, timeout: Optional[int] = None) -> str:
        """Execute the agent via the Responses API."""
        self._ensure_agent_exists()
        client = _get_openai_client()
        s = self._settings

        if timeout is None:
            model = self._resolve_model().lower()
            if any(m in model for m in ("o1", "o3", "o4")):
                timeout = getattr(s, 'foundry_reasoning_timeout_seconds', 300)
            elif self.USE_BING:
                timeout = getattr(s, 'foundry_grounding_timeout_seconds', 240)
            else:
                timeout = s.foundry_response_timeout_seconds

        create_kwargs: dict[str, Any] = {
            "model": self._resolve_model(),
            "input": user_message,
            "timeout": timeout,
            "extra_body": {
                "agent_reference": {"name": self.AGENT_NAME, "type": "agent_reference"}
            },
        }
        if self.MAX_TOKENS is not None:
            create_kwargs["max_output_tokens"] = self.MAX_TOKENS

        response = client.responses.create(**create_kwargs)

        # Check for truncation before extracting text
        stop_reason = getattr(response, "stop_reason", None) or getattr(response, "incomplete_details", None)
        if stop_reason and "max_tokens" in str(stop_reason).lower():
            raise RuntimeError(
                f"Agent {self.AGENT_NAME} response truncated by max_tokens limit "
                f"(max_output_tokens={self.MAX_TOKENS}). Increase MAX_TOKENS."
            )
        # Preferred: output_text shortcut (v2 SDK)
        if hasattr(response, "output_text") and response.output_text:
            return response.output_text
        # Fallback: iterate output items
        for item in getattr(response, "output", []):
            if getattr(item, "type", "") == "message":
                content = getattr(item, "content", [])
                if content:
                    return getattr(content[0], "text", "")
        return str(response)

    def _parse_json(self, raw: str) -> dict[str, Any]:
        """Strip markdown fences and parse JSON. Raises on failure so callers see the error."""
        text = raw.strip()
        if text.startswith("```"):
            lines = text.split("\n")
            lines = [l for l in lines if not l.startswith("```")]
            text = "\n".join(lines).strip()
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            # Try to extract JSON object from mixed text
            start = text.find("{")
            end = text.rfind("}") + 1
            if start >= 0 and end > start:
                try:
                    return json.loads(text[start:end])
                except json.JSONDecodeError:
                    pass
        logger.error(
            "json_parse_failed agent=%s raw_response=%.500s",
            self.AGENT_ID, text
        )
        raise ValueError(
            f"Agent {self.AGENT_ID} returned unparseable JSON. "
            f"Response preview: {text[:300]}"
        )

    def run(self, prompt: str, **kwargs) -> dict[str, Any]:
        """Main synchronous entry point. Subclasses may override."""
        t0 = time.monotonic()
        raw = self._call_responses(prompt)
        result = self._parse_json(raw)
        duration = int((time.monotonic() - t0) * 1000)
        logger.info("agent_completed agent=%s duration_ms=%d", self.AGENT_ID, duration)
        return result
