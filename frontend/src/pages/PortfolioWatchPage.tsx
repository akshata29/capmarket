import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import {
  Activity, RefreshCw, Loader2, TrendingUp, TrendingDown,
  AlertTriangle, ShieldAlert, BarChart2, Zap, Clock,
  ArrowDown, ArrowUp, Minus, Target, Wifi, WifiOff,
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { portfolioApi, clientsApi } from '@/api'
import { getAdvisorId } from '@/api'
import type { ClientProfile } from '@/types'
import type {
  WatchData, MarketRegime, RiskAdvisory,
  WatchSnapshot, Position,
} from '@/types'

// ── Helpers ────────────────────────────────────────────────────────────────

function fmt(n: number, digits = 2) { return isFinite(n) ? n.toFixed(digits) : '—' }

function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

function isStale(iso: string | null | undefined, maxMins = 40): boolean {
  if (!iso) return true
  return (Date.now() - new Date(iso).getTime()) / 60000 > maxMins
}

// ── Sub-components ─────────────────────────────────────────────────────────

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

function ProximityBar({ label, value }: { label: string; value: number }) {
  const pctVal = Math.min(Math.round(value * 100), 100)
  const color = pctVal >= 80 ? 'bg-red-500' : pctVal >= 50 ? 'bg-yellow-500' : pctVal >= 25 ? 'bg-accent' : 'bg-green-500'
  return (
    <div className="flex items-center gap-3">
      <div className="w-32 text-[11px] text-gray-400 shrink-0">{label}</div>
      <div className="flex-1 h-1.5 rounded-full bg-surface-50 overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pctVal}%` }} />
      </div>
      <div className={`w-10 text-right text-[11px] font-semibold tabular-nums ${pctVal >= 80 ? 'text-red-400' : pctVal >= 50 ? 'text-yellow-400' : 'text-gray-300'}`}>{pctVal}%</div>
    </div>
  )
}

function ActionBadge({ action }: { action: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    add_hedge:       { label: 'add hedge',    cls: 'bg-orange-900/40 text-orange-300 border-orange-700/40' },
    tighten_stop:    { label: 'tighten stop', cls: 'bg-red-900/40 text-red-300 border-red-700/40' },
    watch_closely:   { label: 'watch closely',cls: 'bg-yellow-900/40 text-yellow-300 border-yellow-700/40' },
    reduce_position: { label: 'reduce',       cls: 'bg-red-900/60 text-red-200 border-red-700/60' },
    take_profit:     { label: 'take profit',  cls: 'bg-green-900/40 text-green-300 border-green-700/40' },
  }
  const { label, cls } = map[action] ?? { label: action, cls: 'bg-surface-50 text-gray-400 border-border' }
  return <span className={`text-[10px] font-medium px-2 py-0.5 rounded border ${cls}`}>{label}</span>
}

function PriorityDot({ priority }: { priority: string }) {
  const map: Record<string, string> = { critical: 'bg-red-500', high: 'bg-orange-400', medium: 'bg-yellow-400' }
  return <span className={`inline-block w-1.5 h-1.5 rounded-full ${map[priority] ?? 'bg-gray-500'} mr-1.5`} />
}

// ── Equity Curve ───────────────────────────────────────────────────────────

function EquityCurve({ data, investmentAmount }: { data: Record<string, unknown>; investmentAmount: number }) {
  const curve: { date: string; value: number }[] = (() => {
    const raw = (data as any)?.equity_curve ?? (data as any)?.monthly_returns
    if (Array.isArray(raw)) {
      return raw.map((p: any) => ({
        date: p.date ?? p.month ?? '',
        value: typeof p.value === 'number' ? p.value
          : typeof p.portfolio === 'number' ? p.portfolio * investmentAmount : 0,
      })).filter((p: any) => p.date && p.value > 0)
    }
    return []
  })()

  const totalReturn = (() => {
    const r = (data as any)?.total_return ?? (data as any)?.cagr ?? null
    return typeof r === 'number' ? r : null
  })()

  if (curve.length < 2) {
    return (
      <div className="h-32 flex items-center justify-center text-xs text-gray-600 bg-surface-50 rounded-lg border border-border">
        Equity curve will be available after market data is fetched
      </div>
    )
  }
  const isUp = curve[curve.length - 1].value >= curve[0].value
  return (
    <div>
      {totalReturn != null && (
        <div className={`text-sm font-semibold mb-2 flex items-center gap-1 ${isUp ? 'text-green-400' : 'text-red-400'}`}>
          {isUp ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
          {(totalReturn * 100).toFixed(2)}% Total Return
        </div>
      )}
      <ResponsiveContainer width="100%" height={120}>
        <LineChart data={curve} margin={{ top: 0, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#64748b' }} tickLine={false} interval="preserveStartEnd" />
          <YAxis tick={{ fontSize: 9, fill: '#64748b' }} tickLine={false} width={52}
            tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
          <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, fontSize: 11 }}
            formatter={(v: number) => [`$${v.toLocaleString()}`, 'Portfolio']} />
          <Line type="monotone" dataKey="value" stroke={isUp ? '#34d399' : '#f87171'} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
      <div className="flex justify-between text-[10px] text-gray-600 mt-1">
        <span>{curve[0].date}</span>
        <span>{curve[curve.length - 1].date}</span>
      </div>
    </div>
  )
}

// ── Position Intelligence Table ────────────────────────────────────────────

function SignalBadge({ signal }: { signal: string }) {
  const up = signal === 'EXIT' || signal === 'SELL'
  const dn = signal === 'BUY'
  if (up) return <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-900/50 text-red-300 border border-red-700/40"><ArrowDown size={9} /> EXIT</span>
  if (dn) return <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-900/50 text-green-300 border border-green-700/40"><ArrowUp size={9} /> BUY</span>
  return <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-gray-700/50 text-gray-300 border border-border"><Minus size={9} /> HOLD</span>
}

function PositionIntelligenceTable({ positions }: { positions: Position[] }) {
  if (!positions.length) return <p className="text-xs text-gray-500 py-4">No positions available.</p>
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border text-gray-500">
            {['Signal','Symbol','Shares','Entry','Current','Mkt Value','Cost Basis','Unreal P&L','Return','Score'].map(h => (
              <th key={h} className={`py-2 pr-3 font-medium ${h === 'Signal' || h === 'Symbol' ? 'text-left' : 'text-right'}`}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {positions.map((p, i) => {
            const sym      = (p as any).symbol ?? (p as any).ticker ?? '?'
            const shares   = (p as any).shares ?? 0
            const entry    = (p as any).entry_price ?? 0
            const current  = (p as any).current_price ?? 0
            const mktVal   = (p as any).market_value ?? 0
            const costBasis= (p as any).cost_basis_total ?? (shares > 0 && entry > 0 ? shares * entry : 0)
            const pnl      = (p as any).unrealized_pnl ?? (costBasis > 0 ? mktVal - costBasis : 0)
            const ret      = (p as any).unrealized_pnl_pct ?? (costBasis > 0 ? pnl / costBasis : 0)
            const signal  = ((p as any).signal ?? 'HOLD').toUpperCase()
            const score   = (p as any).score ?? (p as any).conviction_score ?? 50
            const isExit  = signal === 'EXIT' || signal === 'SELL'
            return (
              <tr key={i} className={`border-b border-border/50 hover:bg-surface-50/30 ${isExit ? 'bg-red-900/10' : ''}`}>
                <td className="py-2 pr-3"><SignalBadge signal={signal} /></td>
                <td className="py-2 pr-3 font-mono font-bold text-accent">{sym}</td>
                <td className="py-2 pr-3 text-right text-gray-300">{shares > 0 ? shares.toLocaleString() : '—'}</td>
                <td className="py-2 pr-3 text-right text-gray-400">{entry > 0 ? `$${fmt(entry)}` : '—'}</td>
                <td className="py-2 pr-3 text-right text-gray-300">{current > 0 ? `$${fmt(current)}` : '—'}</td>
                <td className="py-2 pr-3 text-right text-gray-200">{mktVal > 0 ? `$${mktVal.toLocaleString(undefined,{maximumFractionDigits:0})}` : '—'}</td>
                <td className="py-2 pr-3 text-right text-gray-400">{costBasis > 0 ? `$${costBasis.toLocaleString(undefined,{maximumFractionDigits:0})}` : '—'}</td>
                <td className={`py-2 pr-3 text-right font-semibold ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {pnl !== 0 ? `${pnl >= 0 ? '+' : '-'}$${Math.abs(pnl).toLocaleString(undefined,{maximumFractionDigits:0})}` : '—'}
                </td>
                <td className={`py-2 pr-3 text-right font-semibold ${ret >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {ret !== 0 ? `${ret >= 0 ? '+' : ''}${(ret * 100).toFixed(1)}%` : '—'}
                </td>
                <td className="py-2 pr-3 text-right">
                  <div className="inline-flex items-center gap-1">
                    <div className="w-12 h-1 rounded-full bg-surface-50 overflow-hidden">
                      <div className={`h-full rounded-full ${score >= 60 ? 'bg-green-500' : score >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                        style={{ width: `${Math.min(score,100)}%` }} />
                    </div>
                    <span className="text-gray-400 tabular-nums w-5 text-right">{Math.round(score)}</span>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ── News Ticker Banner ─────────────────────────────────────────────────────

function NewsTicker({
  snapshot, portfolioId, clientId,
}: { snapshot: WatchSnapshot; portfolioId?: string; clientId?: string }) {
  const news = snapshot?.news as any
  const critical: any[] = news?.critical_alerts ?? []
  const high: any[]     = news?.high_priority ?? []
  const all = [...critical, ...high].slice(0, 8)
  const critCount = critical.length
  const highCount = high.length
  const hoursAgo = Math.round((Date.now() - new Date(snapshot.cycle_at).getTime()) / 3600000)
  const since = hoursAgo < 1 ? 'last hour' : `last ${hoursAgo}h`
  if (!all.length) return null
  return (
    <div className="rounded-xl border border-border bg-surface-100 overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border">
        <AlertTriangle size={13} className="text-yellow-400 shrink-0" />
        <span className="text-xs font-semibold text-gray-200">
          {critCount > 0 && <span className="text-red-400">{critCount} Critical</span>}
          {critCount > 0 && highCount > 0 && <span className="text-gray-500"> · </span>}
          {highCount > 0 && <span className="text-orange-300">{highCount} High</span>}
          <span className="text-gray-500 font-normal ml-1">alerts in {since}</span>
        </span>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[10px] text-gray-600">{timeAgo(snapshot.cycle_at)}</span>
          {portfolioId && clientId && (
            <Link
              to={`/intel-feed?portfolio=${portfolioId}&client=${clientId}`}
              className="text-[10px] text-accent hover:underline"
            >
              View Intel Feed →
            </Link>
          )}
        </div>
      </div>
      <div className="flex gap-0 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        {all.map((a, i) => {
          const ticker = a.ticker ?? a.tickers_affected?.[0] ?? 'MKT'
          const headline = (a.headline ?? a.summary ?? '').slice(0, 80)
          const isCrit = i < critCount
          return (
            <div key={i} className={`shrink-0 px-3 py-2.5 border-r border-border last:border-r-0 w-52 ${isCrit ? 'bg-red-900/10' : ''}`}>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="font-mono text-[10px] font-bold text-accent">{ticker}</span>
                {isCrit && <span className="text-[8px] font-bold text-red-400 uppercase tracking-wider">CRIT</span>}
              </div>
              <p className="text-[10px] text-gray-400 leading-relaxed line-clamp-2">{headline}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Market Regime Panel ────────────────────────────────────────────────────

function MarketRegimePanel({
  regime, portfolioId, clientId,
}: { regime: MarketRegime; portfolioId?: string; clientId?: string }) {
  const cells = [
    { label: 'VIX',          value: fmt(regime.vix),                   sub: regime.vix_term_structure ? `${regime.vix_term_structure} (${fmt(regime.vix_term_ratio, 3)})` : '' },
    { label: 'ROLLING 20D',  value: String(regime.rolling_20d_vol || '—'), sub: (regime.rolling_20d_vol ?? 0) > 30 ? 'Bearish zone' : 'Normal zone' },
    { label: "TODAY'S SUCC", value: String(regime.todays_succ ?? '—'), sub: regime.succ_range_pct ? `Range ${fmt(regime.succ_range_pct)}%` : '' },
    { label: 'ATR REGIME',   value: regime.atr_regime ?? '—',          sub: '', valueClass: regime.atr_regime === 'NORMAL' ? 'text-green-400' : 'text-yellow-400' },
    { label: 'SELLOFF RISK', value: regime.selloff_risk ?? '—',        sub: '', valueClass: regime.selloff_risk === 'ELEVATED' ? 'text-red-400' : regime.selloff_risk === 'MODERATE' ? 'text-yellow-400' : 'text-green-400' },
    { label: 'SIZE',         value: fmt(regime.size_factor),            sub: '', valueClass: (regime.size_factor ?? 0) < 0 ? 'text-red-400' : 'text-green-400' },
  ]
  return (
    <div className="rounded-xl border border-border bg-surface-100 overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border flex-wrap">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Market Regime — S&P 500</div>
        <RegimeBadge regime={regime.regime} />
        <SelloffBadge risk={regime.selloff_risk} />
        <span className="text-[10px] text-gray-600">{regime.confidence != null ? `${(Number(regime.confidence)*100).toFixed(0)}% confidence` : ''}</span>
        <div className="ml-auto flex items-center gap-2">
          {portfolioId && clientId && (
            <Link
              to={`/market-regime?portfolio=${portfolioId}&client=${clientId}`}
              className="text-[10px] text-accent hover:underline"
            >
              Full Dashboard →
            </Link>
          )}
        </div>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-6 divide-x divide-border">
        {cells.map(({ label, value, sub, valueClass }) => (
          <div key={label} className="px-4 py-3">
            <div className="text-[9px] uppercase tracking-wider text-gray-500 mb-1">{label}</div>
            <div className={`text-sm font-bold ${valueClass ?? 'text-gray-100'}`}>{value}</div>
            {sub && <div className="text-[9px] text-gray-500 mt-0.5">{sub}</div>}
          </div>
        ))}
      </div>
      {regime.macro_narrative && (
        <div className="px-4 py-2 border-t border-border">
          <p className="text-[10px] text-gray-500 leading-relaxed">{regime.macro_narrative}</p>
        </div>
      )}
    </div>
  )
}

// ── Risk Advisory Panel ────────────────────────────────────────────────────

function RiskAdvisoryPanel({ advisory, onRun }: { advisory: RiskAdvisory; onRun?: () => void }) {
  const prox = advisory.rebalance_proximity ?? {} as any
  const recs = advisory.recommendations ?? []
  const riskColors: Record<string, string> = { elevated: 'text-red-400', moderate: 'text-yellow-400', low: 'text-green-400' }
  const sentColors: Record<string, string> = { deteriorating: 'text-red-400', stable: 'text-gray-400', improving: 'text-green-400' }
  return (
    <div className="rounded-xl border border-border bg-surface-100 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border flex-wrap">
        <ShieldAlert size={13} className="text-accent shrink-0" />
        <span className="text-sm font-semibold text-gray-100">Portfolio Advisory</span>
        <span className="flex items-center gap-1 text-xs">
          <span className={`font-medium ${riskColors[advisory.risk_level] ?? 'text-gray-400'}`}>Risk {advisory.risk_level}</span>
          <span className="text-gray-600 mx-1">·</span>
          <span className={`font-medium ${sentColors[advisory.sentiment_trend] ?? 'text-gray-400'}`}>Sentiment {advisory.sentiment_trend}</span>
        </span>
        {advisory.total_signals > 0 && <span className="text-[10px] text-gray-500">{advisory.total_signals} signals</span>}
        {onRun && (
          <button onClick={onRun} className="ml-auto text-[10px] text-accent hover:underline flex items-center gap-1">
            <Zap size={10} /> Run
          </button>
        )}
      </div>
      {/* Narrative */}
      {advisory.advisory_narrative && (
        <div className="px-4 py-3 border-b border-border">
          <p className="text-xs text-gray-400 leading-relaxed">{advisory.advisory_narrative}</p>
        </div>
      )}
      {/* Rebalance Proximity */}
      <div className="px-4 py-3 border-b border-border">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-3">Rebalance Proximity</div>
        <div className="space-y-2.5">
          <ProximityBar label="Weight drift"    value={prox.weight_drift     ?? 0} />
          <ProximityBar label="Vol cap"          value={prox.vol_cap          ?? 0} />
          <ProximityBar label="Theme confidence" value={prox.theme_confidence ?? 0} />
          <ProximityBar label="Correlation"      value={prox.correlation      ?? 0} />
          <ProximityBar label="Options roll"     value={prox.options_roll     ?? 0} />
        </div>
      </div>
      {/* Recommendations */}
      {recs.length > 0 && (
        <div className="px-4 py-3">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-3">Recommendations ({recs.length})</div>
          <div className="space-y-3">
            {recs.map((r, i) => (
              <div key={i} className="flex gap-3 items-start">
                <span className="font-mono text-xs font-bold text-accent w-12 shrink-0 pt-0.5">{r.symbol}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <ActionBadge action={r.action} />
                    <span className={`text-[10px] font-semibold ${r.priority === 'critical' ? 'text-red-400' : r.priority === 'high' ? 'text-orange-400' : 'text-yellow-400'}`}>
                      <PriorityDot priority={r.priority} />{r.priority}
                    </span>
                    {r.weight_pct > 0 && <span className="ml-auto text-[10px] text-gray-500 font-mono">{fmt(r.weight_pct, 1)}% wt</span>}
                  </div>
                  <p className="text-[11px] text-gray-400 leading-relaxed">{r.rationale}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Perf Stats Bar ─────────────────────────────────────────────────────────

function PerfStatsBar({ data }: { data: WatchData }) {
  // Performance numbers live inside the equity_curve object (output of BacktestingAgent)
  const ec = (data as any).equity_curve ?? {}
  const inv = data.investment_amount ?? 0
  const positions = data.positions ?? []

  // Portfolio value: last point of curve array, or sum of market values, or investment amount
  const curveArr: any[] = Array.isArray(ec?.equity_curve) ? ec.equity_curve
    : Array.isArray(ec?.monthly_returns) ? ec.monthly_returns : []
  const lastPt = curveArr.length > 0 ? curveArr[curveArr.length - 1] : null
  const portfolioValue = lastPt
    ? (lastPt.value ?? (typeof lastPt.portfolio === 'number' ? lastPt.portfolio * inv : inv))
    : (positions as any[]).reduce((s: number, p: any) => s + (p.market_value ?? 0), 0) || inv

  const totalReturn = ec.total_return ?? ec.return ?? null
  const cagr        = ec.cagr ?? null
  const sharpe      = ec.sharpe ?? ec.sharpe_ratio ?? null
  const maxDD       = ec.max_drawdown ?? null

  const stats = [
    { label: 'Portfolio Value', value: `$${portfolioValue.toLocaleString(undefined,{maximumFractionDigits:0})}` },
    { label: 'Total Return',    value: totalReturn != null ? `${(totalReturn*100).toFixed(2)}%` : '—',   neg: (totalReturn ?? 0) < 0 },
    { label: 'CAGR',            value: cagr        != null ? `${(cagr*100).toFixed(2)}%`        : '—',   neg: (cagr ?? 0) < 0 },
    { label: 'Sharpe',          value: sharpe      != null ? fmt(sharpe)                         : '—',   neg: (sharpe ?? 0) < 0 },
    { label: 'Max Drawdown',    value: maxDD       != null ? `${(maxDD*100).toFixed(1)}%`        : '—',   neg: true },
    { label: 'Positions',       value: String(positions.length) },
  ]
  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-px bg-border rounded-xl overflow-hidden border border-border">
      {stats.map(({ label, value, neg }) => (
        <div key={label} className="bg-surface-100 px-3 py-3">
          <div className="text-[9px] uppercase tracking-wider text-gray-500 mb-1">{label}</div>
          <div className={`text-sm font-bold ${neg ? 'text-red-400' : 'text-gray-100'}`}>{value}</div>
        </div>
      ))}
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function PortfolioWatchPage() {
  const [searchParams] = useSearchParams()
  const [allPortfolios, setAllPortfolios] = useState<any[]>([])
  const [loadingPortfolios, setLoadingPortfolios] = useState(true)
  const [clients, setClients] = useState<ClientProfile[]>([])
  const [clientFilter, setClientFilter] = useState('')
  const [selectedPortfolioId, setSelectedPortfolioId] = useState('')
  const [selectedClientId, setSelectedClientId] = useState('')
  const [loading, setLoading] = useState(false)
  const [cycleRunning, setCycleRunning] = useState(false)
  const [data, setData] = useState<WatchData | null>(null)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'advisory' | 'performance'>('advisory')
  const advisorId = getAdvisorId()

  useEffect(() => { clientsApi.list().then(setClients).catch(() => {}) }, [advisorId])

  useEffect(() => {
    setLoadingPortfolios(true)
    portfolioApi.byAdvisor(advisorId)
      .then((ps: any[]) => {
        const approved = ps.filter(p => p.status === 'approved' || p.status === 'pending_approval')
        setAllPortfolios(approved)
        const urlPid = searchParams.get('portfolio')
        const urlCid = searchParams.get('client')
        if (urlPid && urlCid) {
          setSelectedPortfolioId(urlPid); setSelectedClientId(urlCid)
        } else if (approved.length > 0) {
          setSelectedPortfolioId(approved[0].proposal_id ?? approved[0].id ?? '')
          setSelectedClientId(approved[0].client_id ?? '')
        }
      })
      .catch(() => {})
      .finally(() => setLoadingPortfolios(false))
  }, [advisorId])

  const fetchWatch = useCallback(async () => {
    if (!selectedPortfolioId || !selectedClientId) return
    setLoading(true); setError('')
    try { setData(await portfolioApi.watch(selectedPortfolioId, selectedClientId)) }
    catch (e: any) { setError(e?.response?.data?.detail ?? 'Failed to load portfolio data') }
    finally { setLoading(false) }
  }, [selectedPortfolioId, selectedClientId])

  useEffect(() => { fetchWatch() }, [fetchWatch])

  const runWatchCycle = async () => {
    if (!selectedPortfolioId || !selectedClientId || cycleRunning) return
    setCycleRunning(true)
    try { await portfolioApi.watchCycle(selectedPortfolioId, selectedClientId); await fetchWatch() }
    catch (e: any) { setError(e?.response?.data?.detail ?? 'Watch cycle failed') }
    finally { setCycleRunning(false) }
  }

  const snap      = data?.last_watch_snapshot
  const regime    = snap?.regime
  const advisory  = snap?.advisory
  const hasFresh  = snap && !isStale(snap.cycle_at, 40)
  const positions = data?.positions ?? []

  return (
    <div className="flex h-full min-h-screen">
      {/* LEFT SIDEBAR */}
      <aside className="w-56 shrink-0 border-r border-border bg-surface-100 flex flex-col">
        <div className="px-4 py-3 border-b border-border space-y-2">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Client</div>
          <select
            value={clientFilter}
            onChange={e => {
              setClientFilter(e.target.value)
              setSelectedPortfolioId('')
              setSelectedClientId('')
            }}
            className="w-full bg-surface-50 border border-border rounded text-xs text-gray-200 px-2 py-1 focus:outline-none focus:border-accent"
          >
            <option value="">All clients</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>
                {c.first_name && c.last_name
                  ? `${c.first_name} ${c.last_name}`
                  : c.id}
              </option>
            ))}
          </select>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 pt-1">Portfolios</div>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          {loadingPortfolios
            ? <div className="px-4 py-3 flex items-center gap-2 text-xs text-gray-500"><Loader2 size={12} className="animate-spin" /> Loading...</div>
            : (() => {
                const visible = clientFilter
                  ? allPortfolios.filter(p => (p.client_id ?? '') === clientFilter)
                  : allPortfolios
                return visible.length === 0
                  ? <div className="px-4 py-3 text-xs text-gray-600">{clientFilter ? 'No portfolios for this client' : 'No approved portfolios'}</div>
                  : visible.map(p => {
                  const pid = p.proposal_id ?? p.id ?? ''
                  const cid = p.client_id ?? ''
                  const isActive = pid === selectedPortfolioId
                  const mandate = (p.mandate ?? 'balanced') as string
                  const posCount = (p.positions ?? []).length
                  const createdAt = (p.approved_at ?? p.created_at ?? '').slice(0, 10)
                  return (
                    <button key={pid}
                      onClick={() => { setSelectedPortfolioId(pid); setSelectedClientId(cid) }}
                      className={`w-full text-left px-4 py-3 border-b border-border/50 transition-colors
                        ${isActive ? 'bg-accent/10 border-l-2 border-l-accent' : 'hover:bg-surface-50'}`}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-xs font-semibold text-gray-200 truncate flex-1">
                          {mandate.charAt(0).toUpperCase() + mandate.slice(1)}
                        </span>
                        {p.last_watch_cycle_at && <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" title="Agent data available" />}
                      </div>
                      <div className="text-[10px] text-gray-400 font-mono">
                        {cid.slice(0, 8)}<span className="text-gray-600">/</span>{pid.slice(-6)}
                      </div>
                      <div className="text-[10px] text-gray-500 mt-0.5">{posCount} pos · {p.status}</div>
                      {createdAt && <div className="text-[9px] text-gray-600 mt-0.5 flex items-center gap-1"><Clock size={8} />{createdAt}</div>}
                    </button>
                  )
                })
              })()
          }
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 max-w-5xl">
        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-100 flex items-center gap-2">
              <Activity size={20} className="text-accent" /> Portfolio Watch
            </h1>
            {data && (
              <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                <span>{positions.length} positions</span>
                {data.inception_date && <><span>·</span><span>Since {data.inception_date}</span></>}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {hasFresh && (
              <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full bg-green-900/30 text-green-400 border border-green-700/40">
                <Wifi size={9} /> Latest — {timeAgo(snap!.cycle_at)}
              </span>
            )}
            {!hasFresh && snap && (
              <span className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-yellow-900/30 text-yellow-400 border border-yellow-700/40">
                <WifiOff size={9} /> Stale — {timeAgo(snap.cycle_at)}
              </span>
            )}
            <button onClick={fetchWatch} disabled={!selectedPortfolioId || loading}
              className="btn-secondary text-xs flex items-center gap-1.5 px-3 py-1.5">
              {loading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />} Refresh
            </button>
            <Link to={`/rebalance?client=${selectedClientId}&portfolio=${selectedPortfolioId}`}
              className="btn-secondary text-xs flex items-center gap-1.5 px-3 py-1.5">
              <RefreshCw size={12} /> Rebalance
            </Link>
            <button onClick={runWatchCycle} disabled={!selectedPortfolioId || cycleRunning}
              className="btn-primary text-xs flex items-center gap-1.5 px-3 py-1.5">
              {cycleRunning ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}
              {cycleRunning ? 'Running Agents...' : 'Run Agents'}
            </button>
          </div>
        </div>

        {!selectedPortfolioId && !loadingPortfolios && (
          <div className="card text-center py-10">
            <Activity size={28} className="mx-auto text-gray-600 mb-3" />
            <p className="text-sm text-gray-400">Select a portfolio from the left to view autonomous agent intelligence.</p>
          </div>
        )}
        {error && <div className="rounded-lg border border-red-700/40 bg-red-900/20 px-4 py-3 text-xs text-red-300">{error}</div>}
        {loading && !data && (
          <div className="card flex items-center gap-3 text-sm text-gray-400 py-8 justify-center">
            <Loader2 size={16} className="animate-spin text-accent" /> Loading portfolio intelligence...
          </div>
        )}

        {data && (
          <>
            {/* Vol / risk strip */}
            <div className="grid grid-cols-4 gap-px bg-border rounded-xl overflow-hidden border border-border">
              {[
                { label: 'Vol Target',    value: (data as any).metrics?.volatility_target ? `${((data as any).metrics.volatility_target * 100).toFixed(0)}%` : '—' },
                { label: 'Actual Vol',    value: regime ? `${fmt(regime.rolling_20d_vol)}%` : '—', flag: regime && regime.rolling_20d_vol > 25 },
                { label: 'Max DD Target', value: (data as any).metrics?.max_drawdown ? `${Math.abs((data as any).metrics.max_drawdown * 100).toFixed(0)}%` : '—' },
                { label: 'HHI',           value: (data as any).metrics?.hhi ? fmt((data as any).metrics.hhi, 3) : '—' },
              ].map(({ label, value, flag }) => (
                <div key={label} className="bg-surface-100 px-4 py-3">
                  <div className="text-[9px] uppercase tracking-wider text-gray-500 mb-1">{label}</div>
                  <div className={`text-xl font-bold ${flag ? 'text-red-400' : 'text-gray-100'}`}>{value}</div>
                </div>
              ))}
            </div>

            {snap && <NewsTicker snapshot={snap} portfolioId={selectedPortfolioId} clientId={selectedClientId} />}

            {!snap && (
              <div className="card border-dashed text-center py-6">
                <Zap size={22} className="mx-auto text-gray-600 mb-2" />
                <p className="text-sm text-gray-400 mb-3">
                  No agent data yet. Agents run automatically every 30 min, or click <strong className="text-accent">Run Agents</strong> now.
                </p>
                <button onClick={runWatchCycle} disabled={cycleRunning}
                  className="btn-primary text-xs inline-flex items-center gap-2 mx-auto">
                  {cycleRunning ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}
                  {cycleRunning ? 'Running... (~60s)' : 'Run Agents Now'}
                </button>
              </div>
            )}

            {regime && <MarketRegimePanel regime={regime} portfolioId={selectedPortfolioId} clientId={selectedClientId} />}

            {/* Tabs */}
            <div className="flex gap-1 border-b border-border">
              {([['advisory', 'Portfolio Advisory'], ['performance', 'Performance & Positions']] as const).map(([tab, label]) => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`text-xs px-4 py-2 border-b-2 transition-colors
                    ${activeTab === tab ? 'border-accent text-accent' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>
                  {label}
                </button>
              ))}
            </div>

            {activeTab === 'advisory' && (
              <div className="space-y-4">
                {advisory
                  ? <RiskAdvisoryPanel advisory={advisory} onRun={runWatchCycle} />
                  : <div className="card text-center py-6 text-xs text-gray-500">Run agents to see portfolio risk synthesis.</div>}
                {((data as any).themes ?? []).length > 0 && (
                  <div className="card">
                    <div className="section-title mb-2">Portfolio Themes</div>
                    <div className="flex flex-wrap gap-2">
                      {((data as any).themes as any[]).map((t, i) => {
                        const label = typeof t === 'string' ? t : (t?.name ?? '')
                        return <span key={i} className="px-2 py-0.5 rounded-full text-xs bg-accent/10 text-accent border border-accent/20">{label}</span>
                      })}
                    </div>
                  </div>
                )}
                {data.rationale && (
                  <div className="card">
                    <div className="section-title mb-1">Investment Rationale</div>
                    <p className="text-xs text-gray-400 leading-relaxed">{data.rationale}</p>
                  </div>
                )}
                <div className="flex gap-3 flex-wrap">
                  <Link to={`/backtest?client=${selectedClientId}&portfolio=${selectedPortfolioId}`}
                    className="btn-secondary text-xs flex items-center gap-2"><BarChart2 size={13} /> Run Backtest</Link>
                  <Link to={`/rebalance?client=${selectedClientId}&portfolio=${selectedPortfolioId}`}
                    className="btn-secondary text-xs flex items-center gap-2"><RefreshCw size={13} /> Full Rebalance</Link>
                </div>
              </div>
            )}

            {activeTab === 'performance' && (
              <div className="space-y-4">
                <PerfStatsBar data={data} />
                <div className="card">
                  <div className="section-title mb-3 flex items-center gap-2">
                    <TrendingUp size={14} className="text-accent" /> Equity Curve
                    {data.inception_date && <span className="text-xs text-gray-500 font-normal">since {data.inception_date}</span>}
                  </div>
                  <EquityCurve data={data as any} investmentAmount={data.investment_amount ?? 0} />
                </div>
                <div className="card">
                  <div className="section-title mb-3 flex items-center justify-between">
                    <span className="flex items-center gap-2"><Target size={14} className="text-accent" /> Position Intelligence</span>
                    <span className="text-[10px] text-gray-500">{positions.length} open positions</span>
                  </div>
                  <PositionIntelligenceTable positions={positions} />
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
