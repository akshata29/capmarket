import { useState, useEffect } from 'react'
import { Filter, User, Bot, CheckCircle, Lightbulb, FileText, Play } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { auditApi } from '@/api'
import type { AuditEntry } from '@/types'
import { format } from 'date-fns'

const EVENT_COLORS: Record<string, string> = {
  meeting: 'text-blue-400',
  portfolio: 'text-green-400',
  client: 'text-brand-teal',
  advisory: 'text-accent',
  audit: 'text-gray-400',
  compliance: 'text-yellow-400',
  error: 'text-red-400',
}

function eventColor(eventType: string) {
  const prefix = Object.keys(EVENT_COLORS).find(k => eventType.toLowerCase().includes(k))
  return prefix ? EVENT_COLORS[prefix] : 'text-gray-400'
}

const AGENT_EVENT_TYPES = new Set([
  'recommendation_generated','recommendation_approved','recommendation_rejected',
  'sentiment_computed','meeting_summarized','profile_extracted',
  'advisory_request','agent_invoked','agent_completed','agent_failed',
  'pii_redacted','portfolio_run_started','backtest_completed',
  'tax_strategy_generated','relationship_insight_generated',
  'client_response_sent',
])

function isAgentEvent(eventType: string) {
  return AGENT_EVENT_TYPES.has(eventType)
}

// ── per-event rich detail panel ────────────────────────────────────────────

const ACTION_BADGE: Record<string, string> = {
  BUY:   'bg-green-900/40 text-green-300 border-green-700/40',
  SELL:  'bg-red-900/40 text-red-300 border-red-700/40',
  HOLD:  'bg-yellow-900/40 text-yellow-300 border-yellow-700/40',
}

