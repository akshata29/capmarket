"""
Communication Agent — 24/7 client-facing team member agent.

Handles client inquiries around the clock:
- Portfolio performance explanations
- News impact on holdings
- Balance and position lookups
- Tax document delivery coordination
- Market commentary and education
- Appointment scheduling
- General wealth management Q&A

Always maintains compliance and privacy boundaries. Escalates complex
or sensitive requests to the assigned advisor with full context.
"""
from __future__ import annotations

from typing import Any

from backend.app.agents.base_agent import FoundryAgentBase


class CommunicationAgent(FoundryAgentBase):
    AGENT_ID = "agent_communication"
    AGENT_NAME = "CapmarketCommunicationAgent"
    _MODEL_SETTINGS_KEY = "agent_communication_model"
    USE_BING = True

    SYSTEM_PROMPT = """You are a friendly, knowledgeable wealth management client service specialist.
You represent the advisor's office and serve clients around the clock.

YOUR CAPABILITIES:
- Answer portfolio performance and return questions
- Explain market news impact on client holdings
- Provide educational content on investment strategies
- Help clients understand their portfolio allocation
- Coordinate document requests (tax documents, statements, confirmations)
- Schedule meetings and callbacks with the advisor
- Answer general investment education questions

STRICT BOUNDARIES (ALWAYS enforce):
- NEVER provide specific investment advice or buy/sell recommendations
  (redirect: "Your advisor reviews all changes to your portfolio")
- NEVER share account details without verification context
- NEVER discuss other clients
- ALWAYS recommend advisor consultation for material changes
- ALWAYS maintain professional, warm tone
- Privacy: confirm only information the client already has access to

ESCALATION TRIGGERS (route to advisor immediately):
- Any request to make investment changes
- Complaints or disputes
- Suspicious activity concerns
- Complex tax questions requiring professional advice
- Emotional distress signals from client

Respond in JSON:
{
  "response": "...",
  "response_type": "information|educational|escalation|action_required",
  "escalate_to_advisor": false,
  "escalation_reason": "",
  "action_items": [],
  "follow_up_needed": false,
  "sentiment": "positive|neutral|negative"
}"""

    def respond_to_query(
        self,
        client_query: str,
        client_profile: dict[str, Any],
        portfolio_snapshot: dict[str, Any] | None = None,
        conversation_history: list[dict[str, Any]] | None = None,
    ) -> dict[str, Any]:
        """Generate client-facing response to a query."""
        portfolio_str = f"\nPortfolio snapshot: {portfolio_snapshot}" if portfolio_snapshot else ""
        history_str = ""
        if conversation_history:
            recent = conversation_history[-5:]  # Last 5 turns for context
            history_str = f"\nRecent conversation:\n{recent}"

        prompt = f"""Respond to this client query as their dedicated wealth management service specialist.

Client Profile (sanitized):
Name: {client_profile.get('first_name', 'Client')}
Risk Tolerance: {client_profile.get('risk_profile', {}).get('tolerance', 'moderate')}
Portfolio Value: ${client_profile.get('portfolio_value', 0):,.0f}
{portfolio_str}
{history_str}

Client Query:
"{client_query}"

Provide a helpful, compliant response. Use current market data where relevant."""
        return self.run(prompt, timeout=self._settings.foundry_grounding_timeout_seconds)

    def explain_performance_drivers(
        self,
        portfolio: dict[str, Any],
        time_period: str = "month",
    ) -> dict[str, Any]:
        """Explain what drove portfolio performance in a given period."""
        prompt = f"""Explain portfolio performance drivers for this client in plain language.

Portfolio:
{portfolio}

Time Period: {time_period}

Explain:
- Top contributors to performance
- Top detractors
- Market context (with current data)
- How this compares to benchmarks
- What this means for the client going forward

Use clear, non-technical language appropriate for the client.

Return JSON: {{"explanation": "...", "key_drivers": [], "benchmark_context": "...", "forward_look": "..."}}"""
        return self.run(prompt, timeout=self._settings.foundry_grounding_timeout_seconds)
