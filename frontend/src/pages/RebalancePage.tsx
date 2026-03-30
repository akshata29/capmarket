import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Loader2, RefreshCw, AlertTriangle, CheckCircle, ArrowUpDown, TrendingUp, TrendingDown, Newspaper, History, ChevronDown, ChevronRight } from 'lucide-react'
import { portfolioApi, clientsApi } from '@/api'
import type { ClientProfile } from '@/types'

interface Trade { direction: string; symbol: string; shares?: number; rationale?: string; priority?: number; tax_impact?: string }
interface RebalanceResult {
  triggers_fired?: string[]
  proposed_trades?: Trade[]
  rebalance_rationale?: string
  turnover_pct?: number
  estimated_tx_cost_bps?: number
  drift_summary?: Record<string, number>
  next_check_date?: string
}
interface NewsItem { headline: string; source?: string; impact?: string; urgency?: string; talking_points?: string[] }
interface RunData {
  portfolio_id?: string; checked_at?: string; tickers?: string[]
  news?: { macro_briefing?: string; critical_alerts?: NewsItem[]; high_priority?: NewsItem[]; portfolio_impacts?: any[] }
  rebalance?: RebalanceResult
  rebalance_id?: string
}

export default function RebalancePage() {
  const [searchParams] = useSearchParams()
  const [clients, setClients] = useState<ClientProfile[]>([])
  const [portfolios, setPortfolios] = useState<any[]>([])
  const [selectedClient, setSelectedClient] = useState('')
  const [selectedPortfolio, setSelectedPortfolio] = useState('')
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<RunData | null>(null)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'trades' | 'news' | 'impacts' | 'history'>('trades')
  const [history, setHistory] = useState<RunData[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [expandedHistory, setExpandedHistory] = useState<Set<string>>(new Set())
  const [historyTabs, setHistoryTabs] = useState<Record<string, 'trades' | 'news' | 'impacts'>>({})


  useEffect(() => { clientsApi.list().then(setClients).catch(() => {}) }, [])

  useEffect(() => {
    const cid = searchParams.get('client'); const pid = searchParams.get('portfolio')
    if (cid) setSelectedClient(cid)
    if (pid) setSelectedPortfolio(pid)
  }, [searchParams])

  useEffect(() => {
    if (!selectedClient) { setPortfolios([]); setSelectedPortfolio(''); return }
    portfolioApi.byClient(selectedClient).then(p => {
      setPortfolios(p)
      if (p.length > 0 && !selectedPortfolio)
        setSelectedPortfolio((p[0] as any).id ?? (p[0] as any).proposal_id ?? '')
    }).catch(() => {})
  }, [selectedClient])

  const loadHistory = async (portfolioId: string, clientId: string) => {
    setHistoryLoading(true)
    try {
      const res = await portfolioApi.rebalanceHistory(portfolioId, clientId)
      setHistory(res.runs ?? [])
    } catch {
      setHistory([])
    } finally {
      setHistoryLoading(false)
    }
  }

  const runAnalysis = async () => {
    if (!selectedPortfolio || !selectedClient) return
    setRunning(true); setError(''); setResult(null)
    try {
      const res = await portfolioApi.rebalance(selectedPortfolio, selectedClient)
      setResult(res)
      setActiveTab('trades')
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? 'Rebalance analysis failed')
    } finally {
      setRunning(false)
    }
  }

  const priorityLabel = (p?: number) =>
    p === 1 ? { text: 'Urgent', cls: 'text-red-400 bg-red-900/30 border-red-700/40' }
    : p === 2 ? { text: 'Recommended', cls: 'text-yellow-400 bg-yellow-900/30 border-yellow-700/40' }
    : { text: 'Optional', cls: 'text-gray-400 bg-surface-50 border-border' }

  // -- Shared rich renderer  tabbed UI, same as live result ----------------
  const renderRunResult = (run: RunData, itemKey: string) => {
    const rb = run.rebalance
    const runTrades = rb?.proposed_trades ?? []
    const runCritical = run.news?.critical_alerts ?? []
    const runHigh = run.news?.high_priority ?? []
    const runImpacts = run.news?.portfolio_impacts ?? []
    const runTriggers = rb?.triggers_fired ?? []
    const tab = historyTabs[itemKey] ?? 'trades'
    const setTab = (t: 'trades' | 'news' | 'impacts') =>
      setHistoryTabs(prev => ({ ...prev, [itemKey]: t }))

    return (
      <div className="space-y-3">
        {/* Summary strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="stat-card p-3">
            <div className="stat-label">Triggers Fired</div>
            <div className={`text-base font-semibold ${runTriggers.length > 0 ? 'text-yellow-400' : 'text-green-400'}`}>{runTriggers.length}</div>
          </div>
          <div className="stat-card p-3">
            <div className="stat-label">Proposed Trades</div>
            <div className={`text-base font-semibold ${runTrades.length > 0 ? 'text-accent' : 'text-gray-400'}`}>{runTrades.length}</div>
          </div>
          <div className="stat-card p-3">
            <div className="stat-label">Turnover</div>
            <div className="text-base font-semibold text-gray-100">{rb?.turnover_pct != null ? `${(rb.turnover_pct * 100).toFixed(1)}%` : '--'}</div>
          </div>
          <div className="stat-card p-3">
            <div className="stat-label">Est. Tx Cost</div>
            <div className="text-base font-semibold text-gray-100">{rb?.estimated_tx_cost_bps != null ? `${rb.estimated_tx_cost_bps.toFixed(1)}bps` : '--'}</div>
          </div>
        </div>

        {/* Triggers */}
        {runTriggers.length === 0
          ? <div className="flex items-center gap-2 text-xs text-green-400"><CheckCircle size={12} /> No rebalance triggers fired  portfolio is within tolerance.</div>
          : <div className="flex flex-wrap gap-2">
              {runTriggers.map((t, i) => (
                <span key={i} className="px-2 py-0.5 rounded-full text-xs border text-yellow-400 bg-yellow-900/20 border-yellow-700/40 flex items-center gap-1">
                  <AlertTriangle size={10} />{t}
                </span>
              ))}
            </div>
        }

        {rb?.rebalance_rationale && (
          <p className="text-xs text-gray-400 leading-relaxed">{rb.rebalance_rationale}</p>
        )}

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border">
          {([
            ['trades', `Proposed Trades (${runTrades.length})`],
            ['news', `News Alerts (${runCritical.length + runHigh.length})`],
            ['impacts', `Position Impacts (${runImpacts.length})`],
          ] as const).map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)}
              className={`text-xs px-4 py-2 border-b-2 transition-colors ${tab === t ? 'border-accent text-accent' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>
              {label}
            </button>
          ))}
        </div>

        {/* Trades tab */}
        {tab === 'trades' && (
          <div>
            {runTrades.length === 0
              ? <p className="text-xs text-gray-500">No trades proposed.</p>
              : <div className="space-y-2">
                  {runTrades.map((t, i) => {
                    const { text, cls } = priorityLabel(t.priority)
                    return (
                      <div key={i} className="flex items-start gap-3 p-3 bg-surface-50 rounded-lg border border-border">
                        <span className={`mt-0.5 text-xs font-bold px-2 py-0.5 rounded ${t.direction === 'buy' ? 'bg-green-900/40 text-green-400' : 'bg-red-900/40 text-red-400'}`}>
                          {t.direction.toUpperCase()}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-mono text-sm font-bold text-gray-200">{t.symbol}</span>
                            {t.shares != null && <span className="text-xs text-gray-500">{t.shares} shares</span>}
                            <span className={`ml-auto text-xs px-2 py-0.5 rounded-full border ${cls}`}>{text}</span>
                          </div>
                          {t.rationale && <p className="text-xs text-gray-400 leading-relaxed">{t.rationale}</p>}
                          {t.tax_impact && <p className="text-xs text-gray-600 mt-0.5">Tax: {t.tax_impact}</p>}
                        </div>
                      </div>
                    )
                  })}
                </div>
            }
          </div>
        )}

        {/* News tab */}
        {tab === 'news' && (
          <div className="space-y-4">
            {run.news?.macro_briefing && (
              <div>
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Macro Briefing</div>
                <p className="text-sm text-gray-300 leading-relaxed">{run.news.macro_briefing}</p>
              </div>
            )}
            {runCritical.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-red-400 uppercase tracking-wide mb-2 flex items-center gap-1"><AlertTriangle size={11} /> Critical</div>
                <div className="space-y-2">
                  {runCritical.map((n, i) => (
                    <div key={i} className="p-3 rounded-lg border border-red-800/30 bg-red-900/10">
                      <div className="text-xs font-semibold text-gray-200 mb-0.5">{n.headline}</div>
                      {n.source && <span className="text-xs text-gray-500">{n.source}</span>}
                      {(n.talking_points ?? []).length > 0 && (
                        <ul className="mt-1 space-y-0.5">{n.talking_points!.map((p, j) => <li key={j} className="text-xs text-gray-500 flex gap-1"><span className="text-red-400">&#8226;</span>{p}</li>)}</ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {runHigh.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-yellow-400 uppercase tracking-wide mb-2 flex items-center gap-1"><Newspaper size={11} /> High Priority</div>
                <div className="space-y-2">
                  {runHigh.map((n, i) => (
                    <div key={i} className="p-3 rounded-lg border border-yellow-800/20 bg-yellow-900/10">
                      <div className="text-xs font-semibold text-gray-200 mb-0.5">{n.headline}</div>
                      {n.source && <span className="text-xs text-gray-500">{n.source}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {runCritical.length === 0 && runHigh.length === 0 && !run.news?.macro_briefing && (
              <p className="text-xs text-gray-500">No news alerts recorded for this run.</p>
            )}
          </div>
        )}

        {/* Impacts tab */}
        {tab === 'impacts' && (
          <div>
            {runImpacts.length === 0
              ? <p className="text-xs text-gray-500">No position-specific impacts identified.</p>
              : <div className="space-y-2">
                  {runImpacts.map((imp: any, i: number) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-surface-50 rounded-lg border border-border">
                      <span className="font-mono text-xs font-bold text-gray-200 w-14 shrink-0">{imp.ticker}</span>
                      <div className="flex-1">
                        <div className="text-xs text-gray-300 mb-0.5">{imp.headline}</div>
                        {imp.impact && (
                          <span className={`text-xs font-semibold ${imp.impact === 'positive' ? 'text-green-400' : imp.impact === 'negative' ? 'text-red-400' : 'text-gray-400'}`}>
                            {imp.impact === 'positive' ? <TrendingUp size={10} className="inline mr-0.5" /> : imp.impact === 'negative' ? <TrendingDown size={10} className="inline mr-0.5" /> : null}
                            {imp.impact}
                          </span>
                        )}
                        {imp.urgency && <span className="text-xs text-gray-500 ml-2">{imp.urgency}</span>}
                      </div>
                    </div>
                  ))}
                </div>
            }
          </div>
        )}

        {rb?.next_check_date && (
          <p className="text-xs text-gray-500 text-right">Next recommended check: {rb.next_check_date}</p>
        )}
      </div>
    )
  }
  const rb = result?.rebalance
  const trades = rb?.proposed_trades ?? []
  const criticalAlerts = result?.news?.critical_alerts ?? []
  const highPriority = result?.news?.high_priority ?? []
  const impacts = result?.news?.portfolio_impacts ?? []
  const triggersFired = rb?.triggers_fired ?? []

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-100 flex items-center gap-2"><ArrowUpDown size={20} className="text-accent" /> Rebalancing</h1>
        <p className="text-xs text-gray-500 mt-1">Autonomous news + advisory agents check drift, momentum, and threshold triggers</p>
      </div>

      {/* Controls */}
      <div className="card grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Client</label>
          <select value={selectedClient} onChange={e => setSelectedClient(e.target.value)} className="input w-full text-sm">
            <option value="">Select client...</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Portfolio</label>
          <select value={selectedPortfolio} onChange={e => setSelectedPortfolio(e.target.value)} className="input w-full text-sm" disabled={!selectedClient}>
            <option value="">Select portfolio...</option>
            {portfolios.map((p: any) => {
              const pid = p.id ?? p.proposal_id ?? ''
              return <option key={pid} value={pid}>{pid.slice(0, 8)} â€” {p.status ?? 'proposal'}</option>
            })}
          </select>
        </div>
        <button onClick={runAnalysis} disabled={!selectedPortfolio || running} className="btn-primary flex items-center justify-center gap-2">
          {running ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          {running ? 'Scanning...' : 'Run Rebalance Check'}
        </button>
      </div>

      {error && <div className="rounded-lg border border-red-700/40 bg-red-900/20 px-4 py-3 text-xs text-red-300">{error}</div>}

      {running && (
        <div className="card space-y-2">
          <div className="flex items-center gap-3 text-sm text-gray-400">
            <Loader2 size={16} className="animate-spin text-accent" /> Running autonomous agents...
          </div>
          <div className="text-xs text-gray-500 pl-7 space-y-1">
            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-accent animate-pulse" /> NewsAgent: scanning Bing for position-relevant events</div>
            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" /> RebalanceAgent: checking drift, volatility, and momentum triggers</div>
          </div>
        </div>
      )}

      {result && (
        <>
          {/* Summary strip */}
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <div className="section-title">Analysis Summary</div>
              <span className="text-xs text-gray-500">{result.checked_at ? new Date(result.checked_at).toLocaleString() : ''}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <div className="stat-card p-3">
                <div className="stat-label">Triggers Fired</div>
                <div className={`text-base font-semibold ${triggersFired.length > 0 ? 'text-yellow-400' : 'text-green-400'}`}>{triggersFired.length}</div>
              </div>
              <div className="stat-card p-3">
                <div className="stat-label">Proposed Trades</div>
                <div className={`text-base font-semibold ${trades.length > 0 ? 'text-accent' : 'text-gray-400'}`}>{trades.length}</div>
              </div>
              <div className="stat-card p-3">
                <div className="stat-label">Turnover</div>
                <div className="text-base font-semibold text-gray-100">{rb?.turnover_pct != null ? `${(rb.turnover_pct * 100).toFixed(1)}%` : '--'}</div>
              </div>
              <div className="stat-card p-3">
                <div className="stat-label">Est. Tx Cost</div>
                <div className="text-base font-semibold text-gray-100">{rb?.estimated_tx_cost_bps != null ? `${rb.estimated_tx_cost_bps.toFixed(1)}bps` : '--'}</div>
              </div>
            </div>

            {/* Triggers */}
            {triggersFired.length === 0
              ? <div className="flex items-center gap-2 text-xs text-green-400"><CheckCircle size={12} /> No rebalance triggers fired â€” portfolio is within tolerance.</div>
              : <div className="flex flex-wrap gap-2">
                  {triggersFired.map((t, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-full text-xs border text-yellow-400 bg-yellow-900/20 border-yellow-700/40 flex items-center gap-1">
                      <AlertTriangle size={10} />{t}
                    </span>
                  ))}
                </div>
            }

            {rb?.rebalance_rationale && (
              <p className="text-xs text-gray-400 mt-3 leading-relaxed">{rb.rebalance_rationale}</p>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 border-b border-border">
            {([['trades', `Proposed Trades (${trades.length})`], ['news', `News Alerts (${criticalAlerts.length + highPriority.length})`], ['impacts', `Position Impacts (${impacts.length})`]] as const).map(([tab, label]) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`text-xs px-4 py-2 border-b-2 transition-colors ${activeTab === tab ? 'border-accent text-accent' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>
                {label}
              </button>
            ))}
          </div>

          {/* Trades tab */}
          {activeTab === 'trades' && (
            <div className="card">
              {trades.length === 0
                ? <p className="text-xs text-gray-500">No trades proposed at this time.</p>
                : <div className="space-y-3">
                    {trades.map((t, i) => {
                      const { text, cls } = priorityLabel(t.priority)
                      return (
                        <div key={i} className="flex items-start gap-3 p-3 bg-surface-50 rounded-lg border border-border">
                          <span className={`mt-0.5 text-xs font-bold px-2 py-0.5 rounded ${t.direction === 'buy' ? 'bg-green-900/40 text-green-400' : 'bg-red-900/40 text-red-400'}`}>
                            {t.direction.toUpperCase()}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="font-mono text-sm font-bold text-gray-200">{t.symbol}</span>
                              {t.shares != null && <span className="text-xs text-gray-500">{t.shares} shares</span>}
                              <span className={`ml-auto text-xs px-2 py-0.5 rounded-full border ${cls}`}>{text}</span>
                            </div>
                            {t.rationale && <p className="text-xs text-gray-400 leading-relaxed">{t.rationale}</p>}
                            {t.tax_impact && <p className="text-xs text-gray-600 mt-0.5">Tax: {t.tax_impact}</p>}
                          </div>
                        </div>
                      )
                    })}
                  </div>
              }
            </div>
          )}

          {/* News tab */}
          {activeTab === 'news' && (
            <div className="card space-y-4">
              {result.news?.macro_briefing && (
                <div>
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Macro Briefing</div>
                  <p className="text-sm text-gray-300 leading-relaxed">{result.news.macro_briefing}</p>
                </div>
              )}
              {criticalAlerts.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-red-400 uppercase tracking-wide mb-2 flex items-center gap-1"><AlertTriangle size={11} /> Critical</div>
                  <div className="space-y-2">
                    {criticalAlerts.map((n, i) => (
                      <div key={i} className="p-3 rounded-lg border border-red-800/30 bg-red-900/10">
                        <div className="text-xs font-semibold text-gray-200 mb-0.5">{n.headline}</div>
                        {n.source && <span className="text-xs text-gray-500">{n.source}</span>}
                        {(n.talking_points ?? []).length > 0 && (
                          <ul className="mt-1 space-y-0.5">{n.talking_points!.map((p, j) => <li key={j} className="text-xs text-gray-500 flex gap-1"><span className="text-red-400">&#8226;</span>{p}</li>)}</ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {highPriority.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-yellow-400 uppercase tracking-wide mb-2 flex items-center gap-1"><Newspaper size={11} /> High Priority</div>
                  <div className="space-y-2">
                    {highPriority.map((n, i) => (
                      <div key={i} className="p-3 rounded-lg border border-yellow-800/20 bg-yellow-900/10">
                        <div className="text-xs font-semibold text-gray-200 mb-0.5">{n.headline}</div>
                        {n.source && <span className="text-xs text-gray-500">{n.source}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {criticalAlerts.length === 0 && highPriority.length === 0 && !result.news?.macro_briefing && (
                <p className="text-xs text-gray-500">No news alerts available. Run the analysis to fetch latest market intelligence.</p>
              )}
            </div>
          )}

          {/* Position impacts tab */}
          {activeTab === 'impacts' && (
            <div className="card">
              {impacts.length === 0
                ? <p className="text-xs text-gray-500">No position-specific impacts identified.</p>
                : <div className="space-y-2">
                    {impacts.map((imp: any, i: number) => (
                      <div key={i} className="flex items-start gap-3 p-3 bg-surface-50 rounded-lg border border-border">
                        <span className="font-mono text-xs font-bold text-gray-200 w-14 shrink-0">{imp.ticker}</span>
                        <div className="flex-1">
                          <div className="text-xs text-gray-300 mb-0.5">{imp.headline}</div>
                          {imp.impact && (
                            <span className={`text-xs font-semibold ${imp.impact === 'positive' ? 'text-green-400' : imp.impact === 'negative' ? 'text-red-400' : 'text-gray-400'}`}>
                              {imp.impact === 'positive' ? <TrendingUp size={10} className="inline mr-0.5" /> : imp.impact === 'negative' ? <TrendingDown size={10} className="inline mr-0.5" /> : null}
                              {imp.impact}
                            </span>
                          )}
                          {imp.urgency && <span className="text-xs text-gray-500 ml-2">{imp.urgency}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
              }
            </div>
          )}

          {rb?.next_check_date && (
            <p className="text-xs text-gray-500 text-right">Next recommended check: {rb.next_check_date}</p>
          )}
        </>
      )}

      {/* History tab trigger */}
      <div className="flex gap-1 border-b border-border mt-2">
        <button
          onClick={() => {
            setActiveTab('history')
            if (selectedPortfolio && selectedClient) loadHistory(selectedPortfolio, selectedClient)
          }}
          className={`text-xs px-4 py-2 border-b-2 transition-colors ${activeTab === 'history' ? 'border-accent text-accent' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
        >
          <span className="flex items-center gap-1.5"><History size={11} /> Run History</span>
        </button>
      </div>

      {activeTab === 'history' && (
        <div className="card space-y-3">
          {historyLoading && (
            <div className="flex items-center gap-2 text-xs text-gray-400"><Loader2 size={14} className="animate-spin" /> Loading history...</div>
          )}
          {!historyLoading && history.length === 0 && (
            <p className="text-xs text-gray-500">No previous rebalance runs found. Select a portfolio and run an analysis first.</p>
          )}
          {!historyLoading && history.map((item, idx) => {
            const key = item.rebalance_id ?? String(idx)
            const open = expandedHistory.has(key)
            const itemTrades = item.rebalance?.proposed_trades ?? []
            const itemTriggers = item.rebalance?.triggers_fired ?? []
            return (
              <div key={key} className="rounded-lg border border-border overflow-hidden">
                <button
                  className="w-full flex items-center justify-between px-4 py-3 bg-surface-50 hover:bg-surface-100 transition-colors text-left"
                  onClick={() => {
                    const next = new Set(expandedHistory)
                    open ? next.delete(key) : next.add(key)
                    setExpandedHistory(next)
                  }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {open ? <ChevronDown size={13} className="text-gray-400 shrink-0" /> : <ChevronRight size={13} className="text-gray-400 shrink-0" />}
                    <span className="text-xs text-gray-300">{item.checked_at ? new Date(item.checked_at).toLocaleString() : 'Unknown time'}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${itemTriggers.length > 0 ? 'text-yellow-400 bg-yellow-900/20 border-yellow-700/40' : 'text-green-400 bg-green-900/20 border-green-700/30'}`}>
                      {itemTriggers.length > 0 ? `${itemTriggers.length} trigger${itemTriggers.length > 1 ? 's' : ''}` : 'No triggers'}
                    </span>
                    {itemTrades.length > 0 && (
                      <span className="text-xs text-accent">{itemTrades.length} trade{itemTrades.length > 1 ? 's' : ''}</span>
                    )}
                    {item.tickers && item.tickers.length > 0 && (
                      <span className="text-xs text-gray-500 truncate">{item.tickers.slice(0, 4).join(', ')}{item.tickers.length > 4 ? ` +${item.tickers.length - 4}` : ''}</span>
                    )}
                  </div>
                </button>
                {open && (
                  <div className="px-4 py-4 bg-surface border-t border-border">
                    {renderRunResult(item, key)}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}


