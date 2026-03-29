"""
Rebalance Agent — detects portfolio drift and generates rebalance reports.

Monitors:
- Weight drift from targets
- Volatility budget breach
- Theme confidence degradation
- Momentum exit signals
- Options roll timing

Human-in-the-loop: all rebalance proposals require advisor approval.
"""
from __future__ import annotations

from typing import Any

from backend.app.agents.base_agent import FoundryAgentBase


class RebalanceAgent(FoundryAgentBase):
    AGENT_ID = "agent_rebalance"
    AGENT_NAME = "CapmarketRebalanceAgent"
    _MODEL_SETTINGS_KEY = "agent_rebalance_model"

    SYSTEM_PROMPT = """You are a portfolio rebalancing specialist for wealth management.

REBALANCE TRIGGERS (check all):
1. Weight Drift: any position drifted >5% from target
2. Vol Breach: realized portfolio volatility exceeds target ±20%
3. Theme Exit: theme confidence dropped below 0.50
4. Momentum Exit: position MACD/RSI signals sustained exit
5. Stop Loss: position down >15% from entry with negative momentum
6. Time-Based: quarterly strategic rebalance

REBALANCE RULES:
- Minimize turnover (prefer partial rebalances)
- Consider tax lots and lot lot selection (maximize tax efficiency)
- Respect wash-sale rules (30-day restriction)
- Transaction cost budget: max 25bps per rebalance event
- Maintain at least 2% cash buffer

FOR EACH PROPOSED TRADE:
- Direction (buy/sell)
- Symbol and shares
- Rationale (which trigger fired)
- Priority (1=urgent, 2=recommended, 3=optional)
- Tax impact estimate

Respond in JSON:
{
  "triggers_fired": [],
  "proposed_trades": [
    {
      "direction": "buy|sell",
      "symbol": "...",
      "shares": 0,
      "rationale": "...",
      "priority": 1-3,
      "tax_impact": "..."
    }
  ],
  "turnover_pct": 0.0,
  "estimated_tx_cost_bps": 0.0,
  "rebalance_rationale": "...",
  "drift_summary": {},
  "next_check_date": "..."
}"""

    def check_rebalance_triggers(
        self,
        current_portfolio: dict[str, Any],
        target_portfolio: dict[str, Any],
        market_data: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """Check if any rebalance triggers have fired."""
        market_str = f"\nMarket data: {market_data}" if market_data else ""
        prompt = f"""Check portfolio rebalance triggers and generate trade recommendations.

Current Portfolio State:
{current_portfolio}

Target Portfolio Weights:
{target_portfolio}
{market_str}

Check all rebalance triggers. Generate minimal, efficient rebalance plan.
Prioritize tax efficiency. Require advisor approval for all trades."""
        return self.run(prompt)
