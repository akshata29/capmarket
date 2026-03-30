import { NavLink, useLocation } from 'react-router-dom'
import { useState } from 'react'
import {
  LayoutDashboard,
  Mic,
  Users,
  TrendingUp,
  Lightbulb,
  MessageCircle,
  Shield,
  ChevronRight,
  ChevronDown,
  Check,
  BarChart2,
  RefreshCw,
  Activity,
  AlertTriangle,
  Gauge,
  GitBranch,
  Network,
  Settings,
  Play,
} from 'lucide-react'
import clsx from 'clsx'
import { useAdvisor } from '@/context/AdvisorContext'

const NAV_GROUPS = [
  {
    label: 'Customers',
    items: [
      { to: '/clients',   icon: Users,          label: 'Clients' },
      { to: '/meetings',  icon: Mic,             label: 'Meetings' },
      { to: '/portfolio', icon: TrendingUp,      label: 'Portfolio' },
      { to: '/backtest',  icon: BarChart2,       label: 'Backtesting' },
      { to: '/rebalance', icon: RefreshCw,       label: 'Rebalance' },
      { to: '/advisory',  icon: Lightbulb,       label: 'Advisory AI' },
      { to: '/assistant', icon: MessageCircle,   label: 'Client Assistant' },
    ],
  },
  {
    label: 'Insights',
    items: [
      { to: '/watch',          icon: Activity,       label: 'Portfolio Watch' },
      { to: '/intel-feed',     icon: AlertTriangle,  label: 'Intel Feed' },
      { to: '/market-regime',  icon: Gauge,          label: 'Market Regime' },
      { to: '/audit',          icon: Shield,         label: 'Audit Trail' },
    ],
  },
  {
    label: 'Design',
    items: [
      { to: '/demo',         icon: Play,      label: 'Demo' },
      { to: '/workflow',     icon: GitBranch, label: 'Workflow' },
      { to: '/architecture', icon: Network,    label: 'Architecture' },
      { to: '/settings',     icon: Settings,  label: 'Settings' },
    ],
  },
]

export default function Sidebar() {
  const location = useLocation()
  const { advisor, advisors, setAdvisor } = useAdvisor()
  const [pickerOpen, setPickerOpen] = useState(false)

  return (
    <aside className="flex flex-col w-60 min-h-screen bg-surface-100 border-r border-border shrink-0">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-border">
        <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-white font-bold text-sm">
          C
        </div>
        <div>
          <div className="text-sm font-semibold text-gray-100">Capital Market</div>
          <div className="text-[10px] text-gray-500 uppercase tracking-wider">Wealth Advisor</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-3 overflow-y-auto space-y-1">
        {/* Dashboard — standalone */}
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            clsx(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group',
              isActive
                ? 'bg-accent/20 text-accent-hover'
                : 'text-gray-400 hover:text-gray-100 hover:bg-surface-50',
            )
          }
        >
          {({ isActive }) => (
            <>
              <LayoutDashboard size={16} className={clsx(isActive ? 'text-accent-hover' : 'text-gray-500 group-hover:text-gray-300')} />
              <span className="flex-1">Dashboard</span>
              {isActive && <ChevronRight size={12} className="text-accent" />}
            </>
          )}
        </NavLink>

        {/* Grouped sections */}
        {NAV_GROUPS.map(group => (
          <div key={group.label} className="pt-3">
            <div className="px-3 pb-1.5">
              <span className="text-[9px] font-bold uppercase tracking-widest text-gray-600">
                {group.label}
              </span>
            </div>
            <div className="space-y-0.5">
              {group.items.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    clsx(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group',
                      isActive
                        ? 'bg-accent/20 text-accent-hover'
                        : 'text-gray-400 hover:text-gray-100 hover:bg-surface-50',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon size={16} className={clsx(isActive ? 'text-accent-hover' : 'text-gray-500 group-hover:text-gray-300')} />
                      <span className="flex-1">{label}</span>
                      {isActive && <ChevronRight size={12} className="text-accent" />}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer — advisor selector */}
      <div className="px-4 py-4 border-t border-border relative">
        <button
          onClick={() => setPickerOpen(o => !o)}
          className="w-full flex items-center gap-2.5 rounded-lg hover:bg-surface-50 px-1 py-1 transition-colors group"
        >
          <div className="w-8 h-8 rounded-full bg-brand-gold-muted border border-brand-gold/30 flex items-center justify-center text-brand-gold font-semibold text-xs shrink-0">
            {advisor.initials}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <div className="text-sm font-medium text-gray-200 truncate">{advisor.name}</div>
            <div className="text-[11px] text-gray-500 truncate">{advisor.role}</div>
          </div>
          <ChevronDown
            size={13}
            className={clsx('text-gray-500 transition-transform shrink-0', pickerOpen && 'rotate-180')}
          />
        </button>

        {/* Dropdown */}
        {pickerOpen && (
          <div className="absolute bottom-full left-3 right-3 mb-1 rounded-xl border border-border bg-surface-100 shadow-xl overflow-hidden z-50">
            <div className="px-3 py-2 border-b border-border">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Switch Advisor</span>
            </div>
            {advisors.map(a => (
              <button
                key={a.id}
                onClick={() => { setAdvisor(a); setPickerOpen(false) }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-surface-50 transition-colors text-left"
              >
                <div className="w-7 h-7 rounded-full bg-brand-gold-muted border border-brand-gold/30 flex items-center justify-center text-brand-gold font-semibold text-[11px] shrink-0">
                  {a.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-gray-200 truncate">{a.name}</div>
                  <div className="text-[10px] text-gray-500 truncate">{a.role}</div>
                </div>
                {a.id === advisor.id && <Check size={13} className="text-accent shrink-0" />}
              </button>
            ))}
            <div className="px-3 py-2 border-t border-border">
              <div className="text-[10px] text-gray-600 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-accent/60 inline-block" />
                ID: <span className="text-gray-500 font-mono ml-0.5">{advisor.id}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
