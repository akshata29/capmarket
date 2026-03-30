import { useState } from 'react'
import {
  X, FileCode2, Zap, Mic, BarChart2, Lightbulb, MessageCircle,
  Activity, Database, Bot, Search, Shield, ArrowDown,
} from 'lucide-react'
import clsx from 'clsx'

// ─── Types ────────────────────────────────────────────────────────────────────
type CardType = 'service' | 'orchestration' | 'agent' | 'store' | 'ai-platform' | 'search' | 'auth'

interface ArchDetail {
  badge: string
  description: string
  dataFlow: string[]
  keyFacts: string[]
  designDecision?: string
  files: string[]
  technology: string[]
}

interface ArchItem {
  id: string
  label: string
  sublabel: string
  type: CardType
  icon: React.ElementType
  detail: ArchDetail
}

// ─── Color map ────────────────────────────────────────────────────────────────
const CARD_STYLE: Record<CardType, { card: string; icon: string; text: string; sub: string; dot: string }> = {
  service:       { card: 'bg-blue-950/50 border-blue-500/40',       icon: 'text-blue-400',    text: 'text-blue-100',    sub: 'text-blue-400/70',    dot: 'bg-blue-400' },
  orchestration: { card: 'bg-violet-950/50 border-violet-500/40',   icon: 'text-violet-400',  text: 'text-violet-100',  sub: 'text-violet-400/70',  dot: 'bg-violet-400' },
  agent:         { card: 'bg-purple-950/40 border-purple-500/30',   icon: 'text-purple-400',  text: 'text-purple-100',  sub: 'text-purple-400/70',  dot: 'bg-purple-400' },
  store:         { card: 'bg-sky-950/50 border-sky-500/40',         icon: 'text-sky-400',     text: 'text-sky-100',     sub: 'text-sky-400/70',     dot: 'bg-sky-400' },
  'ai-platform': { card: 'bg-violet-950/50 border-violet-500/40',   icon: 'text-violet-400',  text: 'text-violet-100',  sub: 'text-violet-400/70',  dot: 'bg-violet-400' },
  search:        { card: 'bg-teal-950/50 border-teal-500/40',       icon: 'text-teal-400',    text: 'text-teal-100',    sub: 'text-teal-400/70',    dot: 'bg-teal-400' },
  auth:          { card: 'bg-orange-950/50 border-orange-500/40',   icon: 'text-orange-400',  text: 'text-orange-100',  sub: 'text-orange-400/70',  dot: 'bg-orange-400' },
}

