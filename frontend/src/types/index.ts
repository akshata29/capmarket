// ── Domain types shared between frontend and API ──────────────────────────

export type RiskTolerance  = 'very_conservative' | 'conservative' | 'moderate' | 'moderately_aggressive' | 'aggressive'
export type MeetingStatus  = 'scheduled' | 'pre_briefing' | 'active' | 'processing' | 'review' | 'completed'
export type MeetingType    = 'annual_review' | 'portfolio_review' | 'onboarding' | 'adhoc' | 'tax_planning'
export type SignalDirection = 'BUY' | 'SELL' | 'HOLD'
export type WorkflowStage  = 'sense' | 'gate1' | 'think' | 'gate2' | 'act' | 'gate3' | 'completed'

export type MaritalStatus   = 'single' | 'married' | 'divorced' | 'widowed' | 'domestic_partner' | 'separated'
export type EmploymentStatus = 'employed' | 'self_employed' | 'retired' | 'unemployed' | 'student' | 'part_time' | 'disability'
export type LifeStage       = 'early_career' | 'accumulation' | 'pre_retirement' | 'retirement' | 'distribution' | 'wealth_transfer'
export type GoalType        = 'retirement' | 'education' | 'home_purchase' | 'business_investment' | 'emergency_fund' | 'income_generation' | 'estate_transfer' | 'charitable' | 'debt_payoff' | 'major_purchase' | 'custom'

// ── Sub-models ──────────────────────────────────────────────────────────────

export interface InsuranceCoverage {
  life_insurance_type:         string
  life_insurance_amount:       number
  disability_insurance:        boolean
  disability_monthly_benefit:  number
  long_term_care_insurance:    boolean
  ltc_daily_benefit:           number
  umbrella_policy:             boolean
  umbrella_limit:              number
  notes:                       string
}

export interface EstatePlanningProfile {
  has_will:                 boolean
  has_revocable_trust:      boolean
  has_irrevocable_trust:    boolean
  has_power_of_attorney:    boolean
  has_healthcare_directive: boolean
  beneficiaries_updated:    boolean
  estate_value_estimate:    number
  charitable_intent:        boolean
  charitable_entity:        string
  notes:                    string
}

export interface RiskProfile {
  tolerance:                    RiskTolerance
  risk_capacity:                RiskTolerance  // financial ABILITY to absorb risk
  investment_horizon_years:     number
  liquidity_needs:              string
  income_stability:             string
  max_drawdown_tolerance:       number
  equity_allocation_target:     number
  fixed_income_target:          number
  alternatives_target:          number
  esg_preference:               boolean
  investment_experience_years:  number
  previous_investing_behavior:  string
  loss_aversion_score:          number   // 0=fearless, 1=extreme
  behavioral_notes:             string
  risk_score?:                  number   // 1–10 composite
  assessed_at?:                 string
  assessed_by:                  string
}

export interface TaxProfile {
  filing_status:                    string
  federal_bracket:                  number
  state:                            string
  state_rate:                       number
  estimated_income:                 number
  capital_gains_preference:         string
  tax_loss_harvesting_enabled:      boolean
  has_401k:                         boolean
  retirement_contribution_annual:   number
  k401_balance:                     number
  ira_balance:                      number
  roth_ira_balance:                 number
  hsa_balance:                      number
  pension_monthly_income:           number
  social_security_eligible:         boolean
  social_security_monthly_estimate: number
  notes:                            string
}

// ── Client ─────────────────────────────────────────────────────────────────

export interface InvestmentGoal {
  goal_id?:             string
  goal_type:            GoalType
  name?:                string
  target_amount?:       number
  target_date?:         string
  current_amount?:      number
  monthly_contribution?: number
  priority:             number   // 1=highest
  notes?:               string
}

export interface ClientProfile {
  // Identifiers
  id: string
  client_id?: string
  advisor_id: string
  status: 'active' | 'prospect' | 'inactive' | 'vip'

  // Personal
  first_name: string
  last_name:  string
  email:      string
  phone?:     string
  date_of_birth?: string
  age?:       number
  citizenship?: string

  // Family
  marital_status?:       MaritalStatus
  spouse_name?:          string
  spouse_age?:           number
  spouse_employment?:    EmploymentStatus
  spouse_annual_income?: number
  number_of_dependents?: number
  dependent_ages?:       number[]
  has_elderly_parents?:  boolean

