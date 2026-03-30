import axios from 'axios'
import type {
  ClientProfile,
  MeetingSession,
  PortfolioProposal,
  AuditEntry,
  PreMeetingResult,
  WatchData,
  WatchSnapshot,
} from '@/types'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// ── Advisor identity — updated via AdvisorContext when user switches advisor ─
let _advisorId: string = localStorage.getItem('capmarket_advisor_id') ?? 'alex_morgan'

export const getAdvisorId = (): string => _advisorId
export const setAdvisorId = (id: string): void => { _advisorId = id }

/** @deprecated Use getAdvisorId() so the value stays reactive. */
export const ADVISOR_ID = getAdvisorId

// ── Backend → frontend normalizer ─────────────────────────────────────────
// The backend Pydantic model uses different field names than the flat
// frontend type.  Map them here so the rest of the UI stays unchanged.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeClient(c: any): ClientProfile {
  return {
    ...c,
    // Identifiers
    id:        c.id        ?? c.client_id,
    client_id: c.client_id ?? c.id,

    // Flat convenience accessors (drive table + cards)
    aum:           c.aum ?? c.investable_assets ?? c.net_worth ?? 0,
    risk_tolerance: c.risk_tolerance ?? c.risk_profile?.tolerance ?? 'moderate',
    tax_bracket:   c.tax_bracket ?? (c.tax_profile?.federal_bracket
      ? Math.round(c.tax_profile.federal_bracket * 100)
      : undefined),

    // Age from DOB when not stored explicitly
    age: c.age ?? (c.date_of_birth
      ? Math.floor((Date.now() - new Date(c.date_of_birth).getTime()) / (365.25 * 24 * 3600 * 1000))
      : undefined),

    // Family / employment defaults
    marital_status:       c.marital_status       ?? 'single',
    number_of_dependents: c.number_of_dependents ?? 0,
    dependent_ages:       c.dependent_ages       ?? [],
    employment_status:    c.employment_status     ?? 'employed',
    life_stage:           c.life_stage            ?? 'accumulation',

    // Financials
    annual_income:         c.annual_income         ?? 0,
    household_income:      c.household_income      ?? c.annual_income ?? 0,
    net_worth:             c.net_worth             ?? 0,
    investable_assets:     c.investable_assets      ?? 0,
    monthly_expenses:      c.monthly_expenses      ?? 0,
    monthly_debt_payments: c.monthly_debt_payments ?? 0,
    emergency_fund_months: c.emergency_fund_months ?? 0,

    // Relationship
    relationship_since: c.relationship_since ?? c.relationship_start,

    // AI-extracted
    concerns:     c.concerns     ?? c.extracted_concerns    ?? [],
    life_events:  c.life_events  ?? c.extracted_life_events ?? [],
    preferences:  c.preferences  ?? c.extracted_preferences ?? [],

    goals: c.goals ?? [],
  }
}

// ── Clients ────────────────────────────────────────────────────────────────

export const clientsApi = {
  list: (params?: { advisor_id?: string; query?: string }) =>
    api.get<ClientProfile[]>('/clients', { params: { advisor_id: _advisorId, ...params } })
      .then(r => r.data.map(normalizeClient)),

  get: (id: string) =>
    api.get<ClientProfile>(`/clients/${id}`, { params: { advisor_id: _advisorId } })
      .then(r => normalizeClient(r.data)),

  create: (payload: Partial<ClientProfile> & { advisor_id?: string } & {
    investable_assets?: number
    risk_tolerance?: string
    risk_capacity?: string
    investment_horizon_years?: number
    primary_goal_type?: string
    has_401k?: boolean
    retirement_contribution_annual?: number
    ira_balance?: number
    roth_ira_balance?: number
    hsa_balance?: number
    has_life_insurance?: boolean
    life_insurance_amount?: number
    has_disability_insurance?: boolean
    has_ltc_insurance?: boolean
    has_will?: boolean
    has_trust?: boolean
  }) =>
    api.post<ClientProfile>('/clients', { advisor_id: _advisorId, ...payload }).then(r => r.data),

  update: (id: string, payload: Partial<ClientProfile>) =>
    api.put<ClientProfile>(`/clients/${id}`, payload, { params: { advisor_id: _advisorId } }).then(r => r.data),

  meetings: (id: string) =>
    api.get<MeetingSession[]>(`/clients/${id}/meetings`).then(r =>
      r.data.map(m => ({ ...m, id: m.id ?? (m as any).session_id }))
    ),

  portfolios: (id: string) =>
    api.get<PortfolioProposal[]>(`/clients/${id}/portfolios`).then(r => r.data),

  mergeProfile: (clientId: string, sessionId: string) =>
    api.post(`/clients/${clientId}/merge-profile`, null, {
      params: { session_id: sessionId, advisor_id: _advisorId },
    }).then(r => r.data),

  remove: (id: string) =>
    api.delete(`/clients/${id}`, { params: { advisor_id: _advisorId } }).then(r => r.data),
}

