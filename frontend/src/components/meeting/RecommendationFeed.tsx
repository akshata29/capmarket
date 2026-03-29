import { Check, X, AlertTriangle, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import clsx from 'clsx'
import type { Recommendation } from '@/types'

interface Props {
  recommendations: Recommendation[]
  onApprove?: (id: string) => void
  onReject?: (id: string) => void
  readonly?: boolean
}

const SIGNAL_ICONS = {
  BUY: TrendingUp,
  SELL: TrendingDown,
  HOLD: Minus,
}

const SIGNAL_COLORS = {
  BUY: 'text-green-400 bg-green-900/30 border-green-800/40',
  SELL: 'text-red-400 bg-red-900/30 border-red-800/40',
  HOLD: 'text-yellow-400 bg-yellow-900/30 border-yellow-800/40',
}

const CONVICTION_COLORS = {
  high: 'badge-success',
  medium: 'badge-warning',
  low: 'badge-info',
}

export default function RecommendationFeed({ recommendations, onApprove, onReject, readonly }: Props) {
  if (recommendations.length === 0) {
    return (
      <div className="flex items-center justify-center h-24 text-gray-500 text-sm">
        No recommendations yet
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {recommendations.map((rec) => {
        const SignalIcon = SIGNAL_ICONS[rec.action as keyof typeof SIGNAL_ICONS] ?? Minus

        return (
          <div
            key={rec.id}
            className={clsx(
              'flex items-start gap-3 p-3.5 rounded-xl border',
              rec.compliance_approved === false
                ? 'bg-red-950/30 border-red-900/50'
                : 'bg-card border-border',
            )}
          >
            {/* Signal badge */}
            <div className={clsx('flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-bold shrink-0', SIGNAL_COLORS[rec.action as keyof typeof SIGNAL_COLORS] ?? SIGNAL_COLORS.HOLD)}>
              <SignalIcon size={12} />
              {rec.action}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                {rec.ticker && (
                  <span className="font-mono text-sm font-semibold text-gray-100">{rec.ticker}</span>
                )}
                <span className={CONVICTION_COLORS[rec.conviction]}>
                  {rec.conviction} conviction
                </span>
                <span className="badge text-[10px] text-gray-400 bg-surface-50 border-border">{rec.category}</span>
                {rec.compliance_approved === false && (
                  <span className="badge-error flex items-center gap-1">
                    <AlertTriangle size={9} /> Compliance hold
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">{rec.rationale}</p>
            </div>

            {/* Actions */}
            {!readonly && onApprove && onReject && rec.compliance_approved === undefined && (
              <div className="flex gap-1.5 shrink-0">
                <button
                  onClick={() => onApprove(rec.id)}
                  className="p-1.5 rounded-lg bg-green-900/30 border border-green-800/50 text-green-400 hover:bg-green-800/40 transition-colors"
                >
                  <Check size={13} />
                </button>
                <button
                  onClick={() => onReject(rec.id)}
                  className="p-1.5 rounded-lg bg-red-900/30 border border-red-800/50 text-red-400 hover:bg-red-800/40 transition-colors"
                >
                  <X size={13} />
                </button>
              </div>
            )}
            {rec.compliance_approved === true && (
              <Check size={15} className="text-green-400 shrink-0 mt-0.5" />
            )}
          </div>
        )
      })}
    </div>
  )
}
