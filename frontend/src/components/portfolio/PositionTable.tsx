import React from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import clsx from 'clsx'
import type { Position } from '@/types'

interface Props {
  positions: Position[]
}

const SIGNAL_STYLE: Record<string, { icon: React.ElementType; cls: string }> = {
  BUY:  { icon: TrendingUp,   cls: 'text-green-400 bg-green-900/20 border-green-800/40' },
  SELL: { icon: TrendingDown, cls: 'text-red-400 bg-red-900/20 border-red-800/40' },
  HOLD: { icon: Minus,        cls: 'text-yellow-400 bg-yellow-900/20 border-yellow-800/40' },
}
const SIGNAL_FALLBACK = { icon: Minus, cls: 'text-gray-400 bg-gray-900/20 border-gray-800/40' }

const CONV_COLORS = {
  high: 'text-green-400',
  medium: 'text-yellow-400',
  low: 'text-gray-400',
}

export default function PositionTable({ positions }: Props) {
  // Deduplicate by ticker/symbol — agent occasionally returns the same ticker twice
  const seen = new Set<string>()
  const unique = (positions as any[]).filter(p => {
    const t = (p.symbol ?? p.ticker ?? '').toString()
    if (seen.has(t)) return false
    seen.add(t)
    return true
  })

  if (!unique.length) {
    return <div className="text-gray-500 text-sm py-8 text-center">No positions constructed yet</div>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            {['Ticker', 'Name', 'Asset Class', 'Weight', 'Target', 'Signal', 'Conviction', 'Rationale'].map(h => (
              <th key={h} className="text-left text-xs text-gray-500 font-medium pb-2 pr-4 first:pl-0">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50">
          {unique.map((pos: any, idx: number) => {
            const ticker = pos.symbol ?? pos.ticker
            const signalKey = (pos.signal ?? 'hold').toString().toUpperCase()
            const { icon: Icon, cls } = SIGNAL_STYLE[signalKey] ?? SIGNAL_FALLBACK
            const targetWeight = pos.target_weight ?? pos.weight
            return (
              <tr key={`${ticker ?? ''}-${idx}`} className="hover:bg-surface-50/50 transition-colors">
                <td className="py-2.5 pr-4 font-mono font-semibold text-gray-100">{ticker}</td>
                <td className="py-2.5 pr-4 text-gray-300 max-w-[140px] truncate">{pos.name}</td>
                <td className="py-2.5 pr-4">
                  <span className="badge text-[10px] text-gray-400 bg-surface-50 border-border">{pos.asset_class}</span>
                </td>
                <td className="py-2.5 pr-4 font-mono text-gray-200">{((pos.weight ?? 0) * 100).toFixed(1)}%</td>
                <td className="py-2.5 pr-4 font-mono text-gray-400">{((targetWeight ?? 0) * 100).toFixed(1)}%</td>
                <td className="py-2.5 pr-4">
                  <div className={clsx('inline-flex items-center gap-1 border px-2 py-0.5 rounded text-xs font-bold', cls)}>
                    <Icon size={10} />
                    {signalKey}
                  </div>
                </td>
                <td className={clsx('py-2.5 pr-4 text-xs capitalize font-medium', CONV_COLORS[(pos.conviction as keyof typeof CONV_COLORS)] ?? 'text-gray-400')}>
                  {pos.conviction}
                </td>
                <td className="py-2.5 text-xs text-gray-500 max-w-[200px] truncate">{pos.rationale ?? '-'}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
