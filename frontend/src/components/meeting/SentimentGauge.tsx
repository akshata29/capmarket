import clsx from 'clsx'

interface Props {
  value: number // -1 to 1
  label?: string
  size?: 'sm' | 'md' | 'lg'
}

function sentimentColor(v: number) {
  if (v >= 0.5) return 'text-green-400'
  if (v >= 0.1) return 'text-brand-gold'
  if (v >= -0.1) return 'text-gray-400'
  if (v >= -0.5) return 'text-orange-400'
  return 'text-red-400'
}

function sentimentBg(v: number) {
  if (v >= 0.5) return 'bg-green-400'
  if (v >= 0.1) return 'bg-brand-gold'
  if (v >= -0.1) return 'bg-gray-500'
  if (v >= -0.5) return 'bg-orange-400'
  return 'bg-red-400'
}

function sentimentLabel(v: number) {
  if (v >= 0.5) return 'Very Positive'
  if (v >= 0.1) return 'Positive'
  if (v >= -0.1) return 'Neutral'
  if (v >= -0.5) return 'Negative'
  return 'Very Negative'
}

export default function SentimentGauge({ value, label, size = 'md' }: Props) {
  const pct = Math.round(((value + 1) / 2) * 100)

  return (
    <div className="flex flex-col gap-1.5">
      {label && <div className="text-xs text-gray-500">{label}</div>}
      <div className="flex items-center gap-2">
        <div className={clsx('flex-1 h-1.5 bg-surface-50 rounded-full overflow-hidden', size === 'sm' && 'h-1')}>
          <div
            className={clsx('h-full rounded-full transition-all duration-500', sentimentBg(value))}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className={clsx('text-xs font-medium tabular-nums w-6 text-right', sentimentColor(value))}>
          {value > 0 ? '+' : ''}{value.toFixed(2)}
        </span>
      </div>
      {size !== 'sm' && (
        <div className={clsx('text-[11px]', sentimentColor(value))}>{sentimentLabel(value)}</div>
      )}
    </div>
  )
}
