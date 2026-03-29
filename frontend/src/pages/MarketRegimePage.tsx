import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import {
  ArrowLeft, RefreshCw, Loader2, Info, Activity, AlertTriangle,
} from 'lucide-react'
import { portfolioApi } from '@/api'
import type { WatchSnapshot } from '@/types'

// ── Helpers ────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

function fmt(n: number | undefined | null, digits = 2): string {
  if (n == null || !isFinite(Number(n))) return '—'
  return Number(n).toFixed(digits)
}

// ── Sub-components ─────────────────────────────────────────────────────────

function RegimeBadge({ regime }: { regime: string }) {
  const map: Record<string, string> = {
    BEARISH_VOL: 'bg-red-900/40 text-red-300 border-red-700/40',
    BULL:        'bg-green-900/30 text-green-300 border-green-700/40',
    NEUTRAL:     'bg-gray-700/40 text-gray-300 border-gray-600/40',
    RISK_OFF:    'bg-orange-900/40 text-orange-300 border-orange-700/40',
    VOLATILE:    'bg-yellow-900/40 text-yellow-200 border-yellow-700/40',
  }
  return (
    <span className={`text-[10px] font-bold px-2.5 py-1 rounded border uppercase tracking-widest ${map[regime] ?? 'bg-surface-50 text-gray-400 border-border'}`}>
      {regime?.replace(/_/g, ' ')}
    </span>
  )
}

