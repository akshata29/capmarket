import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, Mic, TrendingUp, Shield, AlertTriangle, Activity, ArrowRight } from 'lucide-react'
import { healthApi, clientsApi, auditApi } from '@/api'
import type { ClientProfile, AuditEntry } from '@/types'
import { format } from 'date-fns'

interface HealthData {
  status: string
  uptime_seconds: number
  cosmos: string
  foundry_project: string
  environment: string
}

export default function DashboardPage() {
  const [health, setHealth] = useState<HealthData | null>(null)
  const [clients, setClients] = useState<ClientProfile[]>([])
  const [recentAudit, setRecentAudit] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      healthApi.check().catch(() => null),
      clientsApi.list().catch(() => []),
      auditApi.log({ limit: 8 }).catch(() => []),
    ]).then(([h, c, a]) => {
      setHealth(h)
      setClients(c)
      setRecentAudit(a)
      setLoading(false)
    })
  }, [])

  const totalAum = clients.reduce((sum, c) => sum + (c.aum ?? 0), 0)

  const stats = [
    { label: 'Total Clients', value: clients.length, icon: Users, color: 'text-accent', bg: 'bg-accent/10' },
    { label: 'Assets Under Mgmt', value: `$${(totalAum / 1e6).toFixed(1)}M`, icon: TrendingUp, color: 'text-green-400', bg: 'bg-green-900/20' },
    { label: 'Active Agents', value: '13', icon: Activity, color: 'text-brand-teal', bg: 'bg-teal-900/20' },
    { label: 'Compliance Flags', value: recentAudit.filter(a => a.event_type?.includes('compliance')).length, icon: Shield, color: 'text-yellow-400', bg: 'bg-yellow-900/20' },
  ]

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-gray-100">Good morning, Advisor</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Wealth advisor platform powered by Azure AI Foundry · MAF orchestration
        </p>
      </div>

      {/* Health banner */}
      {health && (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-surface-50 border border-border rounded-xl text-xs text-gray-400">
          <span className={`w-2 h-2 rounded-full ${health.status === 'ok' ? 'bg-green-400' : 'bg-red-400'} animate-pulse`} />
          <span className="text-gray-300 font-medium">System {health.status.toUpperCase()}</span>
          <span className="text-border">|</span>
          <span>CosmosDB: <span className={health.cosmos === 'connected' ? 'text-green-400' : 'text-red-400'}>{health.cosmos}</span></span>
          <span className="text-border">|</span>
          <span>Uptime: {Math.floor(health.uptime_seconds / 60)}m {Math.round(health.uptime_seconds % 60)}s</span>
          <span className="text-border">|</span>
          <span className="truncate">{health.foundry_project}</span>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="stat-card">
            <div className="flex items-center justify-between mb-2">
              <div className="stat-label">{label}</div>
              <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}>
                <Icon size={15} className={color} />
              </div>
            </div>
            <div className="stat-value">{loading ? '…' : value}</div>
          </div>
        ))}
      </div>

      {/* Two columns: Recent clients + Recent audit */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Clients */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-200">Recent Clients</h3>
            <Link to="/clients" className="text-xs text-accent hover:text-accent-hover flex items-center gap-1">
              View all <ArrowRight size={11} />
            </Link>
          </div>
          <div className="space-y-2">
            {loading ? (
              <div className="text-gray-500 text-sm">Loading…</div>
            ) : clients.slice(0, 5).map(client => (
              <Link
                key={client.id}
                to={`/clients/${client.id}`}
                className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-surface-50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center text-accent text-xs font-semibold">
                    {client.first_name[0]}{client.last_name[0]}
                  </div>
                  <div>
                    <div className="text-sm text-gray-200 group-hover:text-white">{client.first_name} {client.last_name}</div>
                    <div className="text-xs text-gray-500 capitalize">{client.risk_tolerance} · {client.status}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-300">${(client.aum / 1e6).toFixed(1)}M</div>
                  <ArrowRight size={11} className="text-gray-600 group-hover:text-accent ml-auto mt-0.5" />
                </div>
              </Link>
            ))}
            {!loading && clients.length === 0 && (
              <div className="text-gray-500 text-sm py-4 text-center">No clients yet — add one to get started</div>
            )}
          </div>
        </div>

        {/* Audit feed */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-200">Recent Agent Activity</h3>
            <Link to="/audit" className="text-xs text-accent hover:text-accent-hover flex items-center gap-1">
              Full audit <ArrowRight size={11} />
            </Link>
          </div>
          <div className="space-y-2">
            {loading ? (
              <div className="text-gray-500 text-sm">Loading…</div>
            ) : recentAudit.slice(0, 8).map(entry => (
              <div key={entry.id} className="flex items-start gap-3 py-2">
                <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-300 truncate font-medium">{entry.event_type}</div>
                  {entry.agent_name && (
                    <div className="text-[11px] text-gray-600">{entry.agent_name}</div>
                  )}
                </div>
                <div className="text-[11px] text-gray-600 shrink-0">
                  {format(new Date(entry.timestamp), 'HH:mm')}
                </div>
              </div>
            ))}
            {!loading && recentAudit.length === 0 && (
              <div className="text-gray-500 text-sm py-4 text-center">No agent activity yet</div>
            )}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="card">
        <h3 className="text-sm font-semibold text-gray-200 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { to: '/meetings', icon: Mic, label: 'Start Meeting', desc: 'Real-time intelligence' },
            { to: '/portfolio', icon: TrendingUp, label: 'Build Portfolio', desc: 'AI-driven construction' },
            { to: '/advisory', icon: AlertTriangle, label: 'Advisory Prep', desc: 'Pre-meeting briefing' },
            { to: '/clients', icon: Users, label: 'Add Client', desc: 'CRM profile' },
          ].map(({ to, icon: Icon, label, desc }) => (
            <Link
              key={to}
              to={to}
              className="flex flex-col gap-2 p-4 bg-surface-50 border border-border rounded-xl hover:border-accent/40 hover:bg-accent/5 transition-colors group"
            >
              <Icon size={20} className="text-accent" />
              <div>
                <div className="text-sm font-medium text-gray-200 group-hover:text-white">{label}</div>
                <div className="text-xs text-gray-500">{desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
