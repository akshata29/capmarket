# Capmarket AI Wealth Advisor Platform
## Business & Technical Storytelling Demo
### "From First Handshake to Intelligent Portfolio — The Sarah Chen Story"

---

> **Demo Audience**: Business leaders, product executives, technical architects, wealth management practitioners
>
> **Runtime**: ~45-60 minutes (full walkthrough) | ~20 minutes (executive highlight reel)
>
> **Golden Thread**: Sarah Chen — 35-year-old FAANG engineer, $850K in assets, 70% concentration risk, wants to retire at 45. Every demo touchpoint flows from her story.

---

## The Problem We Are Solving

Every wealth advisor today faces the same structural friction:

| The Old World | The AI-Augmented World |
|---|---|
| 4-6 hours of post-meeting note-taking | Real-time AI transcription + CRM population during the meeting |
| 2-3 days to build a portfolio proposal | Fully constructed, backtested, risk-checked portfolio in minutes |
| Weekly market review by hand | Continuous 30-minute autonomous portfolio surveillance |
| Client calls the office to ask "how am I doing?" | 24/7 AI-powered client assistant answers instantly |
| Tax planning happens once a year with the CPA | Every meeting surfaces ranked tax-loss harvesting opportunities |
| Compliance review is a post-processing bottleneck | PII redaction and compliance flags fire in real time |

**This is not AI replacing advisors. This is AI multiplying what advisors can do — turning a $5M book into a $50M book without adding headcount.**

---

## Architecture at a Glance

```
+------------------------------------------------------------------+
|  React 18 / Vite / TypeScript / Tailwind CSS   :5173             |
|  Dashboard | Meetings | Clients | Portfolio | Advisory | Audit   |
+----------------------------+-------------------------------------+
                             | REST  /api/* + WebSocket ws://
+----------------------------v-------------------------------------+
|  FastAPI  :8000  (Python 3.11 + uvicorn)                        |
|  7 Routers: meetings / clients / portfolio / advisory /          |
|             client-assistant / audit / health                    |
+---+----------------+------------------+---------------+---------+
    |  MAF Workflows | 15 Foundry Agents | Cosmos DB     | AI Search
    v                v                  v               v
Azure AI Foundry  Responses API v2   Cosmos DB async  AI Search
(Agents v2)      gpt-4o / gpt-4o-mini  7 containers   3 indexes
                 + Bing Grounding
```

**15 Specialized Agents. 4 Orchestration Workflows. 7 CosmosDB Containers. 1 Audit Trail that never lies.**

---

## Demo Act Structure

| Act | Module | Sarah's Journey | Duration |
|-----|--------|-----------------|----------|
| **Act 1** | Meeting Intelligence | First prospect call with Sarah | 10 min |
| **Act 2** | Client Intelligence | Sarah's profile becomes her financial DNA | 5 min |
| **Act 3** | Portfolio Intelligence | AI builds Sarah's diversification portfolio | 12 min |
| **Act 4** | Advisory Intelligence | Pre-meeting prep + tax strategy briefing | 8 min |
| **Act 5** | Portfolio Watch + Market Regime | Autonomous surveillance catches a risk event | 8 min |
| **Act 6** | Client Assistant (24/7) | Sarah asks a question at 11pm | 5 min |
| **Act 7** | Audit & Compliance | The immutable trail every regulator wants to see | 4 min |

---

## ACT 1 — Meeting Intelligence
### "The First Conversation That Starts Everything"

---

### The Story

It's a Tuesday afternoon. Sarah Chen — senior engineer at a major tech company in San Francisco — walks into the advisor's office for the first time. She's been meaning to "do this" for two years. She has $850K but 70% of it is in company RSUs. She wants to retire by 45.

**Before this platform existed**: The advisor would take hand-written notes, spend the evening writing them up, attempt to remember the nuances of her tone, build a suboptimal profile, and pray nothing fell through the cracks.

**With Capmarket**: The moment the meeting starts, five AI agents begin working in parallel.

---

### Demo Step 1.1 — Start the Meeting Session

Navigate to `Meetings` → `New Meeting` → Select `Sarah Chen` as client.

The platform opens a live meeting workspace:

- **Transcript Panel** — real-time scrolling transcript with speaker labels
- **Sentiment Gauge** — live emotional signal bar showing client engagement
- **Recommendation Feed** — AI-generated recommendations surfacing as Sarah speaks
- **Agent Activity Panel** — shows which agents are processing in real time

---

### Demo Step 1.2 — Inject the Transcript (or play audio)

Either play the recorded audio file or use the scenario injector:

```bash
# Run the scenario to simulate Sarah Chen's meeting
python tests/run_scenario.py sarah_chen
```

Or via the API directly:
```http
POST /api/meetings/{session_id}/inject-transcript
Content-Type: application/json

[
  {"speaker": "advisor", "text": "Good afternoon, Sarah. Thanks for coming in today."},
  {"speaker": "client",  "text": "Yes, first time. I'm Sarah Chen..."}
]
```

**Watch the UI as each message arrives. Point out each agent firing.**

---

### Technical Deep Dive: The Meeting Workflow Pipeline

**File**: `backend/app/orchestration/meeting_workflow.py`

The `MeetingWorkflow` class is the conductor. It implements a DAG (Directed Acyclic Graph) of 7 agents:

```
[Audio / Text Input]
        |
        v
  TranscriptionAgent          ← Azure AI Foundry Agent | gpt-4o
        |
        +——> PIIAgent          ← Runs in parallel | gpt-4o-mini
        |         |
        |         +——> Compliance-safe transcript stored to Cosmos DB
        |
        +——> SentimentAgent    ← Azure Text Analytics + keyword rules
        |         |
        |         +——> Live sentiment score pushed via WebSocket
        |
        +——> ProfileAgent      ← gpt-4o | Extracts CRM fields
        |
        +——> RecommendationAgent ← gpt-4o | HITL Gate 1
        |
[GATE 1: Advisor reviews & approves recommendations]
        |
        v
  SummaryAgent                ← gpt-4o | 3 persona-targeted summaries
        |
[GATE 2: Advisor approves meeting summary]
        |
        v
  Cosmos DB persist + Audit log
```

