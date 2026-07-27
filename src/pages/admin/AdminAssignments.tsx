import { useMemo, useState } from 'react'
import { Plus, Search, ShieldAlert } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useDataStore, effectiveStatus } from '../../store/dataStore'
import type { AssignmentStatus, GoalPriority } from '../../types'
import { Card, CardBody } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Input, Label, Select, Textarea } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { EmptyState } from '../../components/ui/EmptyState'
import { ProgressBar } from '../../components/ui/ProgressBar'
import { formatDate, PRIORITY_META, STATUS_META, downloadCSV } from '../../lib/format'
import { Download } from 'lucide-react'

export function AdminAssignments() {
  const currentUserId = useAuthStore((s) => s.currentUserId)!
  const assignments = useDataStore((s) => s.assignments)
  const allGoals = useDataStore((s) => s.goals)
  const allUsers = useDataStore((s) => s.users)
  const goals = useMemo(() => allGoals.filter((g) => !g.archived), [allGoals])
  const users = useMemo(() => allUsers.filter((u) => u.role === 'employee'), [allUsers])
  const assignGoal = useDataStore((s) => s.assignGoal)
  const overrideAssignmentStatus = useDataStore((s) => s.overrideAssignmentStatus)

  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState<'all' | AssignmentStatus>('all')

  const [assignOpen, setAssignOpen] = useState(false)
  const [assignForm, setAssignForm] = useState<{
    goalId: string
    employeeIds: string[]
    dueDate: string
    priority: GoalPriority
    assignMode: 'individual' | 'department'
    department: string
  }>({ goalId: '', employeeIds: [], dueDate: '', priority: 'medium', assignMode: 'individual', department: '' })

  const [overrideTarget, setOverrideTarget] = useState<string | null>(null)
  const [overrideStatus, setOverrideStatus] = useState<AssignmentStatus>('in_progress')
  const [overrideReason, setOverrideReason] = useState('')

  const departments = useMemo(() => Array.from(new Set(users.map((u) => u.department))).sort(), [users])
  const goalById = useMemo(() => new Map(goals.map((g) => [g.id, g])), [goals])
  const userById = useMemo(() => new Map(users.map((u) => [u.id, u])), [users])

  const rows = useMemo(
    () =>
      assignments
        .map((a) => ({ ...a, effective: effectiveStatus(a), goal: goalById.get(a.goalId), employee: userById.get(a.employeeId) }))
        .filter((a) => a.employee)
        .filter((a) => {
          if (deptFilter !== 'all' && a.employee?.department !== deptFilter) return false
          if (statusFilter !== 'all' && a.effective !== statusFilter) return false
          if (search) {
            const q = search.toLowerCase()
            if (!a.goal?.title.toLowerCase().includes(q) && !a.employee?.name.toLowerCase().includes(q)) return false
          }
          return true
        })
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()),
    [assignments, goalById, userById, deptFilter, statusFilter, search],
  )

  function toggleEmployee(id: string) {
    setAssignForm((f) => ({
      ...f,
      employeeIds: f.employeeIds.includes(id) ? f.employeeIds.filter((e) => e !== id) : [...f.employeeIds, id],
    }))
  }

  function handleAssign() {
    let targetIds = assignForm.employeeIds
    if (assignForm.assignMode === 'department') {
      targetIds = users.filter((u) => u.department === assignForm.department).map((u) => u.id)
    }
    if (!assignForm.goalId || targetIds.length === 0 || !assignForm.dueDate) return
    assignGoal({
      goalId: assignForm.goalId,
      employeeIds: targetIds,
      assignedBy: currentUserId,
      dueDate: assignForm.dueDate,
      priority: assignForm.priority,
    })
    setAssignOpen(false)
    setAssignForm({ goalId: '', employeeIds: [], dueDate: '', priority: 'medium', assignMode: 'individual', department: '' })
  }

  function handleOverride() {
    if (!overrideTarget || !overrideReason.trim()) return
    overrideAssignmentStatus(overrideTarget, overrideStatus, overrideReason, currentUserId)
    setOverrideTarget(null)
    setOverrideReason('')
  }

  function handleExport() {
    downloadCSV(
      'goal-assignments.csv',
      rows.map((r) => ({
        goal: r.goal?.title ?? '',
        employee: r.employee?.name ?? '',
        department: r.employee?.department ?? '',
        due_date: r.dueDate,
        priority: r.priority,
        status: STATUS_META[r.effective].label,
        completion_pct: r.completionPct,
      })),
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Assignments</h1>
          <p className="mt-0.5 text-sm text-text-secondary">Assign goals and track individual progress</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleExport}>
            <Download size={16} /> Export CSV
          </Button>
          <Button onClick={() => setAssignOpen(true)}>
            <Plus size={16} /> Assign Goal
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <Input placeholder="Search goal or employee…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select className="w-auto" value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
          <option value="all">All departments</option>
          {departments.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </Select>
        <Select className="w-auto" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}>
          <option value="all">All statuses</option>
          <option value="not_started">Not Started</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="overdue">Overdue</option>
        </Select>
      </div>

      <Card>
        <CardBody className="!px-0 !py-0">
          {rows.length === 0 ? (
            <EmptyState title="No assignments match" description="Try adjusting your filters." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/10 text-left text-xs uppercase tracking-wide text-text-muted">
                    <th className="px-5 py-3 font-medium">Goal</th>
                    <th className="px-5 py-3 font-medium">Employee</th>
                    <th className="px-5 py-3 font-medium">Due Date</th>
                    <th className="px-5 py-3 font-medium">Priority</th>
                    <th className="px-5 py-3 font-medium">Progress</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-b border-border/5 last:border-b-0 hover:bg-bg-raised/50">
                      <td className="px-5 py-3 font-medium text-text-primary">{r.goal?.title}</td>
                      <td className="px-5 py-3 text-text-secondary">
                        {r.employee?.name}
                        <span className="block text-xs text-text-muted">{r.employee?.department}</span>
                      </td>
                      <td className="px-5 py-3 text-text-secondary">{formatDate(r.dueDate)}</td>
                      <td className="px-5 py-3">
                        <Badge tone={PRIORITY_META[r.priority].tone} dot={false}>
                          {PRIORITY_META[r.priority].label}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 w-36">
                        <div className="flex items-center gap-2">
                          <ProgressBar value={r.completionPct} tone={r.effective === 'overdue' ? 'danger' : 'accent'} />
                          <span className="w-8 text-xs text-text-muted">{r.completionPct}%</span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <Badge tone={STATUS_META[r.effective].tone}>{STATUS_META[r.effective].label}</Badge>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          onClick={() => {
                            setOverrideTarget(r.id)
                            setOverrideStatus(r.effective)
                            setOverrideReason('')
                          }}
                          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-text-secondary hover:bg-bg-raised hover:text-text-primary"
                        >
                          <ShieldAlert size={14} /> Override
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      <Modal
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        title="Assign Goal"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setAssignOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssign}>Assign</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="a-goal">Goal</Label>
            <Select id="a-goal" value={assignForm.goalId} onChange={(e) => setAssignForm((f) => ({ ...f, goalId: e.target.value }))}>
              <option value="">Select a goal…</option>
              {goals.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.title}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="a-due">Due date</Label>
              <Input
                id="a-due"
                type="date"
                value={assignForm.dueDate}
                onChange={(e) => setAssignForm((f) => ({ ...f, dueDate: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="a-priority">Priority</Label>
              <Select
                id="a-priority"
                value={assignForm.priority}
                onChange={(e) => setAssignForm((f) => ({ ...f, priority: e.target.value as GoalPriority }))}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </Select>
            </div>
          </div>

          <div>
            <Label>Assign to</Label>
            <div className="mb-2 flex rounded-lg border border-border/20 p-0.5 w-fit">
              <button
                onClick={() => setAssignForm((f) => ({ ...f, assignMode: 'individual' }))}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${assignForm.assignMode === 'individual' ? 'bg-accent text-white' : 'text-text-secondary hover:text-text-primary'}`}
              >
                Individuals
              </button>
              <button
                onClick={() => setAssignForm((f) => ({ ...f, assignMode: 'department' }))}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${assignForm.assignMode === 'department' ? 'bg-accent text-white' : 'text-text-secondary hover:text-text-primary'}`}
              >
                Department (bulk)
              </button>
            </div>

            {assignForm.assignMode === 'department' ? (
              <Select
                value={assignForm.department}
                onChange={(e) => setAssignForm((f) => ({ ...f, department: e.target.value }))}
              >
                <option value="">Select a department…</option>
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d} ({users.filter((u) => u.department === d).length})
                  </option>
                ))}
              </Select>
            ) : (
              <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-border/15 p-2">
                {users.map((u) => (
                  <label
                    key={u.id}
                    className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm hover:bg-bg-raised cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={assignForm.employeeIds.includes(u.id)}
                      onChange={() => toggleEmployee(u.id)}
                      className="accent-accent"
                    />
                    <span className="text-text-primary">{u.name}</span>
                    <span className="text-xs text-text-muted">{u.department}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>

      <Modal
        open={overrideTarget !== null}
        onClose={() => setOverrideTarget(null)}
        title="Override Status"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOverrideTarget(null)}>
              Cancel
            </Button>
            <Button onClick={handleOverride} disabled={!overrideReason.trim()}>
              Save override
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            Manual overrides are logged to the assignment&apos;s progress history for auditability.
          </p>
          <div>
            <Label htmlFor="o-status">New status</Label>
            <Select id="o-status" value={overrideStatus} onChange={(e) => setOverrideStatus(e.target.value as AssignmentStatus)}>
              <option value="not_started">Not Started</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="overdue">Overdue</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="o-reason">Reason (required)</Label>
            <Textarea
              id="o-reason"
              rows={3}
              placeholder="Why is this being overridden?"
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}
