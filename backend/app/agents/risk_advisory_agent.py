"""
Risk Advisory Agent — Rolling synthesis of news + regime data into portfolio risk advisories.

Accumulates recent news snapshots and market regime readings (typically spanning
2-3 hours at 30-minute intervals), then synthesizes:
- Overall portfolio risk level and sentiment trend
- Rebalance proximity signals across 5 dimensions
- Position-level risk recommendations (add hedge, tighten stop, watch closely, reduce)
- Advisory narrative for the advisor to act on

Runs every 30 minutes as part of the autonomous portfolio watch cycle.
"""
from __future__ import annotations

from typing import Any

from backend.app.agents.base_agent import FoundryAgentBase


class RiskAdvisoryAgent(FoundryAgentBase):
    AGENT_ID = "risk_advisory_agent"
    AGENT_NAME = "CapmarketRiskAdvisoryAgent"
    USE_BING = False
    _MODEL_SETTINGS_KEY = "agent_advisory_model"  # chato4mini

    SYSTEM_PROMPT = """You are a senior portfolio risk officer responsible for synthesizing market intelligence
into actionable risk advisories for a wealth management advisor.

Your inputs will include:
- Current portfolio positions with weights, signals, and scores
- Rolling news intelligence (last 2-3 hours of critical + high-priority alerts)
- Current market regime assessment (VIX, ATR, selloff risk)
- Rebalance trigger data from the rebalance agent (if available)

REQUIRED OUTPUT — respond ONLY with valid JSON, no prose before or after:
{
  "risk_level": "elevated" | "moderate" | "low",
  "sentiment_trend": "deteriorating" | "stable" | "improving",
  "total_signals": 0,
  "advisory_narrative": "2-3 sentence risk advisory summary for the advisor",
  "rebalance_proximity": {
    "weight_drift": 0.0,
    "vol_cap": 0.0,
    "theme_confidence": 0.0,
    "correlation": 0.0,
    "options_roll": 0.0
  },
  "recommendations": [
    {
      "symbol": "TICKER",
      "action": "add_hedge" | "tighten_stop" | "watch_closely" | "reduce_position" | "take_profit",
      "priority": "critical" | "high" | "medium",
      "rationale": "1-2 sentence rationale grounded in the news and regime data",
      "weight_pct": 0.0
    }
  ],
  "portfolio_exposure_summary": {
    "sector_concentration": "brief phrase e.g. tech-heavy with energy exposure",
    "key_risk_factors": ["string"],
    "estimated_portfolio_beta": 0.0
  }
}

Rebalance_proximity fields (0.0 to 1.0 scale — fraction of trigger threshold breached):
- weight_drift: max single-position drift from target weight (5% drift = 1.0, 2.5% = 0.5)
- vol_cap: current estimated portfolio volatility vs volatility budget (>budget = 1.0)
- theme_confidence: 1 - average theme confidence score from position data (low confidence = high proximity)
- correlation: average pairwise correlation spike signal (>0.7 average = 1.0)
- options_roll: urgency of rolling any hedges (0.0 = no hedges; otherwise based on time decay)

Generate 3-7 position recommendations, prioritized by risk magnitude.
Focus critical priority on positions where news + regime create compounding downside risk.
Weight_pct should reflect current portfolio weight of that position."""

    def synthesize(
        self,
        portfolio: dict[str, Any],
        news_history: list[dict[str, Any]],
        regime: dict[str, Any],
        rebalance_data: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """Synthesize accumulated intelligence into a risk advisory.

        Args:
            portfolio: Portfolio document with positions, mandate, investment_amount.
            news_history: Rolling list of news scan snapshots (last N watch cycles).
            regime: Latest market regime classification from MarketRegimeAgent.
            rebalance_data: Optional rebalance trigger result from RebalanceAgent.
        Returns:
            Risk advisory dict with risk_level, rebalance_proximity, recommendations, etc.
        """
        positions = portfolio.get("positions", [])
        pos_summary = "\n".join([
            f"  {p.get('symbol', '?'):6s} | weight {float(p.get('weight', 0)) * 100:5.1f}% "
            f"| signal {p.get('signal', 'HOLD'):5s} | score {p.get('score', 50):3.0f} "
            f"| theme {p.get('theme', '')}"
            for p in positions[:20]
        ]) or "  (no positions)"

        # Flatten recent news alerts from rolling history
        all_alerts: list[dict[str, Any]] = []
        for snap in news_history[-6:]:  # last 6 snapshots = ~3 hours
            news_snap = snap.get("news", snap)
            all_alerts.extend(news_snap.get("critical_alerts", []))
            all_alerts.extend(news_snap.get("high_priority", []))
        # Deduplicate by headline prefix
        seen: set[str] = set()
        deduped_alerts: list[dict[str, Any]] = []
        for a in all_alerts:
            key = (a.get("headline") or a.get("summary") or "")[:60]
            if key not in seen:
                seen.add(key)
                deduped_alerts.append(a)

        news_summary = "\n".join([
            f"  [{a.get('ticker', 'MKT'):6s}] {(a.get('headline') or a.get('summary') or '')[:130]}"
            for a in deduped_alerts[:15]
        ]) or "  (no recent alerts)"

        regime_str = (
            f"Regime: {regime.get('regime', 'UNKNOWN')} | "
            f"VIX: {regime.get('vix', '?')} ({regime.get('vix_term_structure', '?')}) | "
            f"Selloff Risk: {regime.get('selloff_risk', 'UNKNOWN')} | "
            f"ATR: {regime.get('atr_regime', 'UNKNOWN')} | "
            f"Rolling 20D Vol: {regime.get('rolling_20d_vol', '?')} | "
            f"Size Factor: {regime.get('size_factor', '?')}"
        ) if regime else "Regime data unavailable"

        rebal_context = ""
        if rebalance_data:
            triggers = rebalance_data.get("triggers_fired", [])
            trades = rebalance_data.get("proposed_trades", [])
            turnover = rebalance_data.get("turnover_pct", 0)
            rebal_context = (
                f"\nREBALANCE TRIGGERS FIRED: {triggers}"
                f"\nProposed trades: {len(trades)} | Estimated turnover: {float(turnover)*100:.1f}%"
            )

        prompt = f"""Synthesize the following portfolio intelligence into a complete risk advisory.

PORTFOLIO POSITIONS:
{pos_summary}

CURRENT MARKET REGIME:
{regime_str}

ROLLING NEWS ALERTS (last ~3 hours, deduplicated):
{news_summary}
{rebal_context}

Portfolio mandate: {portfolio.get('mandate', 'balanced growth')}
Investment amount: ${float(portfolio.get('investment_amount', 50_000)):,.0f}
Portfolio themes: {[t.get('name', t) if isinstance(t, dict) else t for t in portfolio.get('themes', [])[:5]]}

Based on the cumulative risk picture above, generate a complete risk advisory JSON response.
Focus on positions where news events and regime signals compound each other.
The advisory_narrative should help the advisor understand the top 2-3 risk drivers in plain language."""

        return self.run(prompt)
