import React, { useState } from 'react'
import {
  Mic, Users, TrendingUp, Lightbulb, Activity, MessageCircle, Shield,
  ChevronRight, ChevronLeft, Bot, ArrowRight, AlertTriangle,
  Clock, Terminal, CheckCircle2, Globe, Database,
} from 'lucide-react'
import clsx from 'clsx'

// ─── Types ────────────────────────────────────────────────────────────────────
interface ActColors {
  text: string
  border: string
  bg: string
  badge: string
  dot: string
  tabActive: string
  tabInactive: string
  highlight: string
  gateBg: string
  bizBg: string
  outputText: string
}

interface AgentCard {
  name: string
  model: string
  file: string
  grounded?: boolean
}

interface DemoStep {
  id: string
  title: string
  uiNav?: string
  story: string
  agents?: AgentCard[]
  outputSnippet?: string
  businessPoint?: string
  highlights?: string[]
  isGate?: boolean
  gateLabel?: string
}

interface DemoAct {
  n: number
  label: string
  subtitle: string
  Icon: React.ElementType
  colors: ActColors
  duration: string
  overview: string
  steps: DemoStep[]
}

// ─── Act Color Palettes ───────────────────────────────────────────────────────
const C_CYAN: ActColors = {
  text: 'text-cyan-400', border: 'border-cyan-500/40', bg: 'bg-cyan-900/20',
  badge: 'bg-cyan-900/50 text-cyan-300 border border-cyan-700/50',
  dot: 'bg-cyan-400', tabActive: 'bg-cyan-900/40 border-cyan-500/50 text-cyan-300',
  tabInactive: 'border-border text-gray-400 hover:text-gray-200 hover:border-gray-600',
  highlight: 'bg-cyan-950/40 border-cyan-800/40', gateBg: 'bg-orange-900/20 border-orange-600/30',
  bizBg: 'bg-indigo-900/20 border-indigo-600/30', outputText: 'text-emerald-300',
}
const C_BLUE: ActColors = {
  text: 'text-blue-400', border: 'border-blue-500/40', bg: 'bg-blue-900/20',
  badge: 'bg-blue-900/50 text-blue-300 border border-blue-700/50',
  dot: 'bg-blue-400', tabActive: 'bg-blue-900/40 border-blue-500/50 text-blue-300',
  tabInactive: 'border-border text-gray-400 hover:text-gray-200 hover:border-gray-600',
  highlight: 'bg-blue-950/40 border-blue-800/40', gateBg: 'bg-orange-900/20 border-orange-600/30',
  bizBg: 'bg-indigo-900/20 border-indigo-600/30', outputText: 'text-blue-200',
}
const C_EMERALD: ActColors = {
  text: 'text-emerald-400', border: 'border-emerald-500/40', bg: 'bg-emerald-900/20',
  badge: 'bg-emerald-900/50 text-emerald-300 border border-emerald-700/50',
  dot: 'bg-emerald-400', tabActive: 'bg-emerald-900/40 border-emerald-500/50 text-emerald-300',
  tabInactive: 'border-border text-gray-400 hover:text-gray-200 hover:border-gray-600',
  highlight: 'bg-emerald-950/40 border-emerald-800/40', gateBg: 'bg-orange-900/20 border-orange-600/30',
  bizBg: 'bg-indigo-900/20 border-indigo-600/30', outputText: 'text-emerald-300',
}
const C_YELLOW: ActColors = {
  text: 'text-yellow-400', border: 'border-yellow-500/40', bg: 'bg-yellow-900/20',
  badge: 'bg-yellow-900/50 text-yellow-300 border border-yellow-700/50',
  dot: 'bg-yellow-400', tabActive: 'bg-yellow-900/40 border-yellow-500/50 text-yellow-300',
  tabInactive: 'border-border text-gray-400 hover:text-gray-200 hover:border-gray-600',
  highlight: 'bg-yellow-950/40 border-yellow-800/40', gateBg: 'bg-orange-900/20 border-orange-600/30',
  bizBg: 'bg-indigo-900/20 border-indigo-600/30', outputText: 'text-yellow-200',
}
const C_ORANGE: ActColors = {
  text: 'text-orange-400', border: 'border-orange-500/40', bg: 'bg-orange-900/20',
  badge: 'bg-orange-900/50 text-orange-300 border border-orange-700/50',
  dot: 'bg-orange-400', tabActive: 'bg-orange-900/40 border-orange-500/50 text-orange-300',
  tabInactive: 'border-border text-gray-400 hover:text-gray-200 hover:border-gray-600',
  highlight: 'bg-orange-950/40 border-orange-800/40', gateBg: 'bg-orange-900/20 border-orange-600/30',
  bizBg: 'bg-indigo-900/20 border-indigo-600/30', outputText: 'text-orange-200',
}
const C_VIOLET: ActColors = {
  text: 'text-violet-400', border: 'border-violet-500/40', bg: 'bg-violet-900/20',
  badge: 'bg-violet-900/50 text-violet-300 border border-violet-700/50',
  dot: 'bg-violet-400', tabActive: 'bg-violet-900/40 border-violet-500/50 text-violet-300',
  tabInactive: 'border-border text-gray-400 hover:text-gray-200 hover:border-gray-600',
  highlight: 'bg-violet-950/40 border-violet-800/40', gateBg: 'bg-orange-900/20 border-orange-600/30',
  bizBg: 'bg-indigo-900/20 border-indigo-600/30', outputText: 'text-violet-200',
}
const C_RED: ActColors = {
  text: 'text-red-400', border: 'border-red-500/40', bg: 'bg-red-900/20',
  badge: 'bg-red-900/50 text-red-300 border border-red-700/50',
  dot: 'bg-red-400', tabActive: 'bg-red-900/40 border-red-500/50 text-red-300',
  tabInactive: 'border-border text-gray-400 hover:text-gray-200 hover:border-gray-600',
  highlight: 'bg-red-950/40 border-red-800/40', gateBg: 'bg-orange-900/20 border-orange-600/30',
  bizBg: 'bg-indigo-900/20 border-indigo-600/30', outputText: 'text-red-200',
}

