import { useMemo, useState } from 'react'
import { CheckCircle2, ExternalLink, ShieldAlert } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useDataStore } from '../../store/dataStore'
import { Card, CardBody } from '../../components/ui/Card'
import { Select } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import { EmptyState } from '../../components/ui/EmptyState'
import { formatDate, STATUS_META } from '../../lib/format'

export function EmployeeHistory() {
  const currentUserId = useAuthStore((s) => s.currentUserId)!
  const goals = useDataStore((s) => s.goals)
  const allAssignments = useDataStore((s) => s.assignments)
  const assignments = useMemo(
    () => allAssignments.filter((a) => a.employeeId === currentUserId),
    [allAssignments, currentUserId],
  )
  const progressUpdates = useDataStore((s) => s.progressUpdates)
  const users = useDataStore((s) => s.users)

  const [goalFilter, setGoalFilter] = useState('all')

  const goalById = useMemo(() => new Map(goals.map((g) => [g.id, g])), [goals])
  const userById = useMemo(() => new Map(users.map((u) => [u.id, u])), [users])
  const assignmentIds = new Set(assignments.map((a) => a.id))

  const history = progressUpdates
    .filter((p) => assignmentIds.has(p.assignmentId))
    .filter((p) => (goalFilter === 'all' ? true : assignments.find((a) => a.id === p.assignmentId)?.goalId === goalFilter))
    .map((p) => {
      const assignment = assignments.find((a) => a.id === p.assignmentId)
      return { ...p, goal: assignment ? goalById.get(assignment.goalId) : undefined }
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Progress History</h1>
          <p className="mt-0.5 text-sm text-text-secondary">A full audit trail of your updates, per goal</p>
        </div>
        <Select className="w-auto" value={goalFilter} onChange={(e) => setGoalFilter(e.target.value)}>
          <option value="all">All goals</option>
          {assignments.map((a) => (
            <option key={a.goalId} value={a.goalId}>
              {goalById.get(a.goalId)?.title}
            </option>
          ))}
        </Select>
      </div>

      <Card>
        <CardBody className="!px-0 !py-0">
          {history.length === 0 ? (
            <EmptyState title="No history yet" description="Progress updates you submit will appear here." />
          ) : (
            <ul>
              {history.map((h) => (
                <li key={h.id} className="flex gap-3 border-b border-border/5 px-5 py-4 last:border-b-0">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-bg-raised text-text-secondary">
                    {h.isOverride ? <ShieldAlert size={15} className="text-warning-text" /> : <CheckCircle2 size={15} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-text-primary">{h.goal?.title ?? 'Unknown goal'}</p>
                      <Badge tone={STATUS_META[h.status].tone}>{STATUS_META[h.status].label}</Badge>
                      {h.isOverride && <Badge tone="warning" dot={false}>Admin override</Badge>}
                    </div>
                    {h.note && <p className="mt-1 text-sm text-text-secondary">{h.note}</p>}
                    {h.overrideReason && <p className="mt-1 text-sm italic text-text-muted">Reason: {h.overrideReason}</p>}
                    {h.evidenceUrl && (
                      <p className="mt-1.5 flex items-center gap-1 text-xs text-accent-text">
                        <ExternalLink size={12} /> {h.evidenceUrl}
                      </p>
                    )}
                    <p className="mt-1.5 text-xs text-text-muted">
                      {formatDate(h.createdAt)} · {userById.get(h.updatedBy)?.name ?? 'Unknown'} · {h.completionPct}% complete
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  )
}
