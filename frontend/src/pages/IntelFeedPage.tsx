import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import {
  AlertTriangle, AlertCircle, Info, ArrowLeft, RefreshCw, Loader2,
  ShieldAlert, Clock, ChevronRight, Activity,
} from 'lucide-react'
import { portfolioApi } from '@/api'
import type { WatchSnapshot, RiskAdvisory, RebalanceProximity } from '@/types'

// ── Helpers ────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

const SEVERITIES = ['all', 'critical', 'high', 'medium'] as const
type Severity = typeof SEVERITIES[number]

interface IntelAlert {
  id:             string
  ticker:         string
  headline:       string
  summary:        string
  urgency:        string
  source?:        string
  category?:      string
  timeframe?:     string
  cycle_at:       string
  talking_points?: string[]
}

function SeverityBadge({ urgency }: { urgency: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    critical: { label: 'CRITICAL', cls: 'bg-red-900/50 text-red-300 border-red-700/50' },
    high:     { label: 'HIGH',     cls: 'bg-orange-900/40 text-orange-300 border-orange-700/40' },
    medium:   { label: 'MEDIUM',   cls: 'bg-yellow-900/40 text-yellow-300 border-yellow-700/40' },
    low:      { label: 'LOW',      cls: 'bg-blue-900/40 text-blue-300 border-blue-700/40' },
  }
  const { label, cls } = map[urgency] ?? { label: urgency.toUpperCase(), cls: 'bg-surface-50 text-gray-400 border-border' }
  return (
    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-widest shrink-0 ${cls}`}>
      {label}
    </span>
  )
}

function ProximityBar({ label, value }: { label: string; value: number }) {
  const pct   = Math.min(Math.round(value * 100), 100)
  const color = pct >= 80 ? 'bg-red-500' : pct >= 50 ? 'bg-yellow-500' : pct >= 25 ? 'bg-blue-500' : 'bg-green-500'
  return (
    <div className="flex items-center gap-2">
      <div className="w-24 text-[10px] text-gray-500 shrink-0">{label}</div>
      <div className="flex-1 h-1 rounded-full bg-surface-50 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`w-8 text-right text-[10px] font-medium tabular-nums ${pct >= 80 ? 'text-red-400' : pct >= 50 ? 'text-yellow-400' : 'text-gray-400'}`}>
        {pct}%
      </span>
    </div>
  )
}

function AdvisoryCard({ snap }: { snap: WatchSnapshot }) {
  const adv  = snap.advisory as RiskAdvisory | undefined
  const prox = adv?.rebalance_proximity ?? ({} as RebalanceProximity)
  const recs = adv?.recommendations ?? []
  const riskColors: Record<string, string> = {
    elevated: 'text-red-400', moderate: 'text-yellow-400', low: 'text-green-400',
  }
  const sentColors: Record<string, string> = {
    deteriorating: 'text-red-400', stable: 'text-gray-400', improving: 'text-green-400',
  }
  return (
    <div className="rounded-lg border border-border bg-surface-50 p-3">
      <div className="flex items-center gap-2 mb-2">
        <ShieldAlert size={12} className="text-accent shrink-0" />
        <span className={`text-xs font-semibold ${riskColors[adv?.risk_level ?? ''] ?? 'text-gray-300'}`}>
          {adv?.risk_level ?? '—'} risk
        </span>
        <span className={`text-xs ${sentColors[adv?.sentiment_trend ?? ''] ?? 'text-gray-400'}`}>
          {adv?.sentiment_trend ?? ''}
        </span>
        <span className="ml-auto text-[10px] text-gray-600">{timeAgo(snap.cycle_at)}</span>
      </div>
      {Object.keys(prox).length > 0 && (
        <div className="space-y-1.5 mb-2">
          {prox.weight_drift != null && <ProximityBar label="Weight drift" value={prox.weight_drift} />}
          {prox.vol_cap      != null && <ProximityBar label="Vol cap"      value={prox.vol_cap} />}
          {prox.correlation  != null && <ProximityBar label="Correlation"  value={prox.correlation} />}
        </div>
      )}
      {recs.slice(0, 3).map((r, i) => (
        <div key={i} className="flex items-start gap-2 py-1 border-t border-border/50">
          <span className="font-mono text-[10px] font-bold text-accent shrink-0">{r.symbol}</span>
          <span className="text-[10px] text-gray-400 leading-relaxed">
            {(r.rationale?.slice(0, 72) ?? '')}
            {(r.rationale?.length ?? 0) > 72 ? '…' : ''}
          </span>
        </div>
      ))}
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function IntelFeedPage() {
  const [params] = useSearchParams()
  const portfolioId = params.get('portfolio') ?? ''
  const clientId    = params.get('client')    ?? ''

  const [history, setHistory]               = useState<WatchSnapshot[]>([])
  const [loading, setLoading]               = useState(false)
  const [severityFilter, setSeverityFilter] = useState<Severity>('all')
  const [activeTab, setActiveTab]           = useState<'latest' | 'history'>('latest')
  const [expandedId, setExpandedId]         = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!portfolioId || !clientId) return
    setLoading(true)
    try { setHistory(await portfolioApi.watchHistory(portfolioId, clientId)) }
    catch (e) { console.error('intel-feed load error', e) }
    finally { setLoading(false) }
  }, [portfolioId, clientId])

  useEffect(() => { load() }, [load])

  // Flatten all alerts from all snapshots
  const allAlerts: IntelAlert[] = history.flatMap(snap => {
    const news   = snap.news as any
    const cycleAt = snap.cycle_at
    const toAlert = (a: any, urgency: string): IntelAlert => ({
      id:             `${cycleAt}-${urgency}-${a.ticker ?? ''}-${Math.random().toString(36).slice(2)}`,
      ticker:         a.ticker ?? a.tickers_affected?.[0] ?? 'MKT',
      headline:       a.headline ?? a.summary ?? '',
      summary:        a.summary  ?? a.headline ?? '',
      urgency,
      source:         a.source,
      category:       a.category,
      timeframe:      a.timeframe,
      cycle_at:       cycleAt,
      talking_points: a.talking_points,
    })
    return [
      ...(news?.critical_alerts ?? []).map((a: any) => toAlert(a, 'critical')),
      ...(news?.high_priority   ?? []).map((a: any) => toAlert(a, 'high')),
      ...(news?.medium_priority ?? []).map((a: any) => toAlert(a, 'medium')),
    ]
  }).sort((a, b) => new Date(b.cycle_at).getTime() - new Date(a.cycle_at).getTime())

  const filtered   = severityFilter === 'all' ? allAlerts : allAlerts.filter(a => a.urgency === severityFilter)
  const critCount  = allAlerts.filter(a => a.urgency === 'critical').length
  const highCount  = allAlerts.filter(a => a.urgency === 'high').length
  const medCount   = allAlerts.filter(a => a.urgency === 'medium').length
  const latest     = history[0] ?? null

  if (!portfolioId) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-gray-500">
        No portfolio selected. Open from{' '}
        <Link to="/watch" className="text-accent hover:underline ml-1">Portfolio Watch</Link>.
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-surface-200">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-3 border-b border-border bg-surface-100 shrink-0">
        <Link
          to={`/watch?portfolio=${portfolioId}&client=${clientId}`}
          className="text-gray-500 hover:text-gray-300 transition-colors"
        >
          <ArrowLeft size={14} />
        </Link>
        <div>
          <h1 className="text-sm font-semibold text-gray-100 flex items-center gap-2">
            <AlertTriangle size={14} className="text-yellow-400" /> Intel Feed
          </h1>
          <p className="text-[10px] text-gray-500">
            Portfolio …{portfolioId.slice(-8)}
            {' · '}{allAlerts.length} total alerts
            {history.length > 0 && ` · ${history.length} scan${history.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-50 hover:bg-surface-50/70 text-xs text-gray-300 border border-border transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
            Refresh
          </button>
          <Link
            to={`/market-regime?portfolio=${portfolioId}&client=${clientId}`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-50 hover:bg-surface-50/70 text-xs text-gray-300 border border-border transition-colors"
          >
            <Activity size={12} /> Market Regime
          </Link>
        </div>
      </div>

      {/* Summary + filter bar */}
      <div className="flex items-center gap-3 px-6 py-2.5 border-b border-border bg-surface-100 shrink-0 flex-wrap">
        {[
          { label: 'Critical',    count: critCount,          cls: 'text-red-400 bg-red-900/20 border-red-700/30' },
          { label: 'High',        count: highCount,          cls: 'text-orange-300 bg-orange-900/20 border-orange-700/30' },
          { label: 'Medium',      count: medCount,           cls: 'text-yellow-300 bg-yellow-900/20 border-yellow-700/30' },
          { label: 'Total',       count: allAlerts.length,   cls: 'text-gray-300 bg-surface-50 border-border' },
        ].map(({ label, count, cls }) => (
          <div key={label} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${cls}`}>
            <span className="text-base font-bold tabular-nums leading-none">{count}</span>
            <span className="text-[10px] uppercase tracking-wider opacity-80">{label}</span>
          </div>
        ))}
        <div className="ml-auto flex items-center gap-0.5">
          {SEVERITIES.map(s => (
            <button
              key={s}
              onClick={() => setSeverityFilter(s)}
              className={`px-2.5 py-1.5 rounded text-[11px] font-medium transition-colors capitalize ${
                severityFilter === s ? 'bg-accent text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-surface-50'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading && !history.length ? (
        <div className="flex flex-col items-center justify-center flex-1 gap-3 text-gray-500">
          <Loader2 size={24} className="animate-spin text-accent" />
          <span className="text-sm">Loading intel history…</span>
        </div>
      ) : history.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 gap-3 text-gray-500">
          <Info size={32} />
          <p className="text-sm">No scan history yet.</p>
          <p className="text-xs">Run the watch cycle from Portfolio Watch to generate intelligence.</p>
          <Link
            to={`/watch?portfolio=${portfolioId}&client=${clientId}`}
            className="text-xs text-accent hover:underline flex items-center gap-1 mt-1"
          >
            <ChevronRight size={12} /> Go to Portfolio Watch
          </Link>
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          {/* LEFT — Alert feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {filtered.length === 0 ? (
              <div className="text-center py-12 text-sm text-gray-500">
                No {severityFilter} alerts in scan history.
              </div>
            ) : filtered.map(alert => {
              const isExpanded = expandedId === alert.id
              return (
                <div
                  key={alert.id}
                  className={[
                    'rounded-xl border bg-surface-100 transition-all cursor-pointer',
                    alert.urgency === 'critical' ? 'border-red-700/40 hover:border-red-600/60 bg-red-900/5' :
                    alert.urgency === 'high'     ? 'border-orange-700/30 hover:border-orange-600/50' :
                    'border-border hover:border-border/80',
                  ].join(' ')}
                  onClick={() => setExpandedId(isExpanded ? null : alert.id)}
                >
                  <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/50">
                    <SeverityBadge urgency={alert.urgency} />
                    <span className="font-mono text-xs font-bold text-accent shrink-0">{alert.ticker}</span>
                    {alert.category && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-50 border border-border text-gray-400 shrink-0">
                        {alert.category}
                      </span>
                    )}
                    {alert.timeframe && (
                      <span className="text-[10px] text-gray-500 shrink-0">{alert.timeframe}</span>
                    )}
                    <div className="ml-auto flex items-center gap-1.5 shrink-0">
                      <Clock size={10} className="text-gray-600" />
                      <span className="text-[10px] text-gray-500">{timeAgo(alert.cycle_at)}</span>
                    </div>
                  </div>
                  <div className="px-4 py-3">
                    <p className="text-xs text-gray-200 leading-relaxed">{alert.headline}</p>
                    {alert.headline !== alert.summary && alert.summary && (
                      <p className="text-[10px] text-gray-400 mt-1 leading-relaxed line-clamp-2">
                        {alert.summary}
                      </p>
                    )}
                    {isExpanded && (
                      <>
                        {alert.talking_points && alert.talking_points.length > 0 && (
                          <div className="mt-3 border-t border-border/50 pt-3">
                            <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">Talking Points</div>
                            <ul className="space-y-1.5">
                              {alert.talking_points.map((tp, i) => (
                                <li key={i} className="text-[11px] text-gray-400 flex items-start gap-2">
                                  <ChevronRight size={10} className="text-accent mt-0.5 shrink-0" />
                                  {tp}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {alert.source && (
                          <p className="text-[10px] text-gray-600 mt-2">Source: {alert.source}</p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* RIGHT — Advisory history panel */}
          <div className="w-80 border-l border-border bg-surface-100 flex flex-col shrink-0">
            <div className="flex border-b border-border shrink-0">
              {(['latest', 'history'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
                    activeTab === tab ? 'text-accent border-b-2 border-accent' : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {tab === 'history' ? `History (${history.length})` : 'Latest Advisory'}
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {activeTab === 'latest' && latest ? (
                <>
                  <div className="text-[10px] text-gray-500 flex items-center gap-1 pb-1">
                    <Clock size={10} /> Last scan {timeAgo(latest.cycle_at)}
                  </div>
                  <AdvisoryCard snap={latest} />
                  {latest.advisory?.advisory_narrative && (
                    <div className="rounded-lg border border-border bg-surface-50 p-3">
                      <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Narrative</div>
                      <p className="text-[11px] text-gray-300 leading-relaxed">
                        {latest.advisory.advisory_narrative}
                      </p>
                    </div>
                  )}
                  {latest.advisory?.portfolio_exposure_summary && (
                    <div className="rounded-lg border border-border bg-surface-50 p-3">
                      <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">Exposure</div>
                      <div className="text-[11px] text-gray-400 space-y-1">
                        <div>
                          <span className="text-gray-500">Sector: </span>
                          {latest.advisory.portfolio_exposure_summary.sector_concentration}
                        </div>
                        <div>
                          <span className="text-gray-500">Beta: </span>
                          {latest.advisory.portfolio_exposure_summary.estimated_portfolio_beta?.toFixed(2)}
                        </div>
                        {latest.advisory.portfolio_exposure_summary.key_risk_factors?.slice(0, 3).map((r, i) => (
                          <div key={i} className="flex items-start gap-1">
                            <span className="text-accent mt-0.5 shrink-0">›</span> {r}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : activeTab === 'history' ? (
                history.map((snap, i) => <AdvisoryCard key={i} snap={snap} />)
              ) : (
                <div className="text-center py-8 text-xs text-gray-500">No advisory data available.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
