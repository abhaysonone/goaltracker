import clsx from 'clsx'

interface ProgressBarProps {
  value: number
  tone?: 'accent' | 'success' | 'warning' | 'danger'
  className?: string
}

const toneClasses = {
  accent: 'bg-accent',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
}

export function ProgressBar({ value, tone = 'accent', className }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value))
  return (
    <div className={clsx('h-1.5 w-full rounded-full bg-bg-raised overflow-hidden', className)}>
      <div
        className={clsx('h-full rounded-full transition-all duration-300', toneClasses[tone])}
        style={{ width: `${clamped}%` }}
      />
    </div>
  )
}