**Every gate decision is logged to the immutable `audit_log` container.**

---

### Agent 1: TranscriptionAgent
**File**: `backend/app/agents/transcription_agent.py`
**Model**: gpt-4o | **Foundry Agent Name**: `CapmarketTranscriptionAgent`

This agent doesn't just transcribe — it *enriches*. It:
- Normalizes financial terminology (RSU, ETF, CPI, P/E ratios)
- Labels speakers as ADVISOR or CLIENT from context
- Detects compliance-sensitive phrases in real time
- Extracts financial entities (tickers, products, strategies) as they're mentioned

**When Sarah says**: *"I've accumulated about 850,000 dollars — roughly 600K in company stock and RSUs..."*

The agent returns:
```json
{
  "segments": [{
    "speaker": "client",
    "normalized_text": "I have accumulated approximately $850,000 — $600,000 in company equity (RSUs/stock)...",
    "entities": ["RSU", "company_stock"],
    "compliance_flags": []
  }],
  "meeting_topics": ["concentrated_position", "diversification"],
  "compliance_alerts": []
}
```

---

### Agent 2: PIIAgent
**File**: `backend/app/agents/pii_agent.py`
**Model**: gpt-4o-mini | **Foundry Agent Name**: `CapmarketPIIAgent`

When Sarah says: *"Email is sarah.chen@gmail.com and my cell is 415-702-9384"*

The PII agent fires **immediately** and the stored version becomes:

```json
{
  "redacted_text": "Email is [EMAIL-REDACTED] and my cell is [PHONE-REDACTED]",
  "pii_detected": [
    {"type": "EMAIL", "original": "sarah.chen@gmail.com",  "redacted": "[EMAIL-REDACTED]"},
    {"type": "PHONE", "original": "415-702-9384", "redacted": "[PHONE-REDACTED]"}
  ],
  "risk_level": "medium"
}
```

**Business Point**: Compliance teams can sleep at night. No PII reaches any downstream store unredacted. This satisfies GDPR, CCPA, and financial services data handling requirements out of the box.

---

### Agent 3: SentimentAgent
**File**: `backend/app/agents/sentiment_agent.py`
**Technology**: Azure Text Analytics API + custom keyword rules (no LLM on hot path)

The sentiment agent runs on every new transcript segment with **no LLM latency** — it uses Azure Text Analytics for the confidence scores, then augments with domain-specific keyword patterns:

| Sarah's Statement | Sentiment Signal | Flag |
|---|---|---|
| "I keep meaning to do it" | Procrastination / low urgency | Life event: estate planning gap |
| "I've seen the 2022 tech crash and held on" | Confident / aggressive | Risk appetite: HIGH |
| "The tax bill was brutal. I didn't plan for it at all." | Frustrated / negative | Life event: tax shock trigger |
| "I want financial independence early" | Motivated / positive | Goal: FIRE (early retirement) |

The live **Sentiment Gauge** in the UI shows the composite score in real time. Advisors use this to modulate their tone — Sarah is confident but frustrated by past tax mistakes, so the advisor knows to address tax optimization early.

---

### Agent 4: ProfileAgent
**File**: `backend/app/agents/profile_agent.py`
**Model**: gpt-4o | **Foundry Agent Name**: `CapmarketProfileAgent`

By the end of Sarah's first meeting, this agent extracts a complete structured profile — automatically populating the CRM:

```json
{
  "extracted_personal": {
    "name": "Sarah Chen", "age": 35, "occupation": "Software Engineer",
    "employer_type": "FAANG", "location": "San Francisco, CA",
    "relationship_status": "Single", "dependents": 0
  },
  "extracted_financial": {
    "total_assets": 850000,
    "company_equity": 600000,
    "retirement_401k": 150000,
    "taxable_brokerage": 100000,
    "crypto": 40000,
    "angel_investments": 25000,
    "base_salary": 280000,
    "annual_rsu_vesting": 300000,
    "total_comp": 580000
  },
  "extracted_risk": {
    "tolerance": "aggressive",
    "max_drawdown_comfort": "30%",
    "horizon_years": 10,
    "volatility_stomach": "high"
  },
  "extracted_goals": [
    {"goal": "Financial independence / early retirement", "target_age": 45},
    {"goal": "Diversify away from single-stock concentration"},
    {"goal": "Tax optimization on RSU vesting"}
  ],
  "extracted_concerns": [
    "70% concentration in employer stock",
    "Unplanned RSU tax liability",
    "No will or estate plan"
  ],
  "profile_completeness": 0.87
}
```

**In 20 minutes of conversation, the AI built what would have taken 2 hours of manual CRM entry.**

---

### Agent 5: RecommendationAgent
**File**: `backend/app/agents/recommendation_agent.py`
**Model**: gpt-4o | **Foundry Agent Name**: `CapmarketRecommendationAgent`

Midway through the meeting, as Sarah mentions her concentration risk and tax frustration, the Recommendation Agent surfaces preliminary recommendations in the **Recommendation Feed panel** on the right side of the UI.

**GATE 1**: These recommendations are NOT shown to the client yet. The advisor sees them first:

