"""
Sentiment Agent — uses Azure Language Text Analytics for real-time sentiment
scoring of meeting transcript chunks.

Azure Text Analytics returns: positive/negative/neutral/mixed with confidence
scores. We map these onto the multi-dimensional schema the rest of the app
expects, and supplement with a lightweight keyword scan for compliance flags,
investment themes, and life-event signals — no LLM call required on the hot path.
"""
from __future__ import annotations

import logging
import re
from typing import Any

logger = logging.getLogger(__name__)


# ── keyword mappings (fast, no API) ──────────────────────────────────────────

_COMPLIANCE_CRITICAL = re.compile(
    r"\b(guaranteed|promise|certain return|no risk|risk.?free|insider|tip)\b", re.I
)
_COMPLIANCE_WARNING = re.compile(
    r"\b(outperform|beat the market|always go up|double your money|sure thing)\b", re.I
)
_LIFE_EVENTS = {
    "retirement": r"\bretir(e|ing|ement|ed)\b",
    "inheritance": r"\binherit(ance|ed|ing)?\b",
    "divorce": r"\bdivorc(e|ed|ing)?\b",
    "job_change": r"\b(new job|lost (?:my )?job|laid off|redundan|resign)\b",
    "home_purchase": r"\b(buy(?:ing)? (?:a |my )?home|mortgage|house hunt)\b",
    "college": r"\b(college|university|tuition|education fund|529)\b",
}
_RISK_CAUTIOUS = re.compile(
    r"\b(conservative|safe|protect|capital preservation|low risk|not.{0,10}risk)\b", re.I
)
_RISK_AGGRESSIVE = re.compile(
    r"\b(aggressive|high.?growth|speculative|crypto|options|leverage)\b", re.I
)
_READY_SIGNALS = re.compile(
    r"\b(ready to invest|move forward|let.s do it|sounds good|transfer|rollover|fund)\b", re.I
)


# Module-level singleton so the underlying HTTP connection is reused across calls.
# Initialised lazily on first use; reset to None on SSL/connection errors so the
# next call gets a fresh connection.
_ta_client: Any = None


def _get_ta_client() -> Any:
    global _ta_client
    if _ta_client is None:
        from azure.ai.textanalytics import TextAnalyticsClient
        from azure.core.credentials import AzureKeyCredential
        from backend.config import get_settings
        settings = get_settings()
        if not settings.azure_language_key or not settings.azure_language_endpoint:
            return None
        _ta_client = TextAnalyticsClient(
            endpoint=settings.azure_language_endpoint,
            credential=AzureKeyCredential(settings.azure_language_key),
        )
    return _ta_client


def _language_sentiment(text: str) -> dict[str, float]:
    """
    Call Azure Language Text Analytics sentiment endpoint.
    Returns confidence scores dict. Falls back to neutral on any error.
    Retries once on SSL/connection errors with a fresh client.
    """
    global _ta_client
    neutral = {"positive": 0.5, "neutral": 0.5, "negative": 0.0}

    for attempt in range(2):
        try:
            client = _get_ta_client()
            if client is None:
                return neutral
            results = client.analyze_sentiment([text[:5000]])
            doc = results[0]
            if doc.is_error:
                return neutral
            s = doc.confidence_scores
            return {"positive": s.positive, "neutral": s.neutral, "negative": s.negative}
        except Exception as exc:
            err = str(exc)
            logger.warning("text_analytics_sentiment_failed attempt=%d error=%s", attempt + 1, err)
            # Reset client on connection/SSL errors so next attempt gets a fresh one
            _ta_client = None
            if attempt == 1:
                return neutral


class SentimentAgent:
    """Scores meeting sentiment using Azure Text Analytics + keyword rules."""

    def analyze_incremental(
        self, new_segment: str, prior_sentiment: dict[str, Any]
    ) -> dict[str, Any]:
        """Update running sentiment state with a new transcript segment."""
        scores = _language_sentiment(new_segment)

        # overall: map positive-negative onto [-1, +1], blend with prior
        raw_overall = scores["positive"] - scores["negative"]
        if prior_sentiment and "overall" in prior_sentiment:
            overall = round(0.7 * prior_sentiment["overall"] + 0.3 * raw_overall, 3)
        else:
            overall = round(raw_overall, 3)

        # Compliance flags from keyword scan
        if _COMPLIANCE_CRITICAL.search(new_segment):
            compliance_flag = "critical"
        elif _COMPLIANCE_WARNING.search(new_segment):
            compliance_flag = "warning"
        else:
            compliance_flag = prior_sentiment.get("compliance_flag", "none")

        # Risk appetite signal
        prior_risk = prior_sentiment.get("risk_appetite", 0.5)
        if _RISK_CAUTIOUS.search(new_segment):
            risk_appetite = round(max(0.0, prior_risk - 0.1), 2)
        elif _RISK_AGGRESSIVE.search(new_segment):
            risk_appetite = round(min(1.0, prior_risk + 0.1), 2)
        else:
            risk_appetite = prior_risk

        # Investment readiness
        readiness = prior_sentiment.get("investment_readiness", 0.0)
        if _READY_SIGNALS.search(new_segment):
            readiness = round(min(1.0, readiness + 0.15), 2)

        # Life event signals (accumulate across chunks)
        life_events: list[str] = list(prior_sentiment.get("life_event_signals", []))
        for event, pattern in _LIFE_EVENTS.items():
            if re.search(pattern, new_segment, re.I) and event not in life_events:
                life_events.append(event)

        # Engagement: anything non-neutral is engaged
        engagement = round(1.0 - scores["neutral"] * 0.5, 2)

        return {
            "overall": overall,
            "investment_readiness": readiness,
            "risk_appetite": risk_appetite,
            "engagement": engagement,
            "compliance_flag": compliance_flag,
            "compliance_notes": prior_sentiment.get("compliance_notes", []),
            "life_event_signals": life_events,
            "key_themes": prior_sentiment.get("key_themes", []),
            "emotional_drivers": [],
            "investment_concerns": prior_sentiment.get("investment_concerns", []),
        }

    def analyze(self, transcript_text: str, context: str = "") -> dict[str, Any]:
        """Full sentiment analysis on a complete transcript (end-of-meeting)."""
        return self.analyze_incremental(transcript_text, {})