// ─── Demo Acts Data ───────────────────────────────────────────────────────────
const ACTS: DemoAct[] = [
  // ── ACT 1 ──────────────────────────────────────────────────────────────────
  {
    n: 1,
    label: 'Meeting Intelligence',
    subtitle: 'The First Conversation That Starts Everything',
    Icon: Mic,
    colors: C_CYAN,
    duration: '10 min',
    overview: 'The moment the meeting starts, five AI agents begin working in parallel — transcribing, redacting PII, scoring sentiment, extracting the CRM profile, and surfacing recommendations — all before the advisor has taken a single manual note.',
    steps: [
      {
        id: 'start',
        title: 'Start the Meeting Session',
        uiNav: 'Meetings → New Meeting → Select Sarah Chen',
        story: "It's Tuesday afternoon. Sarah Chen — senior FAANG engineer, $850K in assets, 70% concentration risk — walks into the advisor's office for the first time. Open a live meeting workspace and notice four panels light up simultaneously: Transcript, Sentiment Gauge, Recommendation Feed, and Agent Activity. This is the moment the AI begins working.",
        highlights: [
          'Transcript Panel — real-time scrolling with ADVISOR / CLIENT speaker labels',
          'Sentiment Gauge — live emotional signal bar showing client engagement',
          'Recommendation Feed — AI surfaces recommendations as Sarah speaks',
          'Agent Activity Panel — shows which Foundry agents are actively processing',
        ],
      },
      {
        id: 'inject',
        title: 'Inject the Transcript',
        uiNav: 'Run: python tests/run_scenario.py sarah_chen — or play audio file',
        story: 'Either play the recorded audio file or use the scenario injector to simulate Sarah\'s meeting. Watch the four UI panels respond in real time as each segment arrives. Each new message from either speaker immediately triggers the parallel agent pipeline.',
        outputSnippet: `POST /api/meetings/{session_id}/inject-transcript
Content-Type: application/json

[
  {"speaker": "advisor", "text": "Good afternoon Sarah — thanks for coming in."},
  {"speaker": "client",  "text": "First time. I'm Sarah Chen, 35..."},
  {"speaker": "client",  "text": "I have about $850K — roughly $600K in RSUs..."},
  {"speaker": "client",  "text": "Email sarah.chen@gmail.com, cell 415-702-9384"},
  {"speaker": "client",  "text": "The tax bill was brutal — I didn't plan for it."}
]`,
        highlights: [
          'Each segment immediately fires the 5-agent parallel pipeline',
          'No batch processing — every message is enriched in real time',
        ],
      },
      {
        id: 'transcription',
        title: 'TranscriptionAgent — Enriched Realtime Transcript',
        story: 'The TranscriptionAgent is not a simple speech-to-text wrapper. It normalizes financial terminology (RSU, ETF, CPI), labels speakers from conversational context, detects compliance-sensitive phrases, and extracts financial entities as they are mentioned.',
        agents: [{ name: 'CapmarketTranscriptionAgent', model: 'gpt-4o', file: 'backend/app/agents/transcription_agent.py', grounded: false }],
        outputSnippet: `{
  "segments": [{
    "speaker": "client",
    "normalized_text": "I have ~$850,000 — $600K in company equity (RSUs/stock)...",
    "entities": ["RSU", "company_stock"],
    "compliance_flags": []
  }],
  "meeting_topics": ["concentrated_position", "diversification"],
  "compliance_alerts": []
}`,
        businessPoint: 'Enriched transcription turns unstructured conversation into structured financial data — instantly, with zero manual effort from the advisor.',
      },
      {
        id: 'pii',
        title: 'PIIAgent — Compliance Redaction (Parallel)',
        story: "When Sarah says 'Email is sarah.chen@gmail.com and my cell is 415-702-9384', the PII agent fires immediately in parallel with transcription. No PII ever reaches any downstream store — Cosmos DB, AI Search, or the summary — in unredacted form.",
        agents: [{ name: 'CapmarketPIIAgent', model: 'gpt-4o-mini', file: 'backend/app/agents/pii_agent.py', grounded: false }],
        outputSnippet: `{
  "redacted_text": "Email is [EMAIL-REDACTED] and my cell is [PHONE-REDACTED]",
  "pii_detected": [
    {"type": "EMAIL", "original": "sarah.chen@gmail.com",  "redacted": "[EMAIL-REDACTED]"},
    {"type": "PHONE", "original": "415-702-9384", "redacted": "[PHONE-REDACTED]"}
  ],
  "risk_level": "medium"
}`,
        businessPoint: 'Satisfies GDPR, CCPA, and financial-services data handling requirements out of the box. Compliance teams sleep at night.',
      },
      {
        id: 'sentiment',
        title: 'SentimentAgent — Live Emotional Intelligence (Parallel)',
        story: 'Runs on every transcript segment with zero LLM latency — Azure Text Analytics provides confidence scores, then domain-specific keyword rules augment with financial context. The live Sentiment Gauge updates in real time so the advisor can modulate their tone mid-conversation.',
        agents: [{ name: 'SentimentAgent', model: 'Azure Text Analytics + keyword rules (no LLM on hot path)', file: 'backend/app/agents/sentiment_agent.py', grounded: false }],
        highlights: [
          '"I keep meaning to do it" → Procrastination / low urgency → Life event: estate planning gap',
          '"I\'ve seen the 2022 crash and held on" → Confident / aggressive → Risk appetite: HIGH',
          '"The tax bill was brutal — I didn\'t plan" → Frustrated / negative → Tax shock trigger',
          '"Financial independence early" → Motivated / positive → Goal: FIRE detected',
        ],
        businessPoint: 'Sarah is confident but frustrated by past tax mistakes. The advisor sees this signal and leads with tax optimization — a data-driven conversation pivot.',
      },
      {
        id: 'profile',
        title: 'ProfileAgent — Automatic CRM Population',
        story: 'By the end of the meeting, the ProfileAgent has extracted a complete structured profile — 20+ CRM fields automatically populated directly from Sarah\'s spoken words. The advisor has never touched a form.',
        agents: [{ name: 'CapmarketProfileAgent', model: 'gpt-4o', file: 'backend/app/agents/profile_agent.py', grounded: false }],
        outputSnippet: `{
  "extracted_personal":  {"name": "Sarah Chen", "age": 35, "occupation": "Software Engineer (FAANG)", "location": "San Francisco, CA"},
  "extracted_financial": {"total_assets": 850000, "company_equity": 600000, "base_salary": 280000, "annual_rsu_vesting": 300000},
  "extracted_risk":      {"tolerance": "aggressive", "max_drawdown_comfort": "30%", "horizon_years": 10},
  "extracted_goals": [
    {"goal": "Financial independence / early retirement", "target_age": 45},
    {"goal": "Diversify away from single-stock concentration"},
    {"goal": "Tax optimization on RSU vesting"}
  ],
  "extracted_concerns":  ["70% concentration in employer stock", "Unplanned RSU tax liability", "No will or estate plan"],
  "profile_completeness": 0.87
}`,
        businessPoint: 'In 20 minutes of conversation, the AI built what would have taken 2 hours of manual CRM data entry — with higher accuracy and richer context.',
      },
      {
        id: 'recommendations',
        title: 'RecommendationAgent — Gate 1',
        story: "Midway through the meeting, as Sarah mentions concentration risk and tax frustration, the Recommendation Agent surfaces preliminary recommendations in the Feed panel on the right side of the UI. Point this out explicitly — these are NOT yet shown to Sarah. The advisor reviews first.",
        agents: [{ name: 'CapmarketRecommendationAgent', model: 'gpt-4o', file: 'backend/app/agents/recommendation_agent.py', grounded: false }],
        outputSnippet: `{
  "recommendations": [
    {
      "category": "portfolio_rebalance",
      "headline": "Implement systematic RSU liquidation plan — 10-15% per quarter",
      "rationale": "70% single-employer concentration creates correlated compensation and portfolio risk...",
      "confidence": 0.93, "priority": 1, "compliance_cleared": true
    },
    {
      "category": "tax_strategy",
      "headline": "Establish estimated quarterly tax payments for 2025 RSU vest events",
      "priority": 1, "compliance_cleared": true
    },
    {
      "category": "estate_planning",
      "headline": "Initiate basic estate plan — will, DPOA, beneficiary review",
      "priority": 2, "requires_approval": false
    }
  ],
  "overall_assessment": "High income, poor tax and estate scaffolding. Immediate wins: tax planning and concentration reduction."
}`,
        isGate: true,
        gateLabel: 'Gate 1: Advisor reviews and approves recommendations. Unapproved items never enter the meeting record. Every approval is logged with advisor ID, timestamp, and full payload to the immutable audit trail.',
        businessPoint: 'Human-in-the-loop is architecturally enforced — not a UI toggle. The workflow literally stops and waits for the gate decision before proceeding.',
      },
      {
        id: 'summary',
        title: 'SummaryAgent — Three Summaries, One Click — Gate 2',
        story: 'The SummaryAgent generates three completely different summaries simultaneously — each calibrated to its audience: the Advisor (data-driven CRM entry), the Client (warm follow-up email), and Compliance (FINRA/Reg BI language). Three perfect documents from zero manual writing.',
        agents: [{ name: 'CapmarketSummaryAgent', model: 'gpt-4o', file: 'backend/app/agents/summary_agent.py', grounded: false }],
        highlights: [
          'Advisor Summary: data-driven CRM entry with next steps, hot buttons ("she\'s data-driven — show numbers"), action items',
          'Client Summary: warm, conversational email sent directly to Sarah — no legal jargon',
          'Compliance Summary: FINRA-language, Reg BI suitability confirmation, no guarantee statements, in-scope disclosures',
        ],
        isGate: true,
        gateLabel: 'Gate 2: Advisor reviews the summary, makes any corrections, then approves. Only the approved version is persisted to Cosmos DB. The compliance version goes directly to the audit trail.',
        businessPoint: 'The advisor\'s post-meeting workload dropped from 90 minutes of note-taking to a single approval click — with better output quality.',
      },
    ],
  },

  // ── ACT 2 ──────────────────────────────────────────────────────────────────
  {
    n: 2,
    label: 'Client Intelligence',
    subtitle: "Sarah's Financial DNA Lives in the Platform",
    Icon: Users,
    colors: C_BLUE,
    duration: '5 min',
    overview: "Navigate to Sarah's client profile. Everything extracted from the meeting — enriched, editable, and queryable. The platform builds on every conversation. Meeting 5 knows everything from meetings 1 through 4.",
    steps: [
      {
        id: 'navigate',
        title: "Navigate to Sarah's Profile",
        uiNav: 'Clients → Sarah Chen',
        story: "The client profile page is the financial DNA of Sarah Chen — assembled entirely from AI-analyzed conversation, not a single field filled in manually. Every element on screen was extracted, structured, and persisted without the advisor touching a CRM form.",
        highlights: [
          'Risk Profile Card: Aggressive | 10-year horizon | 30% max drawdown tolerance',
          'Goals: Financial independence @45, RSU diversification, tax optimization',
          'Key Concerns: Single-stock concentration, tax planning, no estate plan',
          'Meeting History: Full AI summaries, key decisions, recommendations, action items per session',
          'Holdings: Current positions with live signals',
        ],
      },
      {
        id: 'history',
        title: 'Meeting History — Cumulative Intelligence',
        story: "Click into any past meeting summary. The profile is enriched after every session — Sarah\'s goals in meeting 3 are refined by what she said in meetings 1 and 2. The AI never forgets. Every conversation adds signal.",
        highlights: [
          'Each meeting summary is stored with the advisor-approved version (not the raw AI output)',
          'Recommendations history shows every item — approved, modified, or rejected',
          'Action items are tracked across meetings — outstanding items surface automatically',
          'Profile completeness score updates after every session',
        ],
        businessPoint: "An advisor picking up Sarah's file 6 months later reads a complete, AI-authored history of every interaction, decision, and signal. No handoff friction.",
      },
      {
        id: 'schema',
        title: 'Cosmos DB — 10 Containers, Purpose-Built Partitioning',
        story: 'All client data lives in the Cosmos DB clients container, partitioned by advisor_id for optimal multi-advisor query patterns. Each of the 10 containers is partitioned specifically for the query patterns it serves — not a general-purpose schema.',
        agents: [{ name: 'CosmosStore', model: 'Azure Cosmos DB (No-SQL)', file: 'backend/app/persistence/cosmos_store.py', grounded: false }],
        outputSnippet: `# backend/app/persistence/cosmos_store.py
COLLECTIONS = {
  "clients":              "/advisor_id",   # Client profiles — query by book
  "sessions":             "/client_id",    # Meeting sessions — query by client
  "portfolios":           "/client_id",    # Proposals — query by client
  "backtests":            "/client_id",    # Backtest results — query by client
  "rebalance_reports":    "/client_id",    # Trade lists — query by client
  "advisory_sessions":    "/advisor_id",   # Advisory intel — query by book
  "client_conversations": "/client_id",   # 24/7 chat history — query by client
  "checkpoints":          "/workflow_id",  # HITL checkpoints — query by workflow
  "audit_log":            "/client_id",    # Immutable audit — query by client
  "agent_audits":         "/run_id",       # Per-agent records — query by run
}`, 
        businessPoint: '10 containers. Each partitioned for the specific access pattern it serves. All workflow state persists here — server restarts do not lose state. Full replay capability for compliance investigation.',
      },
    ],
  },

  // ── ACT 3 ──────────────────────────────────────────────────────────────────
  {
    n: 3,
    label: 'Portfolio Intelligence',
    subtitle: 'AI Builds Sarah a Backtested Portfolio in Under 5 Minutes',
    Icon: TrendingUp,
    colors: C_EMERALD,
    duration: '12 min',
    overview: 'Enter a plain-English mandate and watch the 6-stage Sense → Think → Act pipeline execute with live status updates. From natural language idea to fully backtested, rebalance-ready portfolio — in minutes.',
    steps: [
      {
        id: 'mandate',
        title: 'Open Portfolio Builder & Enter Mandate',
        uiNav: 'Portfolio → New Portfolio → Select Sarah Chen',
        story: "Type the mandate in plain English — exactly how an advisor would brief a quant team. The platform translates it into hard quantitative constraints and immediately starts the portfolio pipeline. No spreadsheets, no Bloomberg terminal.",
        outputSnippet: `"Aggressive growth, tech diversification away from FAANG
concentration, 10-year horizon, $150,000 initial investment,
ESG preference, target 12-15% expected return"

→ Translates to quantitative constraints:
   position_count: [10, 20]
   max_single_weight: 0.10
   max_sector_concentration: 0.40
   hhi_ceiling: 0.25
   volatility_target: 0.20
   min_market_cap: $100M`,
        highlights: [
          'Natural language → quantitative constraints via gpt-4o mandate translation',
          'Live 6-stage pipeline progress indicators as each stage completes',
          'Stage sequence: NewsAgent → Theme gates → Universe → Construction → Backtest → Rebalance',
        ],
      },
      {
        id: 'themes',
        title: 'NewsAgent Surfaces Market Themes (Gate 1)',
        story: "The NewsAgent fires a Bing-grounded scan of today's market landscape aligned to Sarah's mandate. It identifies 3-6 investment themes with confidence scores, supporting tickers, and business rationales — all grounded in current news.",
        agents: [{ name: 'CapmarketNewsAgent', model: 'gpt-4o-mini', file: 'backend/app/agents/news_agent.py', grounded: true }],
        outputSnippet: `{
  "market_themes": [
    {
      "name": "AI Infrastructure & Cloud Computing",
      "confidence": 0.94,
      "tickers": ["MSFT", "GOOGL", "AMZN", "META", "CRM"],
      "rationale": "Enterprise AI capex up 45% YoY — hyperscaler monetization early innings"
    },
    {
      "name": "Semiconductor Supply Chain",
      "confidence": 0.88,
      "tickers": ["NVDA", "AMD", "AVGO", "QCOM", "TSM"],
      "rationale": "CHIPS Act tailwinds + AI compute demand driving secular growth"
    },
    {
      "name": "Cybersecurity",
      "confidence": 0.82,
      "tickers": ["CRWD", "PANW", "ZS", "FTNT"],
      "rationale": "Enterprise security budgets growing 15% CAGR — non-discretionary spend"
    }
  ]
}`,
        isGate: true,
        gateLabel: 'Gate 1: Advisor sees themes with confidence scores and Bing-sourced rationales. One click activates themes. The gate decision is logged with advisor ID and exact timestamp.',
      },
      {
        id: 'construction',
        title: 'Portfolio Construction — Goldman-Grade Quant Engine',
        story: "The highest-stakes agent in the system runs on the most capable model. It executes a 5-phase methodology: mandate translation → theme-to-ticker mapping → multi-factor scoring → mean-variance optimization → risk overlays. This is not a simple stock picker.",
        agents: [{ name: 'CapmarketPortfolioConstructionAgent', model: 'o1 / chato1 (reasoning model — highest stakes agent)', file: 'backend/app/agents/portfolio_agent.py', grounded: false }],
        outputSnippet: `Multi-Factor Scoring Weights:
  Fundamentals (30%): P/E, EV/EBITDA, FCF yield, ROE
  Technicals   (25%): RSI, MACD, ATR, trend strength
  Momentum     (20%): 3/6/12mo price momentum
  Quality      (15%): earnings consistency, debt/equity
  Valuation    (10%): relative to sector peers

Result — 15 positions:
  MSFT: 9.0% | score 0.91 | conviction HIGH
  NVDA: 8.0% | score 0.94 | conviction HIGH
  ... (13 more)

Risk Metrics:
  Sharpe: 1.34  |  HHI: 0.087  |  Vol: 18.2%
  Beta: 1.12    |  Max DD est: -28.3%`,
        isGate: true,
        gateLabel: "Gate 2: Advisor reviews every position — rationale, weight, risk metrics, constraint checks. Can annotate, request changes, or approve. Only approved portfolios are saved to Cosmos DB.",
        businessPoint: "Sarah's current single-stock HHI: 0.49. New portfolio HHI: 0.087. That is a 5.6x reduction in concentration — the quantitative story of diversification told in a single number.",
      },
      {
        id: 'backtest',
        title: 'BacktestingAgent — 3 Years vs SPY',
        story: '3-year historical simulation runs automatically after portfolio approval. The BacktestingAgent generates both the quantitative table and a plain-English narrative explaining the results in the context of Sarah\'s mandate and risk tolerance.',
        agents: [{ name: 'CapmarketBacktestingAgent', model: 'gpt-4o-mini', file: 'backend/app/agents/backtesting_agent.py', grounded: false }],
        highlights: [
          'Total Return (3yr): +87.4%  vs  SPY +32.1%  →  +55.3pp outperformance',
          'CAGR: 23.1%  vs  SPY 9.7%  →  Sharpe Ratio: 1.34  vs  SPY 0.71',
          'Alpha: +13.4%  |  Win Rate (monthly): 71%  vs  SPY 62%',
          'Max Drawdown: -28.3%  —  within Sarah\'s stated 30% drawdown comfort level',
          'Agent narrative explicitly connects -28.3% drawdown to client\'s stated aggressive tolerance',
        ],
        businessPoint: 'The portfolio\'s higher drawdown is not a flaw — the backtest narrative frames it as consistent with the mandate. This is how you defend the construction to a client.',
      },
      {
        id: 'rebalance',
        title: 'Rebalance Plan — Initial Trade List (Gate 3)',
        uiNav: 'Rebalance tab inside the Portfolio page',
        story: 'Even for a brand-new portfolio, the RebalanceAgent generates the initial "from zero to target" trade list. It also sets the ongoing drift thresholds that future autonomous watch cycles will monitor.',
        agents: [{ name: 'CapmarketRebalanceAgent', model: 'gpt-4o-mini', file: 'backend/app/agents/rebalance_agent.py', grounded: false }],
        outputSnippet: `{
  "proposed_trades": [
    {"direction": "buy", "symbol": "MSFT", "shares": 32, "priority": 1,
     "rationale": "Target weight 9.0% — establishing initial position"},
    {"direction": "buy", "symbol": "NVDA", "shares": 18, "priority": 1,
     "rationale": "Target weight 8.0% — high conviction AI compute"}
    // + 13 more initial buys
  ],
  "drift_thresholds": {
    "weight_drift_trigger":    0.05,   // rebalance if any position drifts ±5%
    "vol_breach_trigger":      0.20,   // rebalance if portfolio vol hits 20%
    "theme_confidence_floor":  0.50    // flag if Bing confidence drops below 50%
  }
}`,
        isGate: true,
        gateLabel: "Gate 3: Advisor reviews and executes (or saves as paper portfolio). Every gate decision — approve, modify, or skip — logs to audit_log with full payload.",
      },
    ],
  },

  // ── ACT 4 ──────────────────────────────────────────────────────────────────
  {
    n: 4,
    label: 'Advisory Intelligence',
    subtitle: 'The Advisor Walks In Fully Briefed — Every Time',
    Icon: Lightbulb,
    colors: C_YELLOW,
    duration: '8 min',
    overview: '90 seconds before Sarah walks in, four agents fire in parallel — market news, tax strategy, the briefing, and relationship ideas — all grounded in her profile and live market data. The advisor never walks in cold.',
    steps: [
      {
        id: 'run-briefing',
        title: 'Run Pre-Meeting Briefing',
        uiNav: 'Advisory → Select Sarah Chen → Run Pre-Meeting Briefing',
        story: "The AdvisoryWorkflow fires 4 agents concurrently via asyncio.gather. In under 90 seconds, the advisor has a fully personalized pre-meeting dossier — market context, tax opportunities, talking points, and relationship ideas, all woven together around Sarah's specific situation.",
        highlights: [
          'NewsAgent — Bing-grounded market scan scoped to Sarah\'s exact 15 positions',
          'TaxAgent — identifies tax-loss harvesting and planning opportunities in real time',
          'AdvisoryAgent — contextualized briefing with specific advisor talking points',
          'AdvisoryAgent (second pass) — relationship deepening ideas based on profile + peer patterns',
        ],
      },
      {
        id: 'briefing-alert',
        title: 'Critical Pre-Meeting Alert',
        story: "The briefing lands 5 minutes before Sarah arrives. Today it includes a critical alert — NVDA is down 8.4% pre-market on export restriction news, directly impacting a position in her portfolio. The advisor walks in knowing exactly what Sarah will ask.",
        agents: [{ name: 'CapmarketAdvisoryAgent', model: 'gpt-4o', file: 'backend/app/agents/advisory_agent.py', grounded: true }],
        outputSnippet: `CRITICAL ALERT:
  NVDA -8.4% pre-market on US export restriction headlines
  Directly impacts Sarah's Semiconductor theme (8% weight)

ADVISOR TALKING POINT:
  "This is exactly why we diversified across the theme
  rather than single-name concentration — the theme is
  intact, the position is manageable at 8% weight.
  Your portfolio is down ~1.2% vs NVDA's -8.4%."

MARKET CONTEXT:
  Tech rotation continues — growth under rate pressure
  Sarah's portfolio Sharpe 1.34 provides buffer
  Portfolio vol 18.2% within mandate parameters`,
        businessPoint: 'The advisor walks in with a specific, data-grounded talking point for the exact concern Sarah will raise — before she even sits down.',
      },
      {
        id: 'tax',
        title: 'Tax Strategy Analysis — $63K in Identified Savings',
        story: "For Sarah at $580K total compensation in California — federal bracket 37%, state 13.3% — the TaxAgent identifies $63,000 in estimated annual tax savings across three distinct strategies, all grounded in current tax law.",
        agents: [{ name: 'CapmarketTaxAgent', model: 'gpt-4o-mini', file: 'backend/app/agents/tax_agent.py', grounded: true }],
        highlights: [
          'RSU Withholding Election: elect 37% flat-rate vs 22% default → estimated savings $45,000',
          'Tax-Loss Harvesting in $100K brokerage → estimated savings $18,500 (Dec 31 deadline, wash-sale aware)',
          'Backdoor Roth IRA contribution → $7,200/year ongoing benefit',
          'Total estimated annual tax savings: $63,000',
        ],
        businessPoint: '$63,000 in identified tax savings in 90 seconds. A traditional CPA engagement for this analysis: $2,000-5,000 and a 2-week wait. This surfaces at every single meeting.',
      },
      {
        id: 'chat',
        title: 'Advisor AI Chat — Client-Specific Intelligence',
        uiNav: 'Advisory → Chat tab',
        story: "The advisor can ask any free-form question, fully grounded in Sarah's complete profile AND live Bing market data. The AI gives client-specific analysis — not generic advice — calibrated to Sarah's exact income, tax bracket, vesting schedule, and goals.",
        agents: [{ name: 'CapmarketAdvisoryAgent', model: 'gpt-4o', file: 'backend/app/agents/advisory_agent.py', grounded: true }],
        outputSnippet: `Advisor: "What's the case for selling all Sarah's RSUs
immediately vs. a systematic quarterly approach?
Give me the tax and timing analysis."

→ Agent responds with Bing-grounded, client-contextualized
  analysis specific to:
  - Sarah's $580K income + California 13.3% marginal rate
  - Her exact RSU vesting schedule
  - Long-term vs short-term capital gains thresholds
  - FOMO-risk of immediate liquidation vs. qualified gains
  - Estimated tax differential: systematic vs. lump-sum`,
      },
      {
        id: 'relationship',
        title: 'Relationship Deepening Ideas',
        story: "The AdvisoryAgent analyzes Sarah's profile, stated goals, and life-event signals to suggest four specific relationship actions — each with effort level, timing, and a rationale tied directly to something she said.",
        highlights: [
          'Send FIRE resource kit — Low effort, this week — directly matches her early-retirement goal signal',
          'Estate attorney referral — Low effort, after meeting — $850K estate with no will is a critical gap',
          '"Tech Professionals & Wealth" seminar invite — Medium effort, Q3 — peer-group resonance builds trust',
          'Quarterly tax checkpoint call — Low, ongoing — directly addresses her #1 pain point (tax shock)',
        ],
        businessPoint: 'Every touchpoint is personalized to what Sarah actually cares about — not a generic newsletter blast. The platform knows her. The advisor acts on that.',
      },
    ],
  },

  // ── ACT 5 ──────────────────────────────────────────────────────────────────
  {
    n: 5,
    label: 'Portfolio Watch',
    subtitle: 'The AI That Never Sleeps',
    Icon: Activity,
    colors: C_ORANGE,
    duration: '8 min',
    overview: 'Every 30 minutes, without any human trigger, the platform runs a 4-agent autonomous watch cycle across every managed portfolio. Risks surface in the Intel Feed at 2AM if needed. An advisor running a $50M book has a 24/7 markets desk at infrastructure cost.',
    steps: [
      {
        id: 'cycle',
        title: 'The Autonomous Watch Cycle',
        uiNav: "Portfolio Watch → Sarah Chen's Portfolio",
        story: 'Four agents run sequentially and then in parallel, triggered by the scheduler every 30 minutes. No one has to wake up, no one has to log in. The cycle runs overnight, on weekends, on market open. Every output is persisted to Cosmos DB and surfaced in the Intel Feed.',
        highlights: [
          'MarketRegimeAgent — Bing-grounded VIX, ATR, breadth analysis → classify market environment',
          'NewsAgent — Bing scan of all 15 of Sarah\'s positions → news signals per holding',
          'RebalanceAgent — checks all 15 positions against drift thresholds → flag any breach',
          'RiskAdvisoryAgent — synthesizes regime + news + drift → actionable advisory recommendation',
        ],
      },
      {
        id: 'regime',
        title: 'Market Regime Detection',
        uiNav: 'Market Regime page — VIX term structure visualization',
        story: "The MarketRegimeAgent classifies the current market into one of four regimes using VIX term structure, ATR regime, and breadth signals. The classification drives how the RiskAdvisoryAgent weights its recommendations.", 
        agents: [{ name: 'CapmarketMarketRegimeAgent', model: 'gpt-4o-mini', file: 'backend/app/agents/market_regime_agent.py', grounded: true }],
        outputSnippet: `{
  "regime": "RISK_OFF",
  "selloff_risk": "ELEVATED",
  "vix": 28.4,
  "vix_term_structure": "BACKWARDATION",
  "vix_term_ratio": 1.18,
  "macro_narrative": "VIX spiked to 28 with term structure in
    backwardation — near-term stress signal. Market breadth
    deteriorating: advancing/declining ratio 0.62.
    Semiconductor names under disproportionate pressure.",
  "key_risks": [
    "NVDA export restrictions — direct portfolio exposure",
    "Fed hawkish surprise — growth factor headwind",
    "Tech concentration — portfolio 62% in tech themes"
  ],
  "confidence": 0.87
}`,
      },
      {
        id: 'risk-event',
        title: 'Risk Event Fires at 2:17 AM',
        story: "The RiskAdvisoryAgent synthesizes the RISK_OFF regime, the NVDA news signal, and the portfolio drift analysis into one specific advisory alert — with named positions and recommended actions. No advisor triggered this.",
        agents: [{ name: 'CapmarketRiskAdvisoryAgent', model: 'gpt-4o-mini', file: 'backend/app/agents/risk_advisory_agent.py', grounded: false }],
        outputSnippet: `{
  "risk_level": "elevated",
  "advisory_narrative": "Elevated VIX backwardation + export restriction headlines
    create compounding headwinds for semiconductor theme.
    Portfolio tech concentration (62%) warrants tactical
    monitoring. NVDA at 8% is the primary risk carrier.",
  "recommendations": [
    {
      "symbol": "NVDA",
      "action": "tighten_stop",
      "priority": "critical",
      "rationale": "Export restriction + elevated ATR → asymmetric
        downside. Tighten stop to 12% below current price."
    },
    {
      "symbol": "AMD",
      "action": "watch_closely",
      "priority": "high",
      "rationale": "Semiconductor peer — sentiment contamination risk"
    }
  ]
}`,
        businessPoint: 'This alert fires at 2:17 AM. No human was awake. An advisor cannot manually surveil 30 client portfolios every 30 minutes. This is the equivalent of a 24/7 markets desk — at the cost of Azure infrastructure.',
      },
      {
        id: 'intel-feed',
        title: 'Intel Feed — Cross-Client, Real-Time',
        uiNav: 'Intel Feed page',
        story: "Navigate to the Intel Feed to see the live aggregated stream of every watch cycle output across all clients — not just Sarah. Color-coded by risk level, filterable by client, severity, and agent. This is the advisor's morning command center.",
        highlights: [
          'All risk events across all client portfolios in one scrollable feed',
          'Color-coded: RED (critical) → ORANGE (elevated) → YELLOW (watch) → GREEN (nominal)',
          'Each card links directly to the client profile and affected position',
          'No action required until the advisor decides to act — the feed is informational, not prescriptive',
        ],
        businessPoint: 'The Intel Feed transforms a $50M book from reactive firefighting into proactive risk management — before clients even know there is a risk.',
      },
    ],
  },

  // ── ACT 6 ──────────────────────────────────────────────────────────────────
  {
    n: 6,
    label: 'Client Assistant',
    subtitle: 'Sarah Texts at 11 PM — Gets a Perfect Answer',
    Icon: MessageCircle,
    colors: C_VIOLET,
    duration: '5 min',
    overview: "24/7 AI-powered client assistant. Sarah messages after seeing a headline at 11 PM. Two minutes later, she has a warm, factual, portfolio-specific, compliance-safe answer — not a generic response, and not a voicemail.",
    steps: [
      {
        id: 'question',
        title: "Sarah's 11 PM Question",
        uiNav: 'Client Assistant → Sarah Chen',
        story: "Sarah sees a CNBC headline about NVIDIA after dinner and immediately opens the client assistant. It's 11:02 PM. The office is closed. Her advisor is asleep.",
        outputSnippet: `Sarah Chen  •  11:02 PM

"Hey — I just saw NVDA dropped 8% today on some export
restriction thing. Am I okay? Should I be worried about
my portfolio?"`,
        highlights: [
          'Message arrives outside office hours — no human available',
          'Sarah is emotionally engaged, not just curious — requires reassurance',
          'She is asking about a specific named position in her portfolio',
          'Generic answer ("markets go up and down") is insufficient and harmful',
        ],
      },
      {
        id: 'response',
        title: 'CommunicationAgent Responds at 11:04 PM',
        story: "The ClientServiceWorkflow fetches Sarah's portfolio context from Cosmos DB, pulls the latest watch cycle data already stored for her positions, then invokes the CommunicationAgent — Bing-grounded with today's live market data.",
        agents: [{ name: 'CapmarketCommunicationAgent', model: 'gpt-4o', file: 'backend/app/agents/communication_agent.py', grounded: true }],
        outputSnippet: `AI Assistant  •  11:04 PM

"Hi Sarah! Great that you're staying engaged with your
portfolio. Yes — NVIDIA did drop 8% today on export
restriction news, and I completely understand why that
caught your eye.

The context for your portfolio: NVDA represents ~8% of
your holdings, so the direct impact is limited. More
importantly, your portfolio was designed to ensure no
single position creates outsized impact — which is the
exact opposite of the concentration we discussed.

Your portfolio is down ~1.2% today vs. NVDA's -8%.
That's the diversification working exactly as intended.

Your advisor is aware and will have a full briefing ready
for your next meeting. Anything specific you'd like me
to explain about your positions?"`,
        businessPoint: 'Warm. Factual. Portfolio-specific (not generic). Compliance-safe. Answered at 11:04 PM with better quality than most office-hours callbacks. The alternative: Sarah waits until morning, stewing.',
      },
      {
        id: 'escalation',
        title: 'Escalation Logic — Hard-Coded Limits',
        story: "The CommunicationAgent's system prompt contains hard escalation triggers. These are not configurable — they are architecturally enforced. If Sarah said 'Sell everything', the agent escalates immediately rather than act.",
        highlights: [
          '"Sell everything" / any investment change request → escalate_to_advisor: true → advisor gets immediate notification',
          'Complaints or disputes → immediate escalation with full conversation context',
          'Complex tax questions requiring professional advice → escalate with transcript',
          'Emotional distress signals → escalate with flagged sentiment score',
          'Suspicious activity concerns → escalate with security flag',
        ],
        outputSnippet: `# Hard escalation triggers in CommunicationAgent system prompt
ESCALATION_TRIGGERS = [
  "Any request to make investment changes",
  "Complaints or disputes",
  "Suspicious activity concerns",
  "Complex tax questions requiring professional advice",
  "Emotional distress signals from client"
]

# If triggered:
{
  "response": "I want to make sure you get the best guidance
    for this — I'm flagging this for your advisor to call you
    back as soon as possible.",
  "escalate_to_advisor": true,    # advisor notified immediately
  "escalation_reason": "investment_change_request"
}`,
        businessPoint: 'The AI knows exactly where its authority ends. The escalation boundary is the product design — it is not optional, not configurable, and not subject to prompt injection.',
      },
    ],
  },

  // ── ACT 7 ──────────────────────────────────────────────────────────────────
  {
    n: 7,
    label: 'Audit & Compliance',
    subtitle: 'The Immutable Trail Every Regulator Wants to See',
    Icon: Shield,
    colors: C_RED,
    duration: '4 min',
    overview: "Every action in the platform — agent invocation, gate approval, client message — writes an immutable record to the audit_log Cosmos DB container. Not optional. Not configurable. Architecturally mandatory.",
    steps: [
      {
        id: 'trail',
        title: "View Today's Audit Trail",
        uiNav: 'Audit Trail page',
        story: "Navigate to the Audit Trail. Every action from the Sarah Chen meeting today is timestamped to the millisecond — agent invocations, gate approvals, who approved, what they approved, and the exact payload at the time of approval.",
        highlights: [
          '14:03:22 — MEETING_STARTED — Session created for Sarah Chen (advisor_001)',
          '14:03:25 — AGENT_CALLED — TranscriptionAgent invoked (system)',
          '14:03:26 — AGENT_CALLED — PIIAgent + SentimentAgent parallel fire',
          '14:19:44 — RECOMMENDATION_GENERATED — 3 recommendations surfaced (RecommendationAgent)',
          '14:21:00 — GATE_DECISION — Advisor approved 3 of 3 recommendations (advisor_001)',
          '14:38:12 — MEETING_SUMMARY_GENERATED — 3-persona summaries created (SummaryAgent)',
          '14:39:45 — GATE_DECISION — Advisor approved meeting summary (advisor_001)',
          '14:39:46 — MEETING_COMPLETED — Session finalized and persisted',
        ],
      },
      {
        id: 'schema',
        title: 'The Immutable Record Design',
        story: "Audit events are emitted via _log_event() from every agent and every workflow. The audit_log container is effectively write-only from the application — no update or delete operations exist. Every event type is an enum — no free-text strings that could be manipulated.",
        agents: [{ name: 'AuditLogger', model: 'Azure Cosmos DB (write-only)', file: 'backend/app/models/audit.py', grounded: false }],
        outputSnippet: `# backend/app/models/audit.py
class AuditEventType(str, Enum):
    MEETING_STARTED           = "meeting_started"
    AGENT_CALLED              = "agent_called"
    RECOMMENDATION_GENERATED  = "recommendation_generated"
    GATE_DECISION             = "gate_decision"
    PORTFOLIO_CREATED         = "portfolio_created"
    ADVISORY_REQUEST          = "advisory_request"
    REBALANCE_TRIGGERED       = "rebalance_triggered"
    CLIENT_MESSAGE            = "client_message"
    ESCALATION_FIRED          = "escalation_fired"
    # ... every event is a typed enum — never free text

# Every gate decision captures:
{
  "event_type":   "gate_decision",
  "gate_id":      "GATE-1",
  "approved_by":  "advisor_001",
  "timestamp":    "2026-03-29T14:21:00.443Z",
  "client_id":    "client_sarah_chen",
  "session_id":   "sess_abc123",
  "payload_hash": "sha256:...",   # hash of the approved payload
  "payload":      { ... full recommendation object ... }
}`,
      },
      {
        id: 'regulatory',
        title: 'Regulatory Value — FINRA + Reg BI',
        story: "The audit trail is not a convenience feature — it is the platform's regulatory spine. Two specific regulations are satisfied by the architecture itself, without any additional configuration.",
        highlights: [
          'FINRA Rule 4511: preserve all business communications 3 years → audit_log is permanent, partitioned write-once',
          'Regulation BI: documented suitability reasoning per interaction → every gate decision logs the advisor\'s rationale',
          'GDPR / CCPA: PII redacted before storage in all containers → PIIAgent fires before any persistence call',
          'Machine-readable events: automated compliance sweep can query audit_log without human review',
          'Replay capability: any workflow can be reconstructed from audit_log entries for investigation',
        ],
        businessPoint: "Compliance is not a post-processing bottleneck. It is architecturally baked in. Every gate decision, every agent call, every approval — permanent, typed, queryable, and legally defensible.",
      },
    ],
  },
]

