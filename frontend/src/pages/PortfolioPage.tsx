import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Loader2, Play, RefreshCw, ArrowLeft, Activity } from 'lucide-react'
import { portfolioApi, clientsApi, getAdvisorId } from '@/api'
import type { ClientProfile } from '@/types'
import AllocationChart from '@/components/portfolio/AllocationChart'
import PositionTable from '@/components/portfolio/PositionTable'
import WorkflowProgress from '@/components/portfolio/WorkflowProgress'

interface MarketTheme { theme: string; summary?: string; description?: string; advisor_talking_points?: string[] }
interface ProposalTheme { name: string; weight: number; description?: string }
interface ProposalPosition { ticker: string; name?: string; weight: number; target_weight?: number; asset_class?: string; rationale?: string }
interface RiskMetrics { estimated_volatility: number; estimated_sharpe: number; max_drawdown_estimate: number; hhi: number; beta_estimate: number }
interface ConstraintCheck { value: number | string; status: 'pass' | 'fail' | 'warn' }
interface ProposalData {
  portfolio_rationale?: string
  construction_notes?: string
  themes?: ProposalTheme[]
  positions?: ProposalPosition[]
  risk_metrics?: RiskMetrics
  constraint_checks?: Record<string, ConstraintCheck>
  // legacy fields
  metrics?: Record<string, number>
  backtest?: Record<string, number>
}
interface BacktestData { period_years?: number; cagr?: number; volatility?: number; sharpe?: number; max_drawdown?: number; win_rate?: number }
interface MonitorResult {
  monitored_at?: string
  tickers_scanned?: string[]
  news?: MarketNews
  rebalance?: { triggers_fired?: string[]; proposed_trades?: { direction: string; symbol: string; shares: number; rationale: string; priority: number }[]; rebalance_rationale?: string; turnover_pct?: number }
}
interface NewsItem { headline: string; source?: string; relevance?: string; suggested_advisor_talking_points?: string[] }
interface PortfolioImpact { ticker: string; headline: string; impact?: string; urgency?: string; talking_points?: string[] }
interface MarketNews {
  macro_briefing?: string
  critical_alerts?: NewsItem[]
  high_priority?: NewsItem[]
  market_themes?: MarketTheme[]
  portfolio_impacts?: PortfolioImpact[]
}

interface RunState {
  run_id: string
  client_id?: string
  status: string
  stage: string
  current_step?: string
  gate?: string | null
  themes?: MarketTheme[]
  market_news?: MarketNews
  proposal?: ProposalData
  backtest?: BacktestData
  universe_size?: number
  error?: string
}

interface Checkpoint {
  run_id?: string
  workflow_id?: string
  gate?: string
  client_id: string
  created_at?: string
}

function deriveStage(status: string, gate: string | null | undefined, currentStep: string, prevStage?: string): string {
  if (status === 'completed') return 'completed'
  if (status === 'failed') return prevStage ?? 'sense'  // keep the stage where it failed
  if (status === 'awaiting_approval') {
    if (gate === 'theme_activation') return 'gate1'
    if (gate === 'portfolio_approval') return 'gate2'
    if (gate === 'trade_execution') return 'gate3'
  }
  if (status === 'running') {
    const step = (currentStep ?? '').toLowerCase()
    if (step.includes('universe') || step.includes('construct')) return 'think'
    if (step.includes('backtest') || step.includes('persist') || step.includes('executing')) return 'act'
    // Don't flash back to sense — preserve the last known stage while the background task transitions
    return prevStage ?? 'sense'
  }
  return prevStage ?? 'sense'
}

function mergeRunState(res: RunState, prev: RunState | null): RunState {
  return {
    ...res,
    stage: deriveStage(res.status, res.gate, res.current_step ?? '', prev?.stage),
    proposal: (res.proposal && Object.keys(res.proposal).length > 0) ? res.proposal : prev?.proposal,
    market_news: (res.market_news && Object.keys(res.market_news).length > 0) ? res.market_news : prev?.market_news,
    themes: (res.themes && res.themes.length > 0) ? res.themes : prev?.themes,
  }
}