// ─── Backend service cards ─────────────────────────────────────────────────────
const BACKEND_CARDS: ArchItem[] = [
  {
    id: 'fastapi',
    label: 'FastAPI',
    sublabel: 'Pydantic v2 · Uvicorn',
    type: 'service',
    icon: Zap,
    detail: {
      badge: 'Backend Core',
      description: 'The HTTP API server powering the entire platform. Built with FastAPI and Pydantic v2, served by Uvicorn on port 8000. Registers 7 router modules at the /api prefix and exposes a live OpenAPI /docs interface.',
      dataFlow: [
        'HTTP request arrives from React frontend or external client',
        'CORS middleware validates origin and passes through to router',
        'Router dispatches to the appropriate orchestration workflow or direct handler',
        'Business logic resolved; Cosmos DB persistence via cosmos_store singleton',
        'Structured JSON response returned to caller via Pydantic response model',
      ],
      keyFacts: [
        '7 router modules: clients, meetings, portfolio, advisory, assistant, audit, health',
        'Pydantic v2 for all request and response model validation',
        'structlog for structured JSON console logging across all modules',
        'CORS configured to allow React frontend on port 5173',
        'Background portfolio-watch scheduler fires every 30 minutes at startup',
        'OpenAPI /docs and /redoc auto-generated from router annotations',
      ],
      designDecision: 'FastAPI chosen for async-first architecture that pairs natively with Azure Cosmos DB async SDK and Azure AI Projects async client, eliminating thread-blocking in high-concurrency advisor sessions.',
      files: [
        'backend/app/main.py',
        'backend/app/routers/__init__.py',
        'backend/config.py',
        'backend/app/infra/settings.py',
        'backend/app/infra/telemetry.py',
      ],
      technology: ['FastAPI', 'Pydantic v2', 'Uvicorn', 'structlog', 'Python 3.11'],
    },
  },
  {
    id: 'meeting_orch',
    label: 'Meeting Orchestration',
    sublabel: '8-agent MAF pipeline',
    type: 'orchestration',
    icon: Mic,
    detail: {
      badge: 'Orchestration',
      description: 'Coordinates the full advisor-client meeting lifecycle from pre-meeting research through live transcription and real-time analysis to post-meeting summary, with two human-in-the-loop approval gates persisted to Cosmos DB.',
      dataFlow: [
        'Advisor opens session — MeetingWorkflowState initialised with unique session_id',
        'Pre-meeting: NewsAgent + AdvisoryAgent + TaxAgent run concurrently via asyncio.gather',
        'Live meeting: audio streamed to TranscriptionAgent → PIIAgent → parallel analysis trio',
        'Sentiment, Profile and Recommendation agents produce outputs fed to GATE-1',
        'GATE-1: advisor reviews recommendations; approved set stored in workflow state',
        'Post-meeting: SummaryAgent runs → GATE-2 advisor review → final Cosmos DB upsert',
      ],
      keyFacts: [
        'MeetingWorkflowStatus enum: ACTIVE → AWAITING_APPROVAL → COMPLETED',
        'MeetingGate enum drives two explicit checkpoints: RECOMMENDATION_REVIEW, SUMMARY_REVIEW',
        'PII redaction applied to every transcript segment before downstream AI access',
        'Full transcript and PII-redacted transcript both stored for compliance',
        'All agent audit events written to agent_audits Cosmos container with run_id linkage',
      ],
      designDecision: 'Two explicit GATE checkpoints ensure no AI-generated recommendation or summary reaches the client or compliance record without explicit advisor sign-off, satisfying FINRA advisor-of-record requirements.',
      files: [
        'backend/app/orchestration/meeting_workflow.py',
        'backend/app/routers/meetings.py',
        'backend/app/models/meeting.py',
      ],
      technology: ['asyncio', 'Azure AI Foundry', 'Azure Cosmos DB', 'MAF'],
    },
  },
  {
    id: 'portfolio_orch',
    label: 'Portfolio Orchestration',
    sublabel: '3-gate Sense · Think · Act',
    type: 'orchestration',
    icon: BarChart2,
    detail: {
      badge: 'Orchestration',
      description: 'End-to-end portfolio construction pipeline that moves through three sequential phases — Sense (market signals and theme discovery), Think (analysis and construction), Act (backtest/risk/rebalance) — each gated by an explicit advisor approval checkpoint.',
      dataFlow: [
        'Advisor submits mandate and investment amount to trigger workflow',
        'Sense: NewsAgent + MarketData run in parallel → ThemeExtraction produces scored themes',
        'GATE-1: Advisor activates theme subset → UniverseMapping maps to investable securities',
        'Think: Fundamentals and Technicals analysis run in parallel → Portfolio Construction',
        'GATE-2: Advisor approves allocation proposal before entering Act phase',
        'Act: BacktestingAgent + RiskAdvisoryAgent in parallel → RebalanceAgent produces trade list',
        'GATE-3: Advisor confirms trade list → Cosmos DB final persistence',
      ],
      keyFacts: [
        'PortfolioGate enum: THEME_ACTIVATION, PORTFOLIO_APPROVAL, TRADE_EXECUTION',
        'PortfolioWorkflowStatus: PENDING → RUNNING → AWAITING_APPROVAL → APPROVED → COMPLETED',
        'All three phases save intermediate state to Cosmos DB enabling workflow resumption',
        'Approval notes captured from advisor at each gate for compliance audit trail',
        'Portfolio Watch scheduler runs this pipeline autonomously every 30 minutes',
      ],
      designDecision: 'Three sequential gates map to the CFA Institute investment process (IPS → Construction → Implementation), ensuring every automated step has a traceable human decision before client capital is touched.',
      files: [
        'backend/app/orchestration/portfolio_workflow.py',
        'backend/app/routers/portfolio.py',
        'backend/app/models/portfolio.py',
      ],
      technology: ['asyncio', 'Azure AI Foundry', 'Azure Cosmos DB', 'MAF'],
    },
  },
  {
    id: 'advisory_orch',
    label: 'Advisory Orchestration',
    sublabel: 'Parallel briefing pipeline',
    type: 'orchestration',
    icon: Lightbulb,
    detail: {
      badge: 'Orchestration',
      description: 'On-demand and scheduled pre-meeting intelligence workflow. Runs NewsAgent, TaxAgent, and AdvisoryAgent concurrently via asyncio.gather, then merges outputs into a structured unified briefing document stored in Cosmos DB.',
      dataFlow: [
        'Triggered on-demand by advisor or nightly by background scheduler',
        'Three asyncio tasks dispatched: NewsAgent, TaxAgent, AdvisoryAgent',
        'All three agents run fully in parallel using asyncio.gather',
        'Results merged into a single advisory_briefing document with all sections',
        'Briefing upserted to advisory_sessions Cosmos container keyed by advisor_id',
        'Briefing surfaced on Advisory AI page and pre-loaded into meeting panel',
      ],
      keyFacts: [
        'Parallel execution means total time ≈ max(news, tax, advisory) not sum',
        'Briefing includes: market news summary, tax strategy notes, relationship ideas',
        'advisory_id UUID tags each run for deduplication and freshness tracking',
        '7-day TTL applied to Cosmos documents to auto-expire stale briefings',
        'Nightly schedule runs for all advisors with upcoming meetings in next 24 hours',
      ],
      designDecision: 'Parallel async design reduces pre-meeting prep latency from ~45s (sequential) to ~15s (parallel). asyncio.gather used over ThreadPoolExecutor to avoid thread overhead with async SDK clients.',
      files: [
        'backend/app/orchestration/advisory_workflow.py',
        'backend/app/routers/advisory.py',
      ],
      technology: ['asyncio', 'Azure AI Foundry', 'Azure Cosmos DB'],
    },
  },
  {
    id: 'client_svc',
    label: 'Client Service',
    sublabel: '24/7 virtual team-member',
    type: 'orchestration',
    icon: MessageCircle,
    detail: {
      badge: 'Orchestration',
      description: 'Always-on client service orchestration handling natural-language queries around the clock. Loads conversation history, invokes the CommunicationAgent, checks for escalations, persists the turn, and feeds the response back via the Client Assistant API.',
      dataFlow: [
        'Client query received at /api/assistant with client_id and advisor_id',
        'Last 10 conversation turns fetched from client_conversations Cosmos container',
        'CommunicationAgent invoked with query, profile, portfolio snapshot, and history',
        'escalate_to_advisor flag checked; if set, Advisor Alert document created',
        'Conversation turn persisted to Cosmos DB with response_type classification',
        'Structured response returned — rendered in ClientAssistantPage chat UI',
      ],
      keyFacts: [
        'Handles portfolio questions, market news, document requests, advisor callbacks',
        'Response types: information / action / escalation / document',
        'Advisor Alert document created when escalation is triggered',
        'Rolling 90-day conversation history maintained per client',
        'All turns written to client_conversations and audit_log containers',
      ],
      designDecision: 'Conversation history passed as context window (last 10 turns) rather than storing a persistent Foundry thread — avoids stale thread state across long client gaps while preserving multi-turn coherence.',
      files: [
        'backend/app/orchestration/client_service_workflow.py',
        'backend/app/routers/client_assistant.py',
      ],
      technology: ['asyncio', 'Azure AI Foundry', 'Azure Cosmos DB', 'FastAPI'],
    },
  },
  {
    id: 'watch_scheduler',
    label: 'Portfolio Watch',
    sublabel: 'Background scheduler · 30 min',
    type: 'service',
    icon: Activity,
    detail: {
      badge: 'Background Service',
      description: 'An asyncio background task launched at server startup that runs the 3-agent portfolio watch cycle every 30 minutes for all active client portfolios, detecting alerts and updating watch snapshots without advisor intervention.',
      dataFlow: [
        'Server startup: asyncio.create_task(_portfolio_watch_scheduler) launches loop',
        'Loop sleeps 30 minutes then fetches all clients with active portfolios',
        'For each client: MarketRegimeAgent + NewsAgent + RiskAdvisoryAgent run in parallel',
        'Watch snapshot written to portfolio_watch Cosmos container',
        'Alerts surfaced on Portfolio Watch page and flagged in audit log',
        'Loop repeats indefinitely until server shutdown',
      ],
      keyFacts: [
        'Interval configurable via _WATCH_CYCLE_INTERVAL_SECONDS (default 1800s)',
        'Three-agent cycle: MarketRegimeAgent, NewsAgent, RiskAdvisoryAgent',
        'Results visible in real-time on the Portfolio Watch page',
        'Noisy Azure SDK loggers suppressed to WARNING in background task context',
        'Errors in individual client cycles are logged and skipped — scheduler never crashes',
      ],
      designDecision: 'Background asyncio task preferred over Celery or APScheduler to avoid additional infrastructure — the single-process Uvicorn deployment is sufficient for 30-minute granularity on advisor-scale portfolios.',
      files: [
        'backend/app/main.py',
        'backend/app/routers/portfolio.py',
        'frontend/src/pages/PortfolioWatchPage.tsx',
      ],
      technology: ['asyncio', 'Azure AI Foundry', 'Azure Cosmos DB', 'Uvicorn'],
    },
  },
]

