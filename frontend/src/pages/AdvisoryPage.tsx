import { useState, useEffect } from 'react'
import { Loader2, Lightbulb, TrendingUp, MessageSquare, Users } from 'lucide-react'
import { advisoryApi, clientsApi, getAdvisorId } from '@/api'
import type { ClientProfile } from '@/types'

type Tab = 'briefing' | 'tax' | 'chat' | 'relationship'

export default function AdvisoryPage() {
  const [tab, setTab] = useState<Tab>('briefing')
  const [clients, setClients] = useState<ClientProfile[]>([])
  const [selectedClient, setSelectedClient] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Record<string, unknown> | null>(null)
  const [chatInput, setChatInput] = useState('')
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'assistant'; content: string }[]>([])

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

  const sendChat = async () => {
    if (!chatInput.trim()) return
    const msg = chatInput
    setChatInput('')
    setChatHistory(h => [...h, { role: 'user', content: msg }])
    const res = await advisoryApi.chat({
      advisor_id: getAdvisorId(),
      question: msg,
      client_profile: client as unknown as Record<string, unknown> | undefined,
    })
    setChatHistory(h => [...h, { role: 'assistant', content: (res as { answer?: string }).answer ?? JSON.stringify(res) }])
  }

  const TABS = [
    { key: 'briefing' as Tab, icon: Lightbulb, label: 'Pre-Meeting Briefing' },
    { key: 'tax' as Tab, icon: TrendingUp, label: 'Tax Strategies' },
    { key: 'chat' as Tab, icon: MessageSquare, label: 'Advisor AI Chat' },
    { key: 'relationship' as Tab, icon: Users, label: 'Relationship Ideas' },
  ]

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
      <div className="flex gap-1 bg-surface-50 p-1 rounded-xl w-fit">
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

        {/* Briefing */}
        {tab === 'briefing' && (
          <div className="space-y-4">
            <button onClick={runPreMeeting} disabled={loading} className="btn-primary flex items-center gap-2">
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Lightbulb size={14} />}
              Generate Pre-Meeting Briefing
            </button>
            {result && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { key: 'talking_points', label: 'Talking Points' },
                  { key: 'tax_opportunities', label: 'Tax Opportunities' },
                  { key: 'relationship_ideas', label: 'Relationship Ideas' },
                  { key: 'market_alerts', label: 'Market Alerts' },
                  { key: 'client_updates', label: 'Client Updates' },
                ].map(({ key, label }) => {
                  const items = (result[key] as string[]) ?? []
                  return items.length > 0 ? (
                    <div key={key} className="card">
                      <div className="section-title">{label}</div>
                      <ul className="space-y-2">
                        {items.map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-gray-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-accent mt-1 shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null
                })}
              </div>
            )}
          </div>
        )}

        {/* Tax */}
        {tab === 'tax' && (
          <div className="space-y-4">
            <button onClick={runTax} disabled={loading} className="btn-primary flex items-center gap-2">
              {loading ? <Loader2 size={14} className="animate-spin" /> : <TrendingUp size={14} />}
              Generate Tax Strategies
            </button>
            {result && (
              <div className="space-y-3">
                {((result.strategies ?? []) as Array<{ strategy: string; estimated_savings?: number; timeline: string; priority: string; action_required: string }>).map((s, i) => (
                  <div key={i} className="card space-y-2">
                    <div className="flex items-center gap-3">
                      <span className={`badge text-xs ${s.priority === 'high' ? 'badge-error' : s.priority === 'medium' ? 'badge-warning' : 'badge-info'}`}>
                        {s.priority}
                      </span>
                      <span className="text-sm font-medium text-gray-200">{s.strategy}</span>
                      {s.estimated_savings && (
                        <span className="ml-auto text-green-400 text-xs font-mono">
                          ~${s.estimated_savings.toLocaleString()} savings
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400">{s.action_required}</div>
                    <div className="text-xs text-gray-500">Timeline: {s.timeline}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Chat */}
        {tab === 'chat' && (
          <div className="space-y-4">
            <div className="card min-h-[300px] flex flex-col gap-3">
              <div className="flex-1 space-y-3 overflow-y-auto">
                {chatHistory.length === 0 && (
                  <div className="text-gray-500 text-sm text-center py-8">
                    Ask anything — market analysis, regulatory questions, client strategies…
                  </div>
                )}
                {chatHistory.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm ${
                      msg.role === 'user'
                        ? 'bg-accent/30 border border-accent/40 text-gray-100'
                        : 'bg-surface-50 border border-border text-gray-200'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 border-t border-border pt-3">
                <input
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendChat()}
                  placeholder="Ask your advisory AI assistant…"
                  className="input"
                />
                <button onClick={sendChat} disabled={!chatInput.trim()} className="btn-primary px-4">
                  Send
                </button>
              </div>
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
              <div className="card space-y-3">
                <div className="section-title">Relationship Deepening Ideas</div>
                <ul className="space-y-2">
                  {((result.ideas ?? result.relationship_ideas ?? []) as string[]).map((idea, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-300 py-1.5 border-b border-border/40 last:border-0">
                      <span className="w-5 h-5 rounded-full bg-brand-gold/20 border border-brand-gold/40 flex items-center justify-center text-brand-gold text-xs shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      {idea}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