```json
{
  "recommendations": [
    {
      "category": "portfolio_rebalance",
      "headline": "Implement systematic RSU liquidation plan — 10-15% per quarter",
      "rationale": "Concentration of 70% in single-employer equity creates correlated compensation and portfolio risk. A disciplined, systematic sale schedule (using limit orders at vesting) reduces FOMO-driven inaction while capturing long-term gains treatment on qualifying positions.",
      "risk_alignment": "aggressive",
      "confidence": 0.93,
      "compliance_cleared": true,
      "requires_approval": true,
      "priority": 1
    },
    {
      "category": "tax_strategy",
      "headline": "Establish estimated quarterly tax payments for 2025 RSU vest events",
      "rationale": "Client reports prior-year tax shock from unplanned RSU vesting. At $300K annual vesting + $280K base, effective federal rate will approach 37% + 3.8% NIIT. Proactive estimated payments avoid underpayment penalties.",
      "compliance_cleared": true,
      "requires_approval": true,
      "priority": 1
    },
    {
      "category": "estate_planning",
      "headline": "Initiate basic estate plan — will, DPOA, beneficiary review",
      "rationale": "Client has $850K in assets with no will and no beneficiary designations reviewed. Default state intestacy rules would apply. Beneficiary designations on 401k supersede will — critical to align.",
      "compliance_cleared": true,
      "requires_approval": false,
      "priority": 2
    }
  ],
  "overall_assessment": "Client is financially sophisticated but operationally exposed — high income with poor tax and estate scaffolding. Immediate wins are tax planning and concentration reduction."
}
```

The advisor reviews, annotates if needed, and clicks **Approve**. Only then does the recommendation enter the meeting record.

---

### Agent 6: SummaryAgent
**File**: `backend/app/agents/summary_agent.py`
**Model**: gpt-4o | **Foundry Agent Name**: `CapmarketSummaryAgent`

Post-meeting, the Summary Agent generates three distinct summaries simultaneously:

**Advisor Summary** (for CRM / next meeting prep):
> *Sarah Chen — first prospect meeting. FAANG engineer, 35, SF. $850K AUM potential ($580K comp/year growing). Critical concentration: 70% employer RSU/stock. Immediate pain: unplanned tax on RSU vests. Primary goal: FIRE at 45. Risk: aggressive. No estate plan. Agreed next steps: (1) Build diversification portfolio proposal, (2) Tax Q-payment schedule, (3) Referral to estate attorney. Hot button: she's data-driven — show her the numbers on concentration risk.*

**Client Summary** (warm, sent directly to Sarah):
> *Great to meet you, Sarah! Here's what we covered today: We talked about your strong financial position and your goal of financial independence by 45 — which is absolutely achievable. We identified two immediate priorities: getting a tax plan in place for your RSU vesting so you don't get hit with another surprise at tax time, and starting to thoughtfully diversify your portfolio beyond company stock. I'll have a portfolio proposal ready for you within the week. Talk soon!*

**Compliance Summary** (for file):
> *First prospect meeting. Client confirmed asset levels, income, risk tolerance (aggressive), and investment objectives (growth/early retirement). No product recommendations made pending suitability review. No guarantees of returns made. Client disclosed BTC holdings (~$40K) and angel investment ($25K). Estate planning gap noted and referral recommended. Client expressed understanding of concentration risk. Meeting conducted in accordance with Reg BI suitability standards.*

**GATE 2**: Advisor reviews the summary, makes any corrections, then approves. The approved version is saved to Cosmos DB. The compliance version goes to the audit trail.

---

## ACT 2 — Client Intelligence
### "Sarah's Financial DNA Lives in the Platform"

Navigate to `Clients` → `Sarah Chen`.

The client profile page shows everything extracted from the meeting — enriched and editable:

- **Risk Profile Card**: Aggressive | 10-year horizon | 30% max drawdown tolerance
- **Goals**: Financial independence @45, RSU diversification, tax optimization
- **Key Concerns**: Single-stock concentration, tax planning, no estate plan
- **Meeting History**: Full list of meetings with AI summaries, key decisions, recommendations, action items, and compliance notes
- **Holdings**: Current positions with signals
- **Tags**: drives the Portfolio Construction themes

**Technical Note — Cosmos DB Schema**

All client data lives in the `clients` container, partitioned by `/advisor_id` for optimal multi-advisor query patterns:

```python
# backend/app/persistence/cosmos_store.py
COLLECTIONS = {
    "sessions":           "/client_id",    # Meeting sessions
    "clients":            "/advisor_id",   # Client profiles
    "portfolios":         "/client_id",    # Portfolio proposals
    "audit_log":          "/client_id",    # Immutable audit entries
    "agent_audits":       "/run_id",       # Per-agent execution records
    "checkpoints":        "/workflow_id",  # Human-in-the-loop checkpoints
    "advisory_sessions":  "/advisor_id",   # Advisory intelligence
}
```

The client's meeting history, recommendations, summaries, and action items are all queryable. The platform builds on every conversation — Sarah's profile in meeting 5 knows everything from meetings 1-4.

---

## ACT 3 — Portfolio Intelligence
### "AI Builds Sarah a Portfolio from Scratch in Under 5 Minutes"

Navigate to `Portfolio` → `New Portfolio` → Select `Sarah Chen`.

Enter the mandate:
> *"Aggressive growth, tech diversification away from FAANG concentration, 10-year horizon, $150,000 initial investment, ESG preference, target 12-15% expected return"*

Click **Generate Portfolio**. Watch the 6-stage pipeline execute with live status updates.

---

### The Portfolio Workflow: Sense → Think → Act

**File**: `backend/app/orchestration/portfolio_workflow.py`

```
SENSE (Parallel):
  [NewsAgent]  ←──── Bing-grounded market scan for mandate themes
      |
      +──────────────> Theme Extraction
                           |
                    ┌──────+──────┐
              Clean Energy  AI/Cloud  Healthcare Innovation
              Semiconductors  Fintech  Cybersecurity
                    |
             GATE 1: Advisor activates themes
                    |
THINK (Sequential → Parallel fork):
  [Universe Mapping]  ←── PortfolioConstructionAgent maps 40-60 tickers
         |
    ┌────+─────────────────────────┐
    v                              v
  [Fundamentals scoring]     [Technicals scoring]   ← Parallel
    P/E, EV/EBITDA, FCF           RSI, MACD, ATR, momentum
    |                              |
    └────────────────┬─────────────┘
                     v
          [Portfolio Construction]  ← gpt-4o | Elite quant engine
          10-20 positions | multi-factor scoring | HHI < 0.25
                     |
             GATE 2: Advisor approves portfolio
                     |
ACT:
  [BacktestingAgent]  ← 3-year historical simulation vs SPY benchmark
  [RebalanceAgent]    ← Initial rebalance plan with drift thresholds
                     |
             GATE 3: Execute / Save
```

