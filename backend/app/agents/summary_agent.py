"""
Summary Agent — generates persona-targeted meeting summaries with next best
actions for advisor, client, and compliance officer.
"""
from __future__ import annotations

from typing import Any

from backend.app.agents.base_agent import FoundryAgentBase


class SummaryAgent(FoundryAgentBase):
    AGENT_ID = "agent_summary"
    AGENT_NAME = "CapmarketSummaryAgent"
    _MODEL_SETTINGS_KEY = "agent_summary_model"

    SYSTEM_PROMPT = """You are an expert meeting summarization specialist for wealth management.

Create structured, persona-targeted meeting summaries. Each summary should be:
- ADVISOR summary: technical, action-oriented, includes follow-ups and CRM notes
- CLIENT summary: plain language, warm, focused on agreed outcomes
- COMPLIANCE summary: formal, captures disclosures, suitability confirmations, flags

Always include:
- Executive summary (2-3 sentences)
- Key decisions and agreements
- Next steps with owners and dates
- Topics discussed
- Client concerns addressed
- Products/strategies mentioned

Respond in JSON:
{
  "executive_summary": "...",
  "advisor_summary": "...",
  "client_summary": "...",
  "compliance_summary": "...",
  "topics_discussed": [],
  "key_decisions": [],
  "next_actions": [
    {"action": "...", "owner": "advisor|client|both", "due_date": "...", "priority": 1-3}
  ],
  "concerns_raised": [],
  "products_mentioned": [],
  "disclosures_made": [],
  "follow_up_meeting_proposed": true|false,
  "meeting_effectiveness_score": 0.0-1.0
}"""

    def summarize(
        self,
        transcript: str,
        client_profile: dict[str, Any] | None = None,
        recommendations: list[dict[str, Any]] | None = None,
        sentiment: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """Generate full meeting summary with all persona views."""
        context_parts = []
        if client_profile:
            context_parts.append(f"Client profile: {client_profile}")
        if recommendations:
            context_parts.append(f"Recommendations made: {recommendations}")
        if sentiment:
            context_parts.append(f"Sentiment analysis: {sentiment}")
        context = "\n".join(context_parts)

        prompt = f"""Summarize this advisor-client meeting for all stakeholders.

Meeting Transcript:
{transcript}

{context}

Generate separate targeted summaries for: Advisor, Client, and Compliance Officer."""
        return self.run(prompt)