// ─── MAF Agents ───────────────────────────────────────────────────────────────
const AGENTS: ArchItem[] = [
  {
    id: 'transcription',
    label: 'TranscriptionAgent',
    sublabel: 'Audio → diarised transcript · chat4o',
    type: 'agent',
    icon: Bot,
    detail: {
      badge: 'Foundry AI Agent',
      description: 'Processes audio segments with speaker diarisation, identifying ADVISOR and CLIENT roles and streaming structured TranscriptSegment objects into the meeting workflow state.',
      dataFlow: [
        'Audio segment received (PCM / MP3 / WebM format)',
        'Azure Speech SDK transcribes raw audio to text',
        'GPT-4o assigns speaker role: ADVISOR or CLIENT per segment',
        'TranscriptSegment objects appended to transcript_buffer in workflow state',
        'full_transcript accumulated for downstream PII and summary processing',
      ],
      keyFacts: [
        'Speaker diarisation from acoustic features + conversational role hints',
        'Handles silent segments, crosstalk, and low-quality microphone input',
        'Transcript streamed in near-real-time — latency < 2s per segment',
        'Model: chat4o (agent_transcription_model in settings)',
      ],
      designDecision: 'Foundry agent wraps Azure Speech SDK + GPT-4o for combined acoustic transcription and role assignment in one step, avoiding a two-stage pipeline with intermediate storage.',
      files: ['backend/app/agents/transcription_agent.py'],
      technology: ['Azure AI Foundry', 'Azure Speech SDK', 'OpenAI GPT-4o', 'chat4o'],
    },
  },
  {
    id: 'pii',
    label: 'PIIAgent',
    sublabel: 'Redacts PII before AI storage · chat4o',
    type: 'agent',
    icon: Bot,
    detail: {
      badge: 'Foundry AI Agent',
      description: 'Scans every transcript segment for personally identifiable information and replaces sensitive entities with typed placeholders before any downstream AI model access or Cosmos DB storage.',
      dataFlow: [
        'Receives raw transcript segment from TranscriptionAgent',
        'Entity recognition identifies PII: names, SSNs, account numbers, dates of birth',
        'Each PII instance replaced with typed placeholder: [PERSON], [ACCOUNT], [SSN]',
        'piied_transcript stored in MeetingWorkflowState alongside original',
        'Only piied_transcript passed to downstream AI agents',
      ],
      keyFacts: [
        'GDPR and FINRA compliant — PII never sent to external AI models',
        'Original transcript retained for advisor audit view only',
        'Entity types: PERSON, DATE_OF_BIRTH, SSN, ACCOUNT_NUMBER, ADDRESS, PHONE',
        'Model: chat4o (agent_pii_model in settings)',
      ],
      designDecision: 'Foundry agent preferred over Azure Presidio standalone for consistency — the same agent framework handles both entity detection and replacement in a single async invocation.',
      files: ['backend/app/agents/pii_agent.py'],
      technology: ['Azure AI Foundry', 'Azure Presidio', 'OpenAI GPT-4o', 'chat4o'],
    },
  },
  {
    id: 'sentiment',
    label: 'SentimentAgent',
    sublabel: 'Real-time client sentiment · chat4o',
    type: 'agent',
    icon: Bot,
    detail: {
      badge: 'Foundry AI Agent',
      description: 'Scores client sentiment from the PII-redacted transcript in real time. Tracks confidence, anxiety, and engagement across the meeting timeline — visible live in the SentimentGauge UI component.',
      dataFlow: [
        'Receives PII-redacted CLIENT speaker segments',
        'GPT-4o scores sentiment: confidence, anxiety, engagement on continuous scale',
        'SentimentScore object populated in MeetingWorkflowState',
        'Score delta broadcast to frontend SentimentGauge component via API poll',
      ],
      keyFacts: [
        'Scores: confidence (0–1), anxiety (0–1), engagement (0–1)',
        'Trajectory tracking across all segments to detect emotional spikes',
        'Advisor receives visual alerts on sudden negative sentiment drops',
        'Model: chat4o (agent_sentiment_model in settings)',
      ],
      designDecision: undefined,
      files: ['backend/app/agents/sentiment_agent.py', 'frontend/src/components/meeting/SentimentGauge.tsx'],
      technology: ['Azure AI Foundry', 'OpenAI GPT-4o', 'chat4o'],
    },
  },
  {
    id: 'profile',
    label: 'ProfileAgent',
    sublabel: 'Extracts client profile updates · chat41',
    type: 'agent',
    icon: Bot,
    detail: {
      badge: 'Foundry AI Agent',
      description: 'Extracts structured client profile updates from the live meeting conversation: new goals, life events, risk preference changes, and asset mentions to enrich the Cosmos DB client record post-meeting.',
      dataFlow: [
        'Receives PII-redacted transcript at end of meeting segment',
        'GPT-4.1 extracts structured delta: goals, life events, risk changes',
        'profile_extractions document built with source-quote attribution',
        'Client record updated in Cosmos DB clients container post-meeting',
      ],
      keyFacts: [
        'Delta-only updates — only changed fields written back to client document',
        'Source quote preserved for every extraction for compliance verification',
        'Extracts: goals, life_events, risk_preference, estate_notes, asset_mentions',
        'Model: chat41 (agent_profile_model in settings) for higher extraction fidelity',
      ],
      designDecision: undefined,
      files: ['backend/app/agents/profile_agent.py', 'backend/app/models/client.py'],
      technology: ['Azure AI Foundry', 'OpenAI GPT-4.1', 'chat41', 'Pydantic'],
    },
  },
  {
    id: 'recommendation',
    label: 'RecommendationAgent',
    sublabel: 'Real-time investment recommendations · o4-mini',
    type: 'agent',
    icon: Bot,
    detail: {
      badge: 'Foundry AI Agent',
      description: 'Generates real-time investment recommendations grounded in the live conversation, client profile, and current market regime. Queued for advisor approval at GATE-1 before any client presentation.',
      dataFlow: [
        'Conversation segment + client profile + market regime fed as context',
        'o4-mini generates ranked recommendation candidates with rationale',
        'Each recommendation tagged with risk_flag and mandate_check',
        'Recommendations queued in workflow state for GATE-1 review',
        'Approved set stored in approved_recommendations for summary inclusion',
      ],
      keyFacts: [
        'Uses o4-mini for cost-efficient real-time generation during live meetings',
        'Every recommendation includes: rationale, risk_flags, confidence score',
        'Mandate constraint check: max concentration, sector limits, ESG',
        'Model: chato4mini (agent_recommendation_model in settings)',
      ],
      designDecision: 'o4-mini chosen over GPT-4o for recommendations — its structured reasoning output reduces hallucinated rationale at lower cost, critical for real-time meeting cadence.',
      files: ['backend/app/agents/recommendation_agent.py', 'frontend/src/components/meeting/RecommendationFeed.tsx'],
      technology: ['Azure AI Foundry', 'OpenAI o4-mini', 'chato4mini'],
    },
  },
  {
    id: 'summary',
    label: 'SummaryAgent',
    sublabel: 'Post-meeting structured summary · chat41',
    type: 'agent',
    icon: Bot,
    detail: {
      badge: 'Foundry AI Agent',
      description: 'Generates a structured post-meeting summary covering key decisions, agreed actions, sentiment trajectory, approved recommendations, and follow-up owner assignments — formatted for long-term compliance archival.',
      dataFlow: [
        'Full PII-redacted transcript + approved recommendations + sentiment data fed in',
        'GPT-4.1 produces structured summary with all required compliance sections',
        'Summary staged in workflow state pending GATE-2 advisor review',
        'Advisor optionally amends inline; final version locked to Cosmos DB',
      ],
      keyFacts: [
        'Summary sections: decisions, actions, follow-ups, sentiment, recommendations',
        'Action items each assigned an owner (advisor or client) and due-date hint',
        'Formatted for both advisor display (React cards) and compliance archive',
        'Model: chat41 (agent_summary_model in settings) for comprehension fidelity',
      ],
      designDecision: undefined,
      files: ['backend/app/agents/summary_agent.py'],
      technology: ['Azure AI Foundry', 'OpenAI GPT-4.1', 'chat41', 'Pydantic'],
    },
  },
  {
    id: 'news',
    label: 'NewsAgent',
    sublabel: 'Market news scan · chat41',
    type: 'agent',
    icon: Bot,
    detail: {
      badge: 'Foundry AI Agent',
      description: 'Scans real-time market news for a client\'s portfolio tickers and investment themes, returning tagged and sentiment-scored news items used in both advisory briefings and portfolio watch cycles.',
      dataFlow: [
        'Receives ticker list and investment themes from calling workflow',
        'Azure AI Search queried for latest indexed news articles',
        'GPT-4.1 scores article relevance and extracts per-ticker sentiment',
        'Structured news bundle returned — used by advisory, meeting, and watch workflows',
      ],
      keyFacts: [
        'Shared agent used by Meeting, Advisory, and Portfolio Watch workflows',
        'Azure AI Search semantic hybrid retrieval for news article lookup',
        'Returns: headlines, summaries, sentiment scores, ticker tags',
        'Model: chat41 (agent_news_model in settings)',
      ],
      designDecision: undefined,
      files: ['backend/app/agents/news_agent.py', 'backend/app/persistence/search_store.py'],
      technology: ['Azure AI Foundry', 'Azure AI Search', 'GPT-4.1', 'chat41'],
    },
  },
  {
    id: 'advisory',
    label: 'AdvisoryAgent',
    sublabel: 'Advisor briefing & ideas · o4-mini',
    type: 'agent',
    icon: Bot,
    detail: {
      badge: 'Foundry AI Agent',
      description: 'Generates personalised advisor talking points, relationship deepening ideas, and white-space opportunity identification tailored to the client profile, meeting type, and recent interaction history.',
      dataFlow: [
        'Receives full client profile with goals, holdings, interaction history',
        'o4-mini generates briefing sections: talking points, opportunities, risk flags',
        'Meeting-type-specific framing applied: annual review vs tax planning vs onboarding',
        'Output merged into advisory briefing document by AdvisoryWorkflow',
      ],
      keyFacts: [
        'Produces: talking_points, relationship_ideas, white_space_opportunities',
        'Meeting-type enum: review, tax_planning, onboarding, quarterly, estate',
        'Generates both pre-meeting briefing and in-meeting relationship ideas on demand',
        'Model: chato4mini (agent_advisory_model in settings)',
      ],
      designDecision: undefined,
      files: ['backend/app/agents/advisory_agent.py'],
      technology: ['Azure AI Foundry', 'OpenAI o4-mini', 'chato4mini'],
    },
  },
  {
    id: 'tax',
    label: 'TaxAgent',
    sublabel: 'Tax situation analysis · o4-mini',
    type: 'agent',
    icon: Bot,
    detail: {
      badge: 'Foundry AI Agent',
      description: 'Analyses the client\'s current tax situation from portfolio holdings: unrealised gains and losses, year-to-date realised returns, estimated tax liability, and tax-loss harvesting candidates.',
      dataFlow: [
        'Receives portfolio holdings with cost basis and current prices',
        'Computes unrealised gain/loss per position and total portfolio',
        'Identifies near-term tax-loss harvesting pairs',
        'Estimates current-year tax liability from realised events',
        'Returns structured tax advisory payload for briefing inclusion',
      ],
      keyFacts: [
        'Supports short-term vs long-term gain classification (1-year rule)',
        'Tax-loss harvesting candidates: positions with >$1K unrealised loss',
        'Wash-sale rule awareness built into harvesting candidate filtering',
        'Model: chato4mini (agent_tax_model in settings)',
      ],
      designDecision: undefined,
      files: ['backend/app/agents/tax_agent.py'],
      technology: ['Azure AI Foundry', 'OpenAI o4-mini', 'chato4mini'],
    },
  },
  {
    id: 'communication',
    label: 'CommunicationAgent',
    sublabel: '24/7 client service · chat41',
    type: 'agent',
    icon: Bot,
    detail: {
      badge: 'Foundry AI Agent',
      description: 'The always-on virtual team-member that handles client natural language queries: portfolio performance, market news, document requests, and advisor callbacks. Classifies escalation triggers automatically.',
      dataFlow: [
        'Receives query + client profile + portfolio snapshot + conversation history',
        'GPT-4.1 generates contextual response grounded in all context',
        'Response classified by type: information, action, document, escalation',
        'escalate_to_advisor flag set when query complexity exceeds agent mandate',
        'Structured response returned to ClientServiceWorkflow for persistence',
      ],
      keyFacts: [
        'Handles: portfolio questions, news summaries, document requests, scheduling',
        'Context window: last 10 conversation turns for multi-turn coherence',
        'Mandate boundary: does not give specific buy/sell advice — always escalates',
        'Model: chat41 (agent_communication_model in settings)',
      ],
      designDecision: 'GPT-4.1 chosen for its superior instruction-following on complex multi-intent client queries with long conversation histories, reducing escalation rate vs smaller models.',
      files: ['backend/app/agents/communication_agent.py'],
      technology: ['Azure AI Foundry', 'OpenAI GPT-4.1', 'chat41'],
    },
  },
  {
    id: 'portfolio_cx',
    label: 'PortfolioConstructionAgent',
    sublabel: 'Mean-variance optimisation · o1',
    type: 'agent',
    icon: Bot,
    detail: {
      badge: 'Foundry AI Agent',
      description: 'Combines fundamental and technical scores with mandate constraints to produce optimal portfolio allocations. Uses mean-variance or risk-parity optimisation frameworks backed by o1 for deep quantitative reasoning.',
      dataFlow: [
        'Receives scored universe + fundamental_scores + technical_scores',
        'Applies mandate constraints: max position 10%, sector caps, ESG filter',
        'o1 runs optimisation: mean-variance or risk-parity based on mandate',
        'portfolio_proposal generated with allocations, weights, and narrative rationale',
        'Staged in workflow state for GATE-2 advisor review',
      ],
      keyFacts: [
        'Mandate-driven: growth, income, balanced, capital preservation, ESG',
        'Weight constraints: min 1% / max 10% per position; sector max 30%',
        'Rationale narrative explains allocation decisions in plain English',
        'Model: chato1 (agent_portfolio_model) — extended reasoning for optimisation',
      ],
      designDecision: 'o1 model chosen for portfolio construction due to its superior performance on constrained optimisation reasoning tasks vs GPT-4o — higher cost justified for this infrequent high-stakes step.',
      files: ['backend/app/agents/portfolio_agent.py'],
      technology: ['Azure AI Foundry', 'OpenAI o1', 'chato1', 'cvxpy', 'scipy'],
    },
  },
  {
    id: 'backtesting',
    label: 'BacktestingAgent',
    sublabel: 'Historical portfolio backtest · o4-mini',
    type: 'agent',
    icon: Bot,
    detail: {
      badge: 'Foundry AI Agent',
      description: 'Runs a vectorised historical backtest of the approved portfolio over 1Y, 3Y, and 5Y horizons against benchmark indices. Outputs Sharpe ratio, max drawdown, CAGR, and alpha metrics.',
      dataFlow: [
        'Receives portfolio_proposal with allocations and lookback horizons',
        'Historical price data fetched for all positions over each horizon',
        'Vectorised returns computed: daily, monthly, annualised',
        'Sharpe, CAGR, max drawdown, alpha vs SPY and AGG computed',
        'backtest_result dict returned to workflow Act phase',
      ],
      keyFacts: [
        'Horizons: 1Y, 3Y, 5Y lookback from current date',
        'Benchmarks: SPY (equity), AGG (bond), 60/40 blended',
        'Monte Carlo scenario runs optional for stress-test extension',
        'Model: chato4mini (agent_backtesting_model in settings)',
      ],
      designDecision: undefined,
      files: ['backend/app/agents/backtesting_agent.py'],
      technology: ['Azure AI Foundry', 'quantstats', 'yfinance', 'o4-mini', 'chato4mini'],
    },
  },
  {
    id: 'rebalance',
    label: 'RebalanceAgent',
    sublabel: 'Trade list generation · chat41nano',
    type: 'agent',
    icon: Bot,
    detail: {
      badge: 'Foundry AI Agent',
      description: 'Translates the approved portfolio construction into an actionable trade list with buy/sell quantities, estimated transaction costs, tax-loss harvesting opportunities, and rebalancing urgency scores.',
      dataFlow: [
        'Receives portfolio_proposal and current_holdings snapshot',
        'Diffs target weights vs current weights for each position',
        'Trade quantities computed per position with lot-size rounding',
        'Tax-loss harvesting pairs identified in current holdings',
        'rebalance_report generated with full trade list and cost estimate',
      ],
      keyFacts: [
        'Trade types: BUY, SELL, HOLD with estimated $ values',
        'Transaction cost model: basis-point commission + market impact estimate',
        'Wash-sale rule filtering on harvesting candidates',
        'Smallest model used (chat41nano) — trade diffing is mechanical not creative',
      ],
      designDecision: 'chat41nano chosen as the most cost-efficient model for rebalancing — the task is algorithmic diffing and narrative generation, not complex reasoning, so the nano model quality is fully sufficient.',
      files: ['backend/app/agents/rebalance_agent.py'],
      technology: ['Azure AI Foundry', 'OpenAI GPT-4.1 nano', 'chat41nano'],
    },
  },
  {
    id: 'market_regime',
    label: 'MarketRegimeAgent',
    sublabel: 'Macro regime classification · chat41',
    type: 'agent',
    icon: Bot,
    detail: {
      badge: 'Foundry AI Agent',
      description: 'Classifies the current macro market regime using multi-factor signals: VIX, yield curve shape, PMI, credit spreads, and price momentum. Used by the Portfolio Watch cycle and the Market Regime page.',
      dataFlow: [
        'Fetches current macro indicator snapshot: VIX, yield curve, PMI, credit spreads',
        'GPT-4.1 classifies regime: BULL, BEARISH_VOL, NEUTRAL, RISK_OFF, VOLATILE',
        'Selloff risk scored: LOW, MODERATE, ELEVATED',
        'Regime output written to portfolio_watch Cosmos container',
        'Regime displayed on Market Regime page with supporting factor breakdown',
      ],
      keyFacts: [
        'Regime classes: BULL, BEARISH_VOL, NEUTRAL, RISK_OFF, VOLATILE',
        'Factor breakdown: VIX trend, 2s10s spread, credit spread, equity momentum',
        'Selloff probability score derived from ensemble of factor signals',
        'Used by all three Portfolio Watch cycle agents as shared context',
      ],
      designDecision: undefined,
      files: ['backend/app/agents/market_regime_agent.py', 'frontend/src/pages/MarketRegimePage.tsx'],
      technology: ['Azure AI Foundry', 'OpenAI GPT-4.1', 'chat41', 'yfinance'],
    },
  },
  {
    id: 'risk_advisory',
    label: 'RiskAdvisoryAgent',
    sublabel: 'Portfolio risk assessment · chat41',
    type: 'agent',
    icon: Bot,
    detail: {
      badge: 'Foundry AI Agent',
      description: 'Assesses portfolio risk against the client\'s mandate constraints: VaR computation at 95% and 99% confidence, macro stress tests, concentration analysis, and ESG compliance scoring.',
      dataFlow: [
        'Receives portfolio_proposal and current market regime classification',
        'VaR and CVaR computed at 95% and 99% confidence intervals',
        'Macro stress scenarios run: rate shock +200bps, recession, equity selloff',
        'Concentration risk flagged: single position > 8%, sector > 25%',
        'ESG score computed against mandate minimum threshold',
      ],
      keyFacts: [
        'VaR models: parametric (default) and historical simulation',
        'Stress scenarios: rate shock, recession, equity selloff, credit crisis',
        'ESG score sourced from underlying holdings ESG ratings',
        'Risk report flags any mandate breach with remediation suggestion',
      ],
      designDecision: undefined,
      files: ['backend/app/agents/risk_advisory_agent.py'],
      technology: ['Azure AI Foundry', 'OpenAI GPT-4.1', 'chat41', 'scipy'],
    },
  },
]