---

### Demo Step 3.1 — Watch Themes Surface (NewsAgent + Bing)

**Foundry Agent**: `CapmarketNewsAgent` | **Model**: gpt-4o-mini | **Bing Grounded: YES**

The News Agent fires a Bing-grounded scan based on Sarah's mandate:

```json
{
  "market_themes": [
    {
      "name": "AI Infrastructure & Cloud Computing",
      "confidence": 0.94,
      "tickers": ["MSFT", "GOOGL", "AMZN", "META", "CRM"],
      "rationale": "Enterprise AI spending accelerating — hyperscaler capex up 45% YoY"
    },
    {
      "name": "Semiconductor Supply Chain",
      "confidence": 0.88,
      "tickers": ["NVDA", "AMD", "AVGO", "QCOM", "TSM"],
      "rationale": "CHIPS Act tailwinds + AI compute demand driving secular growth cycle"
    },
    {
      "name": "Cybersecurity",
      "confidence": 0.82,
      "tickers": ["CRWD", "PANW", "ZS", "FTNT", "S"],
      "rationale": "Rising threat landscape — enterprise security budgets growing at 15% CAGR"
    }
  ]
}
```

**GATE 1**: Advisor sees the themes with confidence scores and business rationales. With one click, they activate the themes to proceed. The gate decision is logged with the advisor ID and timestamp.

---

### Demo Step 3.2 — The Portfolio is Constructed

**Foundry Agent**: `CapmarketPortfolioConstructionAgent`
**Model**: gpt-4o (most capable model — this is the highest-stakes agent)
**File**: `backend/app/agents/portfolio_agent.py`

The system prompt for this agent reads like a Goldman Sachs quant desk:

```python
SYSTEM_PROMPT = """You are an elite quantitative portfolio construction engine...

CONSTRUCTION METHODOLOGY:
1. Mandate Translation: Convert client goals to quantitative constraints
2. Theme-to-Ticker Mapping: Identify 5-8 best-in-class per theme
3. Multi-Factor Scoring: Fundamentals (30%) + Technicals (25%) +
   Momentum (20%) + Quality (15%) + Valuation (10%)
4. Optimization: Mean-variance optimization respecting all constraints
5. Risk Overlays: Volatility targeting, correlation control, drawdown limits

HARD CONSTRAINTS:
- Position count: 10-20 names (concentrated conviction)
- Max single weight: 10% (diversification floor)
- Max sector concentration: 40%
- HHI < 0.25 (diversification index)
- All positions > $100M market cap
- No position > 5% of 30-day ADV (liquidity)
"""
```

The result is a full portfolio proposal for Sarah:

```json
{
  "positions": [
    {
      "symbol": "MSFT", "name": "Microsoft Corporation",
      "weight": 0.09, "theme": "AI Infrastructure",
      "rationale": "Dominant enterprise AI platform via Azure OpenAI + Copilot monetization cycle early innings. FCF yield 2.8%, P/E 33x justified by AI revenue ramp.",
      "signal": "buy", "conviction": "high", "score": 0.91,
      "entry_price_target": 415.00
    },
    {
      "symbol": "NVDA", "name": "NVIDIA Corporation",
      "weight": 0.08, "theme": "Semiconductor Supply Chain",
      "signal": "buy", "conviction": "high", "score": 0.94
    }
    // ... 13 more positions
  ],
  "risk_metrics": {
    "estimated_volatility": 0.182,
    "estimated_sharpe": 1.34,
    "max_drawdown_estimate": -0.28,
    "hhi": 0.087,
    "beta_estimate": 1.12
  },
  "constraint_checks": {
    "position_count":    {"value": 15, "status": "pass"},
    "max_weight":        {"value": 0.09, "status": "pass"},
    "volatility_target": {"value": 0.182, "status": "pass"},
    "hhi":               {"value": 0.087, "status": "pass"}
  }
}
```

**Business Point**: The portfolio respects Sarah's mandate — aggressive but diversified, tech-oriented but NOT concentrated in her employer. HHI of 0.087 vs her current single-stock HHI of 0.49. That's the quantitative story of diversification.

---

### Demo Step 3.3 — Backtesting Shows the Numbers

**Foundry Agent**: `CapmarketBacktestingAgent` | **Model**: gpt-4o-mini

The backtest runs the constructed portfolio against historical data with SPY as benchmark:

| Metric | Sarah's AI Portfolio | SPY Benchmark |
|--------|---------------------|---------------|
| Total Return (3yr) | +87.4% | +32.1% |
| CAGR | 23.1% | 9.7% |
| Sharpe Ratio | 1.34 | 0.71 |
| Sortino Ratio | 1.89 | 0.98 |
| Max Drawdown | -28.3% | -23.9% |
| Alpha | +13.4% | — |
| Win Rate (monthly) | 71% | 62% |

The agent also generates a narrative:
> *"The portfolio's aggressive growth positioning delivered strong absolute and risk-adjusted returns over the 3-year backtest period, outperforming SPY by 55.3 percentage points on a total return basis. The higher max drawdown (-28.3% vs -23.9%) is consistent with the client's stated aggressive risk tolerance and 30% drawdown comfort level. The portfolio Sharpe of 1.34 versus SPY's 0.71 indicates superior return-per-unit-of-risk, supporting the construction thesis."*