  // Employment
  employment_status?:   EmploymentStatus
  employer?:            string
  job_title?:           string
  industry?:            string
  years_with_employer?: number

  // Life stage & retirement
  life_stage?:              LifeStage
  expected_retirement_age?: number
  years_to_retirement?:     number

  // Financials — flat accessors used by normalizeClient
  aum:          number   // mapped from investable_assets
  risk_tolerance: RiskTolerance   // mapped from risk_profile.tolerance
  tax_bracket?:  number  // mapped from tax_profile.federal_bracket %

  // Household financials
  annual_income?:         number
  household_income?:      number
  net_worth?:             number
  investable_assets?:     number
  monthly_expenses?:      number
  monthly_debt_payments?: number
  emergency_fund_months?: number

  // Debt
  total_debt?:            number
  has_mortgage?:          boolean
  mortgage_balance?:      number
  mortgage_rate?:         number
  student_loan_balance?:  number
  auto_loan_balance?:     number
  credit_card_balance?:   number

  // Nested profiles
  risk_profile?:    RiskProfile
  goals?:           InvestmentGoal[]
  tax_profile?:     TaxProfile
  insurance?:       InsuranceCoverage
  estate_planning?: EstatePlanningProfile

  // Relationship
  relationship_since?: string
  meeting_count?:      number
  satisfaction_score?: number

  // AI-extracted (life events may be strings or structured {event, timeline, ...} objects)
  life_events?:  (string | Record<string, unknown>)[]
  concerns?:     string[]
  preferences?:  string[]

  // Segmentation
  tags?:    string[]
  segment?: string

  created_at: string
  updated_at: string
}

export interface AccountHolding {
  ticker: string
  name: string
  quantity: number
  current_price: number
  market_value: number
  weight: number
  asset_class: string
}

// ── Meeting ────────────────────────────────────────────────────────────────

export interface MeetingSession {
  id: string
  session_id?: string
  client_id: string
  advisor_id: string
  meeting_type: MeetingType
  status: MeetingStatus
  title?: string
  started_at?: string
  completed_at?: string
  pre_briefing?: PreMeetingBriefing
  transcript?: TranscriptSegment[]
  full_transcript?: string          // raw text stored in completed session doc
  redacted_transcript?: string
  sentiment?: SentimentScore
  recommendations?: Recommendation[]
  profile_extractions?: Record<string, unknown>
  summary?: MeetingSummary
  compliance_flags?: ComplianceFlag[]
  linked_client_id?: string         // set on prospect sessions after promote-to-client
}

export interface TranscriptSegment {
  id: string
  speaker: string
  role: 'advisor' | 'client' | 'system'
  text: string
  timestamp: string
  sentiment_score?: number
  is_pii_redacted?: boolean
}

export interface SentimentScore {
  overall: number
  investment_readiness: number
  risk_appetite: number
  engagement: number
  compliance_flag: string   // "none" | "warning" | "critical"
  compliance_notes?: string[]
  life_event_signals?: string[]
  key_themes?: string[]
  investment_concerns?: string[]
}

export interface Recommendation {
  id: string
  ticker?: string
  action: SignalDirection
  rationale: string
  conviction: 'high' | 'medium' | 'low'
  compliance_approved?: boolean
  category: string
}

export interface MeetingSummary {
  advisor_summary: string
  client_summary: string
  compliance_summary: string
  action_items: string[]
  key_decisions: string[]
}

export interface PreMeetingBriefing {
  talking_points: string[]
  client_updates: string[]
  market_alerts: string[]
  tax_opportunities: string[]
  relationship_ideas: string[]
}

export interface ComplianceFlag {
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  regulation: string
}

// ── Portfolio ─────────────────────────────────────────────────────────────

export interface PortfolioProposal {
  id: string
  client_id: string
  status: WorkflowStage
  themes: Theme[]
  positions: Position[]
  metrics?: PortfolioMetrics
  backtest?: BacktestResult
  created_at: string
}

export interface Theme {
  name: string
  description: string
  weight_target: number
  active: boolean
  tickers: string[]
}

export interface Position {
  ticker: string
  name: string
  weight: number
  target_weight: number
  asset_class: string
  signal: SignalDirection
  conviction: 'high' | 'medium' | 'low'
  rationale?: string
}

export interface PortfolioMetrics {
  expected_return: number
  volatility: number
  sharpe_ratio: number
  max_drawdown: number
  beta: number
  hhi: number
}

