import { useEffect, useMemo, useRef, useState } from 'react'
import { Bell, CheckCheck, Clock, AlertTriangle, UserPlus, CircleCheck, type LucideIcon } from 'lucide-react'
import clsx from 'clsx'
import { useDataStore } from '../../store/dataStore'
import type { NotificationType } from '../../types'

const ICONS: Record<NotificationType, LucideIcon> = {
  goal_assigned: UserPlus,
  due_soon: Clock,
  goal_completed: CircleCheck,
  overdue: AlertTriangle,
}

const ICON_TONE: Record<NotificationType, string> = {
  goal_assigned: 'text-accent-text bg-accent/12',
  due_soon: 'text-warning-text bg-warning-bg',
  goal_completed: 'text-success-text bg-success-bg',
  overdue: 'text-danger-text bg-danger-bg',
}

function timeAgo(iso: string): string {
  const diffDays = Math.round((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays <= 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 30) return `${diffDays}d ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function NotificationsPanel({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const allNotifications = useDataStore((s) => s.notifications)
  const notifications = useMemo(
    () => allNotifications.filter((n) => n.userId === userId),
    [allNotifications, userId],
  )
  const markAllRead = useDataStore((s) => s.markAllNotificationsRead)
  const markRead = useDataStore((s) => s.markNotificationRead)

  const unreadCount = notifications.filter((n) => !n.readAt).length
  const sorted = [...notifications].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-text-secondary hover:bg-bg-raised hover:text-text-primary transition-colors"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-40 mt-2 w-80 max-w-[85vw] rounded-xl border border-border/10 bg-bg-elevated shadow-2xl">
          <div className="flex items-center justify-between border-b border-border/10 px-4 py-3">
            <p className="text-sm font-semibold text-text-primary">Notifications</p>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllRead(userId)}
                className="flex items-center gap-1 text-xs text-accent-text hover:underline"
              >
                <CheckCheck size={13} /> Mark all read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {sorted.length === 0 && (
              <p className="px-4 py-8 text-center text-sm text-text-muted">You&apos;re all caught up.</p>
            )}
            {sorted.map((n) => {
              const Icon = ICONS[n.type]
              return (
                <button
                  key={n.id}
                  onClick={() => markRead(n.id)}
                  className={clsx(
                    'flex w-full items-start gap-3 border-b border-border/5 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-bg-raised',
                    !n.readAt && 'bg-accent/5',
                  )}
                >
                  <span className={clsx('mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg', ICON_TONE[n.type])}>
                    <Icon size={14} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm text-text-primary leading-snug">{n.message}</span>
                    <span className="mt-0.5 block text-xs text-text-muted">{timeAgo(n.createdAt)}</span>
                  </span>
                  {!n.readAt && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" />}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