function SelloffBadge({ risk }: { risk: string }) {
  const map: Record<string, string> = {
    ELEVATED: 'bg-red-900/40 text-red-300 border-red-700/40',
    MODERATE: 'bg-yellow-900/30 text-yellow-300 border-yellow-700/40',
    LOW:      'bg-green-900/30 text-green-300 border-green-700/40',
  }
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border uppercase tracking-wide ${map[risk] ?? 'bg-surface-50 text-gray-400 border-border'}`}>
      {risk} selloff risk
    </span>
  )
}

function StatCell({
  label, value, sub, valueClass,
}: { label: string; value: string; sub?: string; valueClass?: string }) {
  return (
    <div className="px-4 py-3">
      <div className="text-[9px] uppercase tracking-wider text-gray-500 mb-1">{label}</div>
      <div className={`text-sm font-bold ${valueClass ?? 'text-gray-100'}`}>{value}</div>
      {sub && <div className="text-[9px] text-gray-500 mt-0.5">{sub}</div>}
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function MarketRegimePage() {
  const [params] = useSearchParams()
  const portfolioId = params.get('portfolio') ?? ''
  const clientId    = params.get('client')    ?? ''

  const [history, setHistory] = useState<WatchSnapshot[]>([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    if (!portfolioId || !clientId) return
    setLoading(true)
    try { setHistory(await portfolioApi.watchHistory(portfolioId, clientId)) }
    catch (e) { console.error('market-regime load error', e) }
    finally { setLoading(false) }
  }, [portfolioId, clientId])

  useEffect(() => { load() }, [load])

  const latest = history[0] ?? null
  const regime = latest?.regime

  const sentColors: Record<string, string> = {
    deteriorating: 'text-red-400', stable: 'text-gray-400', improving: 'text-green-400',
  }

  const regimeCells = regime ? [
    {
      label: 'VIX',
      value: fmt(regime.vix),
      sub: regime.vix_term_structure
        ? `${regime.vix_term_structure} (${fmt(regime.vix_term_ratio, 3)})`
        : '',
      valueClass: '',
    },
    {
      label: 'ROLLING 20D',
      value: String(regime.rolling_20d_vol ?? '—'),
      sub: (regime.rolling_20d_vol ?? 0) > 30 ? 'Bearish zone' : 'Normal zone',
      valueClass: (regime.rolling_20d_vol ?? 0) > 30 ? 'text-red-400' : 'text-green-400',
    },
    {
      label: "TODAY'S SUCC",
      value: String(regime.todays_succ ?? '—'),
      sub: regime.succ_range_pct ? `Range ${fmt(regime.succ_range_pct)}%` : '',
      valueClass: '',
    },
    {
      label: 'ATR REGIME',
      value: regime.atr_regime ?? '—',
      sub: '',
      valueClass: regime.atr_regime === 'NORMAL' ? 'text-green-400' : 'text-yellow-400',
    },
    {
      label: 'SELLOFF RISK',
      value: regime.selloff_risk ?? '—',
      sub: '',
      valueClass: regime.selloff_risk === 'ELEVATED'
        ? 'text-red-400'
        : regime.selloff_risk === 'MODERATE'
          ? 'text-yellow-400'
          : 'text-green-400',
    },
    {
      label: 'SIZE FACTOR',
      value: fmt(regime.size_factor),
      sub: '',
      valueClass: (regime.size_factor ?? 0) < 0 ? 'text-red-400' : 'text-green-400',
    },
  ] : []

  if (!portfolioId) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-gray-500">
        No portfolio selected. Open from{' '}
        <Link to="/watch" className="text-accent hover:underline ml-1">Portfolio Watch</Link>.
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-surface-200 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-3 border-b border-border bg-surface-100 shrink-0 sticky top-0 z-10">
        <Link
          to={`/watch?portfolio=${portfolioId}&client=${clientId}`}
          className="text-gray-500 hover:text-gray-300 transition-colors"
        >
          <ArrowLeft size={14} />
        </Link>
        <div>
          <h1 className="text-sm font-semibold text-gray-100 flex items-center gap-2">
            <Activity size={14} className="text-accent" /> Market Regime
          </h1>
          <p className="text-[10px] text-gray-500">
            Portfolio …{portfolioId.slice(-8)}
            {latest && ` · Last scan ${timeAgo(latest.cycle_at)}`}
            {history.length > 1 && ` · ${history.length} snapshots`}
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
            to={`/intel-feed?portfolio=${portfolioId}&client=${clientId}`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-50 hover:bg-surface-50/70 text-xs text-gray-300 border border-border transition-colors"
          >
            <AlertTriangle size={12} /> Intel Feed
          </Link>
        </div>
      </div>

      {/* Body */}
      {loading && !history.length ? (
        <div className="flex flex-col items-center justify-center flex-1 gap-3 text-gray-500">
          <Loader2 size={24} className="animate-spin text-accent" />
          <span className="text-sm">Loading regime history…</span>
        </div>
      ) : !regime ? (
        <div className="flex flex-col items-center justify-center flex-1 gap-3 text-gray-500">
          <Info size={32} />
          <p className="text-sm">No regime data yet. Run the watch cycle to generate intelligence.</p>
          <Link
            to={`/watch?portfolio=${portfolioId}&client=${clientId}`}
            className="text-xs text-accent hover:underline"
          >
            Go to Portfolio Watch
          </Link>
        </div>
      ) : (
        <div className="p-6 space-y-4 max-w-5xl mx-auto w-full">

          {/* Current regime banner */}
          <div className="rounded-xl border border-border bg-surface-100 overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-3 border-b border-border flex-wrap">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                Current Market Regime — S&amp;P 500
              </div>
              <RegimeBadge regime={regime.regime} />
              <SelloffBadge risk={regime.selloff_risk} />
              {regime.confidence != null && (
                <span className="text-[10px] text-gray-500">
                  {(Number(regime.confidence) * 100).toFixed(0)}% confidence
                </span>
              )}
              <span className="ml-auto text-[10px] text-gray-600">{timeAgo(latest.cycle_at)}</span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 divide-x divide-border">
              {regimeCells.map(c => (
                <StatCell key={c.label} label={c.label} value={c.value} sub={c.sub} valueClass={c.valueClass} />
              ))}
            </div>
          </div>

          {/* VIX Term Structure */}
          {regime.vix_term_structure && (
            <div className="rounded-xl border border-border bg-surface-100 p-5">
              <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-3">VIX Term Structure</div>
              <div className="flex items-center gap-3 mb-3">
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded border uppercase tracking-wide ${
                    regime.vix_term_structure === 'BACKWARDATION'
                      ? 'bg-red-900/30 text-red-300 border-red-700/30'
                      : 'bg-green-900/20 text-green-300 border-green-700/30'
                  }`}
                >
                  {regime.vix_term_structure}
                </span>
                {regime.vix_term_ratio != null && (
                  <span className="text-xs text-gray-400">Ratio: {fmt(regime.vix_term_ratio, 3)}</span>
                )}
                {regime.vix != null && (
                  <span className="text-xs text-gray-400">VIX: {fmt(regime.vix)}</span>
                )}
              </div>
              <p className="text-[11px] text-gray-400 leading-relaxed">
                {regime.vix_term_structure === 'BACKWARDATION'
                  ? 'Near-term fear elevated above longer-dated expectations — a stress signal. Typically indicates acute risk-off or liquidity concerns in the near term.'
                  : 'VIX curve in normal contango. Near-term volatility below longer-dated expectations, indicating orderly market conditions.'}
              </p>
            </div>
          )}

          {/* Macro narrative + key risks */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {regime.macro_narrative && (
              <div className="rounded-xl border border-border bg-surface-100 p-5">
                <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">Macro Narrative</div>
                <p className="text-xs text-gray-300 leading-relaxed">{regime.macro_narrative}</p>
              </div>
            )}
            {regime.key_risks && regime.key_risks.length > 0 && (
              <div className="rounded-xl border border-border bg-surface-100 p-5">
                <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">Key Risks</div>
                <ul className="space-y-1.5">
                  {regime.key_risks.map((risk, i) => (
                    <li key={i} className="text-xs text-gray-400 flex items-start gap-2">
                      <span className="text-accent mt-0.5 shrink-0">›</span>
                      {risk}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* History timeline */}
          {history.length > 1 && (
            <div className="rounded-xl border border-border bg-surface-100 overflow-hidden">
              <div className="px-5 py-3 border-b border-border">
                <div className="text-[10px] uppercase tracking-wider text-gray-500">
                  Scan History ({history.length} snapshots)
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border text-gray-500">
                      {['Time', 'Regime', 'Selloff Risk', 'VIX', 'Rolling 20D', 'ATR', 'Sentiment'].map(h => (
                        <th key={h} className="py-2 px-4 text-left font-medium text-[10px] uppercase tracking-wider">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((snap, i) => {
                      const r   = snap.regime
                      const adv = snap.advisory
                      return (
                        <tr key={i} className={`border-b border-border/50 ${i === 0 ? 'bg-accent/5' : 'hover:bg-surface-50/30'}`}>
                          <td className="py-2.5 px-4 text-gray-400">
                            {i === 0
                              ? <span className="text-accent font-medium">now</span>
                              : timeAgo(snap.cycle_at)}
                          </td>
                          <td className="py-2.5 px-4">
                            <RegimeBadge regime={r?.regime ?? '—'} />
                          </td>
                          <td className="py-2.5 px-4 text-gray-300 font-medium">
                            {r?.selloff_risk ?? '—'}
                          </td>
                          <td className="py-2.5 px-4 text-gray-300 tabular-nums">
                            {r?.vix != null ? fmt(r.vix) : '—'}
                          </td>
                          <td className="py-2.5 px-4 text-gray-300 tabular-nums">
                            {r?.rolling_20d_vol != null ? fmt(r.rolling_20d_vol) : '—'}
                          </td>
                          <td className={`py-2.5 px-4 font-medium ${r?.atr_regime === 'NORMAL' ? 'text-green-400' : 'text-yellow-400'}`}>
                            {r?.atr_regime ?? '—'}
                          </td>
                          <td className={`py-2.5 px-4 font-medium capitalize ${sentColors[adv?.sentiment_trend ?? ''] ?? 'text-gray-400'}`}>
                            {adv?.sentiment_trend ?? '—'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
