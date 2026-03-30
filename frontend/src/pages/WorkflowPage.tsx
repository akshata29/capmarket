import { useState } from 'react'
import { X, FileCode2 } from 'lucide-react'
import clsx from 'clsx'

// ─── Types ────────────────────────────────────────────────────────────────────
type NodeType = 'start' | 'service' | 'agent' | 'gate' | 'store' | 'outcome'

interface NodeDetail {
  badge: string
  description: string
  files: string[]
  responsibilities: string[]
  technology: string[]
}

interface WFNode {
  id: string
  label: string
  sublabel?: string
  type: NodeType
  x: number
  y: number
  w: number
  h: number
  detail: NodeDetail
}

interface WFEdge {
  from: string
  to: string
  fromFx?: number
  toFx?: number
  dashed?: boolean
}

interface WorkflowDef {
  id: string
  label: string
  description: string
  canvasH: number
  nodes: WFNode[]
  edges: WFEdge[]
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const CANVAS_W = 880

const NODE_STYLE: Record<NodeType, { box: string; text: string; sub: string; dot: string; stroke: string }> = {
  start:   { box: 'bg-cyan-900/50 border-cyan-500/60',       text: 'text-cyan-100',    sub: 'text-cyan-400/70',    dot: 'bg-cyan-400',    stroke: '#22d3ee' },
  service: { box: 'bg-blue-900/40 border-blue-500/50',       text: 'text-blue-100',    sub: 'text-blue-400/70',    dot: 'bg-blue-400',    stroke: '#60a5fa' },
  agent:   { box: 'bg-violet-900/40 border-violet-500/50',   text: 'text-violet-100',  sub: 'text-violet-400/70',  dot: 'bg-violet-400',  stroke: '#a78bfa' },
  gate:    { box: 'bg-orange-900/40 border-orange-500/50',   text: 'text-orange-100',  sub: 'text-orange-400/70',  dot: 'bg-orange-400',  stroke: '#fb923c' },
  store:   { box: 'bg-indigo-900/40 border-indigo-500/50',   text: 'text-indigo-100',  sub: 'text-indigo-400/70',  dot: 'bg-indigo-400',  stroke: '#818cf8' },
  outcome: { box: 'bg-emerald-900/40 border-emerald-500/50', text: 'text-emerald-100', sub: 'text-emerald-400/70', dot: 'bg-emerald-400', stroke: '#34d399' },
}

const LEGEND_ITEMS: { type: NodeType; label: string }[] = [
  { type: 'service', label: 'Service / API' },
  { type: 'agent',   label: 'Foundry AI Agent' },
  { type: 'gate',    label: 'Human Gate' },
  { type: 'store',   label: 'Data Store' },
  { type: 'outcome', label: 'Outcome' },
]

// ─── Workflow Definitions ─────────────────────────────────────────────────────

const MEETING_WF: WorkflowDef = {
  id: 'meeting',
  label: 'Meeting Intelligence',
  description: 'Full pipeline for advisor-client meetings: pre-meeting research, live transcription, PII redaction, real-time sentiment and recommendation analysis, and post-meeting summary — with two human-in-the-loop approval gates.',
  canvasH: 1055,
  nodes: [
    {
      id: 'start', label: 'Start Workflow', sublabel: 'meeting · session trigger', type: 'start',
      x: 330, y: 30, w: 220, h: 44,
      detail: {
        badge: 'Trigger',
        description: 'Meeting workflow initiated when an advisor opens a new session via the Meetings API. A MeetingSession document is created in Cosmos DB and the workflow state initialised.',
        files: ['backend/app/routers/meetings.py', 'backend/app/models/meeting.py'],
        responsibilities: [
          'Create MeetingSession in Cosmos DB with advisor and client context',
          'Initialise MeetingWorkflowState with a unique session_id',
          'Return session_id to the frontend Meeting page',
          'Emit session_start audit event',
        ],
        technology: ['FastAPI', 'Azure Cosmos DB', 'Pydantic'],
      },
    },
    {
      id: 'pre_meeting', label: 'Pre-Meeting Prep', sublabel: 'service · advisory_workflow.py', type: 'service',
      x: 295, y: 115, w: 290, h: 54,
      detail: {
        badge: 'Service',
        description: 'Orchestrates parallel pre-meeting intelligence: news scan for client holdings, tax situation analysis, and relationship deepening ideas — aggregated into a single structured advisor briefing.',
        files: ['backend/app/orchestration/advisory_workflow.py'],
        responsibilities: [
          'Run NewsAgent, TaxAgent and AdvisoryAgent concurrently via asyncio.gather',
          'Merge results into a unified pre_meeting_briefing object',
          'Persist briefing to Cosmos DB for advisor retrieval before the meeting',
          'Log the advisory run to the audit trail',
        ],
        technology: ['asyncio', 'Azure AI Foundry', 'Azure Cosmos DB'],
      },
    },
    {
      id: 'news_pre', label: 'News Agent', sublabel: 'agent · news_agent.py', type: 'agent',
      x: 140, y: 205, w: 190, h: 54,
      detail: {
        badge: 'Foundry AI Agent',
        description: 'Scans real-time market news for the client\'s ticker symbols and investment themes. Returns tagged, sentiment-scored news items used to inform the advisor briefing.',
        files: ['backend/app/agents/news_agent.py'],
        responsibilities: [
          'Query news sources for client portfolio ticker symbols',
          'Score article sentiment per holding',
          'Tag articles with relevant investment themes',
          'Return structured news bundle for briefing aggregation',
        ],
        technology: ['Azure AI Foundry', 'Azure AI Search', 'OpenAI GPT-4o'],
      },
    },
    {
      id: 'advisory_pre', label: 'Advisory Agent', sublabel: 'agent · advisory_agent.py', type: 'agent',
      x: 550, y: 205, w: 190, h: 54,
      detail: {
        badge: 'Foundry AI Agent',
        description: 'Generates personalised advisor talking points, relationship deepening ideas, and tax strategy notes tailored to the client profile and specific meeting type.',
        files: ['backend/app/agents/advisory_agent.py', 'backend/app/agents/tax_agent.py'],
        responsibilities: [
          'Generate meeting-type-specific briefing talking points',
          'Identify relationship deepening and upsell opportunities',
          'Incorporate tax situation analysis from TaxAgent',
          'Return structured advisory guidance document',
        ],
        technology: ['Azure AI Foundry', 'OpenAI GPT-4o', 'Pydantic'],
      },
    },
    {
      id: 'meeting_gate', label: 'Meeting In Progress', sublabel: 'gate · advisor joins call', type: 'gate',
      x: 300, y: 305, w: 280, h: 54,
      detail: {
        badge: 'Human Gate',
        description: 'Advisor opens the Meeting page and joins the live session. The pre-meeting briefing is surfaced in the side panel. Audio capture begins for real-time transcription.',
        files: ['backend/app/routers/meetings.py', 'frontend/src/pages/MeetingPage.tsx'],
        responsibilities: [
          'Display pre-meeting briefing to advisor in the side panel',
          'Begin audio stream capture for Transcription Agent',
          'Record meeting_start timestamp in session state',
          'Enable the live real-time agent pipeline',
        ],
        technology: ['FastAPI', 'React', 'TailwindCSS'],
      },
    },
    {
      id: 'transcription', label: 'Transcription Agent', sublabel: 'agent · transcription_agent.py', type: 'agent',
      x: 330, y: 395, w: 220, h: 54,
      detail: {
        badge: 'Foundry AI Agent',
        description: 'Processes audio segments with speaker diarisation, identifying ADVISOR and CLIENT roles. Transcript segments are streamed in real-time to the downstream analysis pipeline.',
        files: ['backend/app/agents/transcription_agent.py'],
        responsibilities: [
          'Diarise audio into ADVISOR and CLIENT speaker segments',
          'Stream TranscriptSegment objects into workflow state',
          'Handle audio format normalisation: PCM, MP3, WebM',
          'Accumulate full_transcript in MeetingWorkflowState',
        ],
        technology: ['Azure AI Foundry', 'Azure Speech SDK', 'OpenAI Whisper'],
      },
    },
    {
      id: 'pii', label: 'PII Redaction', sublabel: 'agent · pii_agent.py', type: 'agent',
      x: 330, y: 470, w: 220, h: 54,
      detail: {
        badge: 'Foundry AI Agent',
        description: 'Scans every transcript segment for personally identifiable information and replaces sensitive entities with typed placeholders before downstream AI processing and storage.',
        files: ['backend/app/agents/pii_agent.py'],
        responsibilities: [
          'Detect PII entities: names, SSNs, account numbers, addresses, dates of birth',
          'Replace with typed placeholders e.g. [PERSON], [ACCOUNT], [SSN]',
          'Populate piied_transcript in MeetingWorkflowState',
          'Ensure GDPR and FINRA compliance on all stored transcripts',
        ],
        technology: ['Azure AI Foundry', 'Azure Presidio', 'OpenAI'],
      },
    },
    {
      id: 'sentiment', label: 'Sentiment Agent', sublabel: 'agent · sentiment_agent.py', type: 'agent',
      x: 85, y: 562, w: 185, h: 54,
      detail: {
        badge: 'Foundry AI Agent',
        description: 'Scores client sentiment from the redacted transcript in real time. Tracks confidence, anxiety, and engagement across the meeting timeline — visible in the live SentimentGauge UI component.',
        files: ['backend/app/agents/sentiment_agent.py', 'frontend/src/components/meeting/SentimentGauge.tsx'],
        responsibilities: [
          'Score sentiment per transcript segment on a continuous scale',
          'Track mood trajectory and flag emotional spikes for advisor',
          'Populate SentimentScore object in session state',
          'Drive the live SentimentGauge component in the advisor UI',
        ],
        technology: ['Azure AI Foundry', 'OpenAI GPT-4o', 'Pydantic'],
      },
    },
    {
      id: 'profile_ag', label: 'Profile Agent', sublabel: 'agent · profile_agent.py', type: 'agent',
      x: 348, y: 562, w: 185, h: 54,
      detail: {
        badge: 'Foundry AI Agent',
        description: 'Extracts structured client profile updates from the conversation: new goals, life events, risk preference changes, and asset mentions to enrich the Cosmos DB client record.',
        files: ['backend/app/agents/profile_agent.py'],
        responsibilities: [
          'Extract goals, life events, and risk preference changes',
          'Produce a structured profile_extractions delta document',
          'Queue enrichments for post-meeting client profile persistence',
          'Preserve source quote attribution for compliance audit',
        ],
        technology: ['Azure AI Foundry', 'OpenAI GPT-4o', 'Pydantic'],
      },
    },
    {
      id: 'rec_ag', label: 'Recommendation Agent', sublabel: 'agent · recommendation_agent.py', type: 'agent',
      x: 610, y: 562, w: 185, h: 54,
      detail: {
        badge: 'Foundry AI Agent',
        description: 'Generates real-time investment recommendations grounded in the live conversation, client profile, and current market regime. Queued for advisor approval before any client presentation.',
        files: ['backend/app/agents/recommendation_agent.py'],
        responsibilities: [
          'Generate investment and product recommendations from conversation context',
          'Attach rationale and risk flags to each recommendation',
          'Queue recommendations for GATE-1 advisor approval',
          'Cross-reference market regime and client mandate constraints',
        ],
        technology: ['Azure AI Foundry', 'OpenAI GPT-4o', 'Azure Cosmos DB'],
      },
    },
    {
      id: 'gate1', label: 'GATE-1 · Recommendation Review', sublabel: 'human in the loop', type: 'gate',
      x: 215, y: 658, w: 450, h: 56,
      detail: {
        badge: 'Human Gate',
        description: 'Advisor reviews AI-generated recommendations in the Recommendation Feed before presenting to the client. Each recommendation can be approved, amended, or rejected. Workflow is blocked until resolved.',
        files: ['backend/app/routers/meetings.py', 'frontend/src/components/meeting/RecommendationFeed.tsx'],
        responsibilities: [
          'Block workflow pending explicit advisor decision on recommendations',
          'Expose approve / amend / reject actions per recommendation item',
          'Persist approved_recommendations to MeetingWorkflowState',
          'Log gate decision with advisor_id and timestamp for audit',
        ],
        technology: ['FastAPI', 'React', 'Azure Cosmos DB'],
      },
    },
    {
      id: 'summary', label: 'Summary Agent', sublabel: 'agent · summary_agent.py', type: 'agent',
      x: 330, y: 752, w: 220, h: 54,
      detail: {
        badge: 'Foundry AI Agent',
        description: 'Generates a structured post-meeting summary: key decisions, agreed actions, sentiment trajectory, approved recommendations, and follow-up tasks — formatted for compliance archival.',
        files: ['backend/app/agents/summary_agent.py'],
        responsibilities: [
          'Summarise the full meeting transcript into key discussion points',
          'List all agreed actions and follow-up items with owners',
          'Embed sentiment trajectory and approval gate decisions',
          'Format output for long-term compliance storage and retrieval',
        ],
        technology: ['Azure AI Foundry', 'OpenAI GPT-4o', 'Pydantic'],
      },
    },
    {
      id: 'gate2', label: 'GATE-2 · Summary Review', sublabel: 'human in the loop', type: 'gate',
      x: 240, y: 848, w: 400, h: 56,
      detail: {
        badge: 'Human Gate',
        description: 'Advisor reviews and optionally edits the AI-generated meeting summary. Approval triggers final Cosmos DB persistence, locking the meeting record for compliance auditing.',
        files: ['backend/app/routers/meetings.py', 'frontend/src/pages/MeetingPage.tsx'],
        responsibilities: [
          'Present summary for inline advisor review and editing',
          'Block final persistence until advisor explicitly approves',
          'Record advisor amendments and approval time for audit trail',
          'Trigger Cosmos DB upsert on confirmation',
        ],
        technology: ['FastAPI', 'React', 'Azure Cosmos DB'],
      },
    },
    {
      id: 'cosmos_meet', label: 'Cosmos DB · Persist', sublabel: 'store · cosmos_store.py', type: 'store',
      x: 315, y: 952, w: 250, h: 54,
      detail: {
        badge: 'Data Store',
        description: 'Final persistence of the completed meeting: full and PII-redacted transcripts, sentiment data, approved recommendations, advisor-reviewed summary, and complete agent audit trail.',
        files: ['backend/app/persistence/cosmos_store.py', 'backend/app/models/meeting.py', 'backend/app/models/audit.py'],
        responsibilities: [
          'Upsert completed MeetingSession document with all fields',
          'Write AuditEntry records covering all agent actions and gates',
          'Update client profile record with extracted enrichments',
          'Index meeting summary text in Azure AI Search for retrieval',
        ],
        technology: ['Azure Cosmos DB', 'Azure AI Search', 'Python SDK'],
      },
    },
  ],
  edges: [
    { from: 'start',         to: 'pre_meeting' },
    { from: 'pre_meeting',   to: 'news_pre',      fromFx: 0.3 },
    { from: 'pre_meeting',   to: 'advisory_pre',  fromFx: 0.7 },
    { from: 'news_pre',      to: 'meeting_gate',  toFx: 0.3 },
    { from: 'advisory_pre',  to: 'meeting_gate',  toFx: 0.7 },
    { from: 'meeting_gate',  to: 'transcription' },
    { from: 'transcription', to: 'pii' },
    { from: 'pii',           to: 'sentiment',     fromFx: 0.2 },
    { from: 'pii',           to: 'profile_ag',    fromFx: 0.5 },
    { from: 'pii',           to: 'rec_ag',        fromFx: 0.8 },
    { from: 'sentiment',     to: 'gate1',         toFx: 0.08 },
    { from: 'profile_ag',    to: 'gate1',         toFx: 0.5 },
    { from: 'rec_ag',        to: 'gate1',         toFx: 0.92 },
    { from: 'gate1',         to: 'summary' },
    { from: 'summary',       to: 'gate2' },
    { from: 'gate2',         to: 'cosmos_meet' },
  ],
}

const PORTFOLIO_WF: WorkflowDef = {
  id: 'portfolio',
  label: 'Portfolio Intelligence',
  description: 'End-to-end Sense → Think → Act pipeline: news-driven theme discovery, universe mapping, parallel fundamental and technical analysis, portfolio construction, backtesting, risk assessment, and rebalancing — with three human-in-the-loop approval checkpoints.',
  canvasH: 1060,
  nodes: [
    {
      id: 'p_start', label: 'Start Workflow', sublabel: 'portfolio · build trigger', type: 'start',
      x: 330, y: 30, w: 220, h: 44,
      detail: {
        badge: 'Trigger',
        description: 'Portfolio construction workflow triggered by an advisor from the Portfolio page, providing a client mandate and investment amount to guide the entire pipeline.',
        files: ['backend/app/routers/portfolio.py', 'backend/app/orchestration/portfolio_workflow.py'],
        responsibilities: [
          'Validate advisor and client context from request payload',
          'Create PortfolioWorkflowState with a unique run_id',
          'Persist initial pending state to Cosmos DB',
          'Emit run_start audit event and begin Sense phase',
        ],
        technology: ['FastAPI', 'Azure Cosmos DB', 'Pydantic'],
      },
    },
    {
      id: 'news_port', label: 'News Agent', sublabel: 'agent · news_agent.py', type: 'agent',
      x: 148, y: 118, w: 190, h: 54,
      detail: {
        badge: 'Foundry AI Agent',
        description: 'Scans current market news, macro events, and sector narratives to surface investment themes relevant to the advisor\'s client mandate and the current market environment.',
        files: ['backend/app/agents/news_agent.py'],
        responsibilities: [
          'Retrieve macro and sector-level market news',
          'Extract thematic investment signals from headlines',
          'Score news items by investment relevance and conviction',
          'Return structured market_news bundle to workflow state',
        ],
        technology: ['Azure AI Foundry', 'Azure AI Search', 'OpenAI GPT-4o'],
      },
    },
    {
      id: 'market_svc', label: 'Market Data Service', sublabel: 'service · market feeds', type: 'service',
      x: 542, y: 118, w: 190, h: 54,
      detail: {
        badge: 'Service',
        description: 'Supplies real-time and historical market data: prices, volatility metrics, sector performance, and macro indicators used for theme scoring and analysis agent inputs.',
        files: ['backend/app/routers/portfolio.py'],
        responsibilities: [
          'Retrieve current market prices and volatility metrics',
          'Supply sector performance and factor return data',
          'Provide macroeconomic indicator snapshots',
          'Feed structured data to Theme Extraction and Analysis agents',
        ],
        technology: ['FastAPI', 'yfinance', 'Azure Cosmos DB'],
      },
    },
    {
      id: 'theme_extract', label: 'Theme Extraction', sublabel: 'agent · portfolio_agent.py', type: 'agent',
      x: 310, y: 215, w: 260, h: 54,
      detail: {
        badge: 'Foundry AI Agent',
        description: 'Synthesises market news and live data to extract scored investment themes — e.g. "AI Infrastructure", "Clean Energy" — with confidence scores and supporting narrative evidence.',
        files: ['backend/app/agents/portfolio_agent.py'],
        responsibilities: [
          'Fuse news signals and market data into thematic candidates',
          'Generate scored investment themes with conviction levels',
          'Attach evidence narratives and risk caveats to each theme',
          'Store themes list in PortfolioWorkflowState for gate review',
        ],
        technology: ['Azure AI Foundry', 'OpenAI GPT-4o', 'Pydantic'],
      },
    },
    {
      id: 'gate_theme', label: 'GATE-1 · Theme Activation', sublabel: 'human in the loop', type: 'gate',
      x: 215, y: 302, w: 450, h: 56,
      detail: {
        badge: 'Human Gate',
        description: 'Advisor reviews AI-extracted investment themes and activates the ones most aligned with the client mandate. Deactivated themes are excluded from the universe mapping step.',
        files: ['backend/app/routers/portfolio.py', 'frontend/src/pages/PortfolioPage.tsx'],
        responsibilities: [
          'Present themes with confidence scores and evidence to advisor',
          'Block workflow until advisor activates a theme subset',
          'Persist activated_themes list to PortfolioWorkflowState',
          'Log gate decision and activated theme IDs for audit',
        ],
        technology: ['FastAPI', 'React', 'Azure Cosmos DB'],
      },
    },
    {
      id: 'universe_map', label: 'Universe Mapping', sublabel: 'agent · portfolio_agent.py', type: 'agent',
      x: 310, y: 392, w: 260, h: 54,
      detail: {
        badge: 'Foundry AI Agent',
        description: 'Maps activated themes to a concrete investable universe of securities. Filters by liquidity, mandate constraints, ESG scores, and sector diversification requirements.',
        files: ['backend/app/agents/portfolio_agent.py'],
        responsibilities: [
          'Map activated themes to eligible ticker universe',
          'Apply mandate, liquidity, and ESG constraint filters',
          'Produce a ranked candidate security list',
          'Persist filtered universe to PortfolioWorkflowState',
        ],
        technology: ['Azure AI Foundry', 'OpenAI GPT-4o', 'yfinance'],
      },
    },
    {
      id: 'fundamentals', label: 'Fundamentals Analysis', sublabel: 'service · parallel branch', type: 'service',
      x: 140, y: 480, w: 200, h: 54,
      detail: {
        badge: 'Service',
        description: 'Evaluates fundamental quality metrics for each security in the universe: revenue growth, profit margins, valuation multiples, debt levels, and earnings quality. Runs in parallel with Technical Analysis.',
        files: ['backend/app/agents/portfolio_agent.py'],
        responsibilities: [
          'Compute fundamental quality scores per security',
          'Evaluate valuation, growth, and profitability metrics',
          'Flag concentration and sector overweight risks',
          'Return fundamental_scores dict to PortfolioWorkflowState',
        ],
        technology: ['Azure AI Foundry', 'yfinance', 'OpenAI GPT-4o'],
      },
    },
    {
      id: 'technicals', label: 'Technical Analysis', sublabel: 'service · parallel branch', type: 'service',
      x: 540, y: 480, w: 200, h: 54,
      detail: {
        badge: 'Service',
        description: 'Analyses momentum, trend, and volatility signals for all universe securities. Computes RSI, moving average crossovers, and relative strength. Runs in parallel with Fundamentals Analysis.',
        files: ['backend/app/agents/portfolio_agent.py'],
        responsibilities: [
          'Compute momentum and trend indicators per security',
          'Calculate volatility-adjusted relative returns',
          'Score relative strength vs sector benchmarks',
          'Return technical_scores dict to PortfolioWorkflowState',
        ],
        technology: ['Azure AI Foundry', 'pandas-ta', 'yfinance'],
      },
    },
    {
      id: 'portfolio_cx', label: 'Portfolio Construction', sublabel: 'agent · portfolio_agent.py', type: 'agent',
      x: 295, y: 577, w: 290, h: 54,
      detail: {
        badge: 'Foundry AI Agent',
        description: 'Combines fundamental and technical scores with mandate constraints to allocate weights across the universe using a mean-variance optimisation framework. Produces the portfolio_proposal for advisor review.',
        files: ['backend/app/agents/portfolio_agent.py'],
        responsibilities: [
          'Run mean-variance or risk-parity optimisation over scored universe',
          'Enforce mandate constraints: max position size, sector limits',
          'Generate portfolio_proposal with allocations and rationale narrative',
          'Stage proposal for GATE-2 advisor approval review',
        ],
        technology: ['Azure AI Foundry', 'cvxpy', 'OpenAI GPT-4o', 'scipy'],
      },
    },
    {
      id: 'gate_port', label: 'GATE-2 · Portfolio Approval', sublabel: 'human in the loop', type: 'gate',
      x: 215, y: 665, w: 450, h: 56,
      detail: {
        badge: 'Human Gate',
        description: 'Advisor reviews the proposed portfolio allocation — weights, rationale, and risk breakdown. Approval unlocks the Act phase. Rejection with guidance notes loops back to Portfolio Construction.',
        files: ['backend/app/routers/portfolio.py', 'frontend/src/pages/PortfolioPage.tsx'],
        responsibilities: [
          'Display portfolio proposal with full allocation rationale',
          'Block Act phase until explicit advisor approval',
          'Capture approval_notes for compliance audit trail',
          'Support reject-with-guidance loop to Portfolio Construction',
        ],
        technology: ['FastAPI', 'React', 'Azure Cosmos DB'],
      },
    },
    {
      id: 'backtest', label: 'Backtesting Agent', sublabel: 'agent · backtesting_agent.py', type: 'agent',
      x: 140, y: 758, w: 200, h: 54,
      detail: {
        badge: 'Foundry AI Agent',
        description: 'Runs a vectorised historical backtest of the approved portfolio over configurable horizons. Outputs Sharpe ratio, max drawdown, CAGR, and comparison vs benchmark index.',
        files: ['backend/app/agents/backtesting_agent.py'],
        responsibilities: [
          'Run backtest over 1Y, 3Y, and 5Y horizons',
          'Compute Sharpe ratio, CAGR, and max drawdown metrics',
          'Compare performance against standard benchmarks (SPY, AGG)',
          'Return backtest_result dict to PortfolioWorkflowState',
        ],
        technology: ['Azure AI Foundry', 'quantstats', 'yfinance'],
      },
    },
    {
      id: 'risk_adv', label: 'Risk Advisory Agent', sublabel: 'agent · risk_advisory_agent.py', type: 'agent',
      x: 540, y: 758, w: 200, h: 54,
      detail: {
        badge: 'Foundry AI Agent',
        description: 'Assesses portfolio risk against the client\'s risk mandate: VaR computation, macro stress tests, concentration analysis, and ESG compliance scoring.',
        files: ['backend/app/agents/risk_advisory_agent.py'],
        responsibilities: [
          'Compute portfolio VaR and CVaR at 95% and 99% confidence',
          'Run macro stress test scenarios (recession, rate shock, etc.)',
          'Check concentration limits and ESG mandate compliance',
          'Flag deviations and return advisory risk report',
        ],
        technology: ['Azure AI Foundry', 'OpenAI GPT-4o', 'scipy'],
      },
    },
    {
      id: 'rebalance', label: 'Rebalance Agent', sublabel: 'agent · rebalance_agent.py', type: 'agent',
      x: 305, y: 855, w: 270, h: 54,
      detail: {
        badge: 'Foundry AI Agent',
        description: 'Translates the approved portfolio construction into an actionable trade list: buy/sell orders with quantities, tax-loss harvesting opportunities, and estimated transaction costs.',
        files: ['backend/app/agents/rebalance_agent.py'],
        responsibilities: [
          'Diff target vs current holdings to produce the trade list',
          'Identify tax-loss harvesting opportunities in the current portfolio',
          'Estimate transaction costs and expected market impact',
          'Generate rebalance_report for GATE-3 trade execution review',
        ],
        technology: ['Azure AI Foundry', 'OpenAI GPT-4o', 'Pydantic'],
      },
    },
    {
      id: 'gate_exec', label: 'GATE-3 · Trade Execution', sublabel: 'human in the loop', type: 'gate',
      x: 215, y: 948, w: 450, h: 56,
      detail: {
        badge: 'Human Gate',
        description: 'Final approval gate before trades are executed. Advisor reviews the trade list, cost estimates, and risk advisory report. Approval triggers persistence and downstream execution signal.',
        files: ['backend/app/routers/portfolio.py', 'frontend/src/pages/RebalancePage.tsx'],
        responsibilities: [
          'Display full trade list with cost and tax impact breakdown',
          'Require explicit advisor confirmation per trade or in bulk',
          'Block execution signals until gate is cleared',
          'Emit trade_approved audit event and persist final state',
        ],
        technology: ['FastAPI', 'React', 'Azure Cosmos DB'],
      },
    },
  ],
  edges: [
    { from: 'p_start',      to: 'news_port',     fromFx: 0.35 },
    { from: 'p_start',      to: 'market_svc',    fromFx: 0.65 },
    { from: 'news_port',    to: 'theme_extract',  toFx: 0.35 },
    { from: 'market_svc',   to: 'theme_extract',  toFx: 0.65 },
    { from: 'theme_extract', to: 'gate_theme' },
    { from: 'gate_theme',   to: 'universe_map' },
    { from: 'universe_map', to: 'fundamentals',  fromFx: 0.3 },
    { from: 'universe_map', to: 'technicals',    fromFx: 0.7 },
    { from: 'fundamentals', to: 'portfolio_cx',  toFx: 0.25 },
    { from: 'technicals',   to: 'portfolio_cx',  toFx: 0.75 },
    { from: 'portfolio_cx', to: 'gate_port' },
    { from: 'gate_port',    to: 'backtest',      fromFx: 0.25 },
    { from: 'gate_port',    to: 'risk_adv',      fromFx: 0.75 },
    { from: 'backtest',     to: 'rebalance',     toFx: 0.3 },
    { from: 'risk_adv',     to: 'rebalance',     toFx: 0.7 },
    { from: 'rebalance',    to: 'gate_exec' },
  ],
}

const ADVISORY_WF: WorkflowDef = {
  id: 'advisory',
  label: 'Advisory Intelligence',
  description: 'On-demand or scheduled pre-meeting preparation: news scan, tax situation analysis, and relationship deepening ideas run in parallel and aggregated into a unified advisor briefing persisted in Cosmos DB.',
  canvasH: 515,
  nodes: [
    {
      id: 'a_start', label: 'Start Workflow', sublabel: 'advisory · on-demand or scheduled', type: 'start',
      x: 330, y: 30, w: 220, h: 44,
      detail: {
        badge: 'Trigger',
        description: 'Advisory workflow triggered on-demand before a client meeting, or on a nightly schedule for all upcoming meetings. Runs independently of the live meeting pipeline.',
        files: ['backend/app/orchestration/advisory_workflow.py', 'backend/app/routers/advisory.py'],
        responsibilities: [
          'Accept advisor_id and client_profile as input payload',
          'Initialise advisory_id UUID to track this specific run',
          'Dispatch three parallel agent coroutines via asyncio.gather',
          'Route merged output to Cosmos DB and advisory router',
        ],
        technology: ['FastAPI', 'asyncio', 'Azure AI Foundry'],
      },
    },
    {
      id: 'news_adv', label: 'News Agent', sublabel: 'agent · news_agent.py', type: 'agent',
      x: 80, y: 128, w: 185, h: 54,
      detail: {
        badge: 'Foundry AI Agent',
        description: 'Performs a targeted daily news scan for the client\'s portfolio tickers and investment themes. Feeds structured, sentiment-scored news data into the briefing aggregator.',
        files: ['backend/app/agents/news_agent.py'],
        responsibilities: [
          'Execute run_daily_scan for all client ticker symbols',
          'Tag articles with portfolio-relevant investment themes',
          'Score news item sentiment per holding',
          'Return structured news bundle for aggregation step',
        ],
        technology: ['Azure AI Foundry', 'Azure AI Search', 'OpenAI GPT-4o'],
      },
    },
    {
      id: 'tax_adv', label: 'Tax Agent', sublabel: 'agent · tax_agent.py', type: 'agent',
      x: 348, y: 128, w: 185, h: 54,
      detail: {
        badge: 'Foundry AI Agent',
        description: 'Analyses the client\'s current tax situation: unrealised gains and losses, year-to-date realised returns, estimated tax liability, and tax-loss harvesting candidates.',
        files: ['backend/app/agents/tax_agent.py'],
        responsibilities: [
          'Compute unrealised gains and losses per portfolio holding',
          'Identify near-term tax-loss harvesting candidates',
          'Estimate current year tax liability from realised events',
          'Generate structured tax advisory notes for the briefing',
        ],
        technology: ['Azure AI Foundry', 'OpenAI GPT-4o', 'Pydantic'],
      },
    },
    {
      id: 'adv_agent', label: 'Advisory Agent', sublabel: 'agent · advisory_agent.py', type: 'agent',
      x: 615, y: 128, w: 185, h: 54,
      detail: {
        badge: 'Foundry AI Agent',
        description: 'Generates personalised advisor talking points, relationship deepening ideas, and white-space opportunity identification — informed by the full client profile and recent interaction history.',
        files: ['backend/app/agents/advisory_agent.py'],
        responsibilities: [
          'Prepare meeting-type-specific talking points for the advisor',
          'Identify upsell and relationship deepening opportunities',
          'Generate relationship health assessment',
          'Return structured advisory guidance payload',
        ],
        technology: ['Azure AI Foundry', 'OpenAI GPT-4o', 'Pydantic'],
      },
    },
    {
      id: 'briefing_agg', label: 'Briefing Aggregation', sublabel: 'service · advisory_workflow.py', type: 'service',
      x: 295, y: 232, w: 290, h: 54,
      detail: {
        badge: 'Service',
        description: 'Awaits all three parallel agent futures and merges their outputs into a single structured advisor briefing with sections for market news, tax insights, and relationship intelligence.',
        files: ['backend/app/orchestration/advisory_workflow.py'],
        responsibilities: [
          'Await all three asyncio coroutines via asyncio.gather',
          'Merge news, tax and advisory outputs into unified briefing schema',
          'Attach advisory_id and freshness timestamp to the document',
          'Pass merged briefing to the Cosmos DB persistence layer',
        ],
        technology: ['asyncio', 'Pydantic', 'Python'],
      },
    },
    {
      id: 'cosmos_adv', label: 'Cosmos DB · Persist', sublabel: 'store · cosmos_store.py', type: 'store',
      x: 315, y: 330, w: 250, h: 54,
      detail: {
        badge: 'Data Store',
        description: 'Stores the completed advisory briefing in Cosmos DB for retrieval from the Advisory AI page and automatic injection as the pre-meeting side panel in the Meeting UI.',
        files: ['backend/app/persistence/cosmos_store.py'],
        responsibilities: [
          'Upsert advisory briefing document keyed by advisor_id',
          'Write advisory_run audit event with run metadata',
          'Expose briefing via the advisory GET endpoint',
          'Apply 7-day TTL to auto-expire stale briefings',
        ],
        technology: ['Azure Cosmos DB', 'Python SDK'],
      },
    },
    {
      id: 'adv_outcome', label: 'Briefing Available', sublabel: 'outcome · advisory page + meeting UI', type: 'outcome',
      x: 305, y: 428, w: 270, h: 44,
      detail: {
        badge: 'Outcome',
        description: 'The completed advisory briefing is surfaced on the Advisory AI page and automatically pre-loaded into the meeting side panel when the advisor starts a client session.',
        files: ['frontend/src/pages/AdvisoryPage.tsx', 'frontend/src/pages/MeetingPage.tsx'],
        responsibilities: [
          'Display briefing sections in AdvisoryPage card layout',
          'Pre-load briefing into the meeting pre-meeting panel component',
          'Allow advisor to annotate and dismiss individual sections',
          'Show briefing freshness timestamp and expiry indicator',
        ],
        technology: ['React', 'TailwindCSS', 'REST API'],
      },
    },
  ],
  edges: [
    { from: 'a_start',      to: 'news_adv',      fromFx: 0.25 },
    { from: 'a_start',      to: 'tax_adv',       fromFx: 0.5 },
    { from: 'a_start',      to: 'adv_agent',     fromFx: 0.75 },
    { from: 'news_adv',     to: 'briefing_agg',  toFx: 0.2 },
    { from: 'tax_adv',      to: 'briefing_agg',  toFx: 0.5 },
    { from: 'adv_agent',    to: 'briefing_agg',  toFx: 0.8 },
    { from: 'briefing_agg', to: 'cosmos_adv' },
    { from: 'cosmos_adv',   to: 'adv_outcome' },
  ],
}

const CLIENT_SERVICE_WF: WorkflowDef = {
  id: 'client_service',
  label: 'Client Service',
  description: '24/7 client-service workflow: natural language query processing by the Communication Agent, escalation routing, advisor alerting for complex requests, conversation persistence, and full compliance audit logging.',
  canvasH: 640,
  nodes: [
    {
      id: 'cs_start', label: 'Client Query Received', sublabel: 'trigger · client_assistant.py', type: 'start',
      x: 305, y: 30, w: 270, h: 44,
      detail: {
        badge: 'Trigger',
        description: 'A client or advisor submits a natural language query to the Client Assistant endpoint. The workflow is initialised with a unique turn_id tied to the client and advisor context.',
        files: ['backend/app/routers/client_assistant.py'],
        responsibilities: [
          'Accept query with client_id and advisor_id context fields',
          'Generate a unique turn_id for this interaction',
          'Fetch client_profile and portfolio_snapshot from Cosmos DB',
          'Route to ClientServiceWorkflow handler for processing',
        ],
        technology: ['FastAPI', 'Azure Cosmos DB', 'Pydantic'],
      },
    },
    {
      id: 'cs_history', label: 'Load Conversation History', sublabel: 'store · cosmos_store.py', type: 'store',
      x: 305, y: 118, w: 270, h: 54,
      detail: {
        badge: 'Data Store',
        description: 'Retrieves the last 10 conversation turns for the client from Cosmos DB, providing the Communication Agent with full context for coherent multi-turn interaction.',
        files: ['backend/app/persistence/cosmos_store.py'],
        responsibilities: [
          'Query conversation_history container by client_id',
          'Return last 10 turns ordered by timestamp descending',
          'Supply history as context window to Communication Agent',
          'Handle first-turn empty history gracefully without error',
        ],
        technology: ['Azure Cosmos DB', 'Python SDK'],
      },
    },
    {
      id: 'comm_ag', label: 'Communication Agent', sublabel: 'agent · communication_agent.py', type: 'agent',
      x: 305, y: 208, w: 270, h: 54,
      detail: {
        badge: 'Foundry AI Agent',
        description: 'The 24/7 virtual team-member. Answers portfolio and performance queries, surfaces market news, handles document requests, schedules advisor callbacks, and escalates when required.',
        files: ['backend/app/agents/communication_agent.py', 'backend/app/orchestration/client_service_workflow.py'],
        responsibilities: [
          'Generate contextual response using profile, portfolio, and history',
          'Classify response type: information / action / escalation',
          'Detect escalation triggers and set escalate_to_advisor flag',
          'Return structured response with response_type and escalation metadata',
        ],
        technology: ['Azure AI Foundry', 'OpenAI GPT-4o', 'Pydantic'],
      },
    },
    {
      id: 'escalate_gate', label: 'Escalation Check', sublabel: 'gate · workflow decision point', type: 'gate',
      x: 285, y: 300, w: 310, h: 54,
      detail: {
        badge: 'Decision Gate',
        description: 'Evaluates the Communication Agent\'s escalate_to_advisor flag. If set, the Advisor Alert branch is triggered. Otherwise the response flows directly to persistence and delivery.',
        files: ['backend/app/orchestration/client_service_workflow.py'],
        responsibilities: [
          'Evaluate escalate_to_advisor flag from agent response object',
          'Route to Advisor Alert service branch if escalation triggered',
          'Route to direct response branch for standard queries',
          'Log routing decision and escalation reason for audit',
        ],
        technology: ['Python', 'asyncio'],
      },
    },
    {
      id: 'advisor_alert', label: 'Advisor Alert', sublabel: 'service · escalation path', type: 'service',
      x: 108, y: 398, w: 200, h: 54,
      detail: {
        badge: 'Service',
        description: 'Creates a structured advisor alert notification with the original query, escalation reason, and full client context. Advisors receive the alert on their dashboard and can join the conversation.',
        files: ['backend/app/orchestration/client_service_workflow.py'],
        responsibilities: [
          'Build advisor_alert document with query and escalation context',
          'Persist alert to Cosmos DB under advisor_id namespace',
          'Log escalation event with reason to compliance audit trail',
          'Tag the conversation turn with escalation metadata',
        ],
        technology: ['Azure Cosmos DB', 'FastAPI', 'Python'],
      },
    },
    {
      id: 'direct_resp', label: 'Direct Response', sublabel: 'outcome · non-escalation path', type: 'outcome',
      x: 572, y: 398, w: 200, h: 54,
      detail: {
        badge: 'Outcome',
        description: 'The agent\'s direct response is returned to the client or advisor via the API. Includes the answer text, response type classification, and any actionable follow-up items.',
        files: ['backend/app/routers/client_assistant.py', 'frontend/src/pages/ClientAssistantPage.tsx'],
        responsibilities: [
          'Return structured response with answer and response_type fields',
          'Render response in the ClientAssistantPage chat UI',
          'Display action items, document links, and follow-ups if present',
          'Update conversation history cache for next turn context',
        ],
        technology: ['FastAPI', 'React', 'TailwindCSS'],
      },
    },
    {
      id: 'persist_conv', label: 'Persist Conversation Turn', sublabel: 'store · cosmos_store.py', type: 'store',
      x: 295, y: 498, w: 290, h: 54,
      detail: {
        badge: 'Data Store',
        description: 'Persists the full conversation turn — query, agent response, escalation flag, and response type — to the Cosmos DB conversation_history container for continuity and compliance.',
        files: ['backend/app/persistence/cosmos_store.py', 'backend/app/orchestration/client_service_workflow.py'],
        responsibilities: [
          'Upsert conversation turn document keyed by turn_id',
          'Write ClientServiceInteraction audit entry for compliance',
          'Maintain rolling 90-day conversation history window',
          'Link turn record to escalation data if applicable',
        ],
        technology: ['Azure Cosmos DB', 'Azure AI Search', 'Python SDK'],
      },
    },
    {
      id: 'cs_outcome', label: 'Interaction Complete', sublabel: 'outcome · audit logged', type: 'outcome',
      x: 305, y: 570, w: 270, h: 44,
      detail: {
        badge: 'Outcome',
        description: 'The interaction is complete. Response delivered, conversation persisted, and audit trail updated. This turn is now available as context window history for the next client query.',
        files: ['backend/app/models/audit.py'],
        responsibilities: [
          'Confirm response delivery to client or advisor interface',
          'Verify Cosmos DB persistence success status',
          'Emit client_service_complete audit event',
          'Increment turn counter and update session interaction metrics',
        ],
        technology: ['FastAPI', 'Azure Cosmos DB', 'structlog'],
      },
    },
  ],
  edges: [
    { from: 'cs_start',      to: 'cs_history' },
    { from: 'cs_history',    to: 'comm_ag' },
    { from: 'comm_ag',       to: 'escalate_gate' },
    { from: 'escalate_gate', to: 'advisor_alert', fromFx: 0.2,  dashed: true },
    { from: 'escalate_gate', to: 'direct_resp',   fromFx: 0.8 },
    { from: 'advisor_alert', to: 'persist_conv',  toFx: 0.2 },
    { from: 'direct_resp',   to: 'persist_conv',  toFx: 0.8 },
    { from: 'persist_conv',  to: 'cs_outcome' },
  ],
}

const WORKFLOWS: WorkflowDef[] = [MEETING_WF, PORTFOLIO_WF, ADVISORY_WF, CLIENT_SERVICE_WF]

// ─── Helper: SVG edge path ─────────────────────────────────────────────────────
function edgePath(nodes: WFNode[], edge: WFEdge): string {
  const f = nodes.find(n => n.id === edge.from)!
  const t = nodes.find(n => n.id === edge.to)!
  const x1 = f.x + f.w * (edge.fromFx ?? 0.5)
  const y1 = f.y + f.h
  const x2 = t.x + t.w * (edge.toFx ?? 0.5)
  const y2 = t.y
  const mid = (y1 + y2) / 2
  return `M ${x1} ${y1} C ${x1} ${mid}, ${x2} ${mid}, ${x2} ${y2}`
}

function edgeStroke(nodes: WFNode[], edge: WFEdge): string {
  const f = nodes.find(n => n.id === edge.from)
  return f ? NODE_STYLE[f.type].stroke : '#4b5563'
}

// ─── NodeBox ──────────────────────────────────────────────────────────────────
function NodeBox({ node, isSelected, onClick }: {
  node: WFNode
  isSelected: boolean
  onClick: (n: WFNode) => void
}) {
  const s = NODE_STYLE[node.type]
  return (
    <g transform={`translate(${node.x}, ${node.y})`}>
      <foreignObject x={0} y={0} width={node.w} height={node.h}>
        <div
          onClick={() => onClick(node)}
          className={clsx(
            'w-full h-full rounded-xl border px-3 flex flex-col justify-center cursor-pointer transition-all select-none',
            s.box,
            isSelected && 'brightness-125',
          )}
          style={{
            boxSizing: 'border-box',
            borderColor: isSelected ? 'rgba(255,255,255,0.45)' : undefined,
          }}
        >
          <div className={clsx('text-[13px] font-semibold leading-tight truncate', s.text)}>
            {node.label}
          </div>
          {node.sublabel && (
            <div className={clsx('text-[10px] mt-0.5 truncate font-mono', s.sub)}>
              {node.sublabel}
            </div>
          )}
        </div>
      </foreignObject>
    </g>
  )
}

// ─── DetailPanel ──────────────────────────────────────────────────────────────
function DetailPanel({ node, onClose }: { node: WFNode | null; onClose: () => void }) {
  if (!node) return null
  const d = node.detail
  const s = NODE_STYLE[node.type]

  return (
    <div className="w-[340px] shrink-0 border-l border-border flex flex-col overflow-hidden bg-surface-100">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-border">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <span className={clsx('text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border', s.box, s.sub)}>
              {d.badge}
            </span>
            <div className="text-[15px] font-semibold text-gray-100 mt-2 leading-snug">{node.label}</div>
            {node.sublabel && (
              <div className="text-[11px] text-gray-500 font-mono mt-0.5">{node.sublabel}</div>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-surface-50 rounded-lg transition-colors shrink-0 mt-0.5"
          >
            <X size={15} className="text-gray-400" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        <p className="text-[13px] text-gray-400 leading-relaxed">{d.description}</p>

        {d.files.length > 0 && (
          <section>
            <div className="text-[9px] font-bold uppercase tracking-widest text-gray-600 mb-2 flex items-center gap-1.5">
              <FileCode2 size={11} />
              Source Files
            </div>
            <div className="space-y-1.5">
              {d.files.map(f => (
                <div key={f} className="flex items-center gap-2 bg-surface-50 border border-border rounded-lg px-3 py-2">
                  <div className={clsx('w-1.5 h-1.5 rounded-full shrink-0', s.dot)} />
                  <code className="text-[11px] text-gray-300 font-mono truncate">{f}</code>
                </div>
              ))}
            </div>
          </section>
        )}

        {d.responsibilities.length > 0 && (
          <section>
            <div className="text-[9px] font-bold uppercase tracking-widest text-gray-600 mb-2">
              Responsibilities
            </div>
            <ul className="space-y-2">
              {d.responsibilities.map((r, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className={clsx('w-1 h-1 rounded-full mt-1.5 shrink-0', s.dot)} />
                  <span className="text-[12px] text-gray-400 leading-relaxed">{r}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {d.technology.length > 0 && (
          <section>
            <div className="text-[9px] font-bold uppercase tracking-widest text-gray-600 mb-2">
              Technology
            </div>
            <div className="flex flex-wrap gap-1.5">
              {d.technology.map(t => (
                <span key={t} className="text-[11px] px-2.5 py-1 rounded-md bg-surface-50 border border-border text-gray-400 font-mono">
                  {t}
                </span>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

// ─── WorkflowCanvas ───────────────────────────────────────────────────────────
function WorkflowCanvas({ wf, selectedId, onSelect }: {
  wf: WorkflowDef
  selectedId: string | null
  onSelect: (n: WFNode) => void
}) {
  return (
    <div className="flex-1 overflow-auto">
      <div className="flex justify-center py-8 px-6">
        <svg
          width={CANVAS_W}
          height={wf.canvasH}
          viewBox={`0 0 ${CANVAS_W} ${wf.canvasH}`}
          style={{ overflow: 'visible' }}
        >
          <defs>
            <marker
              id="wf-arrow"
              markerWidth="7"
              markerHeight="5"
              refX="6"
              refY="2.5"
              orient="auto"
            >
              <polygon points="0 0, 7 2.5, 0 5" fill="context-stroke" opacity="0.7" />
            </marker>
          </defs>

          {/* Edges */}
          {wf.edges.map((edge, i) => (
            <path
              key={i}
              d={edgePath(wf.nodes, edge)}
              fill="none"
              stroke={edgeStroke(wf.nodes, edge)}
              strokeWidth={1.5}
              strokeOpacity={0.45}
              strokeDasharray={edge.dashed ? '6 4' : undefined}
              markerEnd="url(#wf-arrow)"
            />
          ))}

          {/* Nodes */}
          {wf.nodes.map(node => (
            <NodeBox
              key={node.id}
              node={node}
              isSelected={selectedId === node.id}
              onClick={onSelect}
            />
          ))}
        </svg>
      </div>
    </div>
  )
}

// ─── WorkflowPage ─────────────────────────────────────────────────────────────
export default function WorkflowPage() {
  const [activeWfId, setActiveWfId] = useState(WORKFLOWS[0].id)
  const [selectedNode, setSelectedNode] = useState<WFNode | null>(null)

  const wf = WORKFLOWS.find(w => w.id === activeWfId) ?? WORKFLOWS[0]

  function handleSelect(node: WFNode) {
    setSelectedNode(prev => (prev?.id === node.id ? null : node))
  }

  function handleTabChange(id: string) {
    setActiveWfId(id)
    setSelectedNode(null)
  }

  return (
    <div className="flex flex-col h-full -m-6">
      {/* Page header */}
      <div className="px-6 py-4 border-b border-border shrink-0">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-lg font-semibold text-gray-100">System Workflow</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              End-to-end agent orchestration — click any component to see rich details
            </p>
          </div>
          {/* Legend */}
          <div className="flex items-center gap-5 flex-wrap">
            {LEGEND_ITEMS.map(({ type, label }) => (
              <div key={type} className="flex items-center gap-1.5">
                <span className={clsx('w-2.5 h-2.5 rounded-sm shrink-0', NODE_STYLE[type].dot)} />
                <span className="text-[11px] text-gray-500">{label}</span>
              </div>
            ))}
            <div className="flex items-center gap-1.5">
              <svg width="20" height="10">
                <line x1="0" y1="5" x2="20" y2="5" stroke="#6b7280" strokeWidth="1.5" strokeDasharray="5 3" />
              </svg>
              <span className="text-[11px] text-gray-500">Escalation path</span>
            </div>
          </div>
        </div>
      </div>

      {/* Workflow tabs */}
      <div className="flex items-center gap-1 px-6 py-2.5 border-b border-border bg-surface-100 shrink-0">
        {WORKFLOWS.map(w => (
          <button
            key={w.id}
            onClick={() => handleTabChange(w.id)}
            className={clsx(
              'px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors',
              activeWfId === w.id
                ? 'bg-accent/20 text-accent-hover'
                : 'text-gray-400 hover:text-gray-200 hover:bg-surface-50',
            )}
          >
            {w.label}
          </button>
        ))}
      </div>

      {/* Workflow description */}
      <div className="px-6 py-2.5 border-b border-border bg-surface-100/40 shrink-0">
        <p className="text-[12px] text-gray-500 leading-relaxed">{wf.description}</p>
      </div>

      {/* Canvas + Detail panel */}
      <div className="flex flex-1 overflow-hidden">
        <WorkflowCanvas wf={wf} selectedId={selectedNode?.id ?? null} onSelect={handleSelect} />
        <DetailPanel node={selectedNode} onClose={() => setSelectedNode(null)} />
      </div>
    </div>
  )
}
