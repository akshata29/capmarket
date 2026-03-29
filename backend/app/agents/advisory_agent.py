"""
Advisory Agent — pre-meeting intelligence for advisors.

Helps advisors prepare for client meetings by:
- Surfacing relevant market news and themes for the client's portfolio
- Generating tax strategy ideas based on client profile
- Suggesting relationship deepening tactics used by top advisors with similar clients
- Creating talking points tailored to client sentiment and goals
- Identifying cross-sell/up-sell opportunities

Uses Bing grounding for current market context.
"""
from __future__ import annotations

from typing import Any

from backend.app.agents.base_agent import FoundryAgentBase


class AdvisoryAgent(FoundryAgentBase):
    AGENT_ID = "agent_advisory"
    AGENT_NAME = "CapmarketAdvisoryAgent"
    _MODEL_SETTINGS_KEY = "agent_advisory_model"
    USE_BING = True

    SYSTEM_PROMPT = """You are a senior wealth management advisory intelligence system.

Your role is to help advisors prepare for and conduct client meetings more effectively.

You have access to:
- Current market news and events (via Bing)
- Client profile and portfolio data
- Historical meeting summaries
- Peer advisor best practices

Provide advisor-specific intelligence including:
1. Market updates relevant to client's portfolio/interests
2. Tax optimization opportunities based on client's situation
3. Relationship deepening ideas used successfully with similar clients
4. Meeting agenda suggestions with talking points
5. Cross-sell/up-sell opportunities appropriate to client profile
6. Potential client concerns to address proactively
7. Regulatory/compliance considerations

Always ground recommendations in current market data when possible.

Respond in JSON:
{
  "market_briefing": {
    "key_developments": [],
    "portfolio_impact": "...",
    "talking_points": []
  },
  "tax_opportunities": [],
  "relationship_ideas": [],
  "meeting_agenda": [],
  "cross_sell_opportunities": [],
  "proactive_concerns": [],
  "compliance_reminders": [],
  "data_freshness": "..."
}"""

    def prepare_briefing(
        self,
        client_profile: dict[str, Any],
        advisor_context: str = "",
        meeting_type: str = "review",
    ) -> dict[str, Any]:
        """Generate pre-meeting briefing for advisor."""
        prompt = f"""Prepare a comprehensive pre-meeting briefing for an advisor.

Meeting Type: {meeting_type}
Advisor Context: {advisor_context or 'Standard client review'}

Client Profile:
{client_profile}

Generate: current market briefing, tax opportunities, relationship ideas,
suggested agenda, and any compliance considerations. Use current market data."""
        return self.run(prompt, timeout=self._settings.foundry_grounding_timeout_seconds)

    def generate_tax_strategies(
        self, client_profile: dict[str, Any], tax_year: int = 2025
    ) -> dict[str, Any]:
        """Generate personalized tax strategies for the client."""
        prompt = f"""Generate specific tax optimization strategies for this wealth management client.

Tax Year: {tax_year}
Client Profile:
{client_profile}

Include:
1. Tax-loss harvesting opportunities
2. Asset location optimization (taxable vs. IRA vs. 401k)
3. Roth conversion analysis
4. Charitable giving strategies
5. Estate planning considerations
6. Required Minimum Distribution (RMD) planning if applicable

For each strategy provide: description, estimated tax savings, implementation steps,
deadlines, and risks.

Respond in JSON: {{"strategies": [{{"name": "...", "description": "...", "estimated_savings": "...", "steps": [], "deadline": "...", "risk": "..."}}], "priority_order": [], "total_opportunity": "..."}}"""
        return self.run(prompt)

    def generate_relationship_ideas(
        self,
        client_profile: dict[str, Any],
        peer_insights: list[dict[str, Any]] | None = None,
    ) -> dict[str, Any]:
        """Generate relationship deepening ideas based on peer advisor success patterns."""
        peer_str = f"\nPeer advisor insights: {peer_insights}" if peer_insights else ""
        prompt = f"""Generate relationship deepening ideas for this client based on the advisor's goals
and successful patterns from other high-performing advisors with similar clients.

Client Profile:
{client_profile}
{peer_str}

Suggest concrete, personalized activities, topics, and touchpoints that:
- Demonstrate genuine interest in the client's life and goals
- Provide value beyond investment returns
- Strengthen trust and loyalty
- Are appropriate for the client's profile and preferences

Return JSON: {{"ideas": [{{"category": "...", "idea": "...", "rationale": "...", "effort": "low|medium|high", "timing": "..."}}], "priority_sequence": []}}"""
        return self.run(prompt)
