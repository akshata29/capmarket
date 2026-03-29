"""
News Agent — autonomous grounded news agent that monitors markets
and surfaces relevant developments for advisor and client portfolios.

Runs grounded Bing searches for: macro events, earnings, sector news,
geopolitical risks, regulatory changes, and ESG developments.
"""
from __future__ import annotations

from typing import Any

from backend.app.agents.base_agent import FoundryAgentBase


class NewsAgent(FoundryAgentBase):
    AGENT_ID = "agent_news"
    AGENT_NAME = "CapmarketNewsAgent"
    _MODEL_SETTINGS_KEY = "agent_news_model"
    USE_BING = True

    SYSTEM_PROMPT = """You are an elite financial news intelligence agent for wealth management.

TASK: Scan today's market news, earnings reports, and macro events through Bing
and produce structured intelligence for advisor use.

INTELLIGENCE HIERARCHY:
1. CRITICAL: Events that require immediate advisor action (earnings misses, regulatory changes,
   position-specific negative news, geopolitical market-moving events)
2. HIGH: Significant developments affecting portfolio themes or major positions
3. MEDIUM: Sector/theme updates, economic data releases
4. LOW: General market commentary, educational content

FOR EACH NEWS ITEM:
- Headline and source
- Relevance to portfolio/themes
- Potential portfolio impact (positive/negative/neutral)
- Suggested advisor talking points
- Urgency level (immediate/today/this_week)

Respond in JSON:
{
  "scan_date": "...",
  "critical_alerts": [],
  "high_priority": [],
  "market_themes": [],
  "portfolio_impacts": [
    {
      "ticker": "...",
      "headline": "...",
      "impact": "positive|negative|neutral",
      "urgency": "immediate|today|this_week",
      "talking_points": []
    }
  ],
  "macro_briefing": "...",
  "sector_rotations": [],
  "data_freshness": "..."
}"""

    def run_daily_scan(
        self,
        portfolio_tickers: list[str],
        themes: list[str],
        client_profile: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """Run a comprehensive daily market intelligence scan."""
        tickers_str = ", ".join(portfolio_tickers) if portfolio_tickers else "broad market"
        themes_str = ", ".join(themes) if themes else "general"

        prompt = f"""Perform a comprehensive daily financial intelligence scan.

Portfolio Tickers to Monitor: {tickers_str}
Investment Themes: {themes_str}
{f'Client Profile Context: {client_profile}' if client_profile else ''}

Search for and analyze:
1. Breaking news affecting monitored tickers
2. Earnings announcements and guidance
3. Macro economic releases (CPI, Fed, GDP, jobs)
4. Sector rotation signals
5. Geopolitical risks
6. Regulatory developments

Use current date. Prioritize by portfolio impact."""
        return self.run(prompt, timeout=self._settings.foundry_grounding_timeout_seconds)

    def search_client_news(
        self,
        client_name: str,
        company: str = "",
        sector: str = "",
    ) -> dict[str, Any]:
        """Search for news relevant to a specific client's situation."""
        prompt = f"""Search for news relevant to this wealth management client's situation.

Client Employer/Industry: {company or 'Not specified'}
Sector Focus: {sector or 'General'}

Search for relevant news about their industry, employer, and any life event-related topics
that an advisor should be aware of before the meeting.

Return JSON: {{"client_relevant_news": [], "employer_news": [], "sector_news": [], "talking_points": []}}"""
        return self.run(prompt, timeout=self._settings.foundry_grounding_timeout_seconds)
