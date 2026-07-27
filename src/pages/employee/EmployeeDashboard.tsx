import { useMemo } from 'react'
import { AlertTriangle, CheckCircle2, ClipboardList, Clock3 } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useDataStore, effectiveStatus, isDueSoon } from '../../store/dataStore'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { StatTile } from '../../components/ui/StatTile'
import { Badge } from '../../components/ui/Badge'
import { EmptyState } from '../../components/ui/EmptyState'
import { ProgressBar } from '../../components/ui/ProgressBar'
import { formatDate, STATUS_META } from '../../lib/format'

export function EmployeeDashboard() {
  const currentUserId = useAuthStore((s) => s.currentUserId)!
  const user = useDataStore((s) => s.users.find((u) => u.id === currentUserId))!
  const goals = useDataStore((s) => s.goals)
  const allAssignments = useDataStore((s) => s.assignments)
  const assignments = useMemo(
    () => allAssignments.filter((a) => a.employeeId === currentUserId),
    [allAssignments, currentUserId],
  )

  const goalById = useMemo(() => new Map(goals.map((g) => [g.id, g])), [goals])

  const enriched = useMemo(
    () => assignments.map((a) => ({ ...a, effective: effectiveStatus(a), goal: goalById.get(a.goalId) })),
    [assignments, goalById],
  )

  const total = enriched.length
  const completed = enriched.filter((a) => a.effective === 'completed').length
  const overdue = enriched.filter((a) => a.effective === 'overdue').length
  const dueSoon = enriched.filter((a) => a.effective !== 'completed' && isDueSoon(a.dueDate)).length
  const completionRate = total ? Math.round((completed / total) * 100) : 0

  const upcoming = enriched
    .filter((a) => a.effective !== 'completed')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 5)

  const recentlyCompleted = enriched
    .filter((a) => a.effective === 'completed')
    .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime())
    .slice(0, 5)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Welcome back, {user.name.split(' ')[0]}</h1>
        <p className="mt-0.5 text-sm text-text-secondary">Here&apos;s where your goals stand today</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Assigned Goals" value={total} icon={<ClipboardList size={18} />} />
        <StatTile
          label="Completion Rate"
          value={`${completionRate}%`}
          icon={<CheckCircle2 size={18} />}
          tone="success"
          hint={`${completed} of ${total} completed`}
        />
        <StatTile label="Due Within 7 Days" value={dueSoon} icon={<Clock3 size={18} />} tone="warning" />
        <StatTile label="Overdue" value={overdue} icon={<AlertTriangle size={18} />} tone="danger" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-text-primary">Upcoming Due Dates</h2>
          </CardHeader>
          <CardBody className="!px-0 !py-0">
            {upcoming.length === 0 ? (
              <EmptyState title="Nothing upcoming" description="You're all caught up on your goals." />
            ) : (
              <ul>
                {upcoming.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-3 border-b border-border/5 px-5 py-3.5 last:border-b-0">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-text-primary">{a.goal?.title}</p>
                      <div className="mt-1.5 flex items-center gap-2">
                        <ProgressBar value={a.completionPct} tone={a.effective === 'overdue' ? 'danger' : 'accent'} className="w-24" />
                        <span className="text-xs text-text-muted">{a.completionPct}%</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <Badge tone={STATUS_META[a.effective].tone}>{STATUS_META[a.effective].label}</Badge>
                      <p className="mt-1 text-xs text-text-muted">Due {formatDate(a.dueDate)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-text-primary">Recently Completed</h2>
          </CardHeader>
          <CardBody className="!px-0 !py-0">
            {recentlyCompleted.length === 0 ? (
              <EmptyState title="No completions yet" description="Completed goals will show up here." />
            ) : (
              <ul>
                {recentlyCompleted.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-3 border-b border-border/5 px-5 py-3.5 last:border-b-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-success-bg text-success-text">
                        <CheckCircle2 size={16} />
                      </span>
                      <p className="truncate text-sm font-medium text-text-primary">{a.goal?.title}</p>
                    </div>
                    <span className="shrink-0 text-xs text-text-muted">{formatDate(a.dueDate)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
