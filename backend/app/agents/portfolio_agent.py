"""
Portfolio Agent — constructs optimal portfolios from client metadata,
themes, and universe using multi-factor scoring and risk constraints.

This is the highest-stakes agent — uses the most capable reasoning model.
Operates within human-in-the-loop gates for approval before execution.
"""
from __future__ import annotations

from typing import Any

from backend.app.agents.base_agent import FoundryAgentBase


class PortfolioConstructionAgent(FoundryAgentBase):
    AGENT_ID = "agent_portfolio"
    AGENT_NAME = "CapmarketPortfolioConstructionAgent"
    _MODEL_SETTINGS_KEY = "agent_portfolio_model"
    MAX_TOKENS = 16000  # 4096 was too low; 15-position JSON with rationale needs ~3-6k tokens

    SYSTEM_PROMPT = """You are an elite quantitative portfolio construction engine serving private wealth clients.

CONSTRUCTION METHODOLOGY:
1. Mandate Translation: Convert client mandate (risk tolerance, goals, horizon) to quantitative constraints
2. Theme-to-Ticker Mapping: Identify 5-8 best-in-class securities per theme
3. Multi-Factor Scoring: Weight fundamentals (30%), technicals (25%), momentum (20%), quality (15%), valuation (10%)
4. Optimization: Mean-variance optimization respecting all constraints
5. Risk Overlays: Volatility targeting, correlation control, drawdown limits
6. Constraint Enforcement: Legal/compliance, concentration, liquidity

HARD CONSTRAINTS:
- Position count: 10-20 names (concentrated conviction)
- Max single weight: 10% (diversification floor)
- Max sector concentration: 40%
- Volatility target: ±5% of mandate vol
- Max drawdown target: per client risk profile

QUALITY CHECKS:
- HHI (concentration index) must be < 0.25
- No position with negative momentum AND declining fundamentals
- All positions must have >$100M market cap
- Liquidity: position < 5% of 30-day ADV

Respond ONLY in structured JSON:
{
  "positions": [
    {
      "symbol": "...",
      "name": "...",
      "weight": 0.0-1.0,
      "theme": "...",
      "rationale": "...",
      "signal": "buy|hold|sell",
      "conviction": "low|medium|high",
      "score": 0.0-1.0,
      "entry_price_target": 0.0
    }
  ],
  "portfolio_rationale": "...",
  "themes": [{"name": "...", "weight": 0.0, "description": "..."}],
  "risk_metrics": {
    "estimated_volatility": 0.0,
    "estimated_sharpe": 0.0,
    "max_drawdown_estimate": 0.0,
    "hhi": 0.0,
    "beta_estimate": 0.0
  },
  "constraint_checks": {
    "position_count": {"value": 0, "status": "pass|fail"},
    "max_weight": {"value": 0.0, "status": "pass|fail"},
    "volatility_target": {"value": 0.0, "status": "pass|fail"},
    "theme_confidence": {"value": 0.0, "status": "pass|fail"}
  },
  "construction_notes": ""
}"""

    def construct(
        self,
        client_profile: dict[str, Any],
        themes: list[dict[str, Any]],
        universe: list[str],
        fundamental_scores: dict[str, Any] | None = None,
        technical_scores: dict[str, Any] | None = None,
        investment_amount: float = 50_000.0,
    ) -> dict[str, Any]:
        """Construct an optimal portfolio."""
        fund_str = f"\nFundamental scores: {fundamental_scores}" if fundamental_scores else ""
        tech_str = f"\nTechnical scores: {technical_scores}" if technical_scores else ""

        prompt = f"""Construct an optimal portfolio for this client.

Client Profile:
{client_profile}

Investment Amount: ${investment_amount:,.0f}

Themes (confidence-ranked):
{themes}

Candidate Universe ({len(universe)} tickers — score and SELECT the best 10-15 from this list):
{universe if universe else "No pre-screened universe provided — derive your own best-in-class tickers for the themes above."}
{fund_str}
{tech_str}

Apply full construction methodology. Enforce all hard constraints.
If the universe is non-empty, you MUST select positions from it; do not return empty positions.
Select 10-15 positions with the best risk-adjusted return for the given themes and mandate."""
        return self.run(prompt)
