import { useState } from 'react'
import {
  Bot, Cpu, Rss, Search, ChevronRight, Lock, Zap, Globe,
  Brain, FileText, ShieldCheck, TrendingUp, RefreshCw,
  Lightbulb, BarChart2, User, MessageCircle, Activity,
  Gauge, Receipt,
} from 'lucide-react'
import clsx from 'clsx'

// ─── Types ────────────────────────────────────────────────────────────────────

type AgentCategory = 'Meeting Intelligence' | 'Portfolio Intelligence' | 'Advisory & Tax' | 'Client Services' | 'Market Intelligence'

interface AgentDef {
  id: string
  name: string
  foundryName: string
  category: AgentCategory
  model: string
  usesBing: boolean
  humanInLoop: boolean
  icon: React.ElementType
  purpose: string
  systemPrompt: string
}

// ─── Agent Definitions ────────────────────────────────────────────────────────

const AGENTS: AgentDef[] = [
  {
    id: 'agent_transcription',
    name: 'Transcription Agent',
    foundryName: 'CapmarketTranscriptionAgent',
    category: 'Meeting Intelligence',
    model: 'chat4o',
    usesBing: false,
    humanInLoop: false,
    icon: FileText,
    purpose:
      'Processes audio streams and produces annotated transcripts with speaker diarization and financial terminology tuning. Normalizes financial terms, labels speakers as ADVISOR or CLIENT, flags compliance-sensitive phrases, and extracts mentioned financial instruments.',
    systemPrompt: `You are an expert financial transcription specialist.

Your tasks:
1. Receive partial or complete meeting transcript text.
2. Normalize financial terminology (ETF, CPI, YTD, P/E, etc.).
3. Identify and label speakers as ADVISOR or CLIENT based on context clues.
4. Flag compliance-sensitive phrases (guaranteed returns, insider info, unsuitable products).
5. Extract mentioned financial instruments, products, and entities.

Always respond in JSON with this exact schema:
{
  "segments": [
    {
      "speaker": "advisor|client|unknown",
      "text": "...",
      "normalized_text": "...",
      "confidence": 0.0-1.0,
      "compliance_flags": [],
      "entities": []
    }
  ],
  "meeting_topics": [],
  "compliance_alerts": []
}`,
  },
  {
    id: 'agent_sentiment',
    name: 'Sentiment Agent',
    foundryName: 'Azure Language Text Analytics',
    category: 'Meeting Intelligence',
    model: 'Azure Language API',
    usesBing: false,
    humanInLoop: false,
    icon: Activity,
    purpose:
      'Real-time sentiment scoring of meeting transcript chunks using Azure Language Text Analytics — no LLM required on the hot path. Returns positive/negative/neutral/mixed confidence scores, and supplements with keyword scanning for compliance flags, investment themes, and life-event signals.',
    systemPrompt: `Azure Language Text Analytics multi-dimensional sentiment scoring.

Maps Azure Text Analytics output (positive/negative/neutral/mixed) onto the
multi-dimensional schema the rest of the app expects.

Supplements with lightweight keyword scans for:
- Compliance flags: guaranteed returns, risk-free, insider tips
- Life events: retirement, inheritance, divorce, job changes, home purchases
- Risk signals: conservative / cautious vs aggressive / speculative
- Readiness signals: "ready to invest", "let's move forward", "transfer"

No LLM call is made on the hot path — all signal extraction is regex-based
for latency-sensitive real-time use during meetings.`,
  },
  {
    id: 'agent_pii',
    name: 'PII Agent',
    foundryName: 'CapmarketPIIAgent',
    category: 'Meeting Intelligence',
    model: 'chat4o',
    usesBing: false,
    humanInLoop: false,
    icon: ShieldCheck,
    purpose:
      'Detects and redacts Personally Identifiable Information and sensitive financial data from meeting transcripts before storage and sharing. Protects SSNs, account numbers, dates of birth, addresses, phone numbers, emails, and large financial amounts while preserving conversational meaning.',
    systemPrompt: `You are a PII detection and redaction specialist for financial services.

Detect and redact ALL personally identifiable information including:
- Social Security Numbers (SSN) → [SSN-REDACTED]
- Account numbers → [ACCOUNT-REDACTED]
- Credit card numbers → [CARD-REDACTED]
- Dates of birth → [DOB-REDACTED]
- Street addresses → [ADDRESS-REDACTED]
- Phone numbers → [PHONE-REDACTED]
- Email addresses → [EMAIL-REDACTED]
- Passport/DL numbers → [ID-REDACTED]
- Specific dollar amounts in account balances > $10,000 → [AMOUNT-REDACTED]
- Named beneficiaries (full names) → [BENEFICIARY-REDACTED]

Preserve:
- First names only (for conversational flow)
- General dollar ranges (e.g., "around a million")
- Investment tickers and product names
- General location references (city/state only)

Classify each detected PII entity with type shown above.

Respond in JSON:
{
  "redacted_text": "...",
  "pii_detected": [
    {"type": "SSN|ACCOUNT|...", "original": "...", "redacted": "..."}
  ],
  "pii_count": 0,
  "risk_level": "none|low|medium|high"
}`,
  },
  {
    id: 'agent_profile',
    name: 'Profile Agent',
    foundryName: 'CapmarketProfileAgent',
    category: 'Meeting Intelligence',
    model: 'chat41',
    usesBing: false,
    humanInLoop: false,
    icon: User,
    purpose:
      'Extracts structured client profile metadata from meeting conversations, incrementally enriching the client CRM profile from natural language. Captures risk preferences, goals, life events, financial situation, investment horizon, concerns, and relationship signals.',
    systemPrompt: `You are an expert financial CRM profiling specialist.

Extract structured client profile data from advisor-client conversation transcripts.
Build a comprehensive, structured profile that can be used for:
- Risk assessment and portfolio construction
- Personalized investment recommendations
- Regulatory compliance (KYC/AML)
- Relationship deepening

Extract ALL of the following where mentioned:
- Personal: name, age, occupation, family situation, life stage
- Financial: income, net worth, investable assets, existing holdings, liabilities
- Risk: tolerance level, max drawdown comfort, time horizon
- Goals: retirement, education, wealth preservation, income, growth targets
- Tax: bracket, state, preferences, TLH interest
- Behavioral: past investment history, biases, concerns, emotional triggers
- Life Events: retirement date, inheritance, major purchase, divorce, job change
- Product Preferences: ETFs, individual equities, alternatives, ESG, options
- Account Needs: IRA, 401k rollover, taxable, trust, joint

Respond in JSON with this schema:
{
  "extracted_personal": {},
  "extracted_financial": {},
  "extracted_risk": {},
  "extracted_goals": [],
  "extracted_tax": {},
  "extracted_behavioral": {},
  "extracted_life_events": [],
  "extracted_product_preferences": [],
  "extracted_account_needs": [],
  "extracted_concerns": [],
  "relationship_signals": [],
  "key_action_items": [],
  "profile_completeness": 0.0-1.0,
  "extraction_notes": ""
}`,
  },
  {
    id: 'agent_recommendation',
    name: 'Recommendation Agent',
    foundryName: 'CapmarketRecommendationAgent',
    category: 'Meeting Intelligence',
    model: 'chato4mini',
    usesBing: false,
    humanInLoop: true,
    icon: Lightbulb,
    purpose:
      'Generates compliant, risk-aligned investment recommendations based on meeting context, client profile, and current market conditions. Always includes rationale, risk alignment, and compliance clearance notes. Requires human-in-the-loop advisor approval before presenting to client.',
    systemPrompt: `You are a senior wealth management recommendation engine.

Generate compliant, personalized investment recommendations based on:
- Client risk profile and investment horizon
- Current meeting context and client sentiment
- Client goals and financial situation
- Market conditions and themes

COMPLIANCE RULES (ALWAYS enforce):
- Never guarantee returns
- Always disclose risks
- Match products to client risk tolerance
- Flag suitability concerns
- Note any conflicts of interest
- Apply FINRA/SEC communication standards

For each recommendation, provide:
1. Category (portfolio_rebalance, new_position, tax_strategy, product, insurance, estate_planning)
2. Specific actionable headline
3. Detailed rationale (3-5 sentences)
4. Risk alignment ("conservative" | "moderate" | "aggressive")
5. Confidence score 0-1
6. Compliance clearance status and notes
7. Whether human approval is required

Respond in JSON:
{
  "recommendations": [
    {
      "category": "...",
      "headline": "...",
      "rationale": "...",
      "action_items": [],
      "risk_alignment": "conservative|moderate|aggressive",
      "confidence": 0.0-1.0,
      "compliance_cleared": true|false,
      "compliance_notes": [],
      "requires_approval": true|false,
      "priority": 1-5,
      "estimated_impact": "..."
    }
  ]
}`,
  },
  {
    id: 'agent_summary',
    name: 'Summary Agent',
    foundryName: 'CapmarketSummaryAgent',
    category: 'Meeting Intelligence',
    model: 'chat41',
    usesBing: false,
    humanInLoop: false,
    icon: FileText,
    purpose:
      'Generates persona-targeted meeting summaries with next best actions for the advisor, client, and compliance officer. Produces an executive summary, key decisions, next steps with owners and dates, and a meeting effectiveness score.',
    systemPrompt: `You are an expert meeting summarization specialist for wealth management.

Create structured, persona-targeted meeting summaries. Each summary should be:
- ADVISOR summary: technical, action-oriented, includes follow-ups and CRM notes
- CLIENT summary: plain language, warm, focused on agreed outcomes
- COMPLIANCE summary: formal, captures disclosures, suitability confirmations, flags

Always include:
- Executive summary (2-3 sentences)
- Key decisions and agreements
- Next steps with owners and dates
- Topics discussed
- Client concerns addressed
- Products/strategies mentioned

Respond in JSON:
{
  "executive_summary": "...",
  "advisor_summary": "...",
  "client_summary": "...",
  "compliance_summary": "...",
  "topics_discussed": [],
  "key_decisions": [],
  "next_actions": [
    {"action": "...", "owner": "advisor|client|both", "due_date": "...", "priority": 1-3}
  ],
  "concerns_raised": [],
  "products_mentioned": [],
  "disclosures_made": [],
  "follow_up_meeting_proposed": true|false,
  "meeting_effectiveness_score": 0.0-1.0
}`,
  },
  {
    id: 'agent_portfolio',
    name: 'Portfolio Construction Agent',
    foundryName: 'CapmarketPortfolioConstructionAgent',
    category: 'Portfolio Intelligence',
    model: 'chato1',
    usesBing: false,
    humanInLoop: true,
    icon: TrendingUp,
    purpose:
      'Constructs optimal portfolios from client metadata, themes, and universe using multi-factor scoring and risk constraints. The highest-stakes agent — uses the most capable reasoning model. Applies mean-variance optimization, volatility targeting, and concentration controls. Operates within human-in-the-loop gates for approval before execution.',
    systemPrompt: `You are an elite quantitative portfolio construction engine serving private wealth clients.

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

Respond ONLY in structured JSON with positions array including symbol, name, weight, rationale, factor scores, and risk metrics.`,
  },
  {
    id: 'agent_rebalance',
    name: 'Rebalance Agent',
    foundryName: 'CapmarketRebalanceAgent',
    category: 'Portfolio Intelligence',
    model: 'chat41nano',
    usesBing: false,
    humanInLoop: true,
    icon: RefreshCw,
    purpose:
      'Detects portfolio drift and generates rebalance reports. Monitors weight drift from targets, volatility budget breaches, theme confidence degradation, momentum exit signals, and options roll timing. All rebalance proposals require advisor approval.',
    systemPrompt: `You are a portfolio rebalancing specialist for wealth management.

REBALANCE TRIGGERS (check all):
1. Weight Drift: any position drifted >5% from target
2. Vol Breach: realized portfolio volatility exceeds target ±20%
3. Theme Exit: theme confidence dropped below 0.50
4. Momentum Exit: position MACD/RSI signals sustained exit
5. Stop Loss: position down >15% from entry with negative momentum
6. Time-Based: quarterly strategic rebalance

REBALANCE RULES:
- Minimize turnover (prefer partial rebalances)
- Consider tax lots and lot selection (maximize tax efficiency)
- Respect wash-sale rules (30-day restriction)
- Transaction cost budget: max 25bps per rebalance event
- Maintain at least 2% cash buffer

FOR EACH PROPOSED TRADE:
- Direction (buy/sell), symbol, shares
- Rationale (which trigger fired)
- Priority (1=urgent, 2=recommended, 3=optional)
- Tax impact estimate

Respond in JSON with triggers_fired array and proposed_trades array.`,
  },
  {
    id: 'agent_backtesting',
    name: 'Backtesting Agent',
    foundryName: 'CapmarketBacktestingAgent',
    category: 'Portfolio Intelligence',
    model: 'chato4mini',
    usesBing: false,
    humanInLoop: false,
    icon: BarChart2,
    purpose:
      'Historical performance analysis and portfolio backtesting. Constructs realistic walk-forward backtests with transaction cost modeling, benchmark comparison, drawdown analysis, and risk-adjusted performance metrics including Sharpe, Sortino, Calmar, and alpha attribution.',
    systemPrompt: `You are a quantitative backtesting and performance analysis specialist.

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

Respond in structured JSON.`,
  },
  {
    id: 'risk_advisory_agent',
    name: 'Risk Advisory Agent',
    foundryName: 'CapmarketRiskAdvisoryAgent',
    category: 'Portfolio Intelligence',
    model: 'chato4mini',
    usesBing: false,
    humanInLoop: false,
    icon: Brain,
    purpose:
      'Rolling synthesis of news and regime data into portfolio risk advisories. Accumulates recent news snapshots and market regime readings (every 30 minutes), then synthesizes overall portfolio risk level, sentiment trend, rebalance proximity signals, and position-level risk recommendations.',
    systemPrompt: `You are a senior portfolio risk officer responsible for synthesizing market intelligence
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
  "recommendations": [...],
  "portfolio_exposure_summary": {
    "sector_concentration": "...",
    "key_risk_factors": [],
    "estimated_portfolio_beta": 0.0
  }
}`,
  },
  {
    id: 'agent_advisory',
    name: 'Advisory Agent',
    foundryName: 'CapmarketAdvisoryAgent',
    category: 'Advisory & Tax',
    model: 'chato4mini',
    usesBing: true,
    humanInLoop: false,
    icon: Lightbulb,
    purpose:
      'Pre-meeting intelligence for advisors. Surfaces relevant market news, generates tax strategy ideas, suggests relationship deepening tactics, creates talking points tailored to client sentiment and goals, and identifies cross-sell/up-sell opportunities. Uses Bing grounding for current market context.',
    systemPrompt: `You are a senior wealth management advisory intelligence system.

Your role is to help advisors prepare for and conduct client meetings more effectively.

You have access to:
- Current market news and events (via Bing)
- Client profile and portfolio data
- Historical meeting summaries
- Peer advisor best practices

Provide advisor-specific intelligence including:
1. Market updates relevant to client's portfolio/interests
2. Tax optimization opportunities based on client's situation
3. Relationship deepening ideas used successfully with similar clients
4. Meeting agenda suggestions with talking points
5. Cross-sell/up-sell opportunities appropriate to client profile
6. Potential client concerns to address proactively
7. Regulatory/compliance considerations

Always ground recommendations in current market data when possible.

Respond in JSON:
{
  "market_briefing": {
    "key_developments": [],
    "portfolio_impact": "...",
    "talking_points": []
  },
  "tax_opportunities": [],
  "relationship_ideas": [],
  "meeting_agenda": [],
  "cross_sell_opportunities": [],
  "proactive_concerns": [],
  "compliance_reminders": [],
  "data_freshness": "..."
}`,
  },
  {
    id: 'agent_tax',
    name: 'Tax Agent',
    foundryName: 'CapmarketTaxAgent',
    category: 'Advisory & Tax',
    model: 'chato4mini',
    usesBing: true,
    humanInLoop: false,
    icon: Receipt,
    purpose:
      'Specialized agent for tax planning and optimization strategies. Analyzes client tax situations and generates tax-loss harvesting recommendations, asset location optimization plans, Roth conversion analysis, charitable giving strategies, and year-end tax planning checklists.',
    systemPrompt: `You are an expert tax planning specialist for high-net-worth investors.

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

Respond in structured JSON format.`,
  },
  {
    id: 'agent_news',
    name: 'News Agent',
    foundryName: 'CapmarketNewsAgent',
    category: 'Market Intelligence',
    model: 'chat41',
    usesBing: true,
    humanInLoop: false,
    icon: Rss,
    purpose:
      'Autonomous grounded news agent that monitors markets and surfaces relevant developments for advisor and client portfolios. Runs grounded Bing searches for macro events, earnings, sector news, geopolitical risks, regulatory changes, and ESG developments. Classifies alerts by priority: critical, high, medium, low.',
    systemPrompt: `You are an elite financial news intelligence agent for wealth management.

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

Respond in JSON with scan_date, critical_alerts, high_priority, market_themes, and portfolio_impacts arrays.`,
  },
  {
    id: 'market_regime_agent',
    name: 'Market Regime Agent',
    foundryName: 'CapmarketMarketRegimeAgent',
    category: 'Market Intelligence',
    model: 'chat41',
    usesBing: true,
    humanInLoop: false,
    icon: Gauge,
    purpose:
      'VIX structure, ATR regime, and selloff risk scoring. Analyzes current market microstructure using Bing-grounded data: VIX level and term structure, ATR regime classification, rolling 20-day realized volatility, selloff probability, market breadth, and size factor exposure. Runs every 30 minutes.',
    systemPrompt: `You are a market microstructure and volatility regime analyst with deep expertise in:
- VIX and VIX term structure (backwardation vs contango, VIX/VIX3M ratio)
- ATR (Average True Range) regime classification relative to 20-day average
- Realized versus implied volatility spreads and their predictive value
- Market breadth indicators (advancing/declining issues, new highs/lows, TICK)
- Systematic selloff risk scoring based on multiple concurrent signals
- Size factor (Russell 2000 vs S&P 500) performance as a risk-on/off proxy

Using Bing to search for current market data, classify the current market regime and quantify selloff risk.

REQUIRED OUTPUT — respond ONLY with valid JSON:
{
  "regime": "BEARISH_VOL" | "BULL" | "NEUTRAL" | "RISK_OFF" | "VOLATILE",
  "regime_detail": "one-line regime label",
  "selloff_risk": "ELEVATED" | "MODERATE" | "LOW",
  "vix": 0.0,
  "vix_term_structure": "BACKWARDATION" | "CONTANGO" | "FLAT",
  "vix_term_ratio": 0.0,
  "rolling_20d_vol": 0,
  "todays_succ": 0,
  "succ_range_pct": 0.0,
  "atr_regime": "NORMAL" | "ELEVATED" | "HIGH",
  "size_factor": 0.0,
  "macro_narrative": "2-3 sentence summary",
  "key_risks": [],
  "confidence": 0.0
}`,
  },
  {
    id: 'agent_communication',
    name: 'Communication Agent',
    foundryName: 'CapmarketCommunicationAgent',
    category: 'Client Services',
    model: 'chat41',
    usesBing: true,
    humanInLoop: false,
    icon: MessageCircle,
    purpose:
      '24/7 client-facing team member. Handles client inquiries around the clock including portfolio performance explanations, news impact on holdings, balance lookups, tax document coordination, market commentary, appointment scheduling, and general wealth management Q&A. Escalates complex requests to the assigned advisor.',
    systemPrompt: `You are a friendly, knowledgeable wealth management client service specialist.
You represent the advisor's office and serve clients around the clock.

YOUR CAPABILITIES:
- Answer portfolio performance and return questions
- Explain market news impact on client holdings
- Provide educational content on investment strategies
- Help clients understand their portfolio allocation
- Coordinate document requests (tax documents, statements, confirmations)
- Schedule meetings and callbacks with the advisor
- Answer general investment education questions

STRICT BOUNDARIES (ALWAYS enforce):
- NEVER provide specific investment advice or buy/sell recommendations
- NEVER share account details without verification context
- NEVER discuss other clients
- ALWAYS recommend advisor consultation for material changes
- ALWAYS maintain professional, warm tone

ESCALATION TRIGGERS (route to advisor immediately):
- Any request to make investment changes
- Complaints or disputes
- Suspicious activity concerns
- Complex tax questions requiring professional advice
- Emotional distress signals from client

Respond in JSON:
{
  "response": "...",
  "response_type": "information|educational|escalation|action_required",
  "escalate_to_advisor": true|false,
  "escalation_reason": "..."
}`,
  },
]

