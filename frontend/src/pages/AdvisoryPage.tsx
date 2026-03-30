import { useState, useEffect, useRef } from 'react'
import { Loader2, Lightbulb, TrendingUp, MessageSquare, Users, BarChart2, History, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, Mail, Copy, Check } from 'lucide-react'
import { advisoryApi, clientsApi, getAdvisorId } from '@/api'
import type { ClientProfile } from '@/types'

type Tab = 'briefing' | 'position' | 'tax' | 'chat' | 'relationship' | 'history'

interface BriefingRecord {
  advisory_id: string
  type: string
  client_id: string
  prepared_at: string
  created_at: string
  timeframe_days?: number
  scan_cycles_used?: number
  position_briefing?: Record<string, unknown>
  advisory_briefing?: Record<string, unknown>
  news_briefing?: Record<string, unknown>
  tax_analysis?: Record<string, unknown>
  relationship_ideas?: Record<string, unknown>
  client_email?: { subject?: string; body?: string; key_points?: string[] }
  meeting_type?: string
  result?: Record<string, unknown>  // tax_strategies: holds { strategies, total_opportunity, priority_order }
  ideas?: Array<Record<string, unknown>>  // relationship_ideas
  priority_sequence?: number[]
}

export default function AdvisoryPage() {
  const [tab, setTab] = useState<Tab>('briefing')
  const [clients, setClients] = useState<ClientProfile[]>([])
  const [selectedClient, setSelectedClient] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Record<string, unknown> | null>(null)
  const [chatInput, setChatInput] = useState('')
  const [chatHistory, setChatHistory] = useState<{
    role: 'user' | 'assistant'
    content: string
    structured?: {
      answer?: string
      supporting_evidence?: string[]
      action_items?: string[]
      caveats?: string[]
      sources?: string[]
    }
  }[]>([])
  const [history, setHistory] = useState<BriefingRecord[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [expandedHistory, setExpandedHistory] = useState<string | null>(null)
  const [timeframeDays, setTimeframeDays] = useState(7)
  const [copiedEmail, setCopiedEmail] = useState(false)
  const emailRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    clientsApi.list().then(setClients).catch(() => [])
  }, [])

  const client = clients.find(c => c.id === selectedClient)

  const runPreMeeting = async () => {
    if (!client) return
    setLoading(true)
    setResult(null)
    try {
      const res = await advisoryApi.preMeeting({
        advisor_id: getAdvisorId(),
        client_profile: client as unknown as Record<string, unknown>,
        meeting_type: 'annual_review',
      })
      setResult(res as unknown as Record<string, unknown>)
    } finally {
      setLoading(false)
    }
  }

  const runPositionBriefing = async () => {
    if (!client) return
    setLoading(true)
    setResult(null)
    try {
      const res = await advisoryApi.positionBriefing({
        advisor_id: getAdvisorId(),
        client_profile: client as unknown as Record<string, unknown>,
        timeframe_days: timeframeDays,
      })
      setResult(res)
    } finally {
      setLoading(false)
    }
  }

  const copyEmail = (body: string) => {
    navigator.clipboard.writeText(body)
    setCopiedEmail(true)
    setTimeout(() => setCopiedEmail(false), 2000)
  }

  const runTax = async () => {
    if (!client) return
    setLoading(true)
    setResult(null)
    try {
      const res = await advisoryApi.taxStrategies({
        advisor_id: getAdvisorId(),
        client_profile: client as unknown as Record<string, unknown>,
      })
      setResult(res as unknown as Record<string, unknown>)
    } finally {
      setLoading(false)
    }
  }

  const runRelationship = async () => {
    if (!client) return
    setLoading(true)
    setResult(null)
    try {
      const res = await advisoryApi.relationshipIdeas({
        advisor_id: getAdvisorId(),
        client_profile: client as unknown as Record<string, unknown>,
      })
      setResult(res as unknown as Record<string, unknown>)
    } finally {
      setLoading(false)
    }
  }

  const loadHistory = async () => {
    setHistoryLoading(true)
    try {
      const data = await advisoryApi.history(getAdvisorId(), selectedClient || undefined)
      setHistory(data as BriefingRecord[])
    } finally {
      setHistoryLoading(false)
    }
  }

  useEffect(() => {
    if (tab === 'history') loadHistory()
  }, [tab, selectedClient])

  const sendChat = async () => {
    if (!chatInput.trim()) return
    const msg = chatInput
    setChatInput('')
    setChatHistory(h => [...h, { role: 'user', content: msg }])
    const res = await advisoryApi.chat({
      advisor_id: getAdvisorId(),
      question: msg,
      client_profile: client as unknown as Record<string, unknown> | undefined,
    }) as { answer?: string; supporting_evidence?: string[]; action_items?: string[]; caveats?: string[]; sources?: string[] }
    setChatHistory(h => [...h, {
      role: 'assistant',
      content: res.answer ?? JSON.stringify(res),
      structured: res,
    }])
  }

  const TABS = [
    { key: 'briefing' as Tab, icon: Lightbulb, label: 'Pre-Meeting Briefing' },
    { key: 'position' as Tab, icon: BarChart2, label: 'Position Briefing' },
    { key: 'tax' as Tab, icon: TrendingUp, label: 'Tax Strategies' },
    { key: 'chat' as Tab, icon: MessageSquare, label: 'Advisor AI Chat' },
    { key: 'relationship' as Tab, icon: Users, label: 'Relationship Ideas' },
    { key: 'history' as Tab, icon: History, label: 'Briefing History' },
  ]

  const stanceColor = (stance: string) => {
    if (stance === 'DEFENSIVE') return 'text-red-400'
    if (stance === 'OPPORTUNISTIC') return 'text-green-400'
    return 'text-yellow-400'
  }

  const urgencyBadge = (urgency: string) => {
    if (urgency === 'immediate') return 'badge badge-error'
    if (urgency === 'today') return 'badge badge-warning'
    return 'badge badge-info'
  }

  // AI sometimes returns list items as objects instead of strings — safely render any shape
  const toStr = (v: unknown): string => {
    if (typeof v === 'string') return v
    if (v === null || v === undefined) return ''
    if (typeof v === 'object') {
      const o = v as Record<string, unknown>
      // meeting agenda: {topic, time, points}
      if (o.topic) return [o.topic, o.time ? `(${o.time})` : '', o.points].filter(Boolean).join(' — ')
      // generic fallbacks
      if (o.name) return o.name as string
      if (o.title) return o.title as string
      if (o.text) return o.text as string
      if (o.strategy) return o.strategy as string
      if (o.idea) return o.idea as string
      if (o.item) return o.item as string
      return JSON.stringify(o)
    }
    return String(v)
  }

  const renderTaxDetail = (ta: Record<string, unknown>) => {
    const strategies = (ta.strategies ?? []) as Array<Record<string, unknown>>
    const totalOpp = ta.total_opportunity as string | undefined
    if (strategies.length === 0) return <div className="text-xs text-gray-500">No strategies available.</div>
    return (
      <div className="space-y-4">
        {totalOpp && (
          <div className="card py-2 px-4 flex items-center gap-3">
            <span className="text-xs text-gray-500">Total Opportunity</span>
            <span className="text-base font-bold text-green-400">{totalOpp}</span>
          </div>
        )}
        <div className="space-y-3">
          {strategies.map((s, i) => (
            <div key={i} className="card space-y-2">
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-accent/20 text-accent text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-sm font-semibold text-gray-100">{s.name as string}</span>
                    {s.estimated_savings && (
                      <span className="text-green-400 text-xs font-mono whitespace-nowrap shrink-0">{s.estimated_savings as string} savings</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-300 mt-1">{s.description as string}</p>
                </div>
              </div>
              {((s.steps ?? []) as string[]).length > 0 && (
                <div className="ml-9">
                  <div className="text-xs text-gray-500 mb-1">Implementation Steps</div>
                  <ol className="space-y-1">
                    {((s.steps ?? []) as string[]).map((step, j) => (
                      <li key={j} className="text-xs text-gray-400 flex gap-2">
                        <span className="text-accent/70 shrink-0">{j + 1}.</span>{toStr(step)}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
              <div className="ml-9 flex flex-wrap gap-4">
                {s.deadline && (
                  <div className="text-xs"><span className="text-gray-500">Deadline: </span><span className="text-gray-300">{s.deadline as string}</span></div>
                )}
                {s.risk && (
                  <div className="text-xs"><span className="text-yellow-500">Risk: </span><span className="text-yellow-300/80">{s.risk as string}</span></div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderPreMeetingDetail = (item: BriefingRecord) => {
    const ab = (item.advisory_briefing ?? {}) as Record<string, unknown>
    const mb = (ab.market_briefing ?? {}) as Record<string, unknown>
    const nb = (item.news_briefing ?? {}) as Record<string, unknown>
    const ta = (item.tax_analysis ?? {}) as Record<string, unknown>
    const ri = (item.relationship_ideas ?? {}) as Record<string, unknown>
    const talkingPts = (mb.talking_points ?? []) as string[]
    const taxOps = (ab.tax_opportunities ?? []) as string[]
    const relIdeas = ((ri.ideas ?? ab.relationship_ideas ?? []) as Array<Record<string, unknown>>)
    const agenda = (ab.meeting_agenda ?? []) as string[]
    const crossSell = (ab.cross_sell_opportunities ?? []) as string[]
    const concerns = (ab.proactive_concerns ?? []) as string[]
    const criticalAlerts = (nb.critical_alerts ?? []) as Array<Record<string, unknown>>
    const highPriority = (nb.high_priority ?? []) as Array<Record<string, unknown>>
    const portfolioImpacts = (nb.portfolio_impacts ?? []) as Array<Record<string, unknown>>
    const marketThemes = (nb.market_themes ?? []) as Array<Record<string, unknown>>
    const immediateOps = (ta.immediate_opportunities ?? []) as Array<Record<string, unknown>>
    return (
      <div className="space-y-4">
        {/* Header badges */}
        <div className="flex flex-wrap gap-3">
          {item.meeting_type && (
            <div className="card py-2 px-4 flex items-center gap-2">
              <span className="text-xs text-gray-500">Meeting Type</span>
              <span className="text-sm font-semibold text-gray-200 capitalize">{item.meeting_type.replace('_', ' ')}</span>
            </div>
          )}
          {item.prepared_at && (
            <div className="card py-2 px-4 flex items-center gap-2">
              <span className="text-xs text-gray-500">Prepared</span>
              <span className="text-sm text-gray-300">{new Date(item.prepared_at).toLocaleDateString()}</span>
            </div>
          )}
          {ta.estimated_annual_savings && (
            <div className="card py-2 px-4 flex items-center gap-2">
              <span className="text-xs text-gray-500">Est. Annual Tax Savings</span>
              <span className="text-sm font-bold text-green-400">${(ta.estimated_annual_savings as number).toLocaleString()}</span>
            </div>
          )}
        </div>

        {/* Market Overview */}
        {mb.portfolio_impact && (
          <div className="card">
            <div className="section-title flex items-center gap-2"><TrendingUp size={13} className="text-accent" />Market Overview</div>
            <p className="text-xs text-gray-300 mb-3">{mb.portfolio_impact as string}</p>
            {((mb.key_developments ?? []) as string[]).length > 0 && (
              <ul className="space-y-1.5">
                {((mb.key_developments ?? []) as string[]).map((d, i) => (
                  <li key={i} className="text-xs text-gray-400 flex gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent/60 mt-1 shrink-0" />{d}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Critical Alerts */}
        {criticalAlerts.length > 0 && (
          <div className="card space-y-3">
            <div className="section-title flex items-center gap-2"><AlertTriangle size={13} className="text-red-400" />Critical Alerts</div>
            {criticalAlerts.map((a, i) => (
              <div key={i} className="bg-surface-50 rounded-lg px-3 py-2.5 space-y-1.5">
                <div className="flex items-start gap-2">
                  <span className={urgencyBadge((a.urgency as string) ?? 'today')}>{((a.urgency as string) ?? 'today').toUpperCase()}</span>
                  <span className="text-xs font-semibold text-gray-100">{a.headline as string}</span>
                </div>
                <div className="text-xs text-gray-400">{a.relevance as string}</div>
                {((a.suggested_advisor_talking_points ?? []) as string[]).map((p, j) => (
                  <div key={j} className="text-xs text-red-300 flex gap-1.5"><span className="shrink-0">•</span>{toStr(p)}</div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* High Priority */}
        {highPriority.length > 0 && (
          <div className="card space-y-3">
            <div className="section-title flex items-center gap-2"><AlertTriangle size={13} className="text-yellow-400" />High Priority News</div>
            {highPriority.map((a, i) => (
              <div key={i} className="bg-surface-50 rounded-lg px-3 py-2.5 space-y-1.5">
                <div className="flex items-start gap-2">
                  <span className={urgencyBadge((a.urgency as string) ?? 'today')}>{((a.urgency as string) ?? 'today').toUpperCase()}</span>
                  <span className="text-xs font-semibold text-gray-100">{a.headline as string}</span>
                </div>
                <div className="text-xs text-gray-400">{a.relevance as string}</div>
              </div>
            ))}
          </div>
        )}

        {/* Portfolio Impacts */}
        {portfolioImpacts.length > 0 && (
          <div className="card space-y-3">
            <div className="section-title">Portfolio-Level Impacts</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {portfolioImpacts.map((p, i) => (
                <div key={i} className="bg-surface-50 rounded-lg px-3 py-2.5 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-gray-100">{p.ticker as string}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                      (p.impact as string)?.startsWith('positive') ? 'bg-green-900/40 text-green-300'
                      : (p.impact as string)?.startsWith('negative') ? 'bg-red-900/40 text-red-300'
                      : 'bg-gray-700 text-gray-300'
                    }`}>{p.impact as string}</span>
                  </div>
                  <div className="text-xs text-gray-400">{p.headline as string}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Talking Points */}
        {talkingPts.length > 0 && (
          <div className="card">
            <div className="section-title flex items-center gap-2"><MessageSquare size={13} className="text-accent" />Advisor Talking Points</div>
            <ul className="space-y-2 mt-1">
              {talkingPts.map((p, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-gray-300">
                  <span className="text-accent font-bold shrink-0">{i + 1}.</span>{toStr(p)}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Tax */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {taxOps.length > 0 && (
            <div className="card">
              <div className="section-title">Tax Opportunities</div>
              <ul className="space-y-1.5 mt-1">
                {taxOps.map((t, i) => (
                  <li key={i} className="text-xs text-gray-300 flex gap-2"><span className="text-green-400 shrink-0">$</span>{toStr(t)}</li>
                ))}
              </ul>
            </div>
          )}
          {immediateOps.length > 0 && (
            <div className="card">
              <div className="section-title">Immediate Tax Actions</div>
              <ul className="space-y-2 mt-1">
                {immediateOps.map((op, i) => (
                  <li key={i} className="bg-surface-50 rounded px-2 py-1.5 space-y-0.5">
                    <div className="text-xs font-semibold text-gray-200">{op.strategy as string}</div>
                    {op.estimated_savings && <div className="text-xs text-green-400">Save ~${(op.estimated_savings as number).toLocaleString()}</div>}
                    <div className="text-xs text-gray-400">{op.description as string}</div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Relationship + Agenda */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {relIdeas.length > 0 && (
            <div className="card">
              <div className="section-title flex items-center gap-2"><Users size={13} className="text-accent" />Relationship Ideas</div>
              <ul className="space-y-2 mt-1">
                {relIdeas.slice(0, 5).map((idea, i) => (
                  <li key={i} className="bg-surface-50 rounded px-2 py-1.5 space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      {idea.category && <span className="badge badge-info text-xs">{idea.category as string}</span>}
                      {idea.effort && <span className="text-xs text-gray-500">Effort: {idea.effort as string}</span>}
                    </div>
                    <div className="text-xs font-semibold text-gray-200">{toStr(idea.idea ?? idea)}</div>
                    {idea.rationale && <div className="text-xs text-gray-400">{idea.rationale as string}</div>}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {agenda.length > 0 && (
            <div className="card">
              <div className="section-title">Meeting Agenda</div>
              <ul className="space-y-1 mt-1">
                {agenda.map((a, i) => <li key={i} className="text-xs text-gray-300">{toStr(a)}</li>)}
              </ul>
            </div>
          )}
        </div>

        {/* Cross-sell + Themes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {crossSell.length > 0 && (
            <div className="card">
              <div className="section-title">Cross-Sell Opportunities</div>
              <ul className="space-y-1.5 mt-1">
                {crossSell.map((c, i) => (
                  <li key={i} className="text-xs text-gray-300 flex gap-2">
                    <span className="w-1 h-1 rounded-full bg-accent mt-1.5 shrink-0" />{toStr(c)}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {marketThemes.length > 0 && (
            <div className="card">
              <div className="section-title">Market Themes</div>
              <ul className="space-y-1.5 mt-1">
                {marketThemes.map((t, i) => (
                  <li key={i} className="bg-surface-50 rounded px-2 py-1">
                    <span className="text-xs font-semibold text-gray-200">{t.theme as string}</span>
                    {t.comment && <div className="text-xs text-gray-400">{t.comment as string}</div>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Proactive Concerns */}
        {concerns.length > 0 && (
          <div className="card">
            <div className="section-title text-yellow-400">Proactive Concerns</div>
            <ul className="space-y-1.5 mt-1">
              {concerns.map((c, i) => (
                <li key={i} className="text-xs text-yellow-300/80 flex gap-2">
                  <AlertTriangle size={11} className="shrink-0 mt-0.5" />{toStr(c)}
                </li>
              ))}
            </ul>
          </div>
        )}

        {nb.data_freshness && (
          <div className="text-xs text-gray-600">Data freshness: {nb.data_freshness as string}</div>
        )}
      </div>
    )
  }

  const renderPositionBriefingDetail = (
    pb: Record<string, unknown>,
    regime: Record<string, unknown> | undefined,
    scanCycles: number | undefined,
    email: { subject?: string; body?: string; key_points?: string[] } | undefined,
  ) => (
    <div className="space-y-4">
      {/* Header badges */}
      <div className="flex flex-wrap gap-3">
        {scanCycles !== undefined && (
          <div className="card py-2 px-4 flex items-center gap-2">
            <span className="text-xs text-gray-500">Scan Cycles</span>
            <span className={`text-sm font-bold ${scanCycles === 0 ? 'text-yellow-400' : 'text-green-400'}`}>
              {scanCycles === 0 ? 'None yet' : `${scanCycles} snapshots`}
            </span>
          </div>
        )}
        {pb.portfolio_stance && (
          <div className="card py-2 px-4 flex items-center gap-2">
            <span className="text-xs text-gray-500">Portfolio Stance</span>
            <span className={`text-sm font-bold ${stanceColor(pb.portfolio_stance as string)}`}>
              {pb.portfolio_stance as string}
            </span>
          </div>
        )}
        {regime?.regime && (
          <div className="card py-2 px-4 flex items-center gap-2">
            <span className="text-xs text-gray-500">Market Regime</span>
            <span className="text-sm font-semibold text-gray-200">{regime.regime as string}</span>
          </div>
        )}
        {regime?.selloff_risk && (
          <div className="card py-2 px-4 flex items-center gap-2">
            <span className="text-xs text-gray-500">Selloff Risk</span>
            <span className={`text-sm font-semibold ${regime.selloff_risk === 'ELEVATED' ? 'text-red-400' : regime.selloff_risk === 'MODERATE' ? 'text-yellow-400' : 'text-green-400'}`}>
              {regime.selloff_risk as string}
            </span>
          </div>
        )}
      </div>

      {/* Narrative */}
      {(pb.week_narrative || pb.overall_narrative) && (
        <div className="card">
          <div className="section-title">Overall Narrative</div>
          <p className="text-sm text-gray-300">{(pb.week_narrative ?? pb.overall_narrative) as string}</p>
        </div>
      )}

      {/* At-Risk Positions */}
      {((pb.at_risk_positions ?? []) as Array<{ ticker: string; risk: string; talk_track: string; urgency: string }>).length > 0 && (
        <div className="card space-y-3">
          <div className="section-title flex items-center gap-2">
            <AlertTriangle size={13} className="text-red-400" />
            At-Risk Positions
          </div>
          <div className="space-y-2">
            {((pb.at_risk_positions ?? []) as Array<{ ticker: string; risk: string; talk_track: string; urgency: string }>).map((p, i) => (
              <div key={i} className="bg-surface-50 rounded-lg px-3 py-2.5 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-gray-100">{p.ticker}</span>
                  <span className={urgencyBadge(p.urgency)}>{p.urgency}</span>
                </div>
                <div className="text-xs text-red-300">{p.risk}</div>
                <div className="text-xs text-gray-400 italic">{p.talk_track}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Opportunity Positions */}
      {((pb.opportunity_positions ?? []) as Array<{ ticker: string; opportunity: string; rationale: string }>).length > 0 && (
        <div className="card space-y-3">
          <div className="section-title flex items-center gap-2">
            <CheckCircle2 size={13} className="text-green-400" />
            Opportunities
          </div>
          <div className="space-y-2">
            {((pb.opportunity_positions ?? []) as Array<{ ticker: string; opportunity: string; rationale: string }>).map((p, i) => (
              <div key={i} className="bg-surface-50 rounded-lg px-3 py-2.5 space-y-1">
                <span className="text-xs font-mono font-bold text-gray-100">{p.ticker}</span>
                <div className="text-xs text-green-300">{p.opportunity}</div>
                <div className="text-xs text-gray-400">{p.rationale}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Priority Actions + Key Themes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {((pb.priority_actions ?? []) as string[]).length > 0 && (
          <div className="card">
            <div className="section-title">Priority Actions</div>
            <ul className="space-y-2">
              {((pb.priority_actions ?? []) as string[]).map((a, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-gray-300">
                  <span className="text-accent font-bold shrink-0">{i + 1}.</span>
                  {a}
                </li>
              ))}
            </ul>
          </div>
        )}
        {((pb.key_themes ?? []) as string[]).length > 0 && (
          <div className="card">
            <div className="section-title">Key Themes</div>
            <div className="flex flex-wrap gap-2 mt-1">
              {((pb.key_themes ?? []) as string[]).map((t, i) => (
                <span key={i} className="badge badge-info">{t}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Professional Client Email */}
      {email?.body && (
        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <div className="section-title flex items-center gap-2">
              <Mail size={13} className="text-accent" />
              Professional Client Email
            </div>
            <button
              onClick={() => copyEmail(email.body!)}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-200 transition-colors px-2 py-1 rounded border border-border hover:border-accent/50"
            >
              {copiedEmail ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
              {copiedEmail ? 'Copied!' : 'Copy'}
            </button>
          </div>
          {email.subject && (
            <div className="text-xs">
              <span className="text-gray-500">Subject: </span>
              <span className="text-gray-200 font-medium">{email.subject}</span>
            </div>
          )}
          <textarea
            readOnly
            value={email.body}
            className="w-full bg-surface-50 border border-border rounded-lg p-3 text-xs text-gray-300 leading-relaxed resize-none font-sans"
            rows={Math.min(20, (email.body.match(/\n/g) ?? []).length + 4)}
          />
          {(email.key_points ?? []).length > 0 && (
            <div>
              <div className="text-xs text-gray-500 mb-1">Key Points (advisor review)</div>
              <ul className="space-y-1">
                {(email.key_points ?? []).map((p, i) => (
                  <li key={i} className="text-xs text-gray-400 flex gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-accent mt-1.5 shrink-0" />{p}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )

  const briefingTypeLabel = (type: string) => {
    if (type === 'pre_meeting') return 'Pre-Meeting Briefing'
    if (type === 'position_briefing') return 'Position Briefing'
    if (type === 'tax_strategies') return 'Tax Strategies'
    if (type === 'relationship_ideas') return 'Relationship Ideas'
    return type
  }

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-100">Advisory Intelligence</h2>
        <p className="text-sm text-gray-500 mt-0.5">Bing-grounded market intelligence · tax optimization · relationship deepening</p>
      </div>

      {/* Client selector */}
      <div className="flex items-center gap-4 card max-w-lg py-3">
        <label className="text-xs text-gray-500 shrink-0">Client context:</label>
        <select value={selectedClient} onChange={e => setSelectedClient(e.target.value)} className="input">
          <option value="">No client selected (general)</option>
          {clients.map(c => (
            <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>
          ))}
        </select>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 bg-surface-50 p-1 rounded-xl w-fit">
        {TABS.map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            onClick={() => { setTab(key); setResult(null) }}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              tab === key
                ? 'bg-card text-gray-100 border border-border'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <Icon size={13} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="space-y-4">

        {/* Pre-Meeting Briefing */}
        {tab === 'briefing' && (
          <div className="space-y-4">
            <button onClick={runPreMeeting} disabled={loading || !selectedClient} className="btn-primary flex items-center gap-2">
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Lightbulb size={14} />}
              Generate Pre-Meeting Briefing
            </button>
            {!selectedClient && <p className="text-xs text-gray-500">Select a client above to generate a briefing</p>}

            {result && (() => {
              const ab = (result.advisory_briefing ?? {}) as Record<string, unknown>
              const mb = (ab.market_briefing ?? {}) as Record<string, unknown>
              const nb = (result.news_briefing ?? {}) as Record<string, unknown>
              const ta = (result.tax_analysis ?? {}) as Record<string, unknown>
              const ri = (result.relationship_ideas ?? {}) as Record<string, unknown>
              const talkingPts = (mb.talking_points ?? []) as string[]
              const taxOps = (ab.tax_opportunities ?? []) as string[]
              const relIdeas = ((ri.ideas ?? ab.relationship_ideas ?? []) as Array<Record<string, unknown>>)
              const agenda = (ab.meeting_agenda ?? []) as string[]
              const crossSell = (ab.cross_sell_opportunities ?? []) as string[]
              const concerns = (ab.proactive_concerns ?? []) as string[]
              const criticalAlerts = (nb.critical_alerts ?? []) as Array<Record<string, unknown>>
              const highPriority = (nb.high_priority ?? []) as Array<Record<string, unknown>>
              const portfolioImpacts = (nb.portfolio_impacts ?? []) as Array<Record<string, unknown>>
              const marketThemes = (nb.market_themes ?? []) as Array<Record<string, unknown>>
              const immediateOps = (ta.immediate_opportunities ?? []) as Array<Record<string, unknown>>

              return (
                <div className="space-y-4">
                  {/* Meeting type + date badge */}
                  <div className="flex flex-wrap gap-3">
                    {result.meeting_type && (
                      <div className="card py-2 px-4 flex items-center gap-2">
                        <span className="text-xs text-gray-500">Meeting Type</span>
                        <span className="text-sm font-semibold text-gray-200 capitalize">{(result.meeting_type as string).replace('_', ' ')}</span>
                      </div>
                    )}
                    {result.prepared_at && (
                      <div className="card py-2 px-4 flex items-center gap-2">
                        <span className="text-xs text-gray-500">Prepared</span>
                        <span className="text-sm text-gray-300">{new Date(result.prepared_at as string).toLocaleDateString()}</span>
                      </div>
                    )}
                    {ta.estimated_annual_savings && (
                      <div className="card py-2 px-4 flex items-center gap-2">
                        <span className="text-xs text-gray-500">Est. Annual Tax Savings</span>
                        <span className="text-sm font-bold text-green-400">${(ta.estimated_annual_savings as number).toLocaleString()}</span>
                      </div>
                    )}
                  </div>

                  {/* Market Briefing */}
                  {mb.portfolio_impact && (
                    <div className="card">
                      <div className="section-title flex items-center gap-2"><TrendingUp size={13} className="text-accent" />Market Overview</div>
                      <p className="text-xs text-gray-300 mb-3">{mb.portfolio_impact as string}</p>
                      {((mb.key_developments ?? []) as string[]).length > 0 && (
                        <ul className="space-y-1.5">
                          {((mb.key_developments ?? []) as string[]).map((d, i) => (
                            <li key={i} className="text-xs text-gray-400 flex gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-accent/60 mt-1 shrink-0" />{d}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}

                  {/* News: Critical Alerts */}
                  {criticalAlerts.length > 0 && (
                    <div className="card space-y-3">
                      <div className="section-title flex items-center gap-2">
                        <AlertTriangle size={13} className="text-red-400" />Critical Alerts
                      </div>
                      {criticalAlerts.map((a, i) => (
                        <div key={i} className="bg-surface-50 rounded-lg px-3 py-2.5 space-y-1.5">
                          <div className="flex items-start gap-2">
                            <span className={urgencyBadge((a.urgency as string) ?? 'today')}>{(a.urgency as string ?? 'today').toUpperCase()}</span>
                            <span className="text-xs font-semibold text-gray-100">{a.headline as string}</span>
                          </div>
                          <div className="text-xs text-gray-400">{a.relevance as string}</div>
                          {((a.suggested_advisor_talking_points ?? []) as string[]).map((p, j) => (
                            <div key={j} className="text-xs text-red-300 flex gap-1.5">
                              <span className="shrink-0">•</span>{toStr(p)}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* News: High Priority */}
                  {highPriority.length > 0 && (
                    <div className="card space-y-3">
                      <div className="section-title flex items-center gap-2">
                        <AlertTriangle size={13} className="text-yellow-400" />High Priority News
                      </div>
                      {highPriority.map((a, i) => (
                        <div key={i} className="bg-surface-50 rounded-lg px-3 py-2.5 space-y-1.5">
                          <div className="flex items-start gap-2">
                            <span className={urgencyBadge((a.urgency as string) ?? 'today')}>{(a.urgency as string ?? 'today').toUpperCase()}</span>
                            <span className="text-xs font-semibold text-gray-100">{a.headline as string}</span>
                          </div>
                          <div className="text-xs text-gray-400">{a.relevance as string}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Portfolio Impacts */}
                  {portfolioImpacts.length > 0 && (
                    <div className="card space-y-3">
                      <div className="section-title">Portfolio-Level Impacts</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {portfolioImpacts.map((p, i) => (
                          <div key={i} className="bg-surface-50 rounded-lg px-3 py-2.5 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono font-bold text-gray-100">{p.ticker as string}</span>
                              <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${(p.impact as string)?.startsWith('positive') ? 'bg-green-900/40 text-green-300' : (p.impact as string)?.startsWith('negative') ? 'bg-red-900/40 text-red-300' : 'bg-gray-700 text-gray-300'}`}>
                                {p.impact as string}
                              </span>
                            </div>
                            <div className="text-xs text-gray-400">{p.headline as string}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Talking Points */}
                  {talkingPts.length > 0 && (
                    <div className="card">
                      <div className="section-title flex items-center gap-2"><MessageSquare size={13} className="text-accent" />Advisor Talking Points</div>
                      <ul className="space-y-2 mt-1">
                        {talkingPts.map((p, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-gray-300">
                            <span className="text-accent font-bold shrink-0">{i + 1}.</span>{toStr(p)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Tax */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {taxOps.length > 0 && (
                      <div className="card">
                        <div className="section-title">Tax Opportunities</div>
                        <ul className="space-y-1.5 mt-1">
                          {taxOps.map((t, i) => (
                            <li key={i} className="text-xs text-gray-300 flex gap-2">
                              <span className="text-green-400 shrink-0">$</span>{toStr(t)}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {immediateOps.length > 0 && (
                      <div className="card">
                        <div className="section-title">Immediate Tax Actions</div>
                        <ul className="space-y-2 mt-1">
                          {immediateOps.map((op, i) => (
                            <li key={i} className="bg-surface-50 rounded px-2 py-1.5 space-y-0.5">
                              <div className="text-xs font-semibold text-gray-200">{op.strategy as string}</div>
                              {op.estimated_savings && (
                                <div className="text-xs text-green-400">Save ~${(op.estimated_savings as number).toLocaleString()}</div>
                              )}
                              <div className="text-xs text-gray-400">{op.description as string}</div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Relationship Ideas + Agenda */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {relIdeas.length > 0 && (
                      <div className="card">
                        <div className="section-title flex items-center gap-2"><Users size={13} className="text-accent" />Relationship Ideas</div>
                        <ul className="space-y-2 mt-1">
                          {relIdeas.slice(0, 5).map((idea, i) => (
                            <li key={i} className="bg-surface-50 rounded px-2 py-1.5 space-y-0.5">
                              <div className="flex items-center gap-2 flex-wrap">
                                {idea.category && <span className="badge badge-info text-xs">{idea.category as string}</span>}
                                {idea.effort && <span className="text-xs text-gray-500">Effort: {idea.effort as string}</span>}
                              </div>
                              <div className="text-xs font-semibold text-gray-200">{toStr(idea.idea ?? idea)}</div>
                              {idea.rationale && <div className="text-xs text-gray-400">{idea.rationale as string}</div>}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {agenda.length > 0 && (
                      <div className="card">
                        <div className="section-title">Meeting Agenda</div>
                        <ul className="space-y-1 mt-1">
                          {agenda.map((item, i) => (
                            <li key={i} className="text-xs text-gray-300">{toStr(item)}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Cross-sell + Market Themes */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {crossSell.length > 0 && (
                      <div className="card">
                        <div className="section-title">Cross-Sell Opportunities</div>
                        <ul className="space-y-1.5 mt-1">
                          {crossSell.map((c, i) => (
                            <li key={i} className="text-xs text-gray-300 flex gap-2">
                              <span className="w-1 h-1 rounded-full bg-accent mt-1.5 shrink-0" />{toStr(c)}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {marketThemes.length > 0 && (
                      <div className="card">
                        <div className="section-title">Market Themes</div>
                        <ul className="space-y-1.5 mt-1">
                          {marketThemes.map((t, i) => (
                            <li key={i} className="bg-surface-50 rounded px-2 py-1">
                              <span className="text-xs font-semibold text-gray-200">{t.theme as string}</span>
                              {t.comment && <div className="text-xs text-gray-400">{t.comment as string}</div>}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Proactive Concerns */}
                  {concerns.length > 0 && (
                    <div className="card">
                      <div className="section-title text-yellow-400">Proactive Concerns</div>
                      <ul className="space-y-1.5 mt-1">
                        {concerns.map((c, i) => (
                          <li key={i} className="text-xs text-yellow-300/80 flex gap-2">
                            <AlertTriangle size={11} className="shrink-0 mt-0.5" />{c}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Data freshness */}
                  {nb.data_freshness && (
                    <div className="text-xs text-gray-600">Data freshness: {nb.data_freshness as string}</div>
                  )}
                </div>
              )
            })()}
          </div>
        )}

        {/* Position Briefing */}
        {tab === 'position' && (
          <div className="space-y-4">
            <div className="text-xs text-gray-500 max-w-xl">
              Analyzes a rolling window of Intel Feed, Market Regime, and current portfolio standings to surface position-level risk, opportunities, advisor talk tracks, and a ready-to-send client email.
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-500">Lookback window:</label>
                <select
                  value={timeframeDays}
                  onChange={e => setTimeframeDays(Number(e.target.value))}
                  className="input text-xs py-1 px-2 w-auto"
                >
                  <option value={1}>Today only</option>
                  <option value={7}>Past 7 days</option>
                  <option value={14}>Past 14 days</option>
                  <option value={30}>Past 30 days</option>
                </select>
              </div>
              <button onClick={runPositionBriefing} disabled={loading || !selectedClient} className="btn-primary flex items-center gap-2">
                {loading ? <Loader2 size={14} className="animate-spin" /> : <BarChart2 size={14} />}
                Generate Position Briefing
              </button>
            </div>
            {!selectedClient && <p className="text-xs text-gray-500">Select a client above to run a position briefing</p>}

            {result && (() => {
              const pb = (result.position_briefing ?? result) as Record<string, unknown>
              const regime = result.market_regime as Record<string, unknown> | undefined
              const scanCycles = result.scan_cycles_used as number | undefined
              return (
                <div className="space-y-4">
                  {/* Header row */}
                  <div className="flex flex-wrap gap-3">
                    {scanCycles !== undefined && (
                      <div className="card py-2 px-4 flex items-center gap-2">
                        <span className="text-xs text-gray-500">Scan Cycles Used</span>
                        <span className={`text-sm font-bold ${scanCycles === 0 ? 'text-yellow-400' : 'text-green-400'}`}>
                          {scanCycles === 0 ? 'None yet' : `${scanCycles} snapshots`}
                        </span>
                      </div>
                    )}
                    {pb.portfolio_stance && (
                      <div className="card py-2 px-4 flex items-center gap-2">
                        <span className="text-xs text-gray-500">Portfolio Stance</span>
                        <span className={`text-sm font-bold ${stanceColor(pb.portfolio_stance as string)}`}>
                          {pb.portfolio_stance as string}
                        </span>
                      </div>
                    )}
                    {regime?.regime && (
                      <div className="card py-2 px-4 flex items-center gap-2">
                        <span className="text-xs text-gray-500">Market Regime</span>
                        <span className="text-sm font-semibold text-gray-200">{regime.regime as string}</span>
                      </div>
                    )}
                    {regime?.selloff_risk && (
                      <div className="card py-2 px-4 flex items-center gap-2">
                        <span className="text-xs text-gray-500">Selloff Risk</span>
                        <span className={`text-sm font-semibold ${regime.selloff_risk === 'ELEVATED' ? 'text-red-400' : regime.selloff_risk === 'MODERATE' ? 'text-yellow-400' : 'text-green-400'}`}>
                          {regime.selloff_risk as string}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Narrative */}
                  {pb.overall_narrative && (
                    <div className="card">
                      <div className="section-title">Overall Narrative</div>
                      <p className="text-sm text-gray-300">{pb.overall_narrative as string}</p>
                    </div>
                  )}

                  {/* At-Risk Positions */}
                  {((pb.at_risk_positions ?? []) as Array<{ ticker: string; risk: string; talk_track: string; urgency: string }>).length > 0 && (
                    <div className="card space-y-3">
                      <div className="section-title flex items-center gap-2">
                        <AlertTriangle size={13} className="text-red-400" />
                        At-Risk Positions
                      </div>
                      <div className="space-y-2">
                        {((pb.at_risk_positions ?? []) as Array<{ ticker: string; risk: string; talk_track: string; urgency: string }>).map((p, i) => (
                          <div key={i} className="bg-surface-50 rounded-lg px-3 py-2.5 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono font-bold text-gray-100">{p.ticker}</span>
                              <span className={urgencyBadge(p.urgency)}>{p.urgency}</span>
                            </div>
                            <div className="text-xs text-red-300">{p.risk}</div>
                            <div className="text-xs text-gray-400 italic">{p.talk_track}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Opportunity Positions */}
                  {((pb.opportunity_positions ?? []) as Array<{ ticker: string; opportunity: string; rationale: string }>).length > 0 && (
                    <div className="card space-y-3">
                      <div className="section-title flex items-center gap-2">
                        <CheckCircle2 size={13} className="text-green-400" />
                        Opportunities
                      </div>
                      <div className="space-y-2">
                        {((pb.opportunity_positions ?? []) as Array<{ ticker: string; opportunity: string; rationale: string }>).map((p, i) => (
                          <div key={i} className="bg-surface-50 rounded-lg px-3 py-2.5 space-y-1">
                            <span className="text-xs font-mono font-bold text-gray-100">{p.ticker}</span>
                            <div className="text-xs text-green-300">{p.opportunity}</div>
                            <div className="text-xs text-gray-400">{p.rationale}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Priority Actions + Key Themes side by side */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {((pb.priority_actions ?? []) as string[]).length > 0 && (
                      <div className="card">
                        <div className="section-title">Priority Actions</div>
                        <ul className="space-y-2">
                          {((pb.priority_actions ?? []) as string[]).map((a, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-gray-300">
                              <span className="text-accent font-bold shrink-0">{i + 1}.</span>
                              {a}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {((pb.key_themes ?? []) as string[]).length > 0 && (
                      <div className="card">
                        <div className="section-title">Key Themes</div>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {((pb.key_themes ?? []) as string[]).map((t, i) => (
                            <span key={i} className="badge badge-info">{t}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Professional Client Email */}
                  {(() => {
                    const email = result.client_email as { subject?: string; body?: string; key_points?: string[] } | undefined
                    if (!email?.body) return null
                    return (
                      <div className="card space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="section-title flex items-center gap-2">
                            <Mail size={13} className="text-accent" />
                            Professional Client Email
                          </div>
                          <button
                            onClick={() => copyEmail(email.body!)}
                            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-200 transition-colors px-2 py-1 rounded border border-border hover:border-accent/50"
                          >
                            {copiedEmail ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                            {copiedEmail ? 'Copied!' : 'Copy'}
                          </button>
                        </div>
                        {email.subject && (
                          <div className="text-xs">
                            <span className="text-gray-500">Subject: </span>
                            <span className="text-gray-200 font-medium">{email.subject}</span>
                          </div>
                        )}
                        <textarea
                          ref={emailRef}
                          readOnly
                          value={email.body}
                          className="w-full bg-surface-50 border border-border rounded-lg p-3 text-xs text-gray-300 leading-relaxed resize-none font-sans"
                          rows={Math.min(20, (email.body.match(/\n/g) ?? []).length + 4)}
                        />
                        {(email.key_points ?? []).length > 0 && (
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Key Points (advisor review)</div>
                            <ul className="space-y-1">
                              {(email.key_points ?? []).map((p, i) => (
                                <li key={i} className="text-xs text-gray-400 flex gap-1.5">
                                  <span className="w-1 h-1 rounded-full bg-accent mt-1.5 shrink-0" />{p}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )
                  })()}
                </div>
              )
            })()}
          </div>
        )}

        {/* Tax */}
        {tab === 'tax' && (
          <div className="space-y-4">
            <button onClick={runTax} disabled={loading} className="btn-primary flex items-center gap-2">
              {loading ? <Loader2 size={14} className="animate-spin" /> : <TrendingUp size={14} />}
              Generate Tax Strategies
            </button>
            {result && renderTaxDetail(result)}
          </div>
        )}

        {/* Chat */}
        {tab === 'chat' && (
          <div className="space-y-4">
            {selectedClient && (
              <div className="flex items-center gap-2 text-xs text-gray-500 bg-surface-50 border border-border rounded-lg px-3 py-2">
                <Users size={12} className="text-accent" />
                Client context active: <span className="text-gray-300 font-medium">{client?.first_name} {client?.last_name}</span> — all answers are tailored to this client's profile and portfolio.
              </div>
            )}
            {!selectedClient && (
              <div className="flex items-center gap-2 text-xs text-gray-500 bg-surface-50 border border-border rounded-lg px-3 py-2">
                <MessageSquare size={12} />
                No client selected — answers will be general market / advisory intelligence. Select a client above for personalized responses.
              </div>
            )}

            {/* Message thread */}
            <div className="space-y-4">
              {chatHistory.length === 0 && (
                <div className="card text-gray-500 text-sm text-center py-10">
                  Ask anything — market conditions, strategy ideas, regulatory questions, or client-specific analysis…
                </div>
              )}
              {chatHistory.map((msg, i) => (
                <div key={i}>
                  {msg.role === 'user' ? (
                    <div className="flex justify-end">
                      <div className="max-w-[75%] rounded-xl px-4 py-2.5 text-sm bg-accent/30 border border-accent/40 text-gray-100">
                        {msg.content}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Main answer */}
                      <div className="card space-y-2">
                        <div className="text-xs text-gray-500 flex items-center gap-1.5 mb-1">
                          <MessageSquare size={11} className="text-accent" />Advisor AI
                        </div>
                        <p className="text-sm text-gray-200 leading-relaxed">{msg.structured?.answer ?? msg.content}</p>
                      </div>

                      {/* Supporting Evidence */}
                      {(msg.structured?.supporting_evidence ?? []).length > 0 && (
                        <div className="card">
                          <div className="section-title text-blue-400 mb-2">Supporting Evidence</div>
                          <ul className="space-y-1.5">
                            {(msg.structured!.supporting_evidence!).map((e, j) => (
                              <li key={j} className="text-xs text-gray-300 flex gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-400/60 mt-1 shrink-0" />{toStr(e)}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Action Items + Caveats side by side */}
                      {((msg.structured?.action_items ?? []).length > 0 || (msg.structured?.caveats ?? []).length > 0) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {(msg.structured?.action_items ?? []).length > 0 && (
                            <div className="card">
                              <div className="section-title text-green-400 mb-2">Action Items</div>
                              <ul className="space-y-1.5">
                                {(msg.structured!.action_items!).map((a, j) => (
                                  <li key={j} className="text-xs text-gray-300 flex gap-2">
                                    <span className="text-green-400 font-bold shrink-0">{j + 1}.</span>{toStr(a)}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {(msg.structured?.caveats ?? []).length > 0 && (
                            <div className="card">
                              <div className="section-title text-yellow-400 mb-2">Caveats</div>
                              <ul className="space-y-1.5">
                                {(msg.structured!.caveats!).map((c, j) => (
                                  <li key={j} className="text-xs text-yellow-300/80 flex gap-2">
                                    <AlertTriangle size={11} className="shrink-0 mt-0.5" />{toStr(c)}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Sources */}
                      {(msg.structured?.sources ?? []).length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {(msg.structured!.sources!).map((s, j) => (
                            <span key={j} className="text-xs text-gray-500 bg-surface-50 border border-border rounded px-2 py-0.5">{toStr(s)}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="card flex gap-2 py-3">
              <input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendChat()}
                placeholder={selectedClient ? `Ask about ${client?.first_name ?? 'this client'}'s portfolio, tax situation, strategy…` : 'Ask about markets, regulations, strategies…'}
                className="input"
              />
              <button onClick={sendChat} disabled={!chatInput.trim()} className="btn-primary px-4">
                Send
              </button>
            </div>
          </div>
        )}

        {/* Relationship */}
        {tab === 'relationship' && (
          <div className="space-y-4">
            <button onClick={runRelationship} disabled={loading || !selectedClient} className="btn-primary flex items-center gap-2">
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Users size={14} />}
              Generate Relationship Ideas
            </button>
            {!selectedClient && <p className="text-xs text-gray-500">Select a client above to generate personalized ideas</p>}
            {result && (
              <div className="space-y-3">
                {((result.ideas ?? result.relationship_ideas ?? []) as Array<Record<string, unknown> | string>).map((idea, i) => {
                  const ideaObj = typeof idea === 'object' && idea !== null ? idea : null
                  const ideaText = ideaObj ? (ideaObj.idea as string) : (idea as string)
                  const rationale = ideaObj?.rationale as string | undefined
                  const category = ideaObj?.category as string | undefined
                  const timing = ideaObj?.timing as string | undefined
                  const effort = ideaObj?.effort as string | undefined
                  return (
                    <div key={i} className="card space-y-1.5">
                      <div className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-brand-gold/20 border border-brand-gold/40 flex items-center justify-center text-brand-gold text-xs shrink-0 mt-0.5">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            {category && <span className="badge badge-info text-xs">{category}</span>}
                            {effort && <span className="text-xs text-gray-500">Effort: {effort}</span>}
                            {timing && <span className="text-xs text-gray-500">· {timing}</span>}
                          </div>
                          <div className="text-sm font-medium text-gray-200 mt-0.5">{ideaText}</div>
                          {rationale && <div className="text-xs text-gray-400">{rationale}</div>}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Briefing History */}
        {tab === 'history' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="text-xs text-gray-500">
                {selectedClient
                  ? `Showing briefings for ${clients.find(c => c.id === selectedClient)?.first_name ?? 'selected client'}`
                  : 'Showing all briefings for your advisor ID'}
              </div>
              <button onClick={loadHistory} disabled={historyLoading} className="btn-secondary flex items-center gap-1.5 text-xs px-3 py-1.5">
                {historyLoading ? <Loader2 size={12} className="animate-spin" /> : <History size={12} />}
                Refresh
              </button>
            </div>

            {historyLoading && (
              <div className="flex items-center justify-center py-12 text-gray-500 text-sm gap-2">
                <Loader2 size={16} className="animate-spin" />
                Loading briefing history…
              </div>
            )}

            {!historyLoading && history.length === 0 && (
              <div className="card text-center py-10 text-gray-500 text-sm">
                No briefings found. Generate a Pre-Meeting or Position Briefing above.
              </div>
            )}

            {!historyLoading && history.map((item) => {
              const isExpanded = expandedHistory === item.advisory_id
              const clientName = clients.find(c => c.id === item.client_id)
              const date = new Date(item.prepared_at ?? item.created_at).toLocaleString()
              const hasEmail = !!item.client_email?.body
              return (
                <div key={item.advisory_id} className="card space-y-0">
                  <button
                    onClick={() => setExpandedHistory(isExpanded ? null : item.advisory_id)}
                    className="w-full flex items-center gap-3 text-left"
                  >
                    <div className="flex-1 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className={`badge text-xs ${item.type === 'position_briefing' ? 'badge-warning' : 'badge-info'}`}>
                          {briefingTypeLabel(item.type)}
                        </span>
                        {item.timeframe_days && item.type === 'position_briefing' && (
                          <span className="text-xs text-gray-500">{item.timeframe_days}d window</span>
                        )}
                        {item.scan_cycles_used !== undefined && item.type === 'position_briefing' && (
                          <span className={`text-xs ${(item.scan_cycles_used as number) === 0 ? 'text-yellow-400' : 'text-green-400'}`}>
                            {(item.scan_cycles_used as number) === 0 ? 'no snapshots' : `${item.scan_cycles_used} cycles`}
                          </span>
                        )}
                        {clientName && (
                          <span className="text-xs text-gray-300">{clientName.first_name} {clientName.last_name}</span>
                        )}
                        {hasEmail && (
                          <Mail size={11} className="text-accent ml-auto" title="Has client email" />
                        )}
                      </div>
                      <div className="text-xs text-gray-500">{date}</div>
                    </div>
                    {isExpanded ? <ChevronUp size={14} className="text-gray-500 shrink-0" /> : <ChevronDown size={14} className="text-gray-500 shrink-0" />}
                  </button>

                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-border space-y-4">
                      {/* Position briefing — full rich UI */}
                      {item.type === 'position_briefing' && item.position_briefing &&
                        renderPositionBriefingDetail(
                          item.position_briefing as Record<string, unknown>,
                          item.market_regime as Record<string, unknown> | undefined,
                          item.scan_cycles_used,
                          item.client_email,
                        )
                      }

                      {/* Tax strategies detail */}
                      {item.type === 'tax_strategies' && renderTaxDetail(item.result ?? {})}

                      {/* Relationship ideas detail */}
                      {item.type === 'relationship_ideas' && (() => {
                        const ideas = (item.ideas ?? (item.result as Record<string, unknown> | undefined)?.ideas ?? []) as Array<Record<string, unknown>>
                        return (
                          <div className="space-y-3">
                            {ideas.map((idea, i) => (
                              <div key={i} className="card space-y-1.5">
                                <div className="flex items-start gap-3">
                                  <span className="w-6 h-6 rounded-full bg-brand-gold/20 border border-brand-gold/40 flex items-center justify-center text-brand-gold text-xs font-bold shrink-0 mt-0.5">{i + 1}</span>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      {idea.category && <span className="badge badge-info text-xs">{idea.category as string}</span>}
                                      {idea.effort && <span className="text-xs text-gray-500">Effort: {idea.effort as string}</span>}
                                      {idea.timing && <span className="text-xs text-gray-500">· {idea.timing as string}</span>}
                                    </div>
                                    <div className="text-sm font-medium text-gray-200 mt-0.5">{toStr(idea.idea ?? idea)}</div>
                                    {idea.rationale && <div className="text-xs text-gray-400">{idea.rationale as string}</div>}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )
                      })()}

                      {/* Pre-meeting briefing detail */}
                      {item.type === 'pre_meeting' && renderPreMeetingDetail(item)}

                      <div className="text-xs text-gray-600 font-mono pt-1">{item.advisory_id}</div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

      </div>
    </div>
  )
}
