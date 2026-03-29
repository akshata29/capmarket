"""
Profile Agent — extracts structured client profile metadata from meeting
conversations. Builds and incrementally enriches the client CRM profile
from natural language.

Extracts: risk preferences, goals, life events, financial situation,
investment horizon, concerns, and relationship signals.
"""
from __future__ import annotations

from typing import Any

from backend.app.agents.base_agent import FoundryAgentBase


class ProfileAgent(FoundryAgentBase):
    AGENT_ID = "agent_profile"
    AGENT_NAME = "CapmarketProfileAgent"
    _MODEL_SETTINGS_KEY = "agent_profile_model"
    USE_BING = False

    SYSTEM_PROMPT = """You are an expert financial CRM profiling specialist.

Extract structured client profile data from advisor-client conversation transcripts.
Build a comprehensive, structured profile that can be used for:
- Risk assessment and portfolio construction
- Personalized investment recommendations
- Regulatory compliance (KYC/AML)
- Relationship deepening

Extract ALL of the following where mentioned:
- Personal: name, age, occupation, family situation, life stage
- Financial: income, net worth, investable assets, existing holdings, liabilities
- Risk: tolerance level, max drawdown comfort, time horizon
- Goals: retirement, education, wealth preservation, income, growth targets
- Tax: bracket, state, preferences, TLH interest
- Behavioral: past investment history, biases, concerns, emotional triggers
- Life Events: retirement date, inheritance, major purchase, divorce, job change
- Product Preferences: ETFs, individual equities, alternatives, ESG, options
- Account Needs: IRA, 401k rollover, taxable, trust, joint

Respond in JSON with this schema:
{
  "extracted_personal": {},
  "extracted_financial": {},
  "extracted_risk": {},
  "extracted_goals": [],
  "extracted_tax": {},
  "extracted_behavioral": {},
  "extracted_life_events": [],
  "extracted_product_preferences": [],
  "extracted_account_needs": [],
  "extracted_concerns": [],
  "relationship_signals": [],
  "key_action_items": [],
  "profile_completeness": 0.0-1.0,
  "extraction_notes": ""
}"""

    def extract_from_transcript(
        self, transcript_text: str, existing_profile: dict[str, Any] | None = None
    ) -> dict[str, Any]:
        """Extract profile metadata from a meeting transcript."""
        prior = f"\nExisting profile data: {existing_profile}" if existing_profile else ""
        prompt = f"""Extract client profile metadata from this advisor-client meeting transcript.{prior}

Transcript:
{transcript_text}

Extract all structured profile information. For fields not mentioned, omit them entirely (do not guess)."""
        return self.run(prompt)

    def merge_profile_updates(
        self,
        existing_profile: dict[str, Any],
        new_extractions: dict[str, Any],
    ) -> dict[str, Any]:
        """Merge new extractions into existing profile, resolving conflicts."""
        prompt = f"""Merge new profile extractions into the existing client profile.

Existing profile:
{existing_profile}

New extractions from latest meeting:
{new_extractions}

Rules:
- Newer information takes precedence over older data
- Preserve explicitly stated preferences
- Flag any contradictions in 'conflicts' field
- Update profile_completeness score

Return the complete merged profile in the same schema."""
        return self.run(prompt)