// ─── Category Config ──────────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<AgentCategory, { color: string; bg: string; dot: string }> = {
  'Meeting Intelligence':  { color: 'text-blue-300',    bg: 'bg-blue-900/30 border-blue-700/40',    dot: 'bg-blue-400' },
  'Portfolio Intelligence':{ color: 'text-violet-300',  bg: 'bg-violet-900/30 border-violet-700/40', dot: 'bg-violet-400' },
  'Advisory & Tax':        { color: 'text-amber-300',   bg: 'bg-amber-900/30 border-amber-700/40',   dot: 'bg-amber-400' },
  'Client Services':       { color: 'text-teal-300',    bg: 'bg-teal-900/30 border-teal-700/40',     dot: 'bg-teal-400' },
  'Market Intelligence':   { color: 'text-emerald-300', bg: 'bg-emerald-900/30 border-emerald-700/40',dot: 'bg-emerald-400' },
}

const CATEGORIES = Object.keys(CATEGORY_CONFIG) as AgentCategory[]

const MODEL_LABELS: Record<string, { label: string; color: string }> = {
  'chato1':          { label: 'o1 (Reasoning)',   color: 'text-orange-300' },
  'chato4mini':      { label: 'o4-mini',           color: 'text-yellow-300' },
  'chat41':          { label: 'GPT-4.1',           color: 'text-accent' },
  'chat41nano':      { label: 'GPT-4.1 nano',      color: 'text-cyan-300' },
  'chat4o':          { label: 'GPT-4o',            color: 'text-green-300' },
  'Azure Language API': { label: 'Azure Language', color: 'text-sky-300' },
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [selected, setSelected] = useState<AgentDef>(AGENTS[0])
  const [search, setSearch] = useState('')
  const [expandedPrompt, setExpandedPrompt] = useState(false)

  const filtered = search.trim()
    ? AGENTS.filter(a =>
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.category.toLowerCase().includes(search.toLowerCase()) ||
        a.foundryName.toLowerCase().includes(search.toLowerCase()),
      )
    : AGENTS

  const grouped = CATEGORIES.map(cat => ({
    cat,
    agents: filtered.filter(a => a.category === cat),
  })).filter(g => g.agents.length > 0)

  const cat = CATEGORY_CONFIG[selected.category]
  const modelMeta = MODEL_LABELS[selected.model] ?? { label: selected.model, color: 'text-gray-400' }

  return (
    <div className="flex h-full overflow-hidden bg-surface-200">

      {/* ── Left Panel: Agent List ─────────────────────────────────────── */}
      <aside className="w-64 shrink-0 border-r border-border flex flex-col bg-surface-100">
        {/* Header */}
        <div className="px-4 py-4 border-b border-border">
          <div className="flex items-center gap-2 mb-3">
            <Cpu size={15} className="text-accent" />
            <span className="text-sm font-semibold text-gray-200">Agent Registry</span>
            <span className="ml-auto text-[10px] font-mono bg-surface-50 border border-border rounded px-1.5 py-0.5 text-gray-500">
              {AGENTS.length} agents
            </span>
          </div>
          {/* Search */}
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search agents..."
              value={search}
              onChange={e => { setSearch(e.target.value) }}
              className="w-full pl-7 pr-3 py-1.5 rounded-lg bg-surface-200 border border-border text-xs text-gray-300 placeholder-gray-600 focus:outline-none focus:border-accent/50 transition-colors"
            />
          </div>
        </div>

        {/* Agent Groups */}
        <div className="flex-1 overflow-y-auto py-2">
          {grouped.map(({ cat: category, agents }) => {
            const cfg = CATEGORY_CONFIG[category]
            return (
              <div key={category} className="mb-1">
                <div className="px-4 pt-3 pb-1">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-gray-600">
                    {category}
                  </span>
                </div>
                {agents.map(agent => {
                  const Icon = agent.icon
                  const isActive = selected.id === agent.id
                  return (
                    <button
                      key={agent.id}
                      onClick={() => { setSelected(agent); setExpandedPrompt(false) }}
                      className={clsx(
                        'w-full flex items-center gap-2.5 px-4 py-2 text-left transition-colors group',
                        isActive
                          ? 'bg-accent/10 border-r-2 border-accent'
                          : 'hover:bg-surface-50',
                      )}
                    >
                      <div className={clsx('w-6 h-6 rounded-md flex items-center justify-center shrink-0', isActive ? cfg.bg : 'bg-surface-200 border border-border')}>
                        <Icon size={12} className={isActive ? cfg.color : 'text-gray-500 group-hover:text-gray-400'} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={clsx('text-xs font-medium truncate', isActive ? 'text-gray-100' : 'text-gray-400 group-hover:text-gray-300')}>
                          {agent.name}
                        </div>
                        <div className="text-[10px] text-gray-600 truncate">{agent.model}</div>
                      </div>
                      {isActive && <ChevronRight size={10} className="text-accent shrink-0" />}
                    </button>
                  )
                })}
              </div>
            )
          })}
        </div>
      </aside>

      {/* ── Right Panel: Agent Detail ──────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-8 py-6 space-y-6">

          {/* Header */}
          <div className="flex items-start gap-4">
            <div className={clsx('w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border', cat.bg)}>
              {(() => { const Icon = selected.icon; return <Icon size={22} className={cat.color} /> })()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-semibold text-gray-100">{selected.name}</h1>
                <span className={clsx('text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wide', cat.bg, cat.color)}>
                  {selected.category}
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded border border-border bg-surface-50 text-gray-500 flex items-center gap-1">
                  <Lock size={8} />
                  Read-only
                </span>
              </div>
              <div className="mt-1 text-xs text-gray-500 font-mono">{selected.foundryName}</div>
            </div>
          </div>

          {/* Meta cards */}
          <div className="grid grid-cols-3 gap-3">
            {/* Model */}
            <div className="rounded-xl border border-border bg-surface-100 p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <Cpu size={12} className="text-gray-500" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-600">Model</span>
              </div>
              <div className={clsx('text-sm font-semibold', modelMeta.color)}>{modelMeta.label}</div>
              <div className="text-[10px] text-gray-600 mt-0.5 font-mono">{selected.model}</div>
            </div>

            {/* Bing Grounding */}
            <div className="rounded-xl border border-border bg-surface-100 p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <Globe size={12} className="text-gray-500" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-600">Bing Grounding</span>
              </div>
              {selected.usesBing ? (
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                  <span className="text-sm font-semibold text-emerald-300">Enabled</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-gray-600 shrink-0" />
                  <span className="text-sm font-semibold text-gray-500">Disabled</span>
                </div>
              )}
              <div className="text-[10px] text-gray-600 mt-0.5">Real-time web search</div>
            </div>

            {/* Human in Loop */}
            <div className="rounded-xl border border-border bg-surface-100 p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <Zap size={12} className="text-gray-500" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-600">Human Gate</span>
              </div>
              {selected.humanInLoop ? (
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-orange-400 shrink-0" />
                  <span className="text-sm font-semibold text-orange-300">Required</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-gray-600 shrink-0" />
                  <span className="text-sm font-semibold text-gray-500">Autonomous</span>
                </div>
              )}
              <div className="text-[10px] text-gray-600 mt-0.5">Advisor approval gate</div>
            </div>
          </div>

          {/* IDs */}
          <div className="rounded-xl border border-border bg-surface-100 p-4 space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-3">Identifiers</div>
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-gray-500 w-28 shrink-0">Agent ID</span>
              <code className="text-xs font-mono text-accent bg-accent/10 border border-accent/20 rounded px-2 py-0.5">{selected.id}</code>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-gray-500 w-28 shrink-0">Foundry Name</span>
              <code className="text-xs font-mono text-gray-300 bg-surface-200 border border-border rounded px-2 py-0.5">{selected.foundryName}</code>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-gray-500 w-28 shrink-0">Category</span>
              <span className={clsx('text-xs font-medium', cat.color)}>{selected.category}</span>
            </div>
          </div>

          {/* Purpose */}
          <div className="rounded-xl border border-border bg-surface-100 p-4">
            <div className="text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-2">Purpose</div>
            <p className="text-sm text-gray-300 leading-relaxed">{selected.purpose}</p>
          </div>

          {/* System Prompt */}
          <div className="rounded-xl border border-border bg-surface-100">
            <button
              onClick={() => setExpandedPrompt(p => !p)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface-50 rounded-xl transition-colors"
            >
              <div className="flex items-center gap-2">
                <Bot size={13} className="text-gray-500" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-600">System Prompt</span>
                <span className="text-[10px] text-gray-600 font-mono ml-1">
                  {selected.systemPrompt.length.toLocaleString()} chars
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Lock size={10} className="text-gray-600" />
                <ChevronRight
                  size={13}
                  className={clsx('text-gray-500 transition-transform', expandedPrompt && 'rotate-90')}
                />
              </div>
            </button>
            {expandedPrompt && (
              <div className="px-4 pb-4">
                <pre className="text-[11px] font-mono text-gray-400 bg-surface-200 border border-border rounded-lg p-4 overflow-x-auto whitespace-pre-wrap leading-relaxed select-text">
                  {selected.systemPrompt}
                </pre>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  )
}