**GATE 2**: Advisor reviews the full portfolio — positions, rationales, risk metrics, backtest. They can annotate, request changes, or approve. On approval, the portfolio is locked in Cosmos DB with the approval signature.

---

### Demo Step 3.4 — Rebalance Plan Generated

**Foundry Agent**: `CapmarketRebalanceAgent` | **Model**: gpt-4o-mini
**File**: `backend/app/agents/rebalance_agent.py`

Even on a new portfolio, the rebalance agent generates the initial "from zero to target" trade list, plus sets the drift thresholds going forward:

```json
{
  "proposed_trades": [
    {"direction": "buy", "symbol": "MSFT", "shares": 32, "priority": 1,
     "rationale": "Target weight 9.0% — establishing initial position"},
    {"direction": "buy", "symbol": "NVDA", "shares": 18, "priority": 1,
     "rationale": "Target weight 8.0% — high conviction AI compute play"}
  ],
  "turnover_pct": 0.0,
  "estimated_tx_cost_bps": 4.2,
  "drift_thresholds": {
    "weight_drift_trigger": 0.05,
    "vol_breach_trigger": 0.20,
    "theme_confidence_floor": 0.50
  }
}
```

**GATE 3**: Advisor reviews and executes (or skips for paper portfolio). Every gate decision logs to `audit_log`.

---

## ACT 4 — Advisory Intelligence
### "The Advisor Walks In Fully Briefed — Every Time"

Navigate to `Advisory` → Select `Sarah Chen` → `Run Pre-Meeting Briefing`.

This runs the `AdvisoryWorkflow` which fires 4 agents **in parallel** in under 90 seconds:

```python
# backend/app/orchestration/advisory_workflow.py
news, tax_analysis, briefing, relationship = await asyncio.gather(
    run_news(),       # NewsAgent    — Bing-grounded market scan
    run_tax(),        # TaxAgent     — Tax-loss harvesting analysis
    run_advisory(),   # AdvisoryAgent — Contextualized briefing + talking points
    run_relationship(), # AdvisoryAgent — Relationship deepening ideas
)
```

---

### Advisory Tab 1: Pre-Meeting Briefing

**Foundry Agent**: `CapmarketAdvisoryAgent` | **Model**: gpt-4o | **Bing Grounded: YES**

The briefing lands 5 minutes before Sarah walks in:

> **Critical Alert**: *NVDA down 8.4% pre-market on export restriction news — directly impacts Sarah's semiconductor theme position. Recommended talking point: "This is exactly why diversification across the theme rather than single-name concentration matters — the theme is intact, the position is manageable."*

> **Market Context**: *Tech sector rotation continues — growth names under pressure on rate sensitivity. Sarah's portfolio Sharpe of 1.34 provides buffer. Key talking point: her portfolio volatility (18.2%) is within mandate despite market noise.*

> **Advisor Talking Points**:
> 1. Lead with the concentration risk numbers — her employer-stock HHI is 6x higher than her new portfolio
> 2. Address NVDA volatility proactively — this is a feature of the diversification strategy, not a bug
> 3. Pivot to the tax win — Q1 estimated payment saved her an estimated $28K penalty

---

### Advisory Tab 2: Position Briefing

A position-level intelligence table showing at-risk and opportunity positions, powered by the accumulated 30-minute watch cycle data already stored in Cosmos DB — **no live agent call needed**:

| Symbol | Signal | Urgency | Action |
|--------|--------|---------|--------|
| NVDA | WATCH | HIGH | Export restrictions — monitor; thesis intact |
| CRWD | BUY | MEDIUM | Beat earnings +12% on ARR acceleration |
| MSFT | HOLD | LOW | Copilot monetization on track |

---

### Advisory Tab 3: Tax Strategies

**Foundry Agent**: `CapmarketTaxAgent` | **Model**: gpt-4o-mini | **Bing Grounded: YES**

For Sarah at $580K total comp in California:

```json
{
  "federal_bracket": "37%",
  "state_bracket": "13.3%  (CA — highest marginal)",
  "effective_rate_estimate": 0.41,
  "immediate_opportunities": [
    {
      "strategy": "Systematic RSU Tax Withholding Election",
      "description": "Elect supplemental flat rate 37% withholding on all RSU vests vs. 22% default",
      "estimated_savings": 45000,
      "deadline": "Before next vest event",
      "implementation": ["Contact HR to change withholding election", "File Form W-4 supplement"]
    },
    {
      "strategy": "Tax-Loss Harvesting — Current Brokerage",
      "description": "Identify unrealized losses in $100K brokerage to offset RSU vest gains",
      "estimated_savings": 18500,
      "deadline": "December 31",
      "wash_sale_note": "Maintain 31-day separation or use equivalent ETF substitutes"
    }
  ],
  "medium_term_strategies": [
    {
      "strategy": "Backdoor Roth IRA Contribution",
      "description": "Income above Roth limits — contribute to non-deductible trad IRA, convert immediately",
      "estimated_savings": 7200,
      "annual_benefit": true
    }
  ],
  "estimated_annual_savings": 63000
}
```

**Business Point**: $63,000 in estimated tax savings identified in 90 seconds. This is the kind of insight that traditionally required a dedicated CPA engagement.

---

### Advisory Tab 4: Advisor AI Chat

**Foundry Agent**: `CapmarketAdvisoryAgent` | **Model**: gpt-4o | **Bing Grounded: YES**

The advisor can ask any question, fully grounded in Sarah's profile AND current market data:

> **Advisor types**: *"What's the argument for Sarah to sell all her employer RSUs immediately vs. a systematic approach? Give me the tax and timing analysis."*

The agent responds with a Bing-grounded, client-contextualized analysis — not generic advice, but advice specifically calibrated to Sarah's $580K income, California tax bracket, vesting schedule, and 10-year horizon.

---

### Advisory Tab 5: Relationship Ideas

