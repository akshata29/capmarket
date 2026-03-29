import { CheckCircle, XCircle, Clock, ArrowRight } from 'lucide-react'
import clsx from 'clsx'
import type { WorkflowStage } from '@/types'

const STAGES: { key: WorkflowStage | string; label: string; gate?: boolean }[] = [
  { key: 'sense', label: 'Sense (News + Themes)' },
  { key: 'gate1', label: 'Gate 1  -  Theme Approval', gate: true },
  { key: 'think', label: 'Think (Universe + Construct)' },
  { key: 'gate2', label: 'Gate 2  -  Portfolio Approval', gate: true },
  { key: 'act', label: 'Act (Backtest + Persist)' },
  { key: 'gate3', label: 'Gate 3  -  Trade Execution', gate: true },
  { key: 'completed', label: 'Complete' },
]

interface Props {
  currentStage: string
  currentStep?: string
  onApprove?: () => void
  onReject?: () => void
  loading?: boolean
}

function stageIndex(stage: string) {
  return STAGES.findIndex(s => s.key === stage)
}

export default function WorkflowProgress({ currentStage, currentStep, onApprove, onReject, loading }: Props) {
  const current = stageIndex(currentStage)

  return (
    <div className="flex flex-col gap-3">
      {STAGES.map((stage, idx) => {
        const isDone = idx < current
        const isActive = idx === current
        const isPending = idx > current

        return (
          <div key={stage.key} className="flex items-center gap-3">
            {/* Connector line above gate */}
            <div className="flex flex-col items-center w-7 shrink-0">
              <div
                className={clsx(
                  'w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all',
                  isDone && 'bg-green-900/40 border-green-600 text-green-400',
                  isActive && 'bg-accent/20 border-accent text-accent animate-pulse',
                  isPending && 'bg-surface-50 border-border text-gray-600',
                )}
              >
                {isDone ? (
                  <CheckCircle size={14} />
                ) : isActive ? (
                  <Clock size={14} />
                ) : (
                  <span className="text-xs font-bold">{idx + 1}</span>
                )}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div
                className={clsx(
                  'text-sm font-medium',
                  isDone && 'text-gray-400 line-through',
                  isActive && 'text-gray-100',
                  isPending && 'text-gray-600',
                  stage.gate && 'text-brand-gold',
                )}
              >
                {stage.label}
              </div>
              {isActive && currentStep && (
                <div className="text-xs text-accent mt-0.5 truncate">{currentStep}...</div>
              )}
            </div>

            {/* Gate controls */}
            {isActive && stage.gate && onApprove && onReject && (
              <div className="flex gap-2">
                <button
                  onClick={onApprove}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-green-900/40 border border-green-700 text-green-400 text-xs font-medium rounded-lg hover:bg-green-800/50 transition-colors disabled:opacity-50"
                >
                  <CheckCircle size={12} /> Approve
                </button>
                <button
                  onClick={onReject}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-900/40 border border-red-700 text-red-400 text-xs font-medium rounded-lg hover:bg-red-800/50 transition-colors disabled:opacity-50"
                >
                  <XCircle size={12} /> Reject
                </button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