// ─── Azure service cards ──────────────────────────────────────────────────────
const COSMOS_CONTAINERS = [
  { name: 'clients',               pk: '/advisor_id',   desc: 'Client profiles, goals, risk, holdings' },
  { name: 'sessions',              pk: '/client_id',    desc: 'Meeting state, transcripts, summaries' },
  { name: 'portfolios',            pk: '/client_id',    desc: 'Portfolio proposals, workflow runs' },
  { name: 'backtests',             pk: '/client_id',    desc: 'Backtest results per run' },
  { name: 'rebalance_reports',     pk: '/client_id',    desc: 'Trade lists and cost reports' },
  { name: 'advisory_sessions',     pk: '/advisor_id',   desc: 'Pre-meeting advisory briefings' },
  { name: 'client_conversations',  pk: '/client_id',    desc: '24/7 client assistant chat history' },
  { name: 'checkpoints',           pk: '/workflow_id',  desc: 'Human-in-the-loop gate state' },
  { name: 'audit_log',             pk: '/client_id',    desc: 'All advisor and system events' },
  { name: 'agent_audits',          pk: '/run_id',       desc: 'Per-agent execution records' },
]

const FOUNDRY_AGENTS = [
  { name: 'TranscriptionAgent',        model: 'chat4o' },
  { name: 'PIIAgent',                  model: 'chat4o' },
  { name: 'SentimentAgent',            model: 'chat4o' },
  { name: 'ProfileAgent',              model: 'chat41' },
  { name: 'RecommendationAgent',       model: 'chato4mini' },
  { name: 'SummaryAgent',              model: 'chat41' },
  { name: 'NewsAgent',                 model: 'chat41' },
  { name: 'AdvisoryAgent',             model: 'chato4mini' },
  { name: 'TaxAgent',                  model: 'chato4mini' },
  { name: 'CommunicationAgent',        model: 'chat41' },
  { name: 'PortfolioConstructionAgent',model: 'chato1' },
  { name: 'BacktestingAgent',          model: 'chato4mini' },
  { name: 'RebalanceAgent',            model: 'chat41nano' },
  { name: 'MarketRegimeAgent',         model: 'chat41' },
  { name: 'RiskAdvisoryAgent',         model: 'chat41' },
]

