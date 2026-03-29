import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Loader2, Play, BarChart2, TrendingUp, TrendingDown, AlertTriangle,
  CheckCircle, Clock, ChevronDown, ChevronUp, History,
} from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { portfolioApi, clientsApi } from '@/api'
import type { ClientProfile } from '@/types'

// ── types ──────────────────────────────────────────────────────────────────
interface BacktestMetrics {
  total_return_pct?: number; cagr?: number; volatility?: number; sharpe?: number
  sortino?: number; max_drawdown?: number; calmar?: number; win_rate?: number
  beta?: number; alpha?: number
}
interface BenchmarkComparison {
  symbol?: string; total_return_pct?: number; cagr?: number; volatility?: number
  sharpe?: number; max_drawdown?: number; beta?: number
}
interface ScenarioResult {
  name: string; probability?: number; impact_pct?: number
  description?: string; hedging_suggestions?: string[]
}
interface BacktestResult {
  performance?: BacktestMetrics
  benchmark_comparison?: BenchmarkComparison | Record<string, number>
  stress_tests?: { name?: string; scenario?: string; portfolio_impact?: number; description?: string }[]
  drawdown_periods?: { start?: string; end?: string; depth?: number; recovery_days?: number }[]
  monthly_returns?: number[]
  benchmark_monthly_returns?: number[]
  advisor_narrative?: string
  risk_warnings?: string[]
}
interface RunResult {
  portfolio_id?: string; run_at?: string; start_date?: string; end_date?: string; benchmark?: string
  backtest?: BacktestResult
  scenarios?: { scenarios?: ScenarioResult[]; overall_resilience_score?: number }
}
interface HistoryRun {
  run_at?: string; start_date?: string; end_date?: string; benchmark?: string
  total_return_pct?: number; sharpe?: number; max_drawdown?: number
}

// ── helpers ────────────────────────────────────────────────────────────────
/** All _pct + % metrics come as decimal-percentage (15.2 = 15.2%). Ratios are plain. */
function fmtPct(v: number | undefined | null, decimals = 1): string {
  if (v == null || (typeof v === 'number' && isNaN(v))) return '--'
  return `${Number(v) >= 0 ? '+' : ''}${Number(v).toFixed(decimals)}%`
}
function fmtNum(v: number | undefined | null, decimals = 2): string {
  if (v == null || (typeof v === 'number' && isNaN(v))) return '--'
  return Number(v).toFixed(decimals)
}
function safeNum(v: any): number | null {
  const n = Number(v)
  return isFinite(n) ? n : null
}

function buildEquityCurve(
  monthly: number[],
  benchMonthly?: number[],
  startDateStr?: string,
): { label: string; portfolio: number; benchmark?: number }[] {
  if (!monthly.length) return []
  // Detect if values are already decimal-pct (e.g., 2.1 = 2.1%) → divide by 100; else use as-is
  const scale = monthly.some(r => Math.abs(r) > 2) ? 0.01 : 1
  const bscale = benchMonthly && benchMonthly.some(r => Math.abs(r) > 2) ? 0.01 : 1
  const result: { label: string; portfolio: number; benchmark?: number }[] = []
  let pv = 100, bv = 100
  // Generate date labels from startDate
  let cursor = startDateStr ? new Date(startDateStr) : null
  const label0 = cursor ? `${cursor.toLocaleString('default', { month: 'short' })} '${String(cursor.getFullYear()).slice(2)}` : 'Start'
  result.push({ label: label0, portfolio: 100, ...(benchMonthly ? { benchmark: 100 } : {}) })
  for (let i = 0; i < monthly.length; i++) {
    pv = +(pv * (1 + (safeNum(monthly[i]) ?? 0) * scale)).toFixed(2)
    if (benchMonthly) bv = +(bv * (1 + (safeNum(benchMonthly[i]) ?? 0) * bscale)).toFixed(2)
    if (cursor) cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1)
    const lbl = cursor
      ? `${cursor.toLocaleString('default', { month: 'short' })} '${String(cursor.getFullYear()).slice(2)}`
      : `M${i + 1}`
    result.push({ label: lbl, portfolio: pv, ...(benchMonthly ? { benchmark: bv } : {}) })
  }
  return result
}

