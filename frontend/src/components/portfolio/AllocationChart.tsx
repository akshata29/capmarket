import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import type { Position } from '@/types'

const COLORS = [
  '#6366f1', '#14b8a6', '#f59e0b', '#ef4444', '#22c55e',
  '#8b5cf6', '#06b6d4', '#f97316', '#ec4899', '#84cc16',
  '#0ea5e9', '#a78bfa', '#34d399', '#fb923c', '#f472b6',
]

interface Props {
  positions: Position[]
}

export default function AllocationChart({ positions }: Props) {
  if (positions.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-500 text-sm">
        No positions
      </div>
    )
  }

  const data = positions
    .filter(p => p.weight > 0)
    .sort((a, b) => b.weight - a.weight)
    .map(p => ({ name: p.ticker, value: +(p.weight * 100).toFixed(1) }))

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={90}
          paddingAngle={2}
          dataKey="value"
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ background: '#1a1f2e', border: '1px solid #2a3040', borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: '#cbd5e1' }}
          formatter={(v: number) => [`${v}%`, 'Weight']}
        />
        <Legend
          iconSize={8}
          iconType="circle"
          formatter={(v) => <span style={{ color: '#94a3b8', fontSize: 11 }}>{v}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
