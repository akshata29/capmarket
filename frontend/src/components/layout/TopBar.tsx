import { useLocation } from 'react-router-dom'
import { Bell, Cpu, Activity } from 'lucide-react'

const TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/meetings': 'Meeting Intelligence',
  '/clients': 'Client Management',
  '/portfolio': 'Portfolio Construction',
  '/advisory': 'Advisory Intelligence',
  '/assistant': 'Client Assistant',
  '/audit': 'Audit Trail',
}

export default function TopBar() {
  const { pathname } = useLocation()
  const base = '/' + pathname.split('/')[1]
  const title = TITLES[base] ?? 'Capmarket'

  return (
    <header className="h-16 flex items-center justify-between px-6 bg-surface-100 border-b border-border shrink-0">
      <div className="flex items-center gap-3">
        <h1 className="text-base font-semibold text-gray-100">{title}</h1>
        <span className="badge-gold">Responses API v2</span>
      </div>

      <div className="flex items-center gap-3">
        {/* Live agents indicator */}
        <div className="flex items-center gap-1.5 bg-surface-50 border border-border rounded-full px-3 py-1">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs text-gray-400">13 agents online</span>
        </div>

        {/* MAF badge */}
        <div className="flex items-center gap-1.5 bg-surface-50 border border-border rounded-full px-3 py-1">
          <Cpu size={11} className="text-accent" />
          <span className="text-xs text-gray-400">MAF</span>
        </div>

        <button className="btn-ghost relative">
          <Bell size={16} />
          <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-status-error rounded-full" />
        </button>
      </div>
    </header>
  )
}
