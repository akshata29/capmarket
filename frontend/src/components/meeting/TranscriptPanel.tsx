import { format } from 'date-fns'
import clsx from 'clsx'
import type { TranscriptSegment } from '@/types'

interface Props {
  segments: TranscriptSegment[]
}

const ROLE_COLORS: Record<string, string> = {
  advisor: 'text-accent-hover',
  client: 'text-brand-teal',
  system: 'text-gray-500',
}

const ROLE_BG: Record<string, string> = {
  advisor: 'bg-indigo-900/30 border-indigo-800/40',
  client: 'bg-teal-900/30 border-teal-800/40',
  system: 'bg-surface-50 border-border',
}

export default function TranscriptPanel({ segments }: Props) {
  if (segments.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-500 text-sm">
        Waiting for transcript…
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {segments.map((seg) => (
        <div
          key={seg.id}
          className={clsx(
            'flex gap-3 p-3 rounded-lg border text-sm',
            ROLE_BG[seg.role] ?? ROLE_BG.system,
          )}
        >
          <div className="flex flex-col items-center gap-1 shrink-0 w-16">
            <span className={clsx('text-xs font-semibold uppercase tracking-wide', ROLE_COLORS[seg.role])}>
              {seg.speaker}
            </span>
            <span className="text-[10px] text-gray-600 font-mono">
              {format(new Date(seg.timestamp), 'HH:mm:ss')}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className={clsx('text-gray-200 leading-relaxed', seg.is_pii_redacted && 'italic text-gray-400')}>
              {seg.text}
            </p>
            {seg.is_pii_redacted && (
              <span className="text-[10px] text-yellow-500 mt-0.5 block">PII redacted</span>
            )}
          </div>
          {seg.sentiment_score !== undefined && (
            <div className="shrink-0 text-right">
              <span className={clsx(
                'text-xs font-mono',
                seg.sentiment_score >= 0 ? 'text-green-400' : 'text-red-400',
              )}>
                {seg.sentiment_score > 0 ? '+' : ''}{seg.sentiment_score.toFixed(2)}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
