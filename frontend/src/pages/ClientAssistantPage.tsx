import { useState, useEffect, useRef } from 'react'
import { Send, MessageCircle, AlertTriangle, Newspaper, FileText, Loader2 } from 'lucide-react'
import { assistantApi, clientsApi, getAdvisorId } from '@/api'
import type { ClientProfile } from '@/types'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  escalation?: boolean
  timestamp: string
}

export default function ClientAssistantPage() {
  const [clients, setClients] = useState<ClientProfile[]>([])
  const [selectedClient, setSelectedClient] = useState<string>('')
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [newsResult, setNewsResult] = useState<Record<string, unknown> | null>(null)
  const [docResult, setDocResult] = useState<Record<string, unknown> | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    clientsApi.list().then(c => { setClients(c); if (c.length) setSelectedClient(c[0].id) }).catch(() => [])
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (!selectedClient) return
    assistantApi.history(selectedClient).then(hist => {
      setMessages(
        (hist as Array<{ query?: string; response?: string; escalation_detected?: boolean; created_at: string }>).flatMap((h, i) => [
          { id: `h${i}u`, role: 'user' as const, content: h.query ?? '', timestamp: h.created_at },
          { id: `h${i}a`, role: 'assistant' as const, content: h.response ?? '', escalation: h.escalation_detected, timestamp: h.created_at },
        ]),
      )
    }).catch(() => [])
  }, [selectedClient])

  const client = clients.find(c => c.id === selectedClient)

  const sendQuery = async () => {
    if (!input.trim() || !client) return
    const msg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: msg, timestamp: new Date().toISOString() }])
    setLoading(true)
    try {
      const res = await assistantApi.query({
        client_id: client.id,
        advisor_id: getAdvisorId(),
        query: msg,
        client_profile: client as unknown as Record<string, unknown>,
      })
      const typedRes = res as { response?: string; message?: string; escalation_detected?: boolean }
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: typedRes.response ?? typedRes.message ?? JSON.stringify(res),
        escalation: typedRes.escalation_detected,
        timestamp: new Date().toISOString(),
      }])
    } finally {
      setLoading(false)
    }
  }

  const loadNews = async () => {
    if (!client) return
    setLoading(true)
    try {
      const res = await assistantApi.news({
        client_id: client.id,
        advisor_id: getAdvisorId(),
        client_profile: client as unknown as Record<string, unknown>,
        portfolio: {},
      })
      setNewsResult(res as Record<string, unknown>)
    } finally {
      setLoading(false)
    }
  }

  const requestDoc = async (docType: string) => {
    if (!client) return
    setLoading(true)
    try {
      const res = await assistantApi.document({
        client_id: client.id,
        advisor_id: getAdvisorId(),
        client_profile: client as unknown as Record<string, unknown>,
        document_type: docType,
      })
      setDocResult(res as Record<string, unknown>)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-7xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-100">Client Assistant</h2>
        <p className="text-sm text-gray-500 mt-0.5">24/7 AI team member · compliant · escalation-aware</p>
      </div>

      {/* Client selector */}
      <div className="flex items-center gap-4 card max-w-lg py-3">
        <label className="text-xs text-gray-500 shrink-0">Client:</label>
        <select value={selectedClient} onChange={e => setSelectedClient(e.target.value)} className="input">
          <option value="">Select a client…</option>
          {clients.map(c => (
            <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat */}
        <div className="lg:col-span-2 card flex flex-col" style={{ minHeight: 500 }}>
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border">
            <MessageCircle size={15} className="text-accent" />
            <h3 className="text-sm font-semibold text-gray-200">Client Conversation</h3>
            {client && (
              <span className="text-xs text-gray-500 ml-auto">
                {client.first_name} {client.last_name}
              </span>
            )}
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto mb-4" style={{ maxHeight: 380 }}>
            {messages.length === 0 && (
              <div className="text-gray-500 text-sm text-center py-12">
                Start a conversation — the AI team member is always on
              </div>
            )}
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[82%] rounded-xl px-4 py-2.5 text-sm space-y-1 ${
                  msg.role === 'user'
                    ? 'bg-accent/30 border border-accent/40 text-gray-100'
                    : 'bg-surface-50 border border-border text-gray-200'
                }`}>
                  <p className="leading-relaxed">{msg.content}</p>
                  {msg.escalation && (
                    <div className="flex items-center gap-1.5 text-yellow-400 text-xs mt-1">
                      <AlertTriangle size={11} /> Escalation flagged — advisor notified
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-surface-50 border border-border rounded-xl px-4 py-2.5 flex items-center gap-2">
                  <Loader2 size={13} className="animate-spin text-accent" />
                  <span className="text-sm text-gray-400">Thinking…</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="flex gap-2 border-t border-border pt-3">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendQuery()}
              placeholder="Type client question…"
              className="input"
              disabled={!selectedClient}
            />
            <button onClick={sendQuery} disabled={!input.trim() || !selectedClient || loading} className="btn-primary px-4">
              <Send size={14} />
            </button>
          </div>
        </div>

        {/* Right panel: news + docs */}
        <div className="space-y-4">
          {/* Portfolio news */}
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
                <Newspaper size={13} className="text-brand-teal" /> Portfolio News
              </h3>
              <button onClick={loadNews} disabled={loading || !selectedClient} className="btn-ghost text-xs">
                {loading ? <Loader2 size={11} className="animate-spin" /> : 'Refresh'}
              </button>
            </div>
            {newsResult ? (
              <div className="space-y-2">
                {((newsResult.alerts ?? newsResult.news ?? []) as Array<{ headline: string; severity: string; action_required?: string }>).slice(0, 5).map((alert, i) => (
                  <div key={i} className="text-xs">
                    <div className={`font-medium ${
                      alert.severity === 'critical' ? 'text-red-400' :
                      alert.severity === 'high' ? 'text-orange-400' :
                      alert.severity === 'medium' ? 'text-yellow-400' : 'text-gray-300'
                    }`}>{alert.headline}</div>
                    {alert.action_required && (
                      <div className="text-gray-500 mt-0.5">{alert.action_required}</div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-500 text-xs">Click Refresh to load market news for this client's portfolio</div>
            )}
          </div>

          {/* Document requests */}
          <div className="card">
            <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2 mb-3">
              <FileText size={13} className="text-brand-gold" /> Documents
            </h3>
            <div className="space-y-2">
              {['tax_1099', 'statement_q1', 'performance_report', 'portfolio_proposal'].map(docType => (
                <button
                  key={docType}
                  onClick={() => requestDoc(docType)}
                  disabled={loading || !selectedClient}
                  className="w-full text-left px-3 py-2 bg-surface-50 border border-border rounded-lg text-xs text-gray-300 hover:border-accent/40 hover:bg-accent/5 transition-colors disabled:opacity-50"
                >
                  {docType.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
            {docResult && (
              <div className="mt-3 p-3 bg-surface-50 border border-border rounded-lg text-xs text-gray-400">
                {(docResult as { message?: string; status?: string; url?: string }).message ?? JSON.stringify(docResult)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