export interface BacktestResult {
  cagr: number
  volatility: number
  sharpe: number
  max_drawdown: number
  win_rate: number
  period_years: number
}

// ── Audit ──────────────────────────────────────────────────────────────────

export interface AuditEntry {
  id: string
  event_type: string
  session_id?: string
  client_id?: string
  advisor_id?: string
  agent_name?: string
  description?: string           // human-readable event description
  agent_input?: Record<string, unknown>
  agent_output?: Record<string, unknown>
  payload?: Record<string, unknown>    // primary event data (from backend AuditEntry.payload)
  duration_ms?: number
  timestamp: string
  metadata?: Record<string, unknown>   // secondary / legacy field
}

// ── Advisory ──────────────────────────────────────────────────────────────

export interface PreMeetingResult {
  session_id: string
  client_id: string
  news: NewsAlert[]
  tax_strategies: TaxStrategy[]
  relationship_ideas: string[]
  talking_points: string[]
  generated_at: string
}

export interface NewsAlert {
  headline: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  tickers_affected: string[]
  action_required: string
  source?: string
}

export interface TaxStrategy {
  strategy: string
  estimated_savings?: number
  timeline: string
  priority: 'high' | 'medium' | 'low'
  action_required: string
}

// ── API responses ──────────────────────────────────────────────────────────

export interface ApiError {
  detail: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  limit: number
  offset: number
}

// ── Autonomous Watch Cycle ─────────────────────────────────────────────────

export type RegimeLabel   = 'BEARISH_VOL' | 'BULL' | 'NEUTRAL' | 'RISK_OFF' | 'VOLATILE'
export type SelloffRisk   = 'ELEVATED' | 'MODERATE' | 'LOW'
export type AtrRegime     = 'NORMAL' | 'ELEVATED' | 'HIGH'
export type VixTermStruct = 'BACKWARDATION' | 'CONTANGO' | 'FLAT'
export type RiskLevel     = 'elevated' | 'moderate' | 'low'
export type SentimentTrend = 'deteriorating' | 'stable' | 'improving'
export type AdvisoryAction = 'add_hedge' | 'tighten_stop' | 'watch_closely' | 'reduce_position' | 'take_profit'
export type RecommPriority = 'critical' | 'high' | 'medium'

export interface MarketRegime {
  regime:           RegimeLabel
  regime_detail:    string
  selloff_risk:     SelloffRisk
  vix:              number
  vix_term_structure: VixTermStruct
  vix_term_ratio:   number
  rolling_20d_vol:  number
  todays_succ:      number
  succ_range_pct:   number
  atr_regime:       AtrRegime
  size_factor:      number
  macro_narrative:  string
  key_risks:        string[]
  confidence:       number
}

export interface RebalanceProximity {
  weight_drift:      number   // 0.0–1.0
  vol_cap:           number
  theme_confidence:  number
  correlation:       number
  options_roll:      number
}

export interface WatchRecommendation {
  symbol:     string
  action:     AdvisoryAction
  priority:   RecommPriority
  rationale:  string
  weight_pct: number
}

export interface RiskAdvisory {
  risk_level:        RiskLevel
  sentiment_trend:   SentimentTrend
  total_signals:     number
  advisory_narrative: string
  rebalance_proximity: RebalanceProximity
  recommendations:   WatchRecommendation[]
  portfolio_exposure_summary: {
    sector_concentration: string
    key_risk_factors:     string[]
    estimated_portfolio_beta: number
  }
}

export interface WatchSnapshot {
  cycle_at:       string
  news:           Record<string, unknown>
  regime:         MarketRegime
  advisory:       RiskAdvisory
  tickers_scanned: string[]
}

export interface WatchData {
  portfolio_id:          string
  client_id:             string
  inception_date:        string
  positions:             Position[]
  themes:                (string | { name: string; confidence?: number })[]
  metrics:               Record<string, number>
  rationale:             string
  equity_curve:          Record<string, unknown>   // BacktestingAgent result
  last_monitor:          Record<string, unknown> | null
  last_rebalance:        Record<string, unknown> | null
  last_monitored_at:     string | null
  last_rebalance_at:     string | null
  investment_amount:     number
  status:                string
  mandate:               string
  last_watch_snapshot:   WatchSnapshot | null
  last_watch_cycle_at:   string | null
}
