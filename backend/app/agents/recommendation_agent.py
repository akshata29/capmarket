"""
Recommendation Agent — generates compliant, risk-aligned investment recommendations
based on meeting context, client profile, and current market conditions.

Always includes rationale, risk alignment, and compliance clearance notes.
Human-in-the-loop approval required before presenting to client.
"""
from __future__ import annotations

from typing import Any

from backend.app.agents.base_agent import FoundryAgentBase


class RecommendationAgent(FoundryAgentBase):
    AGENT_ID = "agent_recommendation"
    AGENT_NAME = "CapmarketRecommendationAgent"
    _MODEL_SETTINGS_KEY = "agent_recommendation_model"

    SYSTEM_PROMPT = """You are a senior wealth management recommendation engine.

Generate compliant, personalized investment recommendations based on:
- Client risk profile and investment horizon
- Current meeting context and client sentiment
- Client goals and financial situation
- Market conditions and themes

COMPLIANCE RULES (ALWAYS enforce):
- Never guarantee returns
- Always disclose risks
- Match products to client risk tolerance
- Flag suitability concerns
- Note any conflicts of interest
- Apply FINRA/SEC communication standards

For each recommendation, provide:
1. Category (portfolio_rebalance, new_position, tax_strategy, product, insurance, estate_planning)
2. Specific actionable headline
3. Detailed rationale (3-5 sentences)
4. Risk alignment ("conservative" | "moderate" | "aggressive")
5. Confidence score 0-1
6. Compliance clearance status and notes
7. Whether human approval is required

Respond in JSON:
{
  "recommendations": [
    {
      "category": "...",
      "headline": "...",
      "rationale": "...",
      "action_items": [],
      "risk_alignment": "conservative|moderate|aggressive",
      "confidence": 0.0-1.0,
      "compliance_cleared": true|false,
      "compliance_notes": [],
      "requires_approval": true|false,
      "priority": 1-5,
      "estimated_impact": "..."
    }
  ],
  "overall_assessment": "...",
  "next_best_actions": []
}"""

    def generate(
        self,
        client_profile: dict[str, Any],
        meeting_context: str,
        sentiment: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """Generate recommendations for a meeting."""
        sentiment_str = f"\nSentiment analysis: {sentiment}" if sentiment else ""
        prompt = f"""Generate investment recommendations for this client meeting.

Client Profile:
{client_profile}

Meeting Context:
{meeting_context}
{sentiment_str}

Generate 3-5 specific, actionable recommendations that are:
- Appropriate for the client's risk profile
- Relevant to topics discussed in the meeting
- Compliant with regulatory requirements
- Prioritized by potential impact"""
        return self.run(prompt)

    def revalidate_compliance(
        self, recommendation: dict[str, Any], client_profile: dict[str, Any]
    ) -> dict[str, Any]:
        """Re-check a recommendation for compliance before advisor approval."""
        prompt = f"""Perform a compliance review of this investment recommendation.

Recommendation:
{recommendation}

Client Profile:
{client_profile}

Check for:
1. Suitability (risk alignment with client profile)
2. FINRA/SEC communication standards
3. Guaranteed return language
4. Product appropriateness
5. Disclosure adequacy

Return: {{"compliance_cleared": bool, "issues": [], "modified_rationale": "...", "notes": ""}}"""
        return self.run(prompt)
