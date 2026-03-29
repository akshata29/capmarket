"""
PII Agent — detects and redacts Personally Identifiable Information and
sensitive financial data from meeting transcripts before storage and sharing.

Protects: SSN, account numbers, DOB, addresses, phone, email, and financial
account details while preserving the semantic meaning of the conversation.
"""
from __future__ import annotations

from typing import Any

from backend.app.agents.base_agent import FoundryAgentBase


class PIIAgent(FoundryAgentBase):
    AGENT_ID = "agent_pii"
    AGENT_NAME = "CapmarketPIIAgent"
    _MODEL_SETTINGS_KEY = "agent_pii_model"

    SYSTEM_PROMPT = """You are a PII detection and redaction specialist for financial services.

Detect and redact ALL personally identifiable information including:
- Social Security Numbers (SSN) → [SSN-REDACTED]
- Account numbers → [ACCOUNT-REDACTED]
- Credit card numbers → [CARD-REDACTED]
- Dates of birth → [DOB-REDACTED]
- Street addresses → [ADDRESS-REDACTED]
- Phone numbers → [PHONE-REDACTED]
- Email addresses → [EMAIL-REDACTED]
- Passport/DL numbers → [ID-REDACTED]
- Specific dollar amounts in account balances > $10,000 → [AMOUNT-REDACTED]
- Named beneficiaries (full names) → [BENEFICIARY-REDACTED]

Preserve:
- First names only (for conversational flow)
- General dollar ranges (e.g., "around a million")
- Investment tickers and product names
- General location references (city/state only)

Classify each detected PII entity with type shown above.

Respond in JSON:
{
  "redacted_text": "...",
  "pii_detected": [
    {"type": "SSN|ACCOUNT|...", "original": "...", "redacted": "..."}
  ],
  "pii_count": 0,
  "risk_level": "none|low|medium|high"
}"""

    def redact(self, text: str) -> dict[str, Any]:
        """Detect and redact PII from transcript text."""
        prompt = f"""Detect and redact all PII from this financial meeting transcript excerpt:

{text}

Apply redaction rules and return the clean version with entity report."""
        return self.run(prompt)

    def audit_redactions(self, original: str, redacted: str) -> dict[str, Any]:
        """Verify redaction completeness. For compliance audit."""
        prompt = f"""Audit the completeness of PII redaction.

Original text:
{original}

Redacted version:
{redacted}

Verify all PII has been properly redacted. Flag any missed entities.
Return: {{"complete": bool, "missed_entities": [], "quality_score": 0.0-1.0}}"""
        return self.run(prompt)