The `AdvisoryAgent` analyzes Sarah's profile and peer patterns to suggest relationship-deepening actions:

| Idea | Effort | Timing | Rationale |
|------|--------|--------|-----------|
| Send FIRE (Financial Independence) resource kit | Low | This week | Matches her early retirement goal — shows you understand what drives her |
| Introduce to estate attorney network referral | Low | After meeting | Critical gap: no will on $850K estate |
| Invite to "Tech Professionals & Wealth" seminar | Medium | Next quarter | Peer group resonance — she'll trust advice better from peers |
| Quarterly tax checkpoint call | Low | Ongoing | Addresses her #1 pain point (tax shock) proactively |

---

## ACT 5 — Portfolio Watch + Market Regime
### "The AI That Never Sleeps"

Navigate to `Portfolio Watch` → `Sarah Chen's Portfolio`.

Every 30 minutes, without any human trigger, the platform runs a 4-agent autonomous watch cycle:

```
[MarketRegimeAgent]  ← Bing-grounded VIX, ATR, breadth analysis
         |
[NewsAgent]          ← Bing-grounded scan of Sarah's 15 positions
         |
[RebalanceAgent]     ← Checks drift thresholds
         |
[RiskAdvisoryAgent]  ← Synthesizes all of the above into advisory
         |
[Intel Feed]         ← Alerts surface in the UI automatically
```

**Foundry Agents Used**:
- `CapmarketMarketRegimeAgent` — gpt-4o-mini | Bing Grounded
- `CapmarketNewsAgent` — gpt-4o-mini | Bing Grounded
- `CapmarketRebalanceAgent` — gpt-4o-mini
- `CapmarketRiskAdvisoryAgent` — gpt-4o-mini

---

### Demo: A Risk Event Fires

Simulate a market stress scenario. The Market Regime Agent classifies the current environment:

```json
{
  "regime": "RISK_OFF",
  "regime_detail": "Volatility Expansion — VIX term structure in backwardation",
  "selloff_risk": "ELEVATED",
  "vix": 28.4,
  "vix_term_structure": "BACKWARDATION",
  "vix_term_ratio": 1.18,
  "atr_regime": "ELEVATED",
  "macro_narrative": "VIX has spiked to 28 with term structure in backwardation, signaling near-term stress. Market breadth deteriorating — advancing/declining ratio at 0.62. Semiconductor names bearing disproportionate pressure on export restriction headlines.",
  "key_risks": [
    "NVDA export restrictions — direct portfolio exposure",
    "Fed hawkish surprise risk — growth factor headwind",
    "Tech concentration — portfolio 62% in tech themes"
  ],
  "selloff_risk": "ELEVATED",
  "confidence": 0.87
}
```

The **RiskAdvisoryAgent** synthesizes this into an advisory:

```json
{
  "risk_level": "elevated",
  "sentiment_trend": "deteriorating",
  "advisory_narrative": "Elevated VIX backwardation combined with export restriction news creates compounding headwinds for the semiconductor theme. Portfolio tech concentration (62%) warrants tactical monitoring. NVDA position at 8% weight is the primary risk carrier — export restriction could persist 2-3 quarters.",
  "rebalance_proximity": {
    "weight_drift": 0.72,
    "vol_cap": 0.81,
    "theme_confidence": 0.45,
    "correlation": 0.68
  },
  "recommendations": [
    {
      "symbol": "NVDA",
      "action": "tighten_stop",
      "priority": "critical",
      "rationale": "Export restriction news + elevated ATR regime creates asymmetric downside. Tighten stop to 12% below current price."
    },
    {
      "symbol": "AMD",
      "action": "watch_closely",
      "priority": "high",
      "rationale": "Semiconductor peer — sentiment contamination risk from NVDA headlines"
    }
  ]
}
```

**This alert fires in the Intel Feed at 2:17 AM — no advisor had to be awake.**

Navigate to `Intel Feed` to see the live feed of all watch cycle outputs across all clients.

Navigate to `Market Regime` to see the full VIX term structure visualization.

**Business Point**: An advisor running a $50M book cannot manually monitor 30 client portfolios at 30-minute intervals. This autonomous watch cycle is the equivalent of hiring a 24/7 markets desk — but at infrastructure cost.

---

## ACT 6 — Client Assistant (24/7)
### "Sarah Texts at 11 PM — And Gets a Perfect Answer"

Navigate to `Client Assistant` → `Sarah Chen`.

**Scenario**: Sarah sees a CNBC headline about NVDA after dinner and sends a message:

> *"Hey — I just saw NVDA dropped 8% today on some export thing. Am I okay? Should I be worried about my portfolio?"*

The `ClientServiceWorkflow` invokes the `CommunicationAgent`:

**Foundry Agent**: `CapmarketCommunicationAgent` | **Model**: gpt-4o | **Bing Grounded: YES**

```json
{
  "response": "Hi Sarah! Great that you're staying engaged. Yes, NVIDIA did drop on export restriction news today — and I completely understand why that caught your eye. The important context: within your portfolio, NVDA represents about 8% of your holdings, so the direct impact is limited. More importantly, your portfolio was designed specifically so that no single position can have an outsized impact on your overall wealth — which is actually the exact opposite of the concentrated situation we discussed. Your portfolio is down about 1.2% today vs. NVDA's 8%, which is the diversification strategy working exactly as intended. Your advisor is aware and will have a detailed briefing for you at your next meeting. In the meantime, is there anything specific you'd like me to explain about your positions?",
  "response_type": "information",
  "escalate_to_advisor": false,
  "sentiment": "reassuring"
}
```

**The response is**: warm, factual, compliance-safe, portfolio-specific (not generic), and Bing-grounded with current market data. It does NOT say "everything is fine" and does NOT suggest any trade action (escalation boundaries are hard-coded in the system prompt).

