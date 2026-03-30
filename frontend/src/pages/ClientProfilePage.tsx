import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, TrendingUp, Mic, Shield, Trash2, ChevronDown, ChevronUp, AlertTriangle, CheckCircle, FileText, Target, Activity, BarChart2, RefreshCw } from 'lucide-react'
import { clientsApi, meetingsApi, portfolioApi } from '@/api'
import type { ClientProfile, MeetingSession, PortfolioProposal } from '@/types'
import SentimentGauge from '@/components/meeting/SentimentGauge'
import { format } from 'date-fns'

export default function ClientProfilePage() {
  const { clientId } = useParams<{ clientId: string }>()
  const navigate = useNavigate()
  const [client, setClient] = useState<ClientProfile | null>(null)
  const [meetings, setMeetings] = useState<MeetingSession[]>([])
  const [portfolios, setPortfolios] = useState<PortfolioProposal[]>([])
  const [loading, setLoading] = useState(true)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState<string | null>(null)
  const [expandedMeeting, setExpandedMeeting] = useState<string | null>(null)

  useEffect(() => {
    if (!clientId) return
    Promise.all([
      clientsApi.get(clientId),
      clientsApi.meetings(clientId).catch(() => []),
      clientsApi.portfolios(clientId).catch(() => []),
    ]).then(([c, m, p]) => {
      setClient(c)
      setMeetings(m)
      setPortfolios(p)
      setLoading(false)
    })
  }, [clientId])

  if (loading) {
    return <div className="text-gray-500 py-20 text-center">Loading client profile…</div>
  }
  if (!client) {
    return <div className="text-gray-500 py-20 text-center">Client not found</div>
  }

  const handleDelete = async () => {
    if (!clientId) return
    setDeleting(true)
    try {
      await clientsApi.remove(clientId)
      navigate('/clients')
    } finally {
      setDeleting(false)
    }
  }

  const handleSyncFromMeeting = async () => {
    if (!clientId) return
    setSyncing(true)
    setSyncMsg(null)
    try {
      const updated = await clientsApi.syncFromMeeting(clientId)
      setClient(updated)
      setSyncMsg('Profile synced from meeting data')
      setTimeout(() => setSyncMsg(null), 4000)
    } catch (err: any) {
      setSyncMsg(err?.response?.data?.detail ?? 'Sync failed')
      setTimeout(() => setSyncMsg(null), 5000)
    } finally {
      setSyncing(false)
    }
  }

  const totalMeetings = meetings.length
  const latestPortfolio = portfolios[0]

  // Compute missing critical fields (mirrors ClientsPage badge logic)
  const missingFields: string[] = []
  if (!client.phone)               missingFields.push('Phone')
  if (!client.aum)                 missingFields.push('AUM')
  if (!client.annual_income)       missingFields.push('Income')
  if (!client.risk_profile)        missingFields.push('Risk profile')
  if (!client.goals?.length)       missingFields.push('Goals')
  if (!client.insurance)           missingFields.push('Insurance')
  if (!client.estate_planning)     missingFields.push('Estate plan')

  return (
    <div className="max-w-6xl space-y-6">
      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-red-900/50 rounded-2xl p-6 w-full max-w-sm space-y-4">
            <h3 className="text-base font-semibold text-red-400">Delete Client</h3>
            <p className="text-sm text-gray-300">
              Permanently delete <span className="font-medium text-gray-100">{client.first_name} {client.last_name}</span> and all associated meetings, transcripts, portfolios, and conversations? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={handleDelete} disabled={deleting} className="flex-1 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-lg px-4 py-2 transition-colors disabled:opacity-50">
                {deleting ? 'Deleting…' : 'Delete Everything'}
              </button>
              <button onClick={() => setConfirmDelete(false)} className="btn-secondary">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Top nav */}
      <div className="flex items-center gap-3">
        <Link to="/clients" className="btn-ghost flex items-center gap-1 text-xs">
          <ArrowLeft size={13} /> Clients
        </Link>
        <span className="text-gray-600">/</span>
        <span className="text-sm text-gray-300">{client.first_name} {client.last_name}</span>
      </div>

      {/* Hero card */}
      <div className="card flex flex-col sm:flex-row gap-6">
        <div className="w-16 h-16 rounded-2xl bg-accent/20 border border-accent/30 flex items-center justify-center text-2xl font-bold text-accent shrink-0">
          {client.first_name[0]}{client.last_name[0]}
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex items-start justify-between flex-wrap gap-2">
            <div>
              <h1 className="text-xl font-semibold text-gray-100">{client.first_name} {client.last_name}</h1>
              <div className="text-sm text-gray-500">{client.email} {client.phone && `· ${client.phone}`}</div>
            </div>
            <div className="flex gap-2">
              <Link to="/meetings" className="btn-primary flex items-center gap-2 text-xs">
                <Mic size={13} /> Start Meeting
              </Link>
              <Link to="/portfolio" className="btn-secondary flex items-center gap-2 text-xs">
                <TrendingUp size={13} /> Build Portfolio
              </Link>
              <Link to={`/audit?client_id=${clientId}`}
                className="btn-secondary flex items-center gap-2 text-xs"
                title="View all audit trail events for this client"
              >
                <FileText size={13} /> Audit Trail
              </Link>
              <button
                onClick={handleSyncFromMeeting}
                disabled={syncing}
                className="btn-secondary flex items-center gap-2 text-xs"
                title="Re-populate profile fields from meeting extraction data"
              >
                <RefreshCw size={13} className={syncing ? 'animate-spin' : ''} />
                {syncing ? 'Syncing…' : 'Sync Profile'}
              </button>
              <button
                onClick={() => setConfirmDelete(true)}
                className="p-2 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-900/20 border border-border transition-colors"
                title="Delete client"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="badge-accent">{client.risk_tolerance?.replace(/_/g, ' ')}</span>
            <span className="badge-success">{client.status}</span>
            {client.tax_bracket && <span className="badge-info">{client.tax_bracket}% bracket</span>}
            {client.relationship_since && (
              <span className="badge bg-surface-50 border-border text-gray-400">
                Client since {new Date(client.relationship_since).getFullYear()}
              </span>
            )}
            {missingFields.length > 0 && (
              <span
                className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-900/30 border border-amber-700/40 text-amber-400"
                title={`Missing: ${missingFields.join(', ')}`}
              >
                <AlertTriangle size={10} />
                {missingFields.length} field{missingFields.length > 1 ? 's' : ''} missing
              </span>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 shrink-0">
          <div className="stat-card p-3 min-w-[100px]">
            <div className="stat-label">AUM</div>
            <div className="text-lg font-semibold text-green-400">${(client.aum / 1e6).toFixed(2)}M</div>
          </div>
          <div className="stat-card p-3 min-w-[100px]">
            <div className="stat-label">Meetings</div>
            <div className="text-lg font-semibold text-gray-100">{totalMeetings}</div>
          </div>
        </div>
      </div>

      {/* Sync status toast */}
      {syncMsg && (
        <div className={`text-xs px-4 py-2 rounded-lg border ${
          syncMsg.includes('failed') || syncMsg.includes('Failed')
            ? 'bg-red-900/30 border-red-700/40 text-red-400'
            : 'bg-green-900/30 border-green-700/40 text-green-400'
        }`}>
          {syncMsg}
        </div>
      )}

      {/* ── Financial snapshot ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        {[
          { label: 'AUM',           value: client.aum ? `$${(client.aum / 1e6).toFixed(2)}M` : '—',                color: 'text-green-400' },
          { label: 'Annual Income', value: client.annual_income ? `$${(client.annual_income / 1e3).toFixed(0)}K` : '—', color: 'text-gray-200' },
          { label: 'Net Worth',     value: client.net_worth ? `$${(client.net_worth / 1e6).toFixed(2)}M` : '—',       color: 'text-gray-200' },
          { label: 'Monthly Exp.',  value: client.monthly_expenses ? `$${client.monthly_expenses.toLocaleString()}` : '—', color: 'text-amber-400' },
          { label: 'Tax Bracket',   value: client.tax_bracket ? `${client.tax_bracket}%` : '—',                       color: 'text-gray-200' },
          { label: 'Meetings',      value: String(totalMeetings),                                                      color: 'text-blue-400' },
        ].map(s => (
          <div key={s.label} className="stat-card p-3">
            <div className="stat-label">{s.label}</div>
            <div className={`text-base font-semibold ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* ── Life Events / Concerns / Goals ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <div className="section-title mb-2">Life Events</div>
          {(client.life_events ?? []).length === 0 ? (
            <div className="text-gray-500 text-xs">None recorded</div>
          ) : (
            <ul className="space-y-1.5">
              {client.life_events!.map((ev, i) => {
                const label =
                  typeof ev === 'string'
                    ? ev
                    : (ev as Record<string, unknown>).event ??
                      (ev as Record<string, unknown>).description ??
                      (ev as Record<string, unknown>).name ??
                      JSON.stringify(ev)
                const timeline = typeof ev === 'object' && ev !== null
                  ? (ev as Record<string, unknown>).timeline as string | undefined
                  : undefined
                return (
                  <li key={i} className="flex items-start gap-2 text-xs text-gray-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-gold mt-1 shrink-0" />
                    <span>{String(label)}{timeline ? ` — ${timeline}` : ''}</span>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
        <div className="card">
          <div className="section-title mb-2">Concerns</div>
          {(client.concerns ?? []).length === 0 ? (
            <div className="text-gray-500 text-xs">None recorded</div>
          ) : (
            <ul className="space-y-1.5">
              {client.concerns!.map((c, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-amber-300/80">
                  <AlertTriangle size={11} className="shrink-0 mt-0.5 text-amber-400" />
                  {c}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="card">
          <div className="section-title mb-2">Investment Goals</div>
          {(client.goals ?? []).length === 0 ? (
            <div className="text-gray-500 text-xs">None recorded</div>
          ) : (
            <ul className="space-y-2">
              {client.goals!.map((g, i) => (
                <li key={i} className="text-xs">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle size={10} className="text-green-400 shrink-0" />
                    <span className="font-medium text-gray-200 capitalize">{g.goal_type?.replace(/_/g, ' ')}</span>
                  </div>
                  {g.name && g.name !== g.goal_type && <div className="text-gray-400 ml-4 mt-0.5 leading-tight">{g.name}</div>}
                  <div className="flex gap-3 ml-4 mt-0.5 text-gray-500">
                    {g.target_amount ? <span>${g.target_amount.toLocaleString()}</span> : null}
                    {g.target_date ? <span>{String(g.target_date)}</span> : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* ── Risk + Financial details ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card space-y-3">
          <div className="section-title">Risk Profile</div>
          {client.risk_profile ? (
            <dl className="space-y-1.5">
              {[
                ['Tolerance',       client.risk_profile.tolerance?.replace(/_/g,' ')],
                ['Capacity',        (client.risk_profile as unknown as Record<string,unknown>).risk_capacity as string],
                ['Horizon',         client.risk_profile.investment_horizon_years ? `${client.risk_profile.investment_horizon_years} yrs` : null],
                ['Max Drawdown',    client.risk_profile.max_drawdown_tolerance ? `${(client.risk_profile.max_drawdown_tolerance * 100).toFixed(0)}%` : null],
                ['Equity Target',   client.risk_profile.equity_allocation_target ? `${(client.risk_profile.equity_allocation_target * 100).toFixed(0)}%` : null],
                ['Fixed Inc.',      client.risk_profile.fixed_income_target ? `${(client.risk_profile.fixed_income_target * 100).toFixed(0)}%` : null],
              ].filter(([, v]) => v).map(([k, v]) => (
                <div key={String(k)} className="flex justify-between text-xs">
                  <span className="text-gray-500">{String(k)}</span>
                  <span className="text-gray-200 font-medium capitalize">{String(v)}</span>
                </div>
              ))}
            </dl>
          ) : <div className="text-gray-500 text-xs">No risk profile on file</div>}
        </div>

        <div className="card space-y-3">
          <div className="section-title">Financials &amp; Tax</div>
          <dl className="space-y-1.5">
            {[
              ['Investable Assets',  client.investable_assets || client.aum ? `$${((client.investable_assets || client.aum) / 1e3).toFixed(0)}K` : null],
              ['Monthly Expenses',   client.monthly_expenses ? `$${client.monthly_expenses.toLocaleString()}` : null],
              ['Emergency Fund',     client.emergency_fund_months ? `${client.emergency_fund_months} mo` : null],
              ['Has 401k',           client.tax_profile?.has_401k != null ? (client.tax_profile.has_401k ? 'Yes' : 'No') : null],
              ['IRA Balance',        client.tax_profile?.ira_balance ? `$${(client.tax_profile.ira_balance / 1e3).toFixed(0)}K` : null],
              ['Roth IRA',           client.tax_profile?.roth_ira_balance ? `$${(client.tax_profile.roth_ira_balance / 1e3).toFixed(0)}K` : null],
              ['Has Mortgage',       client.has_mortgage != null ? (client.has_mortgage ? 'Yes' : 'No') : null],
              ['Total Debt',         client.total_debt ? `$${(client.total_debt / 1e3).toFixed(0)}K` : null],
            ].filter(([, v]) => v != null).map(([k, v]) => (
              <div key={String(k)} className="flex justify-between text-xs">
                <span className="text-gray-500">{String(k)}</span>
                <span className="text-gray-200 font-medium">{String(v)}</span>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* ── Insurance & Estate ── */}
      {(client.insurance || client.estate_planning) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {client.insurance && (
            <div className="card space-y-2">
              <div className="section-title">Insurance</div>
              <dl className="space-y-1.5">
                {[
                  ['Life Insurance',    client.insurance.life_insurance_type ? client.insurance.life_insurance_type.replace(/_/g,' ') : null],
                  ['Death Benefit',     client.insurance.life_insurance_amount ? `$${(client.insurance.life_insurance_amount / 1e3).toFixed(0)}K` : null],
                  ['Disability',        client.insurance.disability_insurance != null ? (client.insurance.disability_insurance ? 'Yes' : 'No') : null],
                  ['Long-Term Care',    client.insurance.long_term_care_insurance != null ? (client.insurance.long_term_care_insurance ? 'Yes' : 'No') : null],
                  ['Umbrella',          client.insurance.umbrella_policy != null ? (client.insurance.umbrella_policy ? 'Yes' : 'No') : null],
                ].filter(([, v]) => v != null).map(([k, v]) => (
                  <div key={String(k)} className="flex justify-between text-xs">
                    <span className="text-gray-500">{String(k)}</span>
                    <span className="text-gray-200 font-medium capitalize">{String(v)}</span>
                  </div>
                ))}
              </dl>
            </div>
          )}
          {client.estate_planning && (
            <div className="card space-y-2">
              <div className="section-title">Estate Planning</div>
              <dl className="space-y-1.5">
                {[
                  ['Has Will',             client.estate_planning.has_will],
                  ['Revocable Trust',      client.estate_planning.has_revocable_trust],
                  ['Irrevocable Trust',    client.estate_planning.has_irrevocable_trust],
                  ['Power of Attorney',    client.estate_planning.has_power_of_attorney],
                  ['Healthcare Directive', client.estate_planning.has_healthcare_directive],
                  ['Beneficiaries Updated',client.estate_planning.beneficiaries_updated],
                  ['Charitable Intent',    client.estate_planning.charitable_intent],
                ].filter(([, v]) => v != null).map(([k, v]) => (
                  <div key={String(k)} className="flex justify-between text-xs">
                    <span className="text-gray-500">{String(k)}</span>
                    <span className={`font-medium text-xs ${v ? 'text-green-400' : 'text-gray-500'}`}>{v ? 'Yes' : 'No'}</span>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>
      )}

      {/* ── Meeting History ── */}
      <div className="card">
        <div className="section-title mb-3">Meeting History</div>
        {meetings.length === 0 ? (
          <div className="text-gray-500 text-sm py-4">No meetings yet</div>
        ) : (
          <div className="space-y-2">
            {meetings.map(m => {
              const expanded = expandedMeeting === m.id
              const sum = m.summary
              return (
                <div key={m.id} className="rounded-lg border border-border/50 overflow-hidden">
                  <button
                    className="w-full flex items-center justify-between py-2.5 px-3 bg-surface-50 hover:bg-surface-50/70 transition-colors text-left"
                    onClick={() => setExpandedMeeting(expanded ? null : m.id)}
                  >
                    <div className="flex items-center gap-3">
                      <Mic size={14} className="text-gray-500 shrink-0" />
                      <div>
                        <div className="text-sm text-gray-200 font-medium">
                          {m.title ?? m.meeting_type?.replace(/_/g, ' ')}
                        </div>
                        <div className="text-xs text-gray-500">
                          {m.started_at ? format(new Date(m.started_at), 'MMM d, yyyy HH:mm') : 'Scheduled'}
                          {m.summary?.action_items?.length ? ` · ${m.summary.action_items.length} action items` : ''}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {m.sentiment && (
                        <div className="w-20">
                          <SentimentGauge value={m.sentiment.overall} size="sm" />
                        </div>
                      )}
                      <span className={`badge text-[10px] ${
                        m.status === 'completed' ? 'badge-success' :
                        m.status === 'active'    ? 'badge-error'   : 'badge-info'
                      }`}>{m.status}</span>
                      {expanded ? <ChevronUp size={13} className="text-gray-500" /> : <ChevronDown size={13} className="text-gray-500" />}
                    </div>
                  </button>

                  {expanded && sum && (
                    <div className="px-4 py-3 space-y-3 border-t border-border/30">
                      {/* Sentiment breakdown */}
                      {m.sentiment && (
                        <div className="flex flex-wrap gap-3 text-xs border-b border-border/20 pb-3">
                          {m.sentiment.key_themes && m.sentiment.key_themes.length > 0 && (
                            <div className="flex-1 min-w-40">
                              <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1">Key Themes</div>
                              <div className="flex flex-wrap gap-1">
                                {m.sentiment.key_themes.map((t, i) => (
                                  <span key={i} className="px-1.5 py-0.5 rounded-full bg-blue-900/30 text-blue-300 text-[10px]">{t}</span>
                                ))}
                              </div>
                            </div>
                          )}
                          {m.sentiment.investment_concerns && m.sentiment.investment_concerns.length > 0 && (
                            <div className="flex-1 min-w-40">
                              <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1">Investment Concerns</div>
                              <div className="flex flex-wrap gap-1">
                                {m.sentiment.investment_concerns.map((c, i) => (
                                  <span key={i} className="px-1.5 py-0.5 rounded-full bg-amber-900/30 text-amber-300 text-[10px]">{c}</span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      {sum.advisor_summary && (
                        <div>
                          <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1">Advisor Summary</div>
                          <p className="text-xs text-gray-300 leading-relaxed">{sum.advisor_summary}</p>
                        </div>
                      )}
                      {sum.client_summary && (
                        <div>
                          <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1">Client Summary</div>
                          <p className="text-xs text-gray-300 leading-relaxed">{sum.client_summary}</p>
                        </div>
                      )}
                      {sum.action_items?.length > 0 && (
                        <div>
                          <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1">Action Items</div>
                          <ul className="space-y-1">
                            {sum.action_items.map((a, i) => (
                              <li key={i} className="flex items-start gap-1.5 text-xs text-gray-300">
                                <CheckCircle size={10} className="text-green-400 shrink-0 mt-0.5" />
                                {a}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {sum.key_decisions?.length > 0 && (
                        <div>
                          <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1">Key Decisions</div>
                          <ul className="space-y-1">
                            {sum.key_decisions.map((d, i) => (
                              <li key={i} className="flex items-start gap-1.5 text-xs text-blue-300/80">
                                <Shield size={10} className="shrink-0 mt-0.5" />
                                {d}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {sum.compliance_summary && (
                        <div className="rounded-lg bg-amber-900/20 border border-amber-700/40 px-3 py-2">
                          <div className="text-[10px] font-semibold uppercase tracking-wider text-amber-500 mb-1">Compliance</div>
                          <p className="text-xs text-amber-300/80">{sum.compliance_summary}</p>
                        </div>
                      )}
                      {/* Recommendations */}
                      {m.recommendations && m.recommendations.length > 0 && (
                        <div>
                          <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5 flex items-center gap-1">
                            <BarChart2 size={10} /> Recommendations ({m.recommendations.length})
                          </div>
                          <div className="space-y-1">
                            {m.recommendations.map((r, i) => {
                              const action = (r.action ?? 'HOLD') as string
                              const color = action === 'BUY' ? 'text-green-400' : action === 'SELL' ? 'text-red-400' : 'text-yellow-400'
                              return (
                                <div key={i} className="flex items-start gap-2 text-xs rounded bg-surface-50 px-2 py-1.5">
                                  <span className={`font-bold shrink-0 w-10 ${color}`}>{action}</span>
                                  {r.ticker && <span className="text-gray-200 font-mono shrink-0">{r.ticker}</span>}
                                  <span className="text-gray-400 truncate">{r.rationale ?? r.category ?? ''}</span>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                      {/* Goals & Concerns from this meeting */}
                      {(() => {
                        const ext = m.profile_extractions as Record<string, unknown> | undefined
                        const goals = (ext?.extracted_goals as unknown[]) ?? []
                        const concerns = (ext?.extracted_concerns as string[]) ?? []
                        const actions = (ext?.key_action_items as string[]) ?? []
                        if (!goals.length && !concerns.length && !actions.length) return null
                        return (
                          <div className="space-y-2">
                            {goals.length > 0 && (
                              <div>
                                <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1 flex items-center gap-1">
                                  <Target size={10} /> Goals captured
                                </div>
                                <ul className="space-y-0.5">
                                  {goals.map((g, i) => {
                                    const label = typeof g === 'string' ? g : (g as Record<string, unknown>).name ?? (g as Record<string, unknown>).goal_type ?? JSON.stringify(g)
                                    return (
                                      <li key={i} className="flex items-start gap-1.5 text-xs text-gray-300">
                                        <CheckCircle size={10} className="text-blue-400 shrink-0 mt-0.5" />
                                        {String(label)}
                                      </li>
                                    )
                                  })}
                                </ul>
                              </div>
                            )}
                            {concerns.length > 0 && (
                              <div>
                                <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1 flex items-center gap-1">
                                  <AlertTriangle size={10} /> Concerns raised
                                </div>
                                <ul className="space-y-0.5">
                                  {concerns.map((c, i) => (
                                    <li key={i} className="flex items-start gap-1.5 text-xs text-amber-300/80">
                                      <AlertTriangle size={10} className="text-amber-500 shrink-0 mt-0.5" />{c}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {actions.length > 0 && (
                              <div>
                                <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1 flex items-center gap-1">
                                  <Activity size={10} /> Action items (from extraction)
                                </div>
                                <ul className="space-y-0.5">
                                  {actions.map((a, i) => (
                                    <li key={i} className="flex items-start gap-1.5 text-xs text-gray-300">
                                      <CheckCircle size={10} className="text-green-400 shrink-0 mt-0.5" />{a}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )
                      })()}
                      {m.full_transcript && (
                        <details className="group">
                          <summary className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 cursor-pointer hover:text-gray-400 list-none flex items-center gap-1">
                            <FileText size={10} /> Full Transcript
                            <span className="ml-auto text-gray-600 group-open:hidden">▸ expand</span>
                            <span className="ml-auto text-gray-600 hidden group-open:inline">▾ collapse</span>
                          </summary>
                          <pre className="mt-1.5 text-[10px] text-gray-400 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto bg-surface-50 rounded p-2 border border-border/30">
                            {m.full_transcript}
                          </pre>
                        </details>
                      )}
                      {/* Link to session-specific audit trail */}
                      <div className="pt-1">
                        <Link
                          to={`/audit?session_id=${m.id ?? m.session_id}`}
                          className="text-[10px] text-accent hover:text-accent-hover flex items-center gap-1"
                        >
                          <Shield size={9} /> View session audit trail →
                        </Link>
                      </div>
                    </div>
                  )}
                  {expanded && !sum && (
                    <div className="px-4 py-3 border-t border-border/30 space-y-2">
                      {m.profile_extractions && Object.keys(m.profile_extractions).length > 0 ? (
                        <>
                          <div className="text-[10px] font-semibold uppercase tracking-wider text-amber-500">
                            Partial data captured — meeting pipeline not yet completed
                          </div>
                          {(m.profile_extractions as Record<string, unknown>).extracted_concerns &&
                            ((m.profile_extractions as Record<string, unknown>).extracted_concerns as unknown[]).length > 0 && (
                            <div>
                              <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1">Concerns captured</div>
                              <ul className="space-y-1">
                                {((m.profile_extractions as Record<string, unknown>).extracted_concerns as string[]).map((c, i) => (
                                  <li key={i} className="text-xs text-amber-300/80 flex items-start gap-1.5">
                                    <AlertTriangle size={10} className="shrink-0 mt-0.5 text-amber-500" />{c}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </>
                      ) : (
                        <p className="text-xs text-gray-600">No summary available — meeting may still be in progress</p>
                      )}
                      <div className="pt-1">
                        <Link
                          to={`/audit?session_id=${m.id ?? m.session_id}`}
                          className="text-[10px] text-accent hover:text-accent-hover flex items-center gap-1"
                        >
                          <Shield size={9} /> View session audit trail →
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Latest portfolio */}
      {latestPortfolio && (() => {
        // Normalise metrics — API returns either old shape (metrics.*) or new shape (risk_metrics.*)
        const rm = (latestPortfolio as any).risk_metrics ?? (latestPortfolio as any).metrics ?? {}
        const vol    = rm.estimated_volatility  ?? rm.volatility        ?? null
        const sharpe = rm.estimated_sharpe      ?? rm.sharpe_ratio      ?? null
        const mdd    = rm.max_drawdown_estimate ?? rm.max_drawdown       ?? null
        const hhi    = rm.hhi                                            ?? null
        const positions: any[] = (latestPortfolio as any).positions ?? []
        const rationale: string = (latestPortfolio as any).rationale ?? (latestPortfolio as any).portfolio_rationale ?? ''
        const statusVal: string = String((latestPortfolio as any).status ?? '')
        const statusColor = statusVal === 'approved' ? 'text-green-400 bg-green-900/20 border-green-700/40'
          : statusVal === 'pending_approval' ? 'text-yellow-400 bg-yellow-900/20 border-yellow-700/40'
          : 'text-gray-400 bg-surface-50 border-border'

        return (
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div className="section-title">Latest Portfolio</div>
              <div className="flex items-center gap-3">
                <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColor}`}>{statusVal.replace(/_/g, ' ')}</span>
                <Link
                  to={`/portfolio?run=${(latestPortfolio as any).run_id ?? (latestPortfolio as any).id ?? ''}`}
                  className="text-xs text-accent hover:text-accent-hover"
                >
                  Open Builder →
                </Link>
              </div>
            </div>

            {rationale && (
              <p className="text-xs text-gray-400 leading-relaxed mb-4">{rationale}</p>
            )}

            {/* Risk metrics row */}
            {(vol !== null || sharpe !== null || mdd !== null || hhi !== null) && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                {vol !== null && (
                  <div className="stat-card p-3">
                    <div className="stat-label">Volatility</div>
                    <div className="text-base font-semibold text-yellow-400">{(vol * 100).toFixed(1)}%</div>
                  </div>
                )}
                {sharpe !== null && (
                  <div className="stat-card p-3">
                    <div className="stat-label">Sharpe</div>
                    <div className="text-base font-semibold text-gray-100">{Number(sharpe).toFixed(2)}</div>
                  </div>
                )}
                {mdd !== null && (
                  <div className="stat-card p-3">
                    <div className="stat-label">Max Drawdown</div>
                    <div className="text-base font-semibold text-red-400">{(mdd * 100).toFixed(1)}%</div>
                  </div>
                )}
                {hhi !== null && (
                  <div className="stat-card p-3">
                    <div className="stat-label">HHI</div>
                    <div className="text-base font-semibold text-gray-100">{Number(hhi).toFixed(3)}</div>
                  </div>
                )}
              </div>
            )}

            {/* Top positions */}
            {positions.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Positions ({positions.length})</div>
                <div className="flex flex-wrap gap-2">
                  {positions.slice(0, 10).map((p: any, i: number) => {
                    const sym = p.symbol ?? p.ticker ?? ''
                    const wt  = p.weight ?? 0
                    return (
                      <div key={i} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-50 border border-border">
                        <span className="font-mono text-xs font-bold text-gray-200">{sym}</span>
                        <span className="text-xs text-gray-500">{(wt * 100).toFixed(1)}%</span>
                      </div>
                    )
                  })}
                  {positions.length > 10 && (
                    <div className="px-2.5 py-1 rounded-lg bg-surface-50 border border-border text-xs text-gray-500">+{positions.length - 10} more</div>
                  )}
                </div>
              </div>
            )}
          </div>
        )
      })()}
    </div>
  )
}