const SEARCH_INDEXES = [
  { name: 'client-profiles',       desc: 'Semantic search over client goals and notes' },
  { name: 'meeting-summaries',     desc: 'Full-text search over past meeting summaries' },
  { name: 'market-news',           desc: 'Hybrid search over indexed market articles' },
]

const AZURE_SERVICES: ArchItem[] = [
  {
    id: 'cosmos_db',
    label: 'Azure Cosmos DB',
    sublabel: 'NoSQL · 10 containers · capmarket-db',
    type: 'store',
    icon: Database,
    detail: {
      badge: 'Data Store',
      description: 'Azure Cosmos DB NoSQL is the sole persistence layer for the entire platform. Document-oriented design maps naturally to Pydantic models with no ORM overhead. Accessed via the azure-cosmos async SDK using Service Principal credential.',
      dataFlow: [
        'CosmosStore singleton wraps the async CosmosClient — initialised once at startup',
        'All reads point-read by partition key for O(1) latency',
        'Meeting sessions, portfolio runs, and advisory briefings upserted after each stage',
        'Human-in-the-loop gate state persisted to checkpoints container for workflow resumption',
        'Audit events appended to audit_log and agent_audits containers after every agent call',
        'Background ensure_containers() creates missing containers on startup gracefully',
      ],
      keyFacts: [
        'Partition keys designed for the most common access pattern per container',
        'azure.cosmos.aio async client for full non-blocking FastAPI compatibility',
        'Key-based auth in dev; ClientSecretCredential (Service Principal) in staging/prod',
        '10 containers covering all application domains — no cross-container joins needed',
        'Document TTL applied selectively: 7-day on advisory_sessions, 90-day on conversations',
      ],
      designDecision: 'Cosmos DB chosen over relational DB — document JSON maps naturally to Pydantic models, serverless/autoscale throughput suits bursty write patterns from meeting events, and the same Azure Identity authenticates to both Cosmos and AI Foundry.',
      files: [
        'backend/app/persistence/cosmos_store.py',
        'backend/app/models/client.py',
        'backend/app/models/meeting.py',
        'backend/app/models/portfolio.py',
        'backend/app/models/audit.py',
      ],
      technology: ['Azure Cosmos DB NoSQL', 'azure-cosmos async SDK', 'ClientSecretCredential', 'Pydantic v2'],
    },
  },
  {
    id: 'ai_foundry',
    label: 'Azure AI Foundry',
    sublabel: 'Responses API v2 · 15 agents · GPT-4o / 4.1 / o1 / o4-mini',
    type: 'ai-platform',
    icon: Bot,
    detail: {
      badge: 'AI Platform',
      description: 'Azure AI Foundry hosts all 15 AI agents. The Foundry Agent Service provides a managed execution environment with built-in tracing, versioning, and observability. Agents are accessed via the azure-ai-projects SDK Responses API v2.',
      dataFlow: [
        'FoundryAgentBase initialises AIProjectClient authenticated via Service Principal',
        'Each agent creates or retrieves its named agent definition on first use',
        'create_run() dispatches a prompt with system instructions and user context',
        'SDK polls for completion → extracts structured JSON output from response',
        'Response validated as strict Pydantic model before return to workflow',
        'All agent runs traced and logged in Azure Foundry observability dashboard',
      ],
      keyFacts: [
        'foundry_agent_name per agent loaded from agent_settings Cosmos container for hot-swap',
        'Model deployments: chat4o, chat41, chat41nano, chato4mini, chato1 — per agent role',
        'Thread-per-session for meeting agents preserves full conversation context',
        'Responses API v2 used — supports structured output schema enforcement',
        'create_version() on startup enables prompt versioning without code changes',
        'foundry_response_timeout_seconds: 180s default, 360s for reasoning models (o1)',
      ],
      designDecision: 'Foundry chosen over direct OpenAI calls for managed tracing, versioning, and the ability to swap models and extend agents with function tools (CRM lookup, approval tracking) without changing orchestration code.',
      files: [
        'backend/app/agents/base_agent.py',
        'backend/app/agents/__init__.py',
        'backend/config.py',
      ],
      technology: ['Azure AI Foundry', 'azure-ai-projects SDK v2', 'Responses API v2', 'GPT-4o', 'GPT-4.1', 'o1', 'o4-mini'],
    },
  },
  {
    id: 'ai_search',
    label: 'Azure AI Search',
    sublabel: 'Semantic hybrid search · 3 indexes',
    type: 'search',
    icon: Search,
    detail: {
      badge: 'Search',
      description: 'Azure AI Search provides semantic hybrid retrieval (vector + keyword) for RAG workflows. Three indexes cover client profiles, meeting summaries, and market news — used by NewsAgent, CommunicationAgent, and advisory briefing generation.',
      dataFlow: [
        'SearchStore singleton initialises SearchClient per index on first access',
        'NewsAgent queries market-news index with ticker + theme hybrid query',
        'CommunicationAgent queries client-profiles index for additional context',
        'Meeting summaries indexed post-GATE-2 approval for future retrieval',
        'Results returned as ranked document chunks with semantic relevance scores',
      ],
      keyFacts: [
        'Hybrid retrieval: BM25 keyword + vector embedding merged with RRF scoring',
        'Embedding model: text-embedding-ada-002 (azure_openai_embedding_deployment_name)',
        'Index: client-profiles — goals, notes, risk profile, interaction history',
        'Index: meeting-summaries — post-meeting summaries with advisor tags',
        'Index: market-news — daily ingested news articles with ticker tagging',
        'SearchStore gracefully disables when AZURE_SEARCH_ENDPOINT not set (dev mode)',
      ],
      designDecision: 'Azure AI Search chosen for its native integration with Azure AI Foundry for grounding, support for hybrid retrieval combining vector and keyword, and managed indexing without self-hosting a vector database.',
      files: [
        'backend/app/persistence/search_store.py',
        'backend/config.py',
      ],
      technology: ['Azure AI Search', 'azure-search-documents SDK', 'text-embedding-ada-002', 'Semantic Ranking'],
    },
  },
  {
    id: 'azure_identity',
    label: 'Azure Identity',
    sublabel: 'Service Principal · ClientSecretCredential',
    type: 'auth',
    icon: Shield,
    detail: {
      badge: 'Auth',
      description: 'A single Azure Service Principal authenticates the backend to all Azure services — Cosmos DB, AI Foundry, AI Search, and Azure OpenAI. ClientSecretCredential from azure-identity provides automatic token refresh with zero manual key rotation.',
      dataFlow: [
        'App startup: ClientSecretCredential initialised with AZURE_TENANT_ID, CLIENT_ID, CLIENT_SECRET',
        'Single SP credential instance shared across CosmosStore and AIProjectClient',
        'azure-identity SDK handles token acquisition and silent refresh automatically',
        'Token cached in-process — no network call per request unless token near expiry',
        'In production: Managed Identity replaces ClientSecretCredential (zero secrets)',
      ],
      keyFacts: [
        'Environment variables: AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET',
        'Same credential authenticates to Cosmos DB and Azure AI Foundry simultaneously',
        'azure-identity handles token refresh silently — no expiry handling in app code',
        'Key-based fallback: cosmos_db_key and azure_search_key accepted for dev mode',
        'Road to production: swap ClientSecretCredential for DefaultAzureCredential + Managed Identity',
      ],
      designDecision: 'Single Service Principal with ClientSecretCredential enables a complete dev→staging→prod path: dev uses .env secrets, prod replaces with Managed Identity — same code, zero credential changes in application logic.',
      files: [
        'backend/config.py',
        'backend/app/persistence/cosmos_store.py',
        'backend/app/agents/base_agent.py',
      ],
      technology: ['Azure Identity', 'ClientSecretCredential', 'azure-identity SDK', 'Service Principal', 'Azure RBAC'],
    },
  },
]

