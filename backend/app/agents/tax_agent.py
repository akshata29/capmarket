"""
Tax Agent — specialized agent for tax planning and optimization strategies.

Analyzes client tax situations and generates:
- Tax-loss harvesting recommendations
- Asset location optimization plans
- Roth conversion analysis
- Charitable giving strategies
- Year-end tax planning checklist
"""
from __future__ import annotations

from typing import Any

from backend.app.agents.base_agent import FoundryAgentBase


class TaxAgent(FoundryAgentBase):
    AGENT_ID = "agent_tax"
    AGENT_NAME = "CapmarketTaxAgent"
    _MODEL_SETTINGS_KEY = "agent_tax_model"
    USE_BING = True

    SYSTEM_PROMPT = """You are an expert tax planning specialist for high-net-worth investors.

Analyze client financial situations and generate specific, actionable tax strategies.

EXPERTISE:
- Federal and state income tax optimization
- Capital gains/loss management (short-term vs long-term)
- Tax-loss harvesting with wash-sale rule compliance
- Asset location optimization across account types
- Roth IRA conversion analysis and backdoor Roth
- Required Minimum Distributions (RMD)
- Qualified Opportunity Zone investments
- Charitable giving strategies (DAF, CRT, appreciated stock donations)
- Estate and gift tax planning
- Municipal bond suitability analysis
- Business owner tax strategies (QBI deduction, pass-through entities)

ALWAYS:
- Note that strategies require CPA review before implementation
- Flag jurisdictional variations
- Include estimated timelines and deadlines
- Quantify estimated impact where possible

Respond in structured JSON format."""

    def analyze_tax_situation(
        self, client_profile: dict[str, Any], portfolio: dict[str, Any] | None = None
    ) -> dict[str, Any]:
        """Comprehensive tax situation analysis."""
        portfolio_str = f"\nPortfolio: {portfolio}" if portfolio else ""
        prompt = f"""Analyze this client's tax situation and generate optimization strategies.

Client Profile:
{client_profile}
{portfolio_str}

Provide:
1. Current tax situation assessment
2. Immediate opportunities (before year-end)
3. Medium-term strategies (next 1-3 years)
4. Long-term planning considerations
5. Priority action items

Return JSON: {{
  "tax_situation_summary": "...",
  "federal_bracket": "...",
  "effective_rate_estimate": 0.0,
  "immediate_opportunities": [],
  "medium_term_strategies": [],
  "long_term_planning": [],
  "action_items": [],
  "estimated_annual_savings": 0.0,
  "notes": ""
}}"""
        return self.run(prompt)

    def analyze_tlh_opportunities(
        self, holdings: list[dict[str, Any]], tax_profile: dict[str, Any]
    ) -> dict[str, Any]:
        """Identify tax-loss harvesting opportunities in current portfolio."""
        prompt = f"""Identify tax-loss harvesting opportunities in this portfolio.

Holdings (with unrealized gains/losses):
{holdings}

Tax Profile:
{tax_profile}

For each opportunity:
- Identify positions with unrealized losses
- Calculate potential tax savings
- Suggest replacement securities (avoid wash-sale rule)
- Flag wash-sale risks
- Prioritize by tax impact

Return JSON: {{
  "opportunities": [{{
    "symbol": "...", "loss_amount": 0.0, "tax_savings_estimate": 0.0,
    "replacement_securities": [], "wash_sale_risk": "none|low|medium|high",
    "notes": "..."
  }}],
  "total_harvestable_losses": 0.0,
  "total_tax_savings_estimate": 0.0,
  "urgent_before_year_end": []
}}"""
        return self.run(prompt)