**Compare to the alternative**: Sarah calls the office at 8 AM, waits on hold, speaks to an assistant who says "I'll have someone call you back." The AI assistant answered at 11:04 PM with a better, more personalized response.

**Technical Note — Escalation Detection**:

The agent's system prompt contains hard escalation triggers:
```python
ESCALATION_TRIGGERS = [
    "Any request to make investment changes",
    "Complaints or disputes",
    "Suspicious activity concerns",
    "Complex tax questions requiring professional advice",
    "Emotional distress signals from client"
]
```

If Sarah had said *"Sell everything"*, the `escalate_to_advisor` flag fires to `true` and the advisor receives an immediate notification with full conversation context.

---

## ACT 7 — Audit & Compliance
### "The Trail That Every Regulator Wants to See"

Navigate to `Audit Trail`.

Every single action in the platform — from agent invocation to gate approvals to client messages — writes an immutable record to the `audit_log` CosmosDB container:

| Timestamp | Event Type | Agent | Description | User |
|-----------|-----------|-------|-------------|------|
| 14:03:22 | MEETING_STARTED | — | Meeting session created for Sarah Chen | advisor_001 |
| 14:03:25 | AGENT_CALLED | TranscriptionAgent | Transcript enrichment invoked | system |
| 14:03:26 | AGENT_CALLED | PIIAgent | PII redaction invoked | system |
| 14:03:26 | AGENT_CALLED | SentimentAgent | Sentiment scoring invoked | system |
| 14:19:44 | RECOMMENDATION_GENERATED | RecommendationAgent | 3 recommendations generated | system |
| 14:21:00 | GATE_DECISION | GATE-1 | Advisor approved 3 of 3 recommendations | advisor_001 |
| 14:21:01 | AUDIT_TRAIL | PIIAgent | Compliance verification passed | system |
| 14:38:12 | MEETING_SUMMARY_GENERATED | SummaryAgent | 3-persona summary created | system |
| 14:39:45 | GATE_DECISION | GATE-2 | Advisor approved meeting summary | advisor_001 |
| 14:39:46 | MEETING_COMPLETED | — | Session finalized and persisted | system |

**Every gate decision captures**: who approved it, when, what the payload was, and what session/client context it was made in.

**Technical Implementation**:

```python
# backend/app/models/audit.py — AuditEntry schema
class AuditEventType(str, Enum):
    MEETING_STARTED        = "meeting_started"
    AGENT_CALLED           = "agent_called"
    RECOMMENDATION_GENERATED = "recommendation_generated"
    GATE_DECISION          = "gate_decision"
    PORTFOLIO_CREATED      = "portfolio_created"
    ADVISORY_REQUEST       = "advisory_request"
    REBALANCE_TRIGGERED    = "rebalance_triggered"
    ...
```

Every agent in the system emits audit events via `_log_event()` — the audit trail is not optional or configurable. It is architecturally mandatory.

**Regulatory Value**: FINRA Rule 4511 requires firms to preserve all business communications for 3 years. Regulation BI requires a documented suitability reasoning trail. This audit log satisfies both — with the added benefit of being machine-readable for automated compliance sweeps.

---

## The Full Jour ney: Sarah Chen in Numbers

| Step | Time | Old World | AI-Augmented World |
|------|------|-----------|-------------------|
| Profile CRM population | After meeting | 90 minutes | Real-time during meeting |
| Recommendations draft | Next day | 2-3 hours | Available before meeting ends |
| Portfolio proposal | 3-5 business days | Manual construction | ~4-5 minutes AI + HITL |
| Tax strategy identification | Annual CPA engagement | $2,000-5,000 fee | Per-meeting, automated |
| Pre-meeting briefing | 1 hour morning prep | Hand-curated | 90-second AI briefing |
| Portfolio surveillance | Weekly manual review | 5-10 min/client/week | Continuous 30-min autonomous |
| Client 11pm question | Next business day | — | Answered in seconds, correctly |
| Compliance trail | Manual documentation | Error-prone | Automatic, immutable |

**Total advisor time saved per client per week: 4-8 hours.**
**Book capacity multiplier: 3-5x more clients managed per advisor.**

---

## The Art of the Possible — What This Architecture Enables Next

This platform is built on the **Azure AI Foundry Agents v2 + Microsoft Agent Framework** architecture. Every agent is a first-class Azure resource with:
- Independent versioning and deployment
- Tool attachment (Bing Grounding, Azure AI Search, code execution)
- Audit trails at the Foundry level
- Horizontal scaling independent of application logic

**Near-Term Enhancements** (architecture is already ready):

| Capability | Azure Service | Status |
|-----------|--------------|--------|
| Voice meeting transcription (real-time streaming) | Azure Speech SDK + cognitive services | Wired in `TranscriptionAgent` |
| Document intelligence (10-K, prospectus, tax docs) | Azure Document Intelligence | Plugs into `AISearchStore` |
| Client portal (Sarah-facing app) | Same FastAPI + React, new auth scope | Architecture supports it |
| Multi-advisor firm deployment | CosmosDB partitioning already by `/advisor_id` | Config change only |
| Regulatory sweep agent | New Foundry Agent — reads `audit_log` | One new agent |
| ESG scoring integration | Azure AI Search index + new agent | Standard pattern |
| Options strategy agent | Extends `RebalanceAgent` with options chain tool | Tool addition |

**Longer-Term Vision**:

- **Multi-agent negotiation**: Portfolio Construction Agent debates with Risk Advisory Agent before presenting to the advisor — surfacing dissenting views pro-actively
- **Client behavioral coaching**: Sentiment trend analysis across multiple meetings surfaces behavioral biases (loss aversion, recency bias) and suggests advisor framing strategies
- **Firm-wide intelligence**: Anonymized theme signals across all client portfolios surface macro conviction signals before they hit the news
- **Regulatory co-pilot**: Automated Reg BI suitability rationale generation and documentation for every client interaction

---