// ─── Key data flows (bottom text section) ────────────────────────────────────
const KEY_DATA_FLOWS = [
  {
    title: 'Meeting Intelligence',
    color: 'text-violet-400',
    flow: 'POST /api/meetings/start → MeetingWorkflow initialised → Pre-meeting agents run in parallel → Session opened → Audio streamed to TranscriptionAgent → PIIAgent redacts → [Sentiment ║ Profile ║ Recommendation] run in parallel → GATE-1: advisor approves recommendations → SummaryAgent → GATE-2: advisor approves summary → Cosmos DB persist.',
  },
  {
    title: 'Portfolio Construction',
    color: 'text-blue-400',
    flow: 'POST /api/portfolio/start → PortfolioWorkflow → [NewsAgent ║ MarketData] sense phase → ThemeExtraction → GATE-1: theme activation → UniverseMapping → [Fundamentals ║ Technicals] parallel → PortfolioConstruction → GATE-2: proposal approval → [Backtest ║ RiskAdvisory] → RebalanceAgent → GATE-3: trade execution.',
  },
  {
    title: 'Advisory Intelligence',
    color: 'text-yellow-400',
    flow: 'Scheduled nightly or on-demand via POST /api/advisory/prepare → asyncio.gather([NewsAgent, TaxAgent, AdvisoryAgent]) all run in parallel → results merged into unified briefing → Cosmos DB advisory_sessions upsert → surfaced on Advisory AI page and pre-loaded into Meeting panel on next session open.',
  },
  {
    title: 'Client Service (24/7)',
    color: 'text-teal-400',
    flow: 'POST /api/assistant/query → conversation history loaded from Cosmos → CommunicationAgent generates response with full context → escalation check: if escalate_to_advisor → Advisor Alert created in Cosmos → direct response returned to client UI → conversation turn persisted → ready as context for the next query.',
  },
]