// ── progress steps ─────────────────────────────────────────────────────────
const STEPS = [
  { label: 'Loading portfolio positions', detail: null },
  { label: 'Fetching historical price data', detail: null },
  { label: 'Running walk-forward analysis', detail: 'monthly rebalancing' },
  { label: 'Computing risk-adjusted metrics', detail: 'Sharpe · Sortino · Calmar' },
  { label: 'Stress testing historical crashes', detail: 'COVID · 2008 GFC · 2022 rate shock' },
  { label: 'Generating forward scenarios', detail: '5 macro regimes' },
  { label: 'Writing advisor narrative', detail: null },
]

function ProgressPanel({ step }: { step: number }) {
  return (
    <div className="card space-y-3">
      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Running Backtest</div>
      <div className="space-y-2">
        {STEPS.map((s, i) => {
          const done = i < step
          const active = i === step
          return (
            <div key={i} className={`flex items-center gap-3 transition-opacity ${i > step ? 'opacity-30' : ''}`}>
              <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0">
                {done
                  ? <CheckCircle size={16} className="text-green-400" />
                  : active
                    ? <Loader2 size={16} className="animate-spin text-accent" />
                    : <div className="w-4 h-4 rounded-full border border-border" />}
              </div>
              <div>
                <span className={`text-sm ${active ? 'text-gray-100 font-medium' : done ? 'text-gray-400' : 'text-gray-600'}`}>
                  {s.label}
                </span>
                {s.detail && active && (
                  <span className="text-xs text-gray-500 ml-2">{s.detail}</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── custom tooltip ─────────────────────────────────────────────────────────
function CurveTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface-100 border border-border rounded-lg px-3 py-2 text-xs shadow-lg">
      <div className="text-gray-400 mb-1">{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ color: p.color }} className="flex items-center justify-between gap-4">
          <span>{p.name}</span>
          <span className="font-mono font-semibold">{p.value?.toFixed(1)}</span>
        </div>
      ))}
    </div>
  )
}

// ─── main component ────────────────────────────────────────────────────────
export default function BacktestPage() {
  const [searchParams] = useSearchParams()
  const [clients, setClients] = useState<ClientProfile[]>([])
  const [portfolios, setPortfolios] = useState<any[]>([])
  const [selectedClient, setSelectedClient] = useState('')
  const [selectedPortfolio, setSelectedPortfolio] = useState('')
  const [startDate, setStartDate] = useState(() => {
    const d = new Date(); d.setFullYear(d.getFullYear() - 5); return d.toISOString().slice(0, 10)
  })
  const [benchmark, setBenchmark] = useState('SPY')
  const [running, setRunning] = useState(false)
  const [progressStep, setProgressStep] = useState(0)
  const [result, setResult] = useState<RunResult | null>(null)
  const [history, setHistory] = useState<HistoryRun[]>([])
  const [fullHistory, setFullHistory] = useState<RunResult[]>([])
  const [historyOpen, setHistoryOpen] = useState(false)
  const [error, setError] = useState('')
  const stepTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => { clientsApi.list().then(setClients).catch(() => {}) }, [])

  useEffect(() => {
    const pid = searchParams.get('portfolio'), cid = searchParams.get('client')
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

  // Fetch history whenever portfolio changes
  useEffect(() => {
    if (!selectedPortfolio || !selectedClient) { setHistory([]); setFullHistory([]); return }
    portfolioApi.backtestHistory(selectedPortfolio, selectedClient)
      .then((d: any) => { setHistory(d.runs ?? []); setFullHistory(d.full_history ?? []) })
      .catch(() => {})
  }, [selectedPortfolio, selectedClient])

  const runBacktest = async () => {
    if (!selectedPortfolio || !selectedClient) return
    setRunning(true); setError(''); setResult(null); setProgressStep(0)
    // Animate progress steps ~1.5s each
    let step = 0
    stepTimerRef.current = setInterval(() => {
      step = Math.min(step + 1, STEPS.length - 1)
      setProgressStep(step)
    }, 1500)
    try {
      const res = await portfolioApi.backtest(selectedPortfolio, selectedClient, {
        start_date: startDate, benchmark,
      })
      setResult(res)
      // Refresh history
      portfolioApi.backtestHistory(selectedPortfolio, selectedClient)
        .then((d: any) => { setHistory(d.runs ?? []); setFullHistory(d.full_history ?? []) })
        .catch(() => {})
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? 'Backtest failed')
    } finally {
      if (stepTimerRef.current) clearInterval(stepTimerRef.current)
      setRunning(false)
    }
  }

  // Load a past run — use full_history so all panels render
  const loadHistoryRun = (runAt: string | undefined) => {
    const full = fullHistory.find(r => r.run_at === runAt)
    if (full) { setResult(full); setHistoryOpen(false) }
  }

  const perf = result?.backtest?.performance
  const bc = result?.backtest?.benchmark_comparison as BenchmarkComparison | undefined
  const scenarios = result?.scenarios?.scenarios ?? []
  const stressTests = result?.backtest?.stress_tests ?? []
  const warnings = result?.backtest?.risk_warnings ?? []
  const drawdowns = result?.backtest?.drawdown_periods ?? []
  const monthlyRet = result?.backtest?.monthly_returns ?? []
  const benchMonthlyRet = result?.backtest?.benchmark_monthly_returns
  const equityCurveData = buildEquityCurve(monthlyRet, benchMonthlyRet ?? undefined, result?.start_date)
  const benchLabel = bc?.symbol ?? result?.benchmark ?? 'Benchmark'
  const hasEquityCurve = equityCurveData.length > 1

  // Comparison bar chart data
  const comparisonData = perf && bc ? [
    { metric: 'Total Return', portfolio: safeNum(perf.total_return_pct) ?? 0, [benchLabel]: safeNum(bc.total_return_pct) ?? 0 },
    { metric: 'CAGR', portfolio: safeNum(perf.cagr) ?? 0, [benchLabel]: safeNum(bc.cagr) ?? 0 },
    { metric: 'Volatility', portfolio: safeNum(perf.volatility) ?? 0, [benchLabel]: safeNum(bc.volatility) ?? 0 },
    { metric: 'Max Drawdown', portfolio: safeNum(perf.max_drawdown) ?? 0, [benchLabel]: safeNum(bc.max_drawdown) ?? 0 },
  ] : []

  const metricCards = perf ? [
    { label: 'Total Return', value: fmtPct(perf.total_return_pct), good: (safeNum(perf.total_return_pct) ?? 0) >= 0 },
    { label: 'CAGR', value: fmtPct(perf.cagr), good: (safeNum(perf.cagr) ?? 0) >= 0 },
    { label: 'Volatility', value: fmtPct(perf.volatility), neutral: true },
    { label: 'Sharpe', value: fmtNum(perf.sharpe), good: (safeNum(perf.sharpe) ?? 0) >= 1 },
    { label: 'Sortino', value: fmtNum(perf.sortino), good: (safeNum(perf.sortino) ?? 0) >= 1 },
    { label: 'Max Drawdown', value: fmtPct(perf.max_drawdown), good: false },
    { label: 'Calmar', value: fmtNum(perf.calmar), good: (safeNum(perf.calmar) ?? 0) >= 0.5 },
    { label: 'Win Rate', value: fmtPct(perf.win_rate, 0), good: (safeNum(perf.win_rate) ?? 0) >= 50 },
    { label: 'Beta', value: fmtNum(perf.beta), neutral: true },
    { label: 'Alpha', value: fmtPct(perf.alpha), good: (safeNum(perf.alpha) ?? 0) >= 0 },
  ] : []

  const clientName = clients.find(c => c.id === selectedClient)
  const selectedPortfolioData = portfolios.find((p: any) => (p.id ?? p.proposal_id) === selectedPortfolio)

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-100 flex items-center gap-2">
          <BarChart2 size={20} className="text-accent" /> Backtesting
        </h1>
        <p className="text-xs text-gray-500 mt-1">Historical performance analysis and forward scenario stress-testing</p>
      </div>

      {/* Controls */}
      <div className="card grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
        <div className="lg:col-span-1">
          <label className="block text-xs text-gray-500 mb-1">Client</label>
          <select value={selectedClient} onChange={e => setSelectedClient(e.target.value)} className="input w-full text-sm">
            <option value="">Select client...</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}
          </select>
        </div>
        <div className="lg:col-span-1">
          <label className="block text-xs text-gray-500 mb-1">Portfolio</label>
          <select value={selectedPortfolio} onChange={e => setSelectedPortfolio(e.target.value)} className="input w-full text-sm" disabled={!selectedClient}>
            <option value="">Select portfolio...</option>
            {portfolios.map((p: any) => {
              const pid = p.id ?? p.proposal_id ?? ''
              return <option key={pid} value={pid}>{pid.slice(0, 8)} — {p.status ?? 'proposal'}</option>
            })}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Start Date</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="input w-full text-sm" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Benchmark</label>
          <select value={benchmark} onChange={e => setBenchmark(e.target.value)} className="input w-full text-sm">
            {['SPY', 'QQQ', 'IWM', 'AGG', 'BND', '60/40'].map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        <div>
          <button onClick={runBacktest} disabled={!selectedPortfolio || running} className="btn-primary w-full flex items-center justify-center gap-2">
            {running ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
            {running ? 'Running...' : 'Run Backtest'}
          </button>
        </div>
      </div>

      {/* History bar (below controls) */}
      {history.length > 0 && (
        <div className="card p-3">
          <button onClick={() => setHistoryOpen(o => !o)}
            className="flex items-center justify-between w-full text-xs text-gray-400 hover:text-gray-200">
            <span className="flex items-center gap-2"><History size={13} /> {history.length} past run{history.length !== 1 ? 's' : ''} for this portfolio</span>
            {historyOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
          {historyOpen && (
            <div className="mt-3 space-y-1">
              {history.map((r, i) => (
                <button key={i} onClick={() => loadHistoryRun(r.run_at)}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-surface-50 border border-transparent hover:border-border transition-colors flex items-center gap-4 text-xs">
                  <Clock size={11} className="text-gray-500 shrink-0" />
                  <span className="text-gray-400 w-36 shrink-0">{r.run_at ? new Date(r.run_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : '--'}</span>
                  <span className="text-gray-500 w-28">{r.start_date} → {r.end_date}</span>
                  <span className="text-gray-500 w-12">{r.benchmark}</span>
                  {r.total_return_pct != null && (
                    <span className={`font-semibold ${r.total_return_pct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {fmtPct(r.total_return_pct)}
                    </span>
                  )}
                  {r.sharpe != null && <span className="text-gray-500">Sharpe {fmtNum(r.sharpe)}</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {error && <div className="rounded-lg border border-red-700/40 bg-red-900/20 px-4 py-3 text-xs text-red-300">{error}</div>}
      {running && <ProgressPanel step={progressStep} />}

      {result && !running && (
        <>
          {/* Meta bar */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 px-1">
            <span className="font-medium text-gray-300">
              {clientName ? `${clientName.first_name} ${clientName.last_name}` : ''}{' '}
              {selectedPortfolioData ? `· ${(selectedPortfolioData.id ?? selectedPortfolioData.proposal_id ?? '').slice(0, 8)}` : ''}
            </span>
            <span>Period: {result.start_date} → {result.end_date}</span>
            <span>Benchmark: <strong className="text-gray-300">{result.benchmark}</strong></span>
            <span>Run: {result.run_at ? new Date(result.run_at).toLocaleString() : ''}</span>
          </div>

          {/* ── Metrics grid ── */}
          {metricCards.length > 0 && (
            <div className="card">
              <div className="section-title mb-4">Performance Metrics</div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {metricCards.map(({ label, value, good, neutral }) => (
                  <div key={label} className="stat-card p-3">
                    <div className="stat-label">{label}</div>
                    <div className={`text-base font-semibold ${neutral ? 'text-yellow-400' : good ? 'text-green-400' : 'text-red-400'}`}>{value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Equity Curve ── */}
          {hasEquityCurve && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <div className="section-title mb-0">Equity Curve (Base = 100)</div>
                {perf?.total_return_pct != null && (
                  <div className="flex items-center gap-4 text-xs">
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-0.5 bg-accent inline-block rounded" /> Portfolio
                      <span className={`ml-1 font-semibold ${(safeNum(perf.total_return_pct) ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {fmtPct(perf.total_return_pct)}
                      </span>
                    </span>
                    {bc?.total_return_pct != null && (
                      <span className="flex items-center gap-1">
                        <span className="w-3 h-0.5 bg-yellow-400 inline-block rounded" /> {benchLabel}
                        <span className={`ml-1 font-semibold ${(safeNum(bc.total_return_pct) ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {fmtPct(bc.total_return_pct)}
                        </span>
                      </span>
                    )}
                  </div>
                )}
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={equityCurveData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false}
                    interval={Math.max(1, Math.floor(equityCurveData.length / 8) - 1)} />
                  <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} axisLine={false}
                    tickFormatter={v => v.toFixed(0)} domain={['auto', 'auto']} />
                  <Tooltip content={<CurveTooltip />} />
                  <ReferenceLine y={100} stroke="#4b5563" strokeDasharray="4 4" />
                  <Line type="monotone" dataKey="portfolio" name="Portfolio" stroke="#6366f1"
                    strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                  {benchMonthlyRet && benchMonthlyRet.length > 0 && (
                    <Line type="monotone" dataKey="benchmark" name={benchLabel} stroke="#fbbf24"
                      strokeWidth={1.5} dot={false} strokeDasharray="4 2" activeDot={{ r: 3 }} />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* ── Portfolio vs Benchmark comparison ── */}
          {comparisonData.length > 0 && (
            <div className="card">
              <div className="section-title mb-4">Portfolio vs {benchLabel}</div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Bar chart */}
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={comparisonData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                    barCategoryGap="30%">
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" vertical={false} />
                    <XAxis dataKey="metric" tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} axisLine={false}
                      tickFormatter={v => `${v}%`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #2a2a3a', borderRadius: 8, fontSize: 12 }}
                      formatter={(v: any) => [`${Number(v).toFixed(1)}%`]}
                    />
                    <Legend iconType="square" iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                    <ReferenceLine y={0} stroke="#4b5563" />
                    <Bar dataKey="portfolio" name="Portfolio" fill="#6366f1" radius={[3, 3, 0, 0]} />
                    <Bar dataKey={benchLabel} fill="#fbbf24" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                {/* Table */}
                <div className="space-y-2">
                  {[
                    { label: 'Total Return', p: perf?.total_return_pct, b: bc?.total_return_pct, pct: true },
                    { label: 'CAGR', p: perf?.cagr, b: bc?.cagr, pct: true },
                    { label: 'Volatility', p: perf?.volatility, b: bc?.volatility, pct: true },
                    { label: 'Sharpe Ratio', p: perf?.sharpe, b: bc?.sharpe, pct: false },
                    { label: 'Max Drawdown', p: perf?.max_drawdown, b: bc?.max_drawdown, pct: true },
                    { label: 'Beta', p: perf?.beta, b: bc?.beta, pct: false },
                  ].map(({ label, p, b, pct }) => {
                    const pv = safeNum(p), bv = safeNum(b)
                    const fmt = (v: number | null) => v == null ? '--' : pct ? `${v.toFixed(1)}%` : v.toFixed(2)
                    const winning = pv != null && bv != null &&
                      (label === 'Volatility' || label === 'Max Drawdown' ? pv < bv : pv > bv)
                    return (
                      <div key={label} className="flex items-center text-xs">
                        <span className="text-gray-500 w-28">{label}</span>
                        <span className={`w-20 text-right font-semibold ${winning ? 'text-green-400' : 'text-gray-200'}`}>{fmt(pv)}</span>
                        <span className="w-4 text-center text-gray-600 text-xs">vs</span>
                        <span className="w-20 text-right text-gray-400">{fmt(bv)}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── Advisor narrative ── */}
          {result.backtest?.advisor_narrative && (
            <div className="card">
              <div className="section-title mb-2">Performance Narrative</div>
              <p className="text-sm text-gray-300 leading-relaxed">{result.backtest.advisor_narrative}</p>
            </div>
          )}

          {/* ── Drawdown periods ── */}
          {drawdowns.length > 0 && (
            <div className="card">
              <div className="section-title mb-3">Key Drawdown Periods</div>
              <div className="divide-y divide-border/40">
                {drawdowns.map((d: any, i) => {
                  // Normalise field names — LLM may use different keys
                  const start    = d.start ?? d.period_start ?? d.peak_date ?? d.from ?? ''
                  const end      = d.end   ?? d.period_end   ?? d.trough_date ?? d.to ?? ''
                  const depth    = safeNum(d.depth ?? d.drawdown ?? d.magnitude ?? d.depth_pct)
                  const recovery = safeNum(d.recovery_days ?? d.recovery ?? d.days_to_recovery)
                  const label    = (start && end) ? `${start} – ${end}` : (d.period ?? d.label ?? `Drawdown ${i + 1}`)
                  return (
                    <div key={i} className="flex items-center justify-between text-xs py-2">
                      <span className="text-gray-400">{label}</span>
                      <span className="text-red-400 font-semibold">{depth != null ? `${depth.toFixed(1)}%` : '--'}</span>
                      {recovery != null && <span className="text-gray-500">{Math.round(recovery)}d recovery</span>}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── Stress tests ── */}
          {stressTests.length > 0 && (
            <div className="card">
              <div className="section-title mb-3">Stress Test Results</div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {stressTests.map((s: any, i) => {
                  // Normalise field names — LLM may use various keys
                  const title  = s.name ?? s.scenario ?? s.test_name ?? s.event ?? s.crash_event ?? `Scenario ${i + 1}`
                  const impact = safeNum(s.portfolio_impact ?? s.impact_pct ?? s.impact ?? s.portfolio_return)
                  const desc   = s.description ?? s.narrative ?? s.detail ?? s.summary ?? ''
                  return (
                    <div key={i} className="p-3 bg-surface-50 rounded-lg border border-border">
                      <div className="text-xs font-semibold text-gray-200 mb-1">{title}</div>
                      {impact != null && (
                        <div className={`text-lg font-bold mb-1 ${impact < 0 ? 'text-red-400' : 'text-green-400'}`}>
                          {impact > 0 ? '+' : ''}{impact.toFixed(1)}%
                        </div>
                      )}
                      {desc && <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── Forward scenarios ── */}
          {scenarios.length > 0 && (
            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <div className="section-title">Forward Scenario Analysis</div>
                {result.scenarios?.overall_resilience_score != null && (
                  <span className="text-xs text-gray-500">
                    Resilience: <span className="text-brand-teal font-semibold">{Number(result.scenarios.overall_resilience_score).toFixed(1)}/10</span>
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {scenarios.map((s, i) => {
                  const impact = safeNum(s.impact_pct)
                  return (
                    <div key={i} className="p-3 bg-surface-50 rounded-lg border border-border">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="text-xs font-semibold text-gray-200">{s.name}</span>
                        {impact != null && (
                          <span className={`text-xs font-bold shrink-0 ${impact >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {impact >= 0 ? <TrendingUp size={10} className="inline mr-0.5" /> : <TrendingDown size={10} className="inline mr-0.5" />}
                            {impact >= 0 ? '+' : ''}{impact.toFixed(1)}%
                          </span>
                        )}
                      </div>
                      {s.probability != null && (
                        <div className="text-xs text-gray-500 mb-1">Probability: {(Number(s.probability) * (Number(s.probability) > 1 ? 1 : 100)).toFixed(0)}%</div>
                      )}
                      {s.description && <p className="text-xs text-gray-500 leading-relaxed">{s.description}</p>}
                      {(s.hedging_suggestions ?? []).length > 0 && (
                        <ul className="mt-2 space-y-0.5">
                          {s.hedging_suggestions!.map((h, j) => (
                            <li key={j} className="text-xs text-gray-500 flex gap-1.5">
                              <span className="text-accent shrink-0">&#8226;</span>{h}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── Risk warnings ── */}
          {warnings.length > 0 && (
            <div className="rounded-lg border border-yellow-700/40 bg-yellow-900/20 p-4">
              <div className="flex items-center gap-2 mb-2 text-yellow-400 text-xs font-semibold uppercase tracking-wide">
                <AlertTriangle size={13} /> Risk Warnings
              </div>
              <ul className="space-y-1">
                {warnings.map((w, i) => (
                  <li key={i} className="text-xs text-yellow-200/80 flex gap-1.5">
                    <span className="shrink-0">&#8226;</span>{w}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  )
}
