import { useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { AlertTriangle, CheckCircle2, ClipboardList, Clock3 } from 'lucide-react'
import { useDataStore, effectiveStatus, isDueSoon } from '../../store/dataStore'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { StatTile } from '../../components/ui/StatTile'
import { Badge } from '../../components/ui/Badge'
import { EmptyState } from '../../components/ui/EmptyState'
import { formatDate, STATUS_META } from '../../lib/format'
import type { AssignmentStatus } from '../../types'

const STATUS_COLORS: Record<AssignmentStatus, string> = {
  not_started: '#8f9bb3',
  in_progress: '#D98B3F',
  completed: '#3FA97A',
  overdue: '#BF4B4B',
}

export function AdminDashboard() {
  const company = useDataStore((s) => s.company)
  const assignments = useDataStore((s) => s.assignments)
  const goals = useDataStore((s) => s.goals)
  const users = useDataStore((s) => s.users)

  const [deptFilter, setDeptFilter] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<AssignmentStatus | null>(null)

  const goalById = useMemo(() => new Map(goals.map((g) => [g.id, g])), [goals])
  const userById = useMemo(() => new Map(users.map((u) => [u.id, u])), [users])

  const enriched = useMemo(
    () =>
      assignments.map((a) => ({
        ...a,
        effective: effectiveStatus(a),
        goal: goalById.get(a.goalId),
        employee: userById.get(a.employeeId),
      })),
    [assignments, goalById, userById],
  )

  const total = enriched.length
  const completed = enriched.filter((a) => a.effective === 'completed').length
  const overdue = enriched.filter((a) => a.effective === 'overdue').length
  const dueSoon = enriched.filter((a) => a.effective !== 'completed' && isDueSoon(a.dueDate)).length
  const completionRate = total ? Math.round((completed / total) * 100) : 0

  const statusBreakdown: { status: AssignmentStatus; count: number }[] = (
    ['not_started', 'in_progress', 'completed', 'overdue'] as AssignmentStatus[]
  ).map((status) => ({
    status,
    count: enriched.filter((a) => a.effective === status).length,
  }))

  const departments = useMemo(() => Array.from(new Set(users.map((u) => u.department))).sort(), [users])
  const byDepartment = departments.map((dept) => {
    const rows = enriched.filter((a) => a.employee?.department === dept)
    return {
      department: dept,
      not_started: rows.filter((a) => a.effective === 'not_started').length,
      in_progress: rows.filter((a) => a.effective === 'in_progress').length,
      completed: rows.filter((a) => a.effective === 'completed').length,
      overdue: rows.filter((a) => a.effective === 'overdue').length,
    }
  })

  const atRisk = enriched
    .filter((a) => a.effective === 'overdue' || (a.effective !== 'completed' && isDueSoon(a.dueDate)))
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())

  const filtered = enriched.filter((a) => {
    if (deptFilter && a.employee?.department !== deptFilter) return false
    if (statusFilter && a.effective !== statusFilter) return false
    return true
  })

  const showFiltered = deptFilter !== null || statusFilter !== null

  return (
    <div className="space-y-6">
      <div>
        {company && (
          <p className="text-xs font-bold uppercase tracking-wide text-text-muted">{company.name}</p>
        )}
        <h1 className="text-xl font-semibold text-text-primary">Dashboard</h1>
        <p className="mt-0.5 text-sm text-text-secondary">Organization-wide goal &amp; certification progress</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Total Assignments" value={total} icon={<ClipboardList size={18} />} />
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

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader>
            <h2 className="text-sm font-semibold text-text-primary">Completion Breakdown</h2>
          </CardHeader>
          <CardBody>
            <div className="flex items-center gap-6">
              <div className="h-44 w-44 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusBreakdown}
                      dataKey="count"
                      nameKey="status"
                      innerRadius={48}
                      outerRadius={72}
                      paddingAngle={2}
                      onClick={((d: { status?: AssignmentStatus }) =>
                        setStatusFilter((prev) => (d.status && prev === d.status ? null : d.status ?? null))) as never}
                    >
                      {statusBreakdown.map((entry) => (
                        <Cell
                          key={entry.status}
                          fill={STATUS_COLORS[entry.status]}
                          className="cursor-pointer"
                          opacity={statusFilter && statusFilter !== entry.status ? 0.35 : 1}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={((value: number, name: AssignmentStatus) => [value, STATUS_META[name].label]) as never}
                      contentStyle={{
                        background: 'rgb(var(--color-bg-elevated))',
                        border: '1px solid rgb(var(--color-border) / 0.15)',
                        borderRadius: 8,
                        fontSize: 12,
                        color: 'rgb(var(--color-text-primary))',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2">
                {statusBreakdown.map(({ status, count }) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter((prev) => (prev === status ? null : status))}
                    className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-bg-raised"
                  >
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: STATUS_COLORS[status] }} />
                      <span className="text-sm text-text-secondary">{STATUS_META[status].label}</span>
                    </span>
                    <span className="text-sm font-medium text-text-primary">{count}</span>
                  </button>
                ))}
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <h2 className="text-sm font-semibold text-text-primary">Goals by Department</h2>
            <span className="text-xs text-text-muted">Click a bar to filter the list below</span>
          </CardHeader>
          <CardBody>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byDepartment} barSize={22}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--color-border) / 0.12)" vertical={false} />
                  <XAxis
                    dataKey="department"
                    tick={{ fill: 'rgb(var(--color-text-secondary))', fontSize: 11 }}
                    axisLine={{ stroke: 'rgb(var(--color-border) / 0.15)' }}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: 'rgb(var(--color-text-secondary))', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgb(var(--color-border) / 0.06)' }}
                    contentStyle={{
                      background: 'rgb(var(--color-bg-elevated))',
                      border: '1px solid rgb(var(--color-border) / 0.15)',
                      borderRadius: 8,
                      fontSize: 12,
                      color: 'rgb(var(--color-text-primary))',
                    }}
                  />
                  {(['not_started', 'in_progress', 'completed', 'overdue'] as AssignmentStatus[]).map((status, i) => (
                    <Bar
                      key={status}
                      dataKey={status}
                      stackId="a"
                      fill={STATUS_COLORS[status]}
                      radius={i === 3 ? [4, 4, 0, 0] : undefined}
                      onClick={((d: { department?: string }) =>
                        setDeptFilter((prev) => (d.department && prev === d.department ? null : d.department ?? null))) as never}
                      className="cursor-pointer"
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-text-primary">
            {showFiltered ? 'Filtered Goals' : 'Overdue & At-Risk Goals'}
          </h2>
          {showFiltered ? (
            <button
              onClick={() => {
                setDeptFilter(null)
                setStatusFilter(null)
              }}
              className="text-xs text-accent-text hover:underline"
            >
              Clear filters
            </button>
          ) : (
            <span className="text-xs text-text-muted">Overdue, plus due within 7 days</span>
          )}
        </CardHeader>
        <CardBody className="!px-0 !py-0">
          <GoalTable rows={showFiltered ? filtered : atRisk} />
        </CardBody>
      </Card>
    </div>
  )
}

function GoalTable({
  rows,
}: {
  rows: {
    id: string
    dueDate: string
    priority: string
    effective: AssignmentStatus
    goal?: { title: string; category: string }
    employee?: { name: string; department: string }
  }[]
}) {
  if (rows.length === 0) {
    return <EmptyState title="Nothing here" description="No goals match the current view." />
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/10 text-left text-xs uppercase tracking-wide text-text-muted">
            <th className="px-5 py-3 font-medium">Goal</th>
            <th className="px-5 py-3 font-medium">Employee</th>
            <th className="px-5 py-3 font-medium">Department</th>
            <th className="px-5 py-3 font-medium">Due Date</th>
            <th className="px-5 py-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-border/5 last:border-b-0 hover:bg-bg-raised/50">
              <td className="px-5 py-3 text-text-primary font-medium">{r.goal?.title ?? '—'}</td>
              <td className="px-5 py-3 text-text-secondary">{r.employee?.name ?? '—'}</td>
              <td className="px-5 py-3 text-text-secondary">{r.employee?.department ?? '—'}</td>
              <td className="px-5 py-3 text-text-secondary">{formatDate(r.dueDate)}</td>
              <td className="px-5 py-3">
                <Badge tone={STATUS_META[r.effective].tone}>{STATUS_META[r.effective].label}</Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