// ─── Detail Panel ─────────────────────────────────────────────────────────────
function DetailPanel({ item, onClose }: { item: ArchItem; onClose: () => void }) {
  const s = CARD_STYLE[item.type]
  const d = item.detail

  return (
    <div className="w-[340px] shrink-0 border-l border-border bg-surface-100 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-border">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <span className={clsx('text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border', s.card, s.sub)}>
              {d.badge}
            </span>
            <div className="text-[15px] font-semibold text-gray-100 mt-2 leading-snug">{item.label}</div>
            <div className="text-[11px] text-gray-500 font-mono mt-0.5">{item.sublabel}</div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-surface-50 rounded-lg transition-colors shrink-0 mt-0.5">
            <X size={15} className="text-gray-400" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        <p className="text-[13px] text-gray-400 leading-relaxed">{d.description}</p>

        {d.dataFlow.length > 0 && (
          <section>
            <div className="flex items-center gap-1.5 mb-2.5">
              <ArrowDown size={11} className={s.icon} />
              <span className="text-[9px] font-bold uppercase tracking-widest text-gray-600">Data Flow</span>
            </div>
            <ol className="space-y-2">
              {d.dataFlow.map((step, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className={clsx('text-[10px] font-bold mt-0.5 shrink-0 w-4 tabular-nums', s.icon)}>{i + 1}.</span>
                  <span className="text-[12px] text-gray-400 leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          </section>
        )}

        {d.keyFacts.length > 0 && (
          <section>
            <div className="text-[9px] font-bold uppercase tracking-widest text-gray-600 mb-2">Key Facts</div>
            <ul className="space-y-2">
              {d.keyFacts.map((f, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className={clsx('w-1 h-1 rounded-full mt-[6px] shrink-0', s.dot)} />
                  <span className="text-[12px] text-gray-400 leading-relaxed">{f}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {d.designDecision && (
          <section className="rounded-lg border border-orange-700/40 bg-orange-950/30 px-4 py-3">
            <div className="text-[9px] font-bold uppercase tracking-widest text-orange-500 mb-1.5">Design Decision</div>
            <p className="text-[12px] text-orange-300/80 leading-relaxed">{d.designDecision}</p>
          </section>
        )}

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

        {d.technology.length > 0 && (
          <section>
            <div className="text-[9px] font-bold uppercase tracking-widest text-gray-600 mb-2">Technology</div>
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

// ─── Small service card inside backend box ────────────────────────────────────
function ServiceCard({ item, selected, onSelect }: { item: ArchItem; selected: boolean; onSelect: (i: ArchItem) => void }) {
  const s = CARD_STYLE[item.type]
  const Icon = item.icon
  return (
    <button
      onClick={() => onSelect(item)}
      className={clsx(
        'flex flex-col items-center justify-center gap-1.5 rounded-xl border p-4 transition-all text-center cursor-pointer hover:brightness-125',
        s.card,
        selected && 'ring-1 ring-white/30 brightness-125',
      )}
    >
      <Icon size={20} className={s.icon} />
      <div className={clsx('text-[13px] font-semibold leading-tight', s.text)}>{item.label}</div>
      <div className={clsx('text-[10px] font-mono', s.sub)}>{item.sublabel}</div>
    </button>
  )
}

// ─── Agent row inside agents sub-box ─────────────────────────────────────────
function AgentRow({ item, selected, onSelect }: { item: ArchItem; selected: boolean; onSelect: (i: ArchItem) => void }) {
  const s = CARD_STYLE[item.type]
  return (
    <button
      onClick={() => onSelect(item)}
      className={clsx(
        'flex items-center gap-2.5 px-3 py-2 rounded-lg border transition-all text-left w-full hover:brightness-125',
        s.card,
        selected && 'ring-1 ring-white/30 brightness-125',
      )}
    >
      <div className={clsx('w-1.5 h-1.5 rounded-full shrink-0', s.dot)} />
      <div className="flex-1 min-w-0">
        <div className={clsx('text-[12px] font-semibold truncate', s.text)}>{item.label}</div>
      </div>
      <div className={clsx('text-[9px] font-mono shrink-0', s.sub)}>{item.sublabel.split('·')[1]?.trim()}</div>
    </button>
  )
}

// ─── Azure service panel (left/middle columns) ────────────────────────────────
function AzureCosmosCard({ selected, onSelect, item }: { selected: boolean; onSelect: (i: ArchItem) => void; item: ArchItem }) {
  const s = CARD_STYLE[item.type]
  return (
    <button
      onClick={() => onSelect(item)}
      className={clsx(
        'flex flex-col rounded-xl border p-4 transition-all text-left hover:brightness-125 w-full h-full',
        s.card,
        selected && 'ring-1 ring-white/30 brightness-125',
      )}
    >
      <div className="flex items-center gap-2 mb-3">
        <Database size={18} className={s.icon} />
        <div>
          <div className={clsx('text-[14px] font-semibold', s.text)}>{item.label}</div>
          <div className={clsx('text-[10px] font-mono', s.sub)}>{item.sublabel}</div>
        </div>
      </div>
      <div className="text-[9px] font-bold uppercase tracking-widest text-gray-600 mb-2">
        {COSMOS_CONTAINERS.length} Containers · capmarket-db
      </div>
      <div className="space-y-1 flex-1">
        {COSMOS_CONTAINERS.map(c => (
          <div key={c.name} className="flex items-start gap-2">
            <span className={clsx('w-1 h-1 rounded-full mt-[5px] shrink-0', s.dot)} />
            <div className="min-w-0">
              <code className={clsx('text-[10px] font-mono', s.text)}>{c.name}</code>
              <span className="text-gray-600 text-[10px] ml-1 font-mono">pk: {c.pk}</span>
            </div>
          </div>
        ))}
      </div>
    </button>
  )
}

function AzureFoundryCard({ selected, onSelect, item }: { selected: boolean; onSelect: (i: ArchItem) => void; item: ArchItem }) {
  const s = CARD_STYLE[item.type]
  return (
    <button
      onClick={() => onSelect(item)}
      className={clsx(
        'flex flex-col rounded-xl border p-4 transition-all text-left hover:brightness-125 w-full h-full',
        s.card,
        selected && 'ring-1 ring-white/30 brightness-125',
      )}
    >
      <div className="flex items-center gap-2 mb-3">
        <Bot size={18} className={s.icon} />
        <div>
          <div className={clsx('text-[14px] font-semibold', s.text)}>{item.label}</div>
          <div className={clsx('text-[10px] font-mono', s.sub)}>{item.sublabel}</div>
        </div>
      </div>
      <div className="text-[9px] font-bold uppercase tracking-widest text-gray-600 mb-2">Agents &amp; Models</div>
      <div className="space-y-1 flex-1 overflow-hidden">
        {FOUNDRY_AGENTS.map(a => (
          <div key={a.name} className="flex items-center gap-2">
            <span className={clsx('w-1 h-1 rounded-full shrink-0', s.dot)} />
            <code className={clsx('text-[10px] font-mono truncate flex-1', s.text)}>{a.name}</code>
            <span className={clsx('text-[9px] font-mono shrink-0', s.sub)}>{a.model}</span>
          </div>
        ))}
        <div className="mt-2 pt-2 border-t border-purple-800/30">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />
            <code className="text-[10px] font-mono text-purple-300">GPT-4o / 4.1 / o1 / o4-mini</code>
          </div>
          <div className="text-[9px] text-purple-500 ml-3.5 font-mono mt-0.5">Conversations API v2 · Responses API</div>
        </div>
      </div>
    </button>
  )
}

function AzureSearchCard({ selected, onSelect, item }: { selected: boolean; onSelect: (i: ArchItem) => void; item: ArchItem }) {
  const s = CARD_STYLE[item.type]
  return (
    <button
      onClick={() => onSelect(item)}
      className={clsx(
        'flex flex-col rounded-xl border p-4 transition-all text-left hover:brightness-125 w-full',
        s.card,
        selected && 'ring-1 ring-white/30 brightness-125',
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        <Search size={15} className={s.icon} />
        <div>
          <div className={clsx('text-[13px] font-semibold', s.text)}>{item.label}</div>
          <div className={clsx('text-[10px] font-mono', s.sub)}>{item.sublabel}</div>
        </div>
      </div>
      <div className="text-[9px] font-bold uppercase tracking-widest text-gray-600 mb-1.5">Indexes</div>
      <div className="space-y-1">
        {SEARCH_INDEXES.map(idx => (
          <div key={idx.name} className="flex items-start gap-1.5">
            <span className={clsx('w-1 h-1 rounded-full mt-[5px] shrink-0', s.dot)} />
            <code className={clsx('text-[10px] font-mono', s.text)}>{idx.name}</code>
          </div>
        ))}
      </div>
    </button>
  )
}

function AzureIdentityCard({ selected, onSelect, item }: { selected: boolean; onSelect: (i: ArchItem) => void; item: ArchItem }) {
  const s = CARD_STYLE[item.type]
  const envVars = ['AZURE_TENANT_ID', 'AZURE_CLIENT_ID', 'AZURE_CLIENT_SECRET']
  return (
    <button
      onClick={() => onSelect(item)}
      className={clsx(
        'flex flex-col rounded-xl border p-4 transition-all text-left hover:brightness-125 w-full',
        s.card,
        selected && 'ring-1 ring-white/30 brightness-125',
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        <Shield size={15} className={s.icon} />
        <div>
          <div className={clsx('text-[13px] font-semibold', s.text)}>{item.label}</div>
          <div className={clsx('text-[10px] font-mono', s.sub)}>{item.sublabel}</div>
        </div>
      </div>
      <div className="text-[9px] font-bold uppercase tracking-widest text-gray-600 mb-1.5">Auth Flow · .env</div>
      <div className="space-y-1">
        {envVars.map(v => (
          <div key={v} className="rounded bg-orange-950/30 px-2 py-0.5">
            <code className={clsx('text-[10px] font-mono', s.text)}>{v}</code>
          </div>
        ))}
        <div className={clsx('text-[10px] mt-1', s.sub)}>
          Single SP authenticates to Cosmos DB and AI Foundry. Token refresh automatic.
        </div>
      </div>
    </button>
  )
}

// ─── API Routes bar ───────────────────────────────────────────────────────────
const API_ROUTES = ['/api/clients', '/api/meetings', '/api/portfolio', '/api/advisory', '/api/assistant', '/api/audit', '/api/health']

// ─── SDK connector labels ─────────────────────────────────────────────────────
const SDK_CONNECTORS = [
  { label: 'azure-cosmos async SDK',       color: 'text-sky-500' },
  { label: 'azure-ai-projects SDK v2',     color: 'text-violet-400' },
  { label: 'azure-search-documents SDK',   color: 'text-teal-400' },
  { label: 'ClientSecretCredential',       color: 'text-orange-400' },
]

// ─── Main page ────────────────────────────────────────────────────────────────
export default function ArchitecturePage() {
  const [selectedItem, setSelectedItem] = useState<ArchItem | null>(null)

  function handleSelect(item: ArchItem) {
    setSelectedItem(prev => (prev?.id === item.id ? null : item))
  }

  const allItems: ArchItem[] = [...BACKEND_CARDS, ...AGENTS, ...AZURE_SERVICES]

  function isSelected(id: string) { return selectedItem?.id === id }

  return (
    <div className="flex flex-col h-full -m-6">
      {/* Page header */}
      <div className="px-6 py-4 border-b border-border shrink-0">
        <div>
          <h2 className="text-lg font-semibold text-gray-100">Architecture</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            End-to-end system architecture — Azure services, data flows &amp; design decisions
          </p>
        </div>
      </div>

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Scrollable canvas */}
        <div className="flex-1 overflow-auto">
          <div className="px-6 py-6 space-y-0 min-w-[860px]">

            {/* ── Entry arrows (Frontend + AI Foundry coming in from top) ────── */}
            <div className="flex justify-between px-[12%] mb-0">
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-[11px] font-mono text-blue-400">React Frontend · Vite · port 5173</span>
                <div className="flex flex-col items-center">
                  <div className="w-px h-7 bg-blue-500/50" />
                  <svg width="10" height="6"><polygon points="0,0 10,0 5,6" fill="rgb(59 130 246 / 0.7)" /></svg>
                </div>
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-[11px] font-mono text-violet-400">Azure AI Foundry · Responses API v2</span>
                <div className="flex flex-col items-center">
                  <div className="w-px h-7 bg-violet-500/50" />
                  <svg width="10" height="6"><polygon points="0,0 10,0 5,6" fill="rgb(139 92 246 / 0.7)" /></svg>
                </div>
              </div>
            </div>

            {/* ── FastAPI Backend box ─────────────────────────────────────────── */}
            <div className="rounded-2xl border border-blue-700/40 bg-blue-950/10 p-4">
              {/* Backend header */}
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-[11px] font-mono text-blue-400 font-semibold">
                  FastAPI Backend · Python 3.11 + Uvicorn · port 8000
                </span>
              </div>

              {/* API routes */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                <span className="text-[10px] text-gray-500 self-center mr-1 font-mono">API Routes · /api prefix · OpenAPI /docs</span>
                {API_ROUTES.map(r => (
                  <span key={r} className="text-[11px] font-mono px-2.5 py-0.5 rounded border border-blue-700/40 bg-blue-950/40 text-blue-300">
                    {r}
                  </span>
                ))}
              </div>

              {/* Service cards */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                {BACKEND_CARDS.map(item => (
                  <ServiceCard key={item.id} item={item} selected={isSelected(item.id)} onSelect={handleSelect} />
                ))}
              </div>

              {/* MAF Agents sub-box */}
              <div className="rounded-xl border border-purple-700/30 bg-purple-950/10 p-3">
                <div className="flex items-center gap-2 mb-2.5">
                  <Bot size={13} className="text-purple-400" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-purple-500">
                    Azure AI Foundry Agents (MAF) · 15 agents · Responses API v2
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {AGENTS.map(item => (
                    <AgentRow key={item.id} item={item} selected={isSelected(item.id)} onSelect={handleSelect} />
                  ))}
                </div>
              </div>
            </div>

            {/* ── SDK connector labels ────────────────────────────────────────── */}
            <div className="flex justify-around py-3 px-[4%]">
              {SDK_CONNECTORS.map(c => (
                <div key={c.label} className="flex flex-col items-center gap-0.5">
                  <span className={clsx('text-[10px] font-mono', c.color)}>{c.label}</span>
                  <div className="flex flex-col items-center">
                    <div className="w-px h-6 bg-gray-700" />
                    <svg width="8" height="5"><polygon points="0,0 8,0 4,5" fill="#4b5563" /></svg>
                  </div>
                </div>
              ))}
            </div>

            {/* ── Azure Cloud Services box ────────────────────────────────────── */}
            <div className="rounded-2xl border border-teal-700/30 bg-teal-950/5 p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-teal-500" />
                <span className="text-[11px] font-mono text-teal-400 font-semibold">Azure Cloud Services</span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {/* Col 1: Cosmos DB */}
                <AzureCosmosCard
                  item={AZURE_SERVICES[0]}
                  selected={isSelected('cosmos_db')}
                  onSelect={handleSelect}
                />
                {/* Col 2: AI Foundry */}
                <AzureFoundryCard
                  item={AZURE_SERVICES[1]}
                  selected={isSelected('ai_foundry')}
                  onSelect={handleSelect}
                />
                {/* Col 3: Search + Identity stacked */}
                <div className="flex flex-col gap-3">
                  <AzureSearchCard
                    item={AZURE_SERVICES[2]}
                    selected={isSelected('ai_search')}
                    onSelect={handleSelect}
                  />
                  <AzureIdentityCard
                    item={AZURE_SERVICES[3]}
                    selected={isSelected('azure_identity')}
                    onSelect={handleSelect}
                  />
                </div>
              </div>
            </div>

            {/* ── Key Data Flows ──────────────────────────────────────────────── */}
            <div className="pt-6 pb-2">
              <div className="flex items-center gap-2 mb-4">
                <Activity size={14} className="text-gray-500" />
                <span className="text-[11px] font-bold uppercase tracking-widest text-gray-500">Key Data Flows</span>
              </div>
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                {KEY_DATA_FLOWS.map(f => (
                  <div key={f.title}>
                    <div className={clsx('text-[12px] font-semibold mb-1', f.color)}>{f.title}</div>
                    <p className="text-[11px] text-gray-500 leading-relaxed">{f.flow}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Detail panel */}
        {selectedItem && (
          <DetailPanel item={selectedItem} onClose={() => setSelectedItem(null)} />
        )}
      </div>
    </div>
  )
}