// ── Meetings ───────────────────────────────────────────────────────────────

export const meetingsApi = {
  start: (payload: {
    client_id?: string
    advisor_id: string
    meeting_type: string
    is_prospective?: boolean
    metadata?: Record<string, unknown>
  }) =>
    // Normalize response: backend returns session_id, we expose as id
    api.post<Record<string, unknown>>('/meetings/start', payload).then(r => ({
      ...r.data,
      id: (r.data.id ?? r.data.session_id) as string,
    })),

  preBriefing: (payload: { client_id: string; advisor_id: string; meeting_type?: string }) =>
    api.post('/meetings/pre-briefing', payload).then(r => r.data),

  get: (id: string) =>
    api.get<MeetingSession>(`/meetings/${id}`).then(r => r.data),

  status: (id: string) =>
    api.get(`/meetings/${id}/status`).then(r => r.data),

  addTranscript: (id: string, text: string, speakerHint = 'client') =>
    api.post(`/meetings/${id}/transcript`, { text, speaker_hint: speakerHint }).then(r => r.data),

  addAudioChunk: (id: string, audioBase64: string, speakerHint = 'client') =>
    api.post(`/meetings/${id}/audio`, {
      session_id: id,
      audio_base64: audioBase64,
      speaker_hint: speakerHint,
    }).then(r => r.data),

  recommend: (id: string, profile?: Record<string, unknown>) =>
    api.post(`/meetings/${id}/recommend`, profile ?? null).then(r => r.data),

  approveRecommendations: (id: string, approved: string[], rejected: string[]) =>
    api.post(`/meetings/${id}/approve-recommendations`, { approved_ids: approved, rejected_ids: rejected }).then(r => r.data),

  finalize: (id: string, payload?: Record<string, unknown>) =>
    api.post(`/meetings/${id}/finalize`, payload ?? {}).then(r => r.data),

  complete: (id: string) =>
    api.post<Record<string, unknown>>(`/meetings/${id}/complete`, { approved_by: _advisorId }).then(r => r.data),

  /**
   * Stop recording and run the full automated post-meeting pipeline:
   * recommendations → auto-approve → summarize + action items → persist to Cosmos.
   * All steps are correlated by session_id in the audit trail.
   */
  stopAndComplete: (id: string, profile?: Record<string, unknown>) =>
    api.post<Record<string, unknown>>(`/meetings/${id}/stop`, {
      client_profile: profile ?? {},
      approved_by: _advisorId,
    }).then(r => r.data),

  /** Promote an AI-extracted prospect to a permanent CRM client. */
  promoteToClient: (id: string, overrides: Record<string, unknown>) =>
    api.post<Record<string, unknown>>(`/meetings/${id}/promote-to-client`, overrides).then(r => r.data),

  /** TEST/DEMO: inject pre-written segments, bypassing audio. */
  injectTranscript: (id: string, segments: { speaker: string; text: string }[], delayMs = 0) =>
    api.post<Record<string, unknown>>(`/meetings/${id}/inject-transcript`, { segments, delay_ms: delayMs }).then(r => r.data),

  byClient: (clientId: string) =>
    api.get<MeetingSession[]>(`/meetings/client/${clientId}`).then(r => r.data),
}

// ── Portfolio ──────────────────────────────────────────────────────────────