export default function PortfolioPage() {
  const [clients, setClients] = useState<ClientProfile[]>([])
  const [selectedClient, setSelectedClient] = useState<string>('')
  const [running, setRunning] = useState<RunState | null>(null)
  const [loading, setLoading] = useState(false)
  const [polling, setPolling] = useState(false)
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([])
  const [monitoring, setMonitoring] = useState(false)
  const [monitorResult, setMonitorResult] = useState<MonitorResult | null>(null)
  const [searchParams] = useSearchParams()

  useEffect(() => {
    clientsApi.list().then(setClients).catch(() => {})
    portfolioApi.checkpoints().then(setCheckpoints).catch(() => {})
  }, [])

  // Auto-load a specific run when ?run=<run_id> is in the URL
  useEffect(() => {
    const runId = searchParams.get('run')
    if (!runId || running) return
    setLoading(true)
    portfolioApi.getStatus(runId)
      .then(res => setRunning(mergeRunState(res, null)))
      .catch(() => {})
      .finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  // Poll for status while a run is active and not terminal
  useEffect(() => {
    if (!running || running.status === 'completed' || running.status === 'failed' || running.status === 'rejected') return
    const timer = setTimeout(async () => {
      setPolling(true)
      try {
        const res = await portfolioApi.getStatus(running.run_id)
        setRunning(prev => mergeRunState(res, prev))
      } catch (err: unknown) {
        if ((err as { response?: { status?: number } })?.response?.status === 404) setRunning(null)
      } finally {
        setPolling(false)
      }
    }, 3000)
    return () => clearTimeout(timer)
  }, [running])

  const startRun = async () => {
    if (!selectedClient) return
    const client = clients.find(c => c.id === selectedClient)
    if (!client) return
    setLoading(true)
    try {
      const res = await portfolioApi.run({
        client_id: selectedClient,
        advisor_id: getAdvisorId(),
        client_profile: client as unknown as Record<string, unknown>,
      })
      setRunning({ run_id: res.run_id, client_id: selectedClient, status: res.status, stage: 'sense' })
    } finally {
      setLoading(false)
    }
  }

  const dismissCheckpoint = async (runId: string) => {
    try {
      await portfolioApi.deleteCheckpoint(runId)
    } catch { /* best-effort */ }
    setCheckpoints(prev => prev.filter(c => (c.run_id ?? c.workflow_id) !== runId))
  }

  const reviewCheckpoint = async (cp: Checkpoint) => {
    const runId = cp.run_id ?? cp.workflow_id ?? ''
    setLoading(true)
    try {
      const res = await portfolioApi.getStatus(runId)
      setRunning(mergeRunState({ ...res, client_id: cp.client_id }, null))
    } catch {
      // checkpoint exists but workflow not recoverable ... remove it from list
      setCheckpoints(prev => prev.filter(c => (c.run_id ?? c.workflow_id) !== runId))
    } finally {
      setLoading(false)
    }
  }

  const handleGate = async (decision: 'approve' | 'reject') => {
    if (!running) return
    setLoading(true)
    // Optimistically advance state so buttons disappear immediately and stage progresses
    const optimisticStage = decision === 'approve'
      ? (running.stage === 'gate1' ? 'think' : running.stage === 'gate2' ? 'act' : running.stage === 'gate3' ? 'completed' : running.stage)
      : running.stage
    setRunning(prev => prev ? { ...prev, status: decision === 'approve' ? 'running' : 'failed', gate: undefined, stage: optimisticStage } : prev)
    try {
      const res = await portfolioApi.gate(running.run_id, decision)
      // Merge but don't let the stale awaiting_approval response override our optimistic stage
      setRunning(prev => {
        const merged = mergeRunState({ ...res, client_id: prev?.client_id }, prev)
        // Keep our optimistic stage if the API returned stale awaiting_approval state (background task hasn't run yet)
        if (decision === 'approve' && merged.stage === running.stage) merged.stage = optimisticStage
        return merged
      })
      // Refresh checkpoints after a gate decision
      portfolioApi.checkpoints().then(setCheckpoints).catch(() => {})
    } finally {
      setLoading(false)
    }
  }

  const handleMonitor = async () => {
    if (!running?.proposal) return
    const pid = (running.proposal as any).proposal_id ?? (running.proposal as any).run_id ?? running.run_id
    const cid = running.client_id ?? ''
    setMonitoring(true)
    setMonitorResult(null)
    try {
      const result = await portfolioApi.monitor(pid, cid)
      setMonitorResult(result)
    } catch (err) {
      console.error('monitor failed', err)
    } finally {
      setMonitoring(false)
    }
  }

  const handleRetry = async (step: 'sense' | 'think') => {
    if (!running) return
    setLoading(true)
    try {
      await portfolioApi.retry(running.run_id, step)
      setRunning(prev => prev ? { ...prev, status: 'running', stage: step === 'sense' ? 'sense' : 'think', gate: undefined, error: '' } : prev)
    } finally {
      setLoading(false)
    }
  }

  // Deduplicate checkpoints ... keep only the latest per run_id
  const uniqueCheckpoints = Object.values(
    checkpoints.reduce((acc, cp) => {
      const id = cp.run_id ?? cp.workflow_id ?? ''
      if (!acc[id] || (cp.created_at ?? '') > (acc[id].created_at ?? '')) acc[id] = cp
      return acc
    }, {} as Record<string, Checkpoint>)
  )

  const activeRunId = running?.run_id
  const pendingCheckpoints = uniqueCheckpoints.filter(cp => (cp.run_id ?? cp.workflow_id) !== activeRunId)
  const clientName = (id?: string) => {
    const c = clients.find(x => x.id === id)
    return c ? `${c.first_name} ${c.last_name}` : id?.slice(0, 8) ?? '...'
  }

  const news = running?.market_news
  const proposal = running?.proposal

  return (
    <div className="max-w-7xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-100">AI Portfolio Construction</h2>
        <p className="text-sm text-gray-500 mt-0.5">Sense -&gt; Gate 1 -&gt; Think -&gt; Gate 2 -&gt; Act -&gt; Gate 3  - Human-in-the-loop at every stage</p>
      </div>

      {!running && (
        <>
          {/* New run form */}
          <div className="card max-w-md space-y-4">
            <h3 className="text-sm font-semibold text-gray-200">New Portfolio Construction Run</h3>
            <div>
              <label className="section-title">Select Client</label>
              <select value={selectedClient} onChange={e => setSelectedClient(e.target.value)} className="input">
                <option value="">Choose a client...</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.first_name} {c.last_name} (${(c.aum / 1e6).toFixed(1)}M)</option>
                ))}
              </select>
            </div>
            <button onClick={startRun} disabled={!selectedClient || loading} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading ? <Loader2 size={15} className="animate-spin" /> : <Play size={15} />}
              Start AI Construction
            </button>
          </div>

          {/* Pending approvals */}
          {pendingCheckpoints.length > 0 && (
            <div className="card">
              <div className="section-title mb-3">Pending Your Approval</div>
              <div className="space-y-2">
                {pendingCheckpoints.map(cp => {
                  const runId = cp.run_id ?? cp.workflow_id ?? ''
                  const gateLabel = cp.gate === 'theme_activation' ? 'Gate 1 - Theme Approval'
                    : cp.gate === 'portfolio_approval' ? 'Gate 2 - Portfolio Approval'
                    : cp.gate ?? cp.gate
                  return (
                    <div key={runId} className="flex items-center justify-between py-2.5 px-3 bg-surface-50 rounded-lg border border-border">
                      <div className="space-y-0.5">
                        <div className="text-sm font-medium text-gray-200">{clientName(cp.client_id)}</div>
                        <div className="text-xs text-brand-gold">{gateLabel}</div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => reviewCheckpoint(cp)} disabled={loading} className="btn-secondary text-xs">
                          {loading ? <Loader2 size={12} className="animate-spin" /> : 'Review'}
                        </button>
                        <button onClick={() => dismissCheckpoint(runId)} disabled={loading} className="flex items-center gap-1 px-2.5 py-1.5 bg-red-900/20 border border-red-800/50 text-red-400 text-xs rounded-lg hover:bg-red-900/40 transition-colors">
                          Delete
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Active run */}
      {running && (
        <div className="space-y-4">
          {/* Header bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => { setRunning(null); portfolioApi.checkpoints().then(setCheckpoints).catch(() => {}) }} className="text-gray-500 hover:text-gray-300 transition-colors">
                <ArrowLeft size={16} />
              </button>
              <div>
                <span className="text-sm font-semibold text-gray-100">{clientName(running.client_id)}</span>
                <span className="text-xs text-gray-500 ml-2 font-mono">{running.run_id.slice(0, 8)}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {polling && <RefreshCw size={13} className="text-gray-500 animate-spin" />}
              {running.status === 'completed' && (
                <button
                  onClick={handleMonitor}
                  disabled={monitoring}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-brand-teal/40 text-brand-teal hover:bg-brand-teal/10 transition-colors disabled:opacity-50"
                >
                  {monitoring ? <Loader2 size={11} className="animate-spin" /> : <Activity size={11} />}
                  {monitoring ? 'Monitoring...' : 'Monitor Portfolio'}
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Progress sidebar */}
            <div className="card">
              <WorkflowProgress
                currentStage={running.stage}
                currentStep={running.current_step}
                onApprove={() => handleGate('approve')}
                onReject={() => handleGate('reject')}
                loading={loading}
              />
              {(running.status === 'completed' || running.status === 'failed') && (
                <button onClick={() => { setRunning(null); portfolioApi.checkpoints().then(setCheckpoints).catch(() => {}) }} className="btn-secondary w-full mt-4 text-xs">
                  &larr; Back
                </button>
              )}
              {running.status === 'failed' && running.stage !== 'sense' && (
                <div className="mt-3 p-2 bg-red-900/20 border border-red-800 rounded text-xs text-red-400">
                  {running.error ?? 'Workflow failed'}
                </div>
              )}
              {running.status === 'failed' && (
                <div className="mt-3 space-y-2">
                  <button onClick={() => handleRetry('sense')} disabled={loading} className="btn-secondary w-full text-xs flex items-center justify-center gap-1.5">
                    <RefreshCw size={11} /> Retry from Sense
                  </button>
                  {(running.themes ?? []).length > 0 && (
                    <button onClick={() => handleRetry('think')} disabled={loading} className="btn-secondary w-full text-xs flex items-center justify-center gap-1.5">
                      <RefreshCw size={11} /> Retry from Think
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Content panel */}
            <div className="lg:col-span-2 space-y-4">

              {/* Error banner — always shown when workflow failed */}
              {running.status === 'failed' && running.error && (
                <div className="rounded-lg border border-red-700/60 bg-red-900/20 px-4 py-3">
                  <div className="text-xs font-bold text-red-400 uppercase tracking-wide mb-1">Agent Error</div>
                  <p className="text-xs text-red-200/80 leading-relaxed font-mono">{running.error}</p>
                </div>
              )}

              {/* Gate 1: news intelligence */}
              {running.stage === 'gate1' && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Review the AI-identified themes below before approving.</span>
                    <button
                      onClick={() => handleRetry('sense')}
                      disabled={loading}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border text-gray-400 hover:text-gray-200 hover:border-gray-500 transition-colors disabled:opacity-50"
                    >
                      <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
                      Re-scan News
                    </button>
                  </div>
                  {news?.macro_briefing && (
                    <div className="card">
                      <div className="section-title mb-2">Macro Briefing</div>
                      <p className="text-sm text-gray-300 leading-relaxed">{news.macro_briefing}</p>
                    </div>
                  )}

                  {(running.themes ?? []).length > 0 && (
                    <div className="card">
                      <div className="section-title mb-1">Themes Identified</div>
                      <p className="text-xs text-gray-500 mb-3">Approve to build the portfolio around all of these, or Reject to re-run with different parameters.</p>
                      <div className="space-y-2">
                        {(running.themes ?? []).map((t, i) => (
                          <div key={i} className="p-3 bg-surface-50 rounded-lg border border-border">
                              <div className="text-sm font-semibold text-accent">{t.theme ?? (t as any).name ?? (t as any).title ?? ''}</div>
                            {(t.description ?? t.summary) && (
                              <div className="text-xs text-gray-400 mt-1 leading-relaxed">{t.description ?? t.summary}</div>
                            )}
                            {(t.advisor_talking_points ?? []).length > 0 && (
                              <ul className="space-y-0.5 mt-2">
                                {t.advisor_talking_points!.map((pt: string, j: number) => (
                                  <li key={j} className="text-xs text-gray-500 flex gap-1.5"><span className="text-accent shrink-0">&#8226;</span>{pt}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {((news?.critical_alerts?.length ?? 0) > 0 || (news?.high_priority?.length ?? 0) > 0) && (
                    <div className="card">
                      <div className="section-title mb-3">News Alerts</div>
                      <div className="space-y-3">
                        {[
                          ...(news?.critical_alerts ?? []).map(n => ({ ...n, _lv: 'critical' as const })),
                          ...(news?.high_priority ?? []).map(n => ({ ...n, _lv: 'high' as const })),
                        ].map((n, i) => (
                          <div key={i} className="p-3 bg-surface-50 rounded-lg border border-border space-y-1.5">
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-sm font-medium text-gray-200 leading-snug">{n.headline}</span>
                              <span className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide ${n._lv === 'critical' ? 'bg-red-900/60 text-red-400' : 'bg-yellow-900/40 text-yellow-400'}`}>
                                {n._lv === 'critical' ? '!! Critical' : 'High'}
                              </span>
                            </div>
                            {n.source && <div className="text-xs text-gray-500">{n.source}{n.relevance ? ` - ${n.relevance}` : ''}</div>}
                            {(n.suggested_advisor_talking_points ?? []).length > 0 && (
                              <ul className="space-y-0.5 mt-1">
                                {n.suggested_advisor_talking_points!.map((pt, j) => (
                                   <li key={j} className="text-xs text-gray-400 flex gap-1.5"><span className="text-accent shrink-0">&#8226;</span>{pt}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {(news?.portfolio_impacts ?? []).length > 0 && (
                    <div className="card">
                      <div className="section-title mb-3">Position Impacts</div>
                      <div className="space-y-2">
                        {(news?.portfolio_impacts ?? []).map((p, i) => (
                          <div key={i} className="p-3 bg-surface-50 rounded-lg border border-border">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-mono text-xs font-bold bg-gray-700 px-1.5 py-0.5 rounded text-gray-200">{p.ticker}</span>
                              <span className={`text-xs font-medium ${p.impact === 'positive' ? 'text-green-400' : p.impact === 'negative' ? 'text-red-400' : 'text-gray-400'}`}>{p.impact}</span>
                              {p.urgency && <span className="text-xs text-gray-500">{p.urgency}</span>}
                            </div>
                            <div className="text-xs text-gray-300">{p.headline}</div>
                            {(p.talking_points ?? []).length > 0 && (
                              <ul className="space-y-0.5 mt-1.5">
                                {p.talking_points!.map((pt, j) => (
                                   <li key={j} className="text-xs text-gray-400 flex gap-1.5"><span className="text-accent shrink-0">&#8226;</span>{pt}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Gate 2 action bar — always visible when at gate2, proposal or not */}
              {running.stage === 'gate2' && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Review the proposed portfolio before approving.</span>
                  <button
                    onClick={() => handleRetry('think')}
                    disabled={loading}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border text-gray-400 hover:text-gray-200 hover:border-gray-500 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
                    Rebuild Portfolio
                  </button>
                </div>
              )}

              {/* Gate 2 / completed: portfolio proposal */}
              {proposal && ['gate2', 'act', 'gate3', 'completed'].includes(running.stage) && (
                <>
                  {/* Retry think header — only shown at gate2 */}
                  {/* Rationale */}
                  {proposal.portfolio_rationale && (
                    <div className="card">
                      <div className="section-title mb-2">Portfolio Rationale</div>
                      <p className="text-sm text-gray-300 leading-relaxed">{proposal.portfolio_rationale}</p>
                    </div>
                  )}

                  {/* Construction notes / warnings */}
                  {proposal.construction_notes && (
                    <div className="rounded-lg border border-yellow-700/50 bg-yellow-900/20 px-4 py-3">
                      <div className="text-xs font-semibold text-yellow-400 mb-1">Construction Notes</div>
                      <p className="text-xs text-yellow-200/80 leading-relaxed">{proposal.construction_notes}</p>
                    </div>
                  )}

                  {/* Risk metrics */}
                  {proposal.risk_metrics && (
                    <div className="card">
                      <div className="section-title mb-3">Risk Metrics</div>
                      <div className="grid grid-cols-3 gap-3">
                        {([
                          { label: 'Volatility', value: `${(proposal.risk_metrics.estimated_volatility * 100).toFixed(1)}%`, color: 'text-yellow-400' },
                          { label: 'Sharpe', value: proposal.risk_metrics.estimated_sharpe.toFixed(2), color: 'text-gray-100' },
                          { label: 'Max DD', value: `${(proposal.risk_metrics.max_drawdown_estimate * 100).toFixed(1)}%`, color: 'text-red-400' },
                          { label: 'HHI', value: proposal.risk_metrics.hhi.toFixed(3), color: proposal.risk_metrics.hhi < 0.25 ? 'text-green-400' : 'text-red-400' },
                          { label: 'Beta', value: proposal.risk_metrics.beta_estimate.toFixed(2), color: 'text-gray-100' },
                        ] as {label:string;value:string;color:string}[]).map(({ label, value, color }) => (
                          <div key={label} className="stat-card p-3">
                            <div className="stat-label">{label}</div>
                            <div className={`text-lg font-semibold ${color}`}>{value}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Constraint checks */}
                  {proposal.constraint_checks && Object.keys(proposal.constraint_checks).length > 0 && (
                    <div className="card">
                      <div className="section-title mb-3">Constraint Checks</div>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(proposal.constraint_checks).map(([key, chk]) => (
                          <div key={key} className="flex items-center justify-between px-3 py-2 rounded bg-surface-50 border border-border">
                            <span className="text-xs text-gray-400 capitalize">{key.replace(/_/g, ' ')}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-300">{typeof chk.value === 'number' ? chk.value.toFixed(2) : chk.value}</span>
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                                chk.status === 'pass' ? 'bg-green-900/50 text-green-400' :
                                chk.status === 'warn' ? 'bg-yellow-900/50 text-yellow-400' :
                                'bg-red-900/50 text-red-400'
                              }`}>{chk.status}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Theme allocations (proposal level) */}
                  {(proposal.themes ?? []).length > 0 && (
                    <div className="card">
                      <div className="section-title mb-3">Theme Allocations</div>
                      <div className="space-y-2">
                        {proposal.themes!.map((t, i) => (
                          <div key={i} className="p-3 bg-surface-50 rounded-lg border border-border">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-semibold text-accent">{t.name}</span>
                              <span className="text-xs font-mono text-gray-300">{(t.weight * 100).toFixed(1)}%</span>
                            </div>
                            {t.description && <p className="text-xs text-gray-400 leading-relaxed">{t.description}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Positions */}
                  {(proposal.positions?.length ?? 0) > 0 && (
                    <div className="card">
                      <div className="section-title mb-2">Asset Allocation</div>
                      <AllocationChart positions={proposal.positions as any} />
                    </div>
                  )}
                  {(proposal.positions?.length ?? 0) > 0 && (
                    <div className="card overflow-hidden p-4">
                      <div className="section-title mb-3">Positions</div>
                      <PositionTable positions={proposal.positions as any} />
                    </div>
                  )}

                  {/* Backtest — top-level or legacy proposal.backtest */}
                  {(() => { const bt = running.backtest; if (!bt || !bt.cagr) return null; return (
                    <div className="card">
                      <div className="section-title mb-3">Backtest Results{bt.period_years ? ` (${bt.period_years}Y)` : ''}</div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {([
                          { label: 'CAGR', value: `${((bt.cagr ?? 0) * 100).toFixed(1)}%`, color: 'text-green-400' },
                          { label: 'Volatility', value: `${((bt.volatility ?? 0) * 100).toFixed(1)}%`, color: 'text-yellow-400' },
                          { label: 'Sharpe', value: (bt.sharpe ?? 0).toFixed(2), color: 'text-gray-100' },
                          { label: 'Max Drawdown', value: `${((bt.max_drawdown ?? 0) * 100).toFixed(1)}%`, color: 'text-red-400' },
                          { label: 'Win Rate', value: `${((bt.win_rate ?? 0) * 100).toFixed(0)}%`, color: 'text-brand-teal' },
                        ] as {label:string;value:string;color:string}[]).map(({ label, value, color }) => (
                          <div key={label} className="stat-card p-3">
                            <div className="stat-label">{label}</div>
                            <div className={`text-base font-semibold ${color}`}>{value}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )})()}

                  {/* Monitor results — shown after "Monitor Portfolio" is clicked */}
                  {monitorResult && (
                    <div className="card border border-brand-teal/30">
                      <div className="flex items-center justify-between mb-3">
                        <div className="section-title flex items-center gap-2"><Activity size={13} className="text-brand-teal" /> Monitoring Report</div>
                        <span className="text-xs text-gray-500">{monitorResult.monitored_at ? new Date(monitorResult.monitored_at).toLocaleString() : ''}</span>
                      </div>

                      {/* Rebalance triggers */}
                      {monitorResult.rebalance && (
                        <div className="mb-4">
                          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Rebalance Check</div>
                          {(monitorResult.rebalance.triggers_fired?.length ?? 0) === 0
                            ? <p className="text-xs text-green-400">No rebalance triggers fired. Portfolio is on-track.</p>
                            : <div className="flex flex-wrap gap-1 mb-2">{monitorResult.rebalance.triggers_fired!.map((t, i) => (
                                <span key={i} className="px-2 py-0.5 rounded-full text-xs bg-yellow-900/30 text-yellow-400 border border-yellow-700/40">{t}</span>
                              ))}</div>
                          }
                          {monitorResult.rebalance.rebalance_rationale && (
                            <p className="text-xs text-gray-400 mt-1 leading-relaxed">{monitorResult.rebalance.rebalance_rationale}</p>
                          )}
                          {(monitorResult.rebalance.proposed_trades?.length ?? 0) > 0 && (
                            <div className="mt-3">
                              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Proposed Trades</div>
                              <div className="space-y-1.5">
                                {monitorResult.rebalance.proposed_trades!.map((tr, i) => (
                                  <div key={i} className="flex items-start gap-2 text-xs">
                                    <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${tr.direction === 'buy' ? 'bg-green-900/40 text-green-400' : 'bg-red-900/40 text-red-400'}`}>{tr.direction.toUpperCase()}</span>
                                    <span className="font-mono text-gray-200">{tr.symbol}</span>
                                    <span className="text-gray-400">{tr.rationale}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* News highlights from monitor */}
                      {monitorResult.news?.macro_briefing && (
                        <div>
                          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Market Update</div>
                          <p className="text-xs text-gray-300 leading-relaxed">{monitorResult.news.macro_briefing}</p>
                        </div>
                      )}
                      {(monitorResult.news?.critical_alerts?.length ?? 0) > 0 && (
                        <div className="mt-3 space-y-1">
                          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Critical Alerts</div>
                          {monitorResult.news!.critical_alerts!.map((a, i) => (
                            <div key={i} className="text-xs text-red-300 border border-red-800/40 rounded px-2 py-1">{a.headline}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* Live progress panel — shown while sense/think/act is running */}
              {['sense', 'think', 'act'].includes(running.stage) && !proposal && (() => {
                const step = (running.current_step ?? '').toLowerCase()

                // Derive sub-step completion from current_step text
                const senseSteps = [
                  { label: 'Connect to Bing Grounding', done: true },
                  { label: 'Scan market news & headlines', done: step.includes('grounding') || step.includes('gate') || running.stage !== 'sense' },
                  { label: 'Extract macro themes', done: (running.themes ?? []).length > 0 || running.stage !== 'sense' },
                ]
                const thinkSteps = [
                  { label: 'Map themes to ticker universe', done: step.includes('construct') || step.includes('gate') || running.stage === 'act' },
                  { label: 'Score candidates (fundamentals + technicals)', done: step.includes('construct') || step.includes('gate') || running.stage === 'act' },
                  { label: 'Run mean-variance optimisation', done: step.includes('gate') || running.stage === 'act' },
                  { label: 'Enforce constraints & risk overlays', done: step.includes('gate') || running.stage === 'act' },
                ]
                const actSteps = [
                  { label: 'Run historical backtest', done: step.includes('persist') },
                  { label: 'Persist approved portfolio', done: false },
                ]

                const activeSteps = running.stage === 'sense' ? senseSteps : running.stage === 'think' ? thinkSteps : actSteps
                const activeIndex = activeSteps.findIndex(s => !s.done)

                return (
                  <div className="space-y-4">
                    {/* Current step hero */}
                    <div className="card flex items-center gap-4 py-5">
                      <div className="shrink-0 w-10 h-10 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center">
                        <Loader2 size={18} className="animate-spin text-accent" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">AI Agent Running</div>
                        <div className="text-sm font-semibold text-gray-100">
                          {running.current_step || (running.stage === 'sense' ? 'Scanning market news...' : running.stage === 'think' ? 'Constructing portfolio...' : 'Running backtest...')}
                        </div>
                      </div>
                    </div>

                    {/* Sub-step pipeline */}
                    <div className="card space-y-3">
                      <div className="section-title mb-1">
                        {running.stage === 'sense' ? 'Sense Pipeline' : running.stage === 'think' ? 'Think Pipeline' : 'Act Pipeline'}
                      </div>
                      {activeSteps.map((s, i) => {
                        const isActive = i === activeIndex
                        const isDone = s.done
                        return (
                          <div key={i} className="flex items-center gap-3">
                            <div className={`shrink-0 w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-bold transition-all ${
                              isDone ? 'bg-green-900/40 border-green-600 text-green-400' :
                              isActive ? 'bg-accent/20 border-accent text-accent' :
                              'bg-surface-50 border-border text-gray-600'
                            }`}>
                              {isDone ? '✓' : isActive ? <Loader2 size={10} className="animate-spin" /> : i + 1}
                            </div>
                            <span className={`text-xs ${isDone ? 'text-gray-500 line-through' : isActive ? 'text-gray-100' : 'text-gray-600'}`}>
                              {s.label}
                            </span>
                          </div>
                        )
                      })}
                    </div>

                    {/* Context already available */}
                    {(running.themes ?? []).length > 0 && (
                      <div className="card">
                        <div className="section-title mb-2">Approved Themes Being Processed</div>
                        <div className="space-y-1.5">
                          {(running.themes ?? []).map((t, i) => (
                            <div key={i} className="flex items-start gap-2 px-3 py-2 rounded-lg bg-surface-50 border border-border">
                              <span className="text-green-400 text-xs mt-0.5">✓</span>
                              <div>
                                <div className="text-xs font-semibold text-accent">{t.theme ?? (t as any).name ?? (t as any).title ?? ''}</div>
                                {t.description && <div className="text-xs text-gray-500 mt-0.5 leading-relaxed">{t.description}</div>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Universe size once known */}
                    {(running.universe_size ?? 0) > 0 && (
                      <div className="card flex items-center justify-between px-4 py-3">
                        <span className="text-xs text-gray-400">Candidate Universe</span>
                        <span className="text-lg font-bold text-accent">{running.universe_size} tickers</span>
                      </div>
                    )}
                  </div>
                )
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