## Azure Services Used — The Technical Foundation

| Service | Role in Platform | Agent/Component |
|---------|-----------------|-----------------|
| **Azure AI Foundry (Agents v2)** | Agent registration, versioning, hosting | All 15 agents |
| **OpenAI Responses API** | LLM inference via `responses.create()` with `agent_reference` | All agents |
| **gpt-4o** | High-stakes reasoning: meeting intelligence, portfolio construction | TranscriptionAgent, ProfileAgent, RecommendationAgent, SummaryAgent, PortfolioConstructionAgent, AdvisoryAgent, CommunicationAgent |
| **gpt-4o-mini** | High-frequency, cost-efficient tasks | SentimentAgent, PIIAgent, NewsAgent, BacktestingAgent, RebalanceAgent, MarketRegimeAgent, RiskAdvisoryAgent, TaxAgent |
| **Azure Bing Search** | Real-time market grounding | NewsAgent, MarketRegimeAgent, AdvisoryAgent, TaxAgent, CommunicationAgent |
| **Azure Cosmos DB** | Session state, client profiles, audit log — 7 containers | CosmosStore (all workflows) |
| **Azure AI Search** | Hybrid semantic search over meeting summaries + documents | SearchStore |
| **Azure Text Analytics** | Real-time sentiment scoring (no-LLM hot path) | SentimentAgent |
| **Azure Speech SDK** | Audio transcription streaming | TranscriptionAgent |
| **Azure Entra ID (ClientSecretCredential)** | Auth to all Azure services | All services |
| **Microsoft Agent Framework (MAF)** | Workflow orchestration, DAG execution, HITL checkpoints | MeetingWorkflow, PortfolioWorkflow, AdvisoryWorkflow, ClientServiceWorkflow |

---

## Code Architecture Principles

### 1. Every Agent is a Foundry Agent (not a raw API call)

```python
# backend/app/agents/base_agent.py
class FoundryAgentBase:
    """Every agent registers in Azure AI Foundry on first run.
       System prompt is versioned. Model deployment is configurable per environment.
       Bing grounding is a flag — any agent can be grounded."""

    def _ensure_agent_exists(self) -> str:
        """Register agent in Foundry project if not already present."""
        client = _get_project_client()
        tools = [BingGroundingTool(...)] if self.USE_BING else []
        agent = client.agents.create_agent(
            model=self._resolve_model(),
            name=self.AGENT_NAME,
            instructions=self.SYSTEM_PROMPT,
            tools=tools,
        )
        return agent.id
```

### 2. Human-in-the-Loop is Architecturally Enforced

Gates are not optional UI elements. They are coded into the workflow state machine:

```python
# MeetingWorkflow — Gate 1 is structurally required
async def process_transcript_segment(self, text: str, speaker: str) -> dict:
    # ... agents run ...
    self.state.status = MeetingWorkflowStatus.AWAITING_APPROVAL
    self.state.gate = MeetingGate.RECOMMENDATION_REVIEW
    # Workflow stops here until approve_gate() is called
    return {"status": "awaiting_gate_1", "recommendations": self.state.recommendations}

async def approve_gate(self, gate: MeetingGate, advisor_id: str, notes: str) -> dict:
    await _log_event(AuditEventType.GATE_DECISION, ...)  # Immutable
    # Only now does the workflow proceed
```

### 3. Cosmos DB is the Source of Truth for All State

All workflow state is persisted to Cosmos DB — not held in memory. This means:
- Server restarts don't lose workflow state
- Multiple server instances can collaborate
- Human gate decisions survive any infrastructure event
- Full replay capability for compliance investigation

### 4. Parallel Execution Where Possible

```python
# AdvisoryWorkflow runs 4 agents simultaneously
news, tax_analysis, briefing, relationship = await asyncio.gather(
    run_news(), run_tax(), run_advisory(), run_relationship(),
    return_exceptions=True,  # One failure doesn't kill the rest
)
```

The Portfolio workflow's Fundamentals and Technicals scoring stages run in parallel. Total latency is bounded by the slowest agent, not the sum.

---

## Demo Checklist

Before running this demo, verify:

- [ ] Backend running on `:8000` — `run_backend.bat`
- [ ] Frontend running on `:5173` — `run_frontend.bat`
- [ ] Azure AI Foundry project endpoint configured in `.env`
- [ ] Cosmos DB endpoint and credentials active
- [ ] Bing Search key active (required for NewsAgent, AdvisoryAgent, MarketRegimeAgent, TaxAgent, CommunicationAgent)
- [ ] Sarah Chen client record created in the system
- [ ] Audio file ready OR use `python tests/run_scenario.py sarah_chen` for transcript injection

**For a live audience demo**: Use the transcript injector (not audio) — it's faster, more reliable, and lets you control the pacing of each reveal.

---

## Closing Message to the Audience

*"Wealth management has always been a relationship business. AI doesn't change that. What it changes is the advisor's capacity to serve those relationships at a level of depth, speed, and consistency that was previously impossible.*

*Sarah Chen's advisor — using this platform — walked into their second meeting knowing Sarah's exact tax exposure, the market regime signal on her biggest risk position, three tax strategies worth $63K in savings, and exactly what relationship idea would land with her.*

*That advisor doesn't just seem smarter. They ARE smarter — because they have 15 specialized AI agents running in the background, every 30 minutes, 24/7, ensuring nothing falls through the cracks.*

*This is what Azure AI Foundry enables: not a chatbot bolted onto an existing product, but a purpose-built, multi-agent intelligence layer woven into the fabric of the advisor's entire workflow — from the first handshake to the last rebalance.*

*The art of the possible is not 'what if AI could help advisors?' — we're past that question. The art of the possible is: how many Sarah Chens can one exceptional advisor serve when they have the right AI infrastructure behind them?"*

---

*Document version: 1.0 | March 2026 | Capmarket AI Wealth Advisor Platform*