export const portfolioApi = {
  run: (payload: { client_id: string; advisor_id: string; client_profile: Record<string, unknown>; constraints?: Record<string, unknown> }) =>
    api.post<{ run_id: string; status: string }>('/portfolio/run', payload).then(r => r.data),

  getStatus: (runId: string) =>
    api.get(`/portfolio/runs/${runId}`).then(r => r.data),

  gate: (runId: string, decision: 'approve' | 'reject', feedback?: string) =>
    api.post(`/portfolio/runs/${runId}/gate`, {
      approved: decision === 'approve',
      approved_by: getAdvisorId(),
      notes: feedback ?? '',
    }).then(r => r.data),

  checkpoints: () =>
    api.get('/portfolio/checkpoints').then(r => r.data),
  deleteCheckpoint: (runId: string) =>
    api.delete(`/portfolio/checkpoints/${runId}`).then(r => r.data),

  retry: (runId: string, step: 'sense' | 'think') =>
    api.post(`/portfolio/runs/${runId}/retry`, { step }).then(r => r.data),

  get: (id: string) =>
    api.get<PortfolioProposal>(`/portfolio/${id}`).then(r => r.data),

  approve: (id: string) =>
    api.post(`/portfolio/${id}/approve`).then(r => r.data),

  reject: (id: string, reason: string) =>
    api.post(`/portfolio/${id}/reject`, { reason }).then(r => r.data),

  byClient: (clientId: string) =>
    api.get<PortfolioProposal[]>(`/portfolio/client/${clientId}`).then(r => r.data),

  byAdvisor: (advisorId: string) =>
    api.get<PortfolioProposal[]>(`/portfolio/advisor/${advisorId}`).then(r => r.data),

  monitor: (portfolioId: string, clientId: string) =>
    api.post(`/portfolio/${portfolioId}/monitor?client_id=${clientId}`).then(r => r.data),

  watchCycle: (portfolioId: string, clientId: string) =>
    api.post(`/portfolio/${portfolioId}/watch-cycle?client_id=${clientId}`).then(r => r.data),

  backtest: (portfolioId: string, clientId: string, opts?: { start_date?: string; end_date?: string; benchmark?: string }) =>
    api.post(`/portfolio/${portfolioId}/backtest?client_id=${clientId}`, opts ?? {}).then(r => r.data),

  backtestHistory: (portfolioId: string, clientId: string) =>
    api.get(`/portfolio/${portfolioId}/backtest-history?client_id=${clientId}`).then(r => r.data),

  rebalance: (portfolioId: string, clientId: string) =>
    api.post(`/portfolio/${portfolioId}/rebalance?client_id=${clientId}`).then(r => r.data),

  rebalanceHistory: (portfolioId: string, clientId: string) =>
    api.get(`/portfolio/${portfolioId}/rebalance-history?client_id=${clientId}`).then(r => r.data),

  watch: (portfolioId: string, clientId: string) =>
    api.get<WatchData>(`/portfolio/${portfolioId}/watch?client_id=${clientId}`).then(r => r.data),

  watchHistory: (portfolioId: string, clientId: string) =>
    api.get<WatchSnapshot[]>(`/portfolio/${portfolioId}/watch-history?client_id=${clientId}`).then(r => r.data),
}

// ── Advisory ──────────────────────────────────────────────────────────────

export const advisoryApi = {
  preMeeting: (payload: { advisor_id: string; client_profile: Record<string, unknown>; meeting_type?: string }) =>
    api.post<PreMeetingResult>('/advisory/pre-meeting', payload).then(r => r.data),

  positionBriefing: (payload: { advisor_id: string; client_profile: Record<string, unknown>; timeframe_days?: number }) =>
    api.post<Record<string, unknown>>('/advisory/position-briefing', payload).then(r => r.data),

  taxStrategies: (payload: { advisor_id: string; client_profile: Record<string, unknown>; tax_year?: number }) =>
    api.post('/advisory/tax-strategies', payload).then(r => r.data),

  chat: (payload: { advisor_id: string; question: string; client_profile?: Record<string, unknown>; context?: string }) =>
    api.post('/advisory/chat', payload).then(r => r.data),

  relationshipIdeas: (payload: { advisor_id: string; client_profile: Record<string, unknown> }) =>
    api.post('/advisory/relationship-ideas', payload).then(r => r.data),

  history: (advisorId: string, clientId?: string, briefingType?: string) =>
    api.get('/advisory/history', { params: { advisor_id: advisorId, client_id: clientId, briefing_type: briefingType } }).then(r => r.data),
}

// ── Client Assistant ───────────────────────────────────────────────────────

export const assistantApi = {
  query: (payload: { client_id: string; advisor_id: string; query: string; client_profile: Record<string, unknown>; portfolio_snapshot?: Record<string, unknown> }) =>
    api.post('/assistant/query', payload).then(r => r.data),

  news: (payload: { client_id: string; advisor_id: string; client_profile: Record<string, unknown>; portfolio: Record<string, unknown> }) =>
    api.post('/assistant/news', payload).then(r => r.data),

  document: (payload: { client_id: string; advisor_id: string; client_profile: Record<string, unknown>; document_type: string }) =>
    api.post('/assistant/document', payload).then(r => r.data),

  history: (clientId: string, limit = 20) =>
    api.get(`/assistant/history/${clientId}`, { params: { limit } }).then(r => r.data),
}

// ── Audit ──────────────────────────────────────────────────────────────────

export const auditApi = {
  log: (params?: { client_id?: string; session_id?: string; advisor_id?: string; event_type?: string; limit?: number; offset?: number }) =>
    api.get<AuditEntry[]>('/audit/log', { params }).then(r => r.data),

  session: (sessionId: string) =>
    api.get<AuditEntry[]>(`/audit/session/${sessionId}`).then(r => r.data),

  client: (clientId: string) =>
    api.get<AuditEntry[]>(`/audit/client/${clientId}`).then(r => r.data),
}

// ── Health ─────────────────────────────────────────────────────────────────

export const healthApi = {
  check: () => api.get('/health').then(r => r.data),
}

export default api