function RecCard({ rec }: { rec: Record<string, string> }) {
  const action = (rec.action || '').toUpperCase()
  const badge = ACTION_BADGE[action] ?? 'bg-surface-200 text-gray-400 border-border'
  return (
    <div className="rounded-lg border border-border bg-surface-200 p-3 space-y-1.5">
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-semibold text-gray-200 leading-tight flex-1">{rec.headline || rec.title || 'Recommendation'}</span>
        {action && <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${badge}`}>{action}</span>}
      </div>
      {rec.category && (
        <span className="inline-block text-[10px] bg-surface-50/40 border border-border rounded px-1.5 py-0.5 text-gray-500 uppercase tracking-wide">
          {rec.category.replace(/_/g, ' ')}
        </span>
      )}
      {rec.ticker && <div className="text-[11px] text-accent font-mono">{rec.ticker}</div>}
      {rec.rationale && <p className="text-[11px] text-gray-400 leading-snug">{rec.rationale}</p>}
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-1.5">{children}</div>
}

function BulletList({ items }: { items: string[] }) {
  if (!items.length) return null
  return (
    <ul className="space-y-0.5">
      {items.map((item, i) => (
        <li key={i} className="flex gap-1.5 text-[11px] text-gray-400">
          <span className="text-gray-600 shrink-0">·</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

function ChipList({ items, color }: { items: string[]; color?: string }) {
  if (!items.length) return null
  return (
    <div className="flex flex-wrap gap-1">
      {items.map((t, i) => (
        <span key={i} className={`text-[10px] px-2 py-0.5 rounded-full border ${color ?? 'bg-surface-200 border-border text-gray-400'}`}>{t}</span>
      ))}
    </div>
  )
}

function EventDetail({ entry }: { entry: AuditEntry }) {
  const m = (entry.payload ?? entry.metadata ?? {}) as Record<string, unknown>
  const isEmpty = !entry.payload && !entry.metadata && !entry.agent_input && !entry.agent_output

  if (isEmpty) {
    return <p className="text-xs text-gray-600 italic">No additional data recorded for this event.</p>
  }

  return (
    <div className="space-y-4 text-xs">
      {/* ── meeting_started ─────────────────────────────────────────────── */}
      {entry.event_type === 'meeting_started' && (
        <div className="flex flex-wrap gap-3">
          {m.meeting_type != null && (
            <div className="stat-card p-2 min-w-[120px]">
              <div className="stat-label flex items-center gap-1"><Play size={9} /> Meeting Type</div>
              <div className="text-sm font-semibold capitalize">{String(m.meeting_type).replace(/_/g, ' ')}</div>
            </div>
          )}
          {m.is_prospective != null && (
            <div className="stat-card p-2 min-w-[100px]">
              <div className="stat-label">Session</div>
              <div className="text-sm font-semibold">{m.is_prospective ? 'Prospect' : 'Existing Client'}</div>
            </div>
          )}
          {m.title != null && (
            <div className="stat-card p-2 flex-1">
              <div className="stat-label">Title</div>
              <div className="text-sm font-semibold">{String(m.title)}</div>
            </div>
          )}
        </div>
      )}

      {/* ── recommendation_generated ────────────────────────────────────── */}
      {entry.event_type === 'recommendation_generated' && (() => {
        const recs = (m.recommendations ?? []) as Record<string, string>[]
        return (
          <div className="space-y-2">
            <SectionLabel><Lightbulb size={10} className="inline mr-1" />{recs.length} Recommendations Generated</SectionLabel>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {recs.map((r, i) => <RecCard key={i} rec={r} />)}
            </div>
          </div>
        )
      })()}

      {/* ── recommendation_approved ─────────────────────────────────────── */}
      {(entry.event_type === 'recommendation_approved') && (() => {
        const recs = (m.recommendations ?? []) as Record<string, string>[]
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <CheckCircle size={14} className="text-green-400" />
              <span className="text-gray-300 font-medium">
                {m.count != null ? `${m.count} recommendation${Number(m.count) !== 1 ? 's' : ''} approved` : 'Recommendations approved'}
                {m.approved_by ? ` by ${String(m.approved_by)}` : ''}
                {m.auto_approved ? ' (automatic)' : ''}
              </span>
            </div>
            {recs.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                {recs.map((r, i) => <RecCard key={i} rec={r} />)}
              </div>
            )}
          </div>
        )
      })()}

      {/* ── meeting_summarized ──────────────────────────────────────────── */}
      {entry.event_type === 'meeting_summarized' && (
        <div className="space-y-3">
          {!!m.executive_summary && (
            <div>
              <SectionLabel><FileText size={10} className="inline mr-1" />Executive Summary</SectionLabel>
              <p className="text-[12px] text-gray-300 leading-relaxed">{String(m.executive_summary)}</p>
            </div>
          )}
          {!!m.advisor_summary && (
            <div>
              <SectionLabel>Advisor Notes</SectionLabel>
              <p className="text-[11px] text-gray-400 leading-relaxed">{String(m.advisor_summary)}</p>
            </div>
          )}
          {Array.isArray(m.action_items) && m.action_items.length > 0 && (
            <div>
              <SectionLabel>Action Items</SectionLabel>
              <BulletList items={m.action_items as string[]} />
            </div>
          )}
          {Array.isArray(m.key_decisions) && m.key_decisions.length > 0 && (
            <div>
              <SectionLabel>Key Decisions</SectionLabel>
              <BulletList items={m.key_decisions as string[]} />
            </div>
          )}
          {Array.isArray(m.topics_discussed) && m.topics_discussed.length > 0 && (
            <div>
              <SectionLabel>Topics Discussed</SectionLabel>
              <ChipList items={m.topics_discussed as string[]} />
            </div>
          )}
          {Array.isArray(m.concerns_raised) && m.concerns_raised.length > 0 && (
            <div>
              <SectionLabel>Concerns Raised</SectionLabel>
              <ChipList items={m.concerns_raised as string[]} color="bg-amber-900/20 border-amber-700/40 text-amber-300" />
            </div>
          )}
          {m.meeting_effectiveness_score != null && (
            <div className="stat-card p-2 inline-block">
              <div className="stat-label">Effectiveness</div>
              <div className="text-sm font-semibold">{Math.round(Number(m.meeting_effectiveness_score) * 100)}%</div>
            </div>
          )}
        </div>
      )}

      {/* ── meeting_ended ───────────────────────────────────────────────── */}
      {entry.event_type === 'meeting_ended' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {m.sentiment_overall != null && (
              <div className="stat-card p-2">
                <div className="stat-label">Sentiment</div>
                <div className="text-sm font-semibold text-green-400">{Number(m.sentiment_overall).toFixed(2)}</div>
              </div>
            )}
            {m.transcript_length_chars != null && (
              <div className="stat-card p-2">
                <div className="stat-label">Transcript</div>
                <div className="text-sm font-semibold">{Number(m.transcript_length_chars).toLocaleString()} chars</div>
              </div>
            )}
            {m.recommendations_approved != null && (
              <div className="stat-card p-2">
                <div className="stat-label">Recs Approved</div>
                <div className="text-sm font-semibold">{String(m.recommendations_approved)}</div>
              </div>
            )}
            {m.profile_completeness != null && (
              <div className="stat-card p-2">
                <div className="stat-label">Profile</div>
                <div className="text-sm font-semibold">{Math.round(Number(m.profile_completeness) * 100)}%</div>
              </div>
            )}
          </div>
          {Array.isArray(m.action_items) && m.action_items.length > 0 && (
            <div>
              <SectionLabel>Action Items</SectionLabel>
              <BulletList items={m.action_items as string[]} />
            </div>
          )}
          {Array.isArray(m.key_themes) && m.key_themes.length > 0 && (
            <div>
              <SectionLabel>Key Themes</SectionLabel>
              <ChipList items={m.key_themes as string[]} />
            </div>
          )}
          {!!m.transcript_preview && (
            <div>
              <SectionLabel>Transcript Preview</SectionLabel>
              <pre className="bg-surface-200 border border-border rounded p-2 text-gray-400 text-[11px] whitespace-pre-wrap max-h-32 overflow-y-auto">
                {`${String(m.transcript_preview)}${Number(m.transcript_length_chars) > 500 ? '\n…[truncated]' : ''}`}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* ── fallback for any other event type with a payload ────────────── */}
      {!['meeting_started','recommendation_generated','recommendation_approved','meeting_summarized','meeting_ended'].includes(entry.event_type) && (entry.payload || entry.metadata) && (
        <div>
          <SectionLabel>Event Data</SectionLabel>
          <pre className="bg-surface-200 border border-border rounded p-2 text-gray-400 text-[11px] overflow-x-auto whitespace-pre-wrap">
            {JSON.stringify(entry.payload ?? entry.metadata, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}

export default function AuditPage() {
  const [searchParams] = useSearchParams()
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    event_type: '',
    client_id: searchParams.get('client_id') ?? '',
    session_id: searchParams.get('session_id') ?? '',
    limit: 100,
  })
  const [expanded, setExpanded] = useState<string | null>(null)

  const load = (params = filters) => {
    setLoading(true)
    auditApi.log({
      event_type:  params.event_type  || undefined,
      client_id:   params.client_id   || undefined,
      session_id:  params.session_id  || undefined,
      limit:       params.limit,
    }).then(setEntries).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  return (
    <div className="max-w-7xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-100">Audit Trail</h2>
          <p className="text-sm text-gray-500 mt-0.5">Every agent action, human decision, and system event — immutable CosmosDB log</p>
        </div>
        {(filters.client_id || filters.session_id) && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-amber-400 bg-amber-900/20 border border-amber-700/40 rounded px-2 py-1">
              {filters.client_id ? `Filtered by client: ${filters.client_id.slice(0, 12)}…` : ''}
              {filters.session_id ? `Filtered by session: ${filters.session_id.slice(0, 12)}…` : ''}
            </span>
            <button
              onClick={() => {
                const reset = { event_type: '', client_id: '', session_id: '', limit: 100 }
                setFilters(reset)
                load(reset)
              }}
              className="text-xs text-gray-400 hover:text-gray-200"
            >
              ✕ Clear filter
            </button>
          </div>
        )}
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="stat-label">Total Events</div>
          <div className="stat-value">{entries.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Agent Calls</div>
          <div className="stat-value">{entries.filter(e => ['recommendation_generated','sentiment_computed','meeting_summarized','profile_extracted','advisory_request','agent_invoked','agent_completed'].some(t => e.event_type === t)).length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Compliance Events</div>
          <div className="stat-value text-yellow-400">{entries.filter(e => e.event_type?.includes('compliance')).length}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="section-title">Event Type</label>
          <input
            value={filters.event_type}
            onChange={e => setFilters(p => ({ ...p, event_type: e.target.value }))}
            placeholder="e.g. meeting_started"
            className="input w-48"
          />
        </div>
        <div>
          <label className="section-title">Client ID</label>
          <input
            value={filters.client_id}
            onChange={e => setFilters(p => ({ ...p, client_id: e.target.value }))}
            placeholder="client id"
            className="input w-48"
          />
        </div>
        <div>
          <label className="section-title">Session ID</label>
          <input
            value={filters.session_id}
            onChange={e => setFilters(p => ({ ...p, session_id: e.target.value }))}
            placeholder="session id"
            className="input w-48"
          />
        </div>
        <button onClick={() => load(filters)} className="btn-primary flex items-center gap-2">
          <Filter size={14} /> Apply Filters
        </button>
        <button onClick={() => {
          const reset = { event_type: '', client_id: '', session_id: '', limit: 100 }
          setFilters(reset)
          load(reset)
        }} className="btn-secondary">
          Reset
        </button>
      </div>

      {/* Log */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {['Timestamp', 'Event Type', 'Description / Agent', 'Session', 'Client', 'Duration', ''].map(h => (
                  <th key={h} className="text-left text-xs font-medium text-gray-500 px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-500">Loading audit log…</td></tr>
              ) : entries.map(entry => (
                <>
                  <tr
                    key={entry.id}
                    className="hover:bg-surface-50/30 cursor-pointer transition-colors"
                    onClick={() => setExpanded(expanded === entry.id ? null : entry.id)}
                  >
                    <td className="px-4 py-2.5 font-mono text-xs text-gray-500">
                      {format(new Date(entry.timestamp), 'MMM d HH:mm:ss')}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs font-medium ${eventColor(entry.event_type)}`}>{entry.event_type}</span>
                    </td>
                    <td className="px-4 py-2.5 max-w-xs">
                      {isAgentEvent(entry.event_type) ? (
                        <div className="flex items-start gap-1.5">
                          <Bot size={11} className="text-accent shrink-0 mt-0.5" />
                          <div>
                            <div className="text-xs text-gray-300">Agent</div>
                            {entry.description && <div className="text-[10px] text-gray-500 truncate max-w-[200px]" title={entry.description}>{entry.description}</div>}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-1.5">
                          <User size={11} className="text-gray-500 shrink-0 mt-0.5" />
                          <div>
                            <div className="text-xs text-gray-500">Human</div>
                            {entry.description && <div className="text-[10px] text-gray-500 truncate max-w-[200px]" title={entry.description}>{entry.description}</div>}
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs text-gray-500">
                      {entry.session_id ? entry.session_id.slice(0, 8) + '…' : '—'}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs text-gray-500">
                      {entry.client_id ? entry.client_id.slice(0, 8) + '…' : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-gray-500">
                      {entry.duration_ms != null ? `${entry.duration_ms}ms` : '—'}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs text-gray-600 ${expanded === entry.id ? 'text-accent' : ''}`}>
                        {expanded === entry.id ? '▲' : '▼'}
                      </span>
                    </td>
                  </tr>
                  {expanded === entry.id && (
                    <tr key={`${entry.id}-detail`} className="bg-surface-50/50">
                      <td colSpan={7} className="px-6 py-4">
                        <EventDetail entry={entry} />
                      </td>
                    </tr>
                  )}
                </>
              ))}
              {!loading && entries.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-500">No audit events found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
