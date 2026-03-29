"""
Backtesting Agent — historical performance analysis and portfolio backtesting.

Constructs realistic backtests of proposed portfolios with:
- Walk-forward testing
- Transaction cost modeling
- Benchmark comparison
- Drawdown analysis
- Risk-adjusted performance metrics
"""
from __future__ import annotations

from typing import Any

from backend.app.agents.base_agent import FoundryAgentBase


class BacktestingAgent(FoundryAgentBase):
    AGENT_ID = "agent_backtesting"
    AGENT_NAME = "CapmarketBacktestingAgent"
    _MODEL_SETTINGS_KEY = "agent_backtesting_model"

    SYSTEM_PROMPT = """You are a quantitative backtesting and performance analysis specialist.

Analyze historical portfolio performance data and provide:
1. Statistical performance metrics
2. Risk-adjusted return analysis
3. Drawdown analysis and recovery periods
4. Rolling performance windows
5. Benchmark comparison and alpha attribution
6. Stress test results (COVID crash, 2008 GFC, 2022 rate shock)
7. Regime-conditional performance
8. Factor exposure analysis

METRICS TO ALWAYS COMPUTE:
- Total Return and CAGR
- Annualized Volatility
- Sharpe Ratio (risk-free = 4.5%)
- Sortino Ratio
- Maximum Drawdown and recovery time
- Calmar Ratio
- Win Rate
- Best/Worst month
- Beta and Alpha vs SPY benchmark
- Information Ratio

PRESENTATION:
- Use plain language to explain technical metrics for advisor-client communication
- Flag any concerning patterns
- Compare to benchmark and peer portfolios where possible

Respond in structured JSON."""

    def analyze_backtest_results(
        self,
        portfolio_positions: list[dict[str, Any]],
        price_data: dict[str, Any],
        start_date: str,
        end_date: str,
        initial_capital: float = 100_000.0,
        benchmark: str = "SPY",
    ) -> dict[str, Any]:
        """Analyze historical performance of a proposed portfolio."""
        prompt = f"""Perform comprehensive backtesting analysis for this portfolio proposal.

Portfolio Positions:
{portfolio_positions}

Backtest Parameters:
- Start Date: {start_date}
- End Date: {end_date}
- Initial Capital: ${initial_capital:,.0f}
- Benchmark: {benchmark}
- Transaction Cost: 1 basis point per trade

Historical Price Data:
{price_data}

Compute all performance and risk metrics. Run stress tests.
Provide advisor talking points for client interpretation.

IMPORTANT UNITS:
- All "_pct" fields and percentage fields: express as decimal percentage, e.g., 15.2 means 15.2% (NOT 0.152)
- Ratio fields (sharpe, sortino, calmar, beta, alpha, information_ratio): express as plain number, e.g., 0.67
- monthly_returns: express each month as decimal percentage, e.g., 2.1 means +2.1% that month
- benchmark_monthly_returns: same units as monthly_returns

Respond in JSON: {{
  "performance": {{
    "total_return_pct": 0.0,
    "cagr": 0.0,
    "volatility": 0.0,
    "sharpe": 0.0,
    "sortino": 0.0,
    "max_drawdown": 0.0,
    "calmar": 0.0,
    "win_rate": 0.0,
    "beta": 0.0,
    "alpha": 0.0
  }},
  "benchmark_comparison": {{
    "symbol": "{benchmark}",
    "total_return_pct": 0.0,
    "cagr": 0.0,
    "volatility": 0.0,
    "sharpe": 0.0,
    "max_drawdown": 0.0,
    "beta": 1.0
  }},
  "stress_tests": [
    {{
      "name": "describe the event, e.g. COVID Crash (Feb-Mar 2020)",
      "portfolio_impact": -18.5,
      "description": "narrative of how this portfolio would have fared"
    }}
  ],
  "drawdown_periods": [
    {{
      "start": "YYYY-MM-DD",
      "end": "YYYY-MM-DD",
      "depth": -18.5,
      "recovery_days": 120
    }}
  ],
  "monthly_returns": [],
  "benchmark_monthly_returns": [],
  "advisor_narrative": "...",
  "risk_warnings": []
}}"""
        return self.run(prompt)

    def generate_scenario_analysis(
        self,
        portfolio: dict[str, Any],
        scenarios: list[str] | None = None,
    ) -> dict[str, Any]:
        """Generate forward-looking scenario analysis."""
        if not scenarios:
            scenarios = [
                "Fed rate cut cycle (2-3 cuts)",
                "Recession (mild -15% market)",
                "Inflation resurgence",
                "Tech rotation to value",
                "Geopolitical escalation",
            ]
        prompt = f"""Perform forward scenario analysis for this portfolio.

Portfolio:
{portfolio}

Scenarios to analyze:
{scenarios}

For each scenario, estimate:
- Portfolio impact (%)
- Best case / Base case / Worst case
- Key risk factors
- Recommended positioning adjustments

Return JSON: {{"scenarios": [{{"name": "...", "probability": 0.0, "impact_pct": 0.0, "description": "...", "hedging_suggestions": []}}], "overall_resilience_score": 0.0}}"""
        return self.run(prompt)