// ─── Subcomponents ────────────────────────────────────────────────────────────
function AgentBadge({ agent, idx }: { agent: AgentCard; idx: number }) {
  return (
    <div key={idx} className="flex flex-wrap items-start gap-3 bg-violet-950/40 border border-violet-500/30 rounded-xl p-4">
      <Bot size={15} className="text-violet-400 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-violet-200">{agent.name}</span>
          {agent.grounded && (
            <span className="inline-flex items-center gap-1 badge bg-sky-900/50 text-sky-300 border border-sky-700/50">
              <Globe size={10} />
              Bing Grounded
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-gray-500">
          <span>Model: <span className="text-violet-300">{agent.model}</span></span>
          <span className="flex items-center gap-1">
            <Database size={10} className="text-gray-600" />
            <span className="font-mono text-gray-400">{agent.file}</span>
          </span>
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function DemoPage() {
  const [actIdx, setActIdx] = useState(0)
  const [stepIdx, setStepIdx] = useState(0)
  const [showCode, setShowCode] = useState(false)
  const [execMode, setExecMode] = useState(false)   // "Executive reel" toggle

  const act = ACTS[actIdx]
  const step = act.steps[stepIdx]
  const isFirst = actIdx === 0 && stepIdx === 0
  const isLast = actIdx === ACTS.length - 1 && stepIdx === act.steps.length - 1

  const advance = (dir: 1 | -1) => {
    setShowCode(false)
    if (dir === 1) {
      if (stepIdx < act.steps.length - 1) setStepIdx(s => s + 1)
      else if (actIdx < ACTS.length - 1) { setActIdx(a => a + 1); setStepIdx(0) }
    } else {
      if (stepIdx > 0) setStepIdx(s => s - 1)
      else if (actIdx > 0) { setActIdx(a => a - 1); setStepIdx(ACTS[actIdx - 1].steps.length - 1) }
    }
  }

  const jumpAct = (i: number) => { setActIdx(i); setStepIdx(0); setShowCode(false) }
  const jumpStep = (i: number) => { setStepIdx(i); setShowCode(false) }

  const totalStepsCompleted = ACTS.slice(0, actIdx).reduce((s, a) => s + a.steps.length, 0) + stepIdx
  const totalSteps = ACTS.reduce((s, a) => s + a.steps.length, 0)
  const progressPct = Math.round((totalStepsCompleted / totalSteps) * 100)

  return (
    <div className="space-y-5 max-w-screen-2xl">

      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-100">Demo Playbook</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Step-by-step walkthrough · "The Sarah Chen Story" · From first handshake to AI-managed portfolio
          </p>
        </div>
        <button
          onClick={() => setExecMode(e => !e)}
          className={clsx('shrink-0 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors', execMode
            ? 'bg-indigo-900/50 border-indigo-600/50 text-indigo-300'
            : 'border-border text-gray-400 hover:text-gray-200'
          )}
        >
          {execMode ? '⚡ Executive Mode' : '⚡ Executive Mode'}
        </button>
      </div>

      {/* ── Sarah Chen Profile + Demo Stats ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Sarah card */}
        <div className="bg-gradient-to-br from-indigo-950/60 via-slate-900/60 to-slate-900/40 border border-indigo-500/30 rounded-2xl p-5 col-span-1">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm shrink-0">SC</div>
            <div>
              <div className="text-sm font-semibold text-gray-100">Sarah Chen</div>
              <div className="text-xs text-indigo-400">The Golden Thread · Follow her through all 7 Acts</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs">
            {[
              ['Age', '35'],
              ['Role', 'FAANG Eng.'],
              ['Location', 'San Francisco'],
              ['Total Assets', '$850,000'],
              ['Company Equity', '$600K (70%)'],
              ['Annual Comp', '$580,000'],
              ['Goal', 'FIRE at 45'],
              ['Risk', 'Aggressive'],
            ].map(([k, v]) => (
              <div key={k}>
                <div className="text-gray-600 uppercase tracking-wide" style={{ fontSize: '9px' }}>{k}</div>
                <div className="text-gray-200 font-medium">{v}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 px-3 py-2 bg-red-900/30 border border-red-700/40 rounded-lg">
            <div className="text-xs font-medium text-red-300">Critical Risk Signal</div>
            <div className="text-xs text-red-400/80 mt-0.5">70% single-employer RSU concentration · No estate plan · Unplanned RSU tax liability</div>
          </div>
        </div>

        {/* Platform stats */}
        <div className="col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { v: '7', label: 'Demo Acts', sub: '45-60 min full walk', color: 'text-accent' },
            { v: '15', label: 'Foundry Agents', sub: 'Specialized AI agents', color: 'text-violet-400' },
            { v: '4', label: 'MAF Workflows', sub: 'Orchestrated pipelines', color: 'text-emerald-400' },
            { v: '7', label: 'Cosmos Containers', sub: 'Purpose-built schemas', color: 'text-sky-400' },
          ].map(({ v, label, sub, color }) => (
            <div key={label} className="stat-card flex flex-col justify-between min-h-[90px]">
              <div className={`text-3xl font-bold ${color}`}>{v}</div>
              <div>
                <div className="text-sm font-medium text-gray-200">{label}</div>
                <div className="text-xs text-gray-500">{sub}</div>
              </div>
            </div>
          ))}
          {/* Old vs AI table */}
          <div className="col-span-2 sm:col-span-4 bg-surface-50 border border-border rounded-xl overflow-hidden">
            <div className="grid grid-cols-2 text-xs">
              <div className="px-4 py-2 bg-red-900/20 border-b border-border font-medium text-red-400">Old World</div>
              <div className="px-4 py-2 bg-emerald-900/20 border-b border-border font-medium text-emerald-400 border-l border-border">AI-Augmented World</div>
              {[
                ['4-6 hrs post-meeting notes', 'Real-time transcription + CRM during meeting'],
                ['2-3 days for portfolio proposal', 'Backtested portfolio in minutes'],
                ['Weekly manual market review', 'Continuous 30-min autonomous surveillance'],
                ['Annual CPA for tax planning', 'Per-meeting tax opportunity identification'],
              ].map(([old, ai]) => (
                <React.Fragment key={old}>
                  <div className="px-4 py-2 text-gray-500 border-b border-border/50">{old}</div>
                  <div className="px-4 py-2 text-gray-300 border-b border-border/50 border-l border-border">{ai}</div>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Overall Progress ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-1.5 bg-surface-50 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-accent to-violet-500 rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <span className="text-xs text-gray-500 shrink-0">{totalStepsCompleted} / {totalSteps} steps</span>
      </div>

      {/* ── Act Tabs ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2">
        {ACTS.map((a, i) => {
          const Icon = a.Icon
          const isActive = i === actIdx
          const isDone = i < actIdx
          return (
            <button
              key={a.n}
              onClick={() => jumpAct(i)}
              className={clsx(
                'flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-all',
                isActive ? a.colors.tabActive : a.colors.tabInactive,
                isDone && !isActive && 'opacity-60'
              )}
            >
              {isDone ? <CheckCircle2 size={13} className="text-emerald-400" /> : <Icon size={13} />}
              <span className="hidden sm:inline">Act {a.n} ·</span>
              <span>{a.label}</span>
              <span className="hidden md:flex items-center gap-1 text-gray-600">
                <Clock size={10} />{a.duration}
              </span>
            </button>
          )
        })}
      </div>

      {/* ── Main 2-Column Content ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">

        {/* Left: Act overview + step list */}
        <div className="lg:col-span-1 space-y-4">
          {/* Act overview */}
          <div className={clsx('rounded-xl border p-4 space-y-2', act.colors.bg, act.colors.border)}>
            <div className="flex items-center gap-2">
              <act.Icon size={14} className={act.colors.text} />
              <span className={clsx('text-xs font-semibold', act.colors.text)}>Act {act.n}</span>
            </div>
            <div className="text-sm font-medium text-gray-100">{act.subtitle}</div>
            <p className="text-xs text-gray-400 leading-relaxed">{act.overview}</p>
            <div className="flex items-center gap-1 text-xs text-gray-500 pt-1">
              <Clock size={11} />
              <span>{act.duration}</span>
              <span className="text-border mx-1">·</span>
              <span>{act.steps.length} steps</span>
            </div>
          </div>

          {/* Step list */}
          <div className="space-y-1">
            {act.steps.map((s, i) => (
              <button
                key={s.id}
                onClick={() => jumpStep(i)}
                className={clsx(
                  'w-full flex items-start gap-3 px-3 py-2.5 rounded-lg text-left text-xs transition-colors',
                  i === stepIdx
                    ? clsx('font-medium', act.colors.bg, act.colors.border, 'border')
                    : 'text-gray-500 hover:text-gray-300 hover:bg-surface-50'
                )}
              >
                <div className={clsx('w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0 mt-0.5 font-bold',
                  i < stepIdx ? 'bg-emerald-900/50 text-emerald-400' : i === stepIdx ? clsx(act.colors.bg, act.colors.text) : 'bg-surface-50 text-gray-600'
                )}>
                  {i < stepIdx ? <CheckCircle2 size={11} /> : i + 1}
                </div>
                <span className={clsx('leading-snug', i === stepIdx ? act.colors.text : '')}>{s.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Step detail */}
        <div className="lg:col-span-3 space-y-4">

          {/* Step header */}
          <div className={clsx('border-l-4 pl-5 py-1', act.colors.border)}>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className={clsx('badge text-xs', act.colors.badge)}>Act {act.n} · Step {stepIdx + 1} of {act.steps.length}</span>
              {step.isGate && (
                <span className="badge bg-orange-900/50 text-orange-300 border border-orange-700/50">
                  HITL Gate
                </span>
              )}
            </div>
            <h3 className="text-lg font-semibold text-gray-100">{step.title}</h3>
          </div>

          {/* UI Navigation hint */}
          {step.uiNav && (
            <div className="flex items-start gap-3 px-4 py-3 bg-amber-900/20 border border-amber-600/30 rounded-xl">
              <ArrowRight size={14} className="text-amber-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs text-amber-500 font-medium uppercase tracking-wide mb-0.5">Navigate to</div>
                <div className="text-sm text-amber-200 font-medium">{step.uiNav}</div>
              </div>
            </div>
          )}

          {/* Story */}
          <div className="bg-surface-50 border border-border rounded-xl p-5">
            <p className="text-sm text-gray-300 leading-relaxed">{step.story}</p>
            {step.highlights && step.highlights.length > 0 && (
              <ul className="mt-4 space-y-2.5 border-t border-border/50 pt-4">
                {step.highlights.map((h, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-xs text-gray-400">
                    <div className={clsx('w-1.5 h-1.5 rounded-full mt-1.5 shrink-0', act.colors.dot)} />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Agent Cards */}
          {step.agents && step.agents.length > 0 && (
            <div className="space-y-2">
              {step.agents.map((a, i) => <AgentBadge key={i} agent={a} idx={i} />)}
            </div>
          )}

          {/* Output Snippet */}
          {step.outputSnippet && !execMode && (
            <div className="bg-zinc-950 border border-zinc-800/80 rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-zinc-800 bg-zinc-900/80">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                </div>
                <Terminal size={12} className="text-zinc-500 ml-1" />
                <span className="text-xs text-zinc-500 font-medium">Output / Payload</span>
                <button
                  onClick={() => setShowCode(s => !s)}
                  className="ml-auto text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  {showCode ? '▲ collapse' : '▼ expand'}
                </button>
              </div>
              <pre className={clsx(
                'text-xs font-mono leading-relaxed p-4 overflow-x-auto whitespace-pre-wrap',
                act.colors.outputText,
                !showCode && 'max-h-44 overflow-y-hidden'
              )}>
                {step.outputSnippet}
              </pre>
              {!showCode && (
                <div
                  className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-zinc-950 to-transparent pointer-events-none"
                  style={{ position: 'relative', marginTop: '-40px' }}
                />
              )}
            </div>
          )}

          {/* Gate callout */}
          {step.isGate && step.gateLabel && (
            <div className="flex items-start gap-3 px-4 py-3.5 bg-orange-900/20 border border-orange-600/30 rounded-xl">
              <AlertTriangle size={14} className="text-orange-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-semibold text-orange-300 mb-1">Human-in-the-Loop Gate</div>
                <p className="text-xs text-orange-200/90 leading-relaxed">{step.gateLabel}</p>
              </div>
            </div>
          )}

          {/* Business Point */}
          {step.businessPoint && (
            <div className="flex items-start gap-3 px-4 py-4 bg-indigo-900/20 border border-indigo-600/30 rounded-xl">
              <div className="shrink-0 px-1.5 py-0.5 rounded bg-indigo-800/60 text-indigo-300 text-xs font-bold">BIZO</div>
              <p className="text-sm text-indigo-100 leading-relaxed">{step.businessPoint}</p>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-3 border-t border-border">
            <button
              onClick={() => advance(-1)}
              disabled={isFirst}
              className="btn-secondary flex items-center gap-2 text-xs disabled:opacity-30"
            >
              <ChevronLeft size={14} />
              Previous
            </button>
            <div className="text-xs text-gray-500 text-center">
              <span className={act.colors.text}>Act {actIdx + 1}</span>
              <span className="text-gray-600"> / {ACTS.length}</span>
              <span className="text-border mx-2">·</span>
              <span>Step {stepIdx + 1} of {act.steps.length}</span>
            </div>
            <button
              onClick={() => advance(1)}
              disabled={isLast}
              className="btn-primary flex items-center gap-2 text-xs disabled:opacity-30"
            >
              {stepIdx < act.steps.length - 1 ? 'Next Step' : `Act ${actIdx + 2}`}
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Journey in Numbers (always visible at bottom) ───────────────────── */}
      <div className="border-t border-border pt-5 space-y-3">
        <div className="text-sm font-semibold text-gray-300">Sarah Chen in Numbers — Platform Impact</div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr>
                <th className="text-left px-4 py-2 bg-surface-50 border border-border text-gray-400 font-medium w-48">Step</th>
                <th className="text-left px-4 py-2 bg-red-900/10 border border-border text-red-400 font-medium">Old World</th>
                <th className="text-left px-4 py-2 bg-emerald-900/10 border border-border text-emerald-400 font-medium">AI-Augmented World</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['CRM population',        '90 minutes post-meeting',     'Real-time during meeting — zero manual input'],
                ['Recommendations draft', '2-3 hours next day',          'Surfaced before meeting ends, advisor-approved'],
                ['Portfolio proposal',    '3-5 business days',           '4-5 minutes AI + 3 HITL gates'],
                ['Tax strategy ID',       'Annual CPA, $2K-5K fee',      'Per-meeting, automated, Bing-grounded'],
                ['Pre-meeting briefing',  '1 hour morning prep',         '90-second 4-agent parallel briefing'],
                ['Portfolio surveillance','Weekly manual, 5 min/client', 'Continuous 30-min autonomous watch cycle'],
                ['Client 11pm question',  'Next business day callback',  'Answered in 2 minutes, portfolio-specific'],
                ['Compliance trail',      'Manual, error-prone',         'Automatic, immutable, machine-readable'],
              ].map(([step, old, ai], i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-surface-100/20' : ''}>
                  <td className="px-4 py-2.5 border border-border/50 text-gray-400 font-medium">{step}</td>
                  <td className="px-4 py-2.5 border border-border/50 text-red-400/80">{old}</td>
                  <td className="px-4 py-2.5 border border-border/50 text-emerald-300">{ai}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-indigo-900/20 border border-indigo-600/30 rounded-xl px-4 py-3">
            <div className="text-xl font-bold text-indigo-300">4-8 hrs</div>
            <div className="text-xs text-indigo-400">advisor time saved per client per week</div>
          </div>
          <div className="bg-emerald-900/20 border border-emerald-600/30 rounded-xl px-4 py-3">
            <div className="text-xl font-bold text-emerald-300">3-5x</div>
            <div className="text-xs text-emerald-400">book capacity multiplier per advisor</div>
          </div>
        </div>
      </div>

    </div>
  )
}
