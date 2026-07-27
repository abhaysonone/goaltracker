import type { ReactNode } from 'react'
import clsx from 'clsx'
import { Card } from './Card'

interface StatTileProps {
  label: string
  value: ReactNode
  icon?: ReactNode
  tone?: 'default' | 'success' | 'warning' | 'danger'
  hint?: string
}

const toneClasses = {
  default: 'text-accent bg-accent/12',
  success: 'text-success-text bg-success-bg',
  warning: 'text-warning-text bg-warning-bg',
  danger: 'text-danger-text bg-danger-bg',
}

export function StatTile({ label, value, icon, tone = 'default', hint }: StatTileProps) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-text-primary">{value}</p>
          {hint && <p className="mt-1 text-xs text-text-muted">{hint}</p>}
        </div>
        {icon && (
          <div className={clsx('flex h-10 w-10 items-center justify-center rounded-lg', toneClasses[tone])}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  )
}
