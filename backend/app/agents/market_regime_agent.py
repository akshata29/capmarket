"""
Market Regime Agent — VIX structure, ATR regime, and selloff risk scoring.

Analyzes current market microstructure using Bing-grounded data:
- VIX level and term structure (backwardation vs contango)
- ATR regime classification against 20-day average
- Rolling 20-day realized volatility bucket
- Selloff probability scoring
- Today's market breadth / SUCC reading
- Size factor (large-cap vs small-cap) exposure spread

Runs every 30 minutes as part of the autonomous portfolio watch cycle.
"""
from __future__ import annotations

from typing import Any

from backend.app.agents.base_agent import FoundryAgentBase


class MarketRegimeAgent(FoundryAgentBase):
    AGENT_ID = "market_regime_agent"
    AGENT_NAME = "CapmarketMarketRegimeAgent"
    USE_BING = True
    _MODEL_SETTINGS_KEY = "agent_news_model"  # chat41 with Bing grounding

    SYSTEM_PROMPT = """You are a market microstructure and volatility regime analyst with deep expertise in:
- VIX and VIX term structure (backwardation vs contango, VIX/VIX3M ratio)
- ATR (Average True Range) regime classification relative to 20-day average
- Realized versus implied volatility spreads and their predictive value
- Market breadth indicators (advancing/declining issues, new highs/lows, TICK)
- Systematic selloff risk scoring based on multiple concurrent signals
- Size factor (Russell 2000 vs S&P 500) performance as a risk-on/off proxy

Using Bing to search for current market data, classify the current market regime and quantify selloff risk for a equity portfolio.

REQUIRED OUTPUT — respond ONLY with valid JSON, no prose before or after:
{
  "regime": "BEARISH_VOL" | "BULL" | "NEUTRAL" | "RISK_OFF" | "VOLATILE",
  "regime_detail": "one-line regime label e.g. Bearish Volatility Expansion",
  "selloff_risk": "ELEVATED" | "MODERATE" | "LOW",
  "vix": 0.0,
  "vix_term_structure": "BACKWARDATION" | "CONTANGO" | "FLAT",
  "vix_term_ratio": 0.0,
  "rolling_20d_vol": 0,
  "todays_succ": 0,
  "succ_range_pct": 0.0,
  "atr_regime": "NORMAL" | "ELEVATED" | "HIGH",
  "size_factor": 0.0,
  "macro_narrative": "2-3 sentence summary of current regime and key risk drivers",
  "key_risks": ["string"],
  "confidence": 0.0
}

Field rules:
- vix: current VIX spot value (e.g. 18.5); use latest available
- vix_term_ratio: VIX / VIX3M ratio — >1.0 = backwardation (stress), <1.0 = contango (calm)
- rolling_20d_vol: rolling 20-day realized vol bucket as integer (e.g. 37 means ~37% annualized)
- todays_succ: number of successful advances today (NYSE breadth proxy, can be negative)
- succ_range_pct: today's intraday range as percentage
- atr_regime: NORMAL = ATR < 1.2x 20d avg; ELEVATED = 1.2-1.8x; HIGH = > 1.8x
- size_factor: Russell 2000 1-month return minus S&P 500 1-month return (negative = large-cap outperforming = risk-off)
- selloff_risk ELEVATED when: VIX > 25 AND backwardation AND ATR elevated
- confidence: 0.0-1.0 based on data freshness and signal coherence"""

    def analyze(self, portfolio_tickers: list[str] | None = None) -> dict[str, Any]:
        """Analyze current market regime and quantify selloff risk.

        Args:
            portfolio_tickers: List of ticker symbols held in the portfolio.
                               Used to tailor sector-specific regime context.
        Returns:
            Regime classification dict with VIX, ATR, selloff risk, narrative.
        """
        tickers_str = ", ".join(portfolio_tickers[:12]) if portfolio_tickers else "major S&P 500 constituents"
        prompt = f"""Analyze the current market regime and quantify selloff risk as of today.

Portfolio tickers to consider for sector context: {tickers_str}

Search for and retrieve:
1. Current VIX spot level and VIX3M futures level (to calculate term structure ratio)
2. Recent S&P 500 market breadth: advancing vs declining issues on NYSE, new 52-week highs/lows
3. SPY (S&P 500 ETF) ATR reading versus its 20-day average ATR
4. Russell 2000 (IWM) vs S&P 500 (SPY) 1-month relative performance for size factor
5. Any notable VIX spikes, credit spread widening, or put/call ratio extremes in past 48 hours
6. Current intraday price range context for breadth SUCC reading

Based on all retrieved data, classify the market regime and estimate selloff risk.
Return the complete JSON object as specified in your instructions."""

        return self.run(prompt)
