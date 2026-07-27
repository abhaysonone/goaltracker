import { useMemo, useState } from 'react'
import { Filter, Paperclip, Search, UploadCloud } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useDataStore, effectiveStatus } from '../../store/dataStore'
import type { AssignmentStatus } from '../../types'
import { Card, CardBody } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Input, Label, Select, Textarea } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { ProgressBar } from '../../components/ui/ProgressBar'
import { EmptyState } from '../../components/ui/EmptyState'
import { formatDate, PRIORITY_META, STATUS_META } from '../../lib/format'

export function EmployeeGoals() {
  const currentUserId = useAuthStore((s) => s.currentUserId)!
  const goals = useDataStore((s) => s.goals)
  const allAssignments = useDataStore((s) => s.assignments)
  const assignments = useMemo(
    () => allAssignments.filter((a) => a.employeeId === currentUserId),
    [allAssignments, currentUserId],
  )
  const addProgressUpdate = useDataStore((s) => s.addProgressUpdate)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | AssignmentStatus>('all')
  const [activeId, setActiveId] = useState<string | null>(null)

  const [status, setStatus] = useState<AssignmentStatus>('in_progress')
  const [pct, setPct] = useState(0)
  const [note, setNote] = useState('')
  const [evidenceMode, setEvidenceMode] = useState<'file' | 'link'>('link')
  const [evidenceLink, setEvidenceLink] = useState('')
  const [evidenceFileName, setEvidenceFileName] = useState('')

  const goalById = useMemo(() => new Map(goals.map((g) => [g.id, g])), [goals])

  const enriched = useMemo(
    () => assignments.map((a) => ({ ...a, effective: effectiveStatus(a), goal: goalById.get(a.goalId) })),
    [assignments, goalById],
  )

  const filtered = enriched
    .filter((a) => (statusFilter === 'all' ? true : a.effective === statusFilter))
    .filter((a) => (search ? a.goal?.title.toLowerCase().includes(search.toLowerCase()) : true))
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())

  const active = enriched.find((a) => a.id === activeId)

  function openUpdate(id: string) {
    const a = enriched.find((x) => x.id === id)
    if (!a) return
    setActiveId(id)
    setStatus(a.effective === 'overdue' ? 'in_progress' : a.effective)
    setPct(a.completionPct)
    setNote('')
    setEvidenceMode(a.goal?.evidenceType === 'file' ? 'file' : 'link')
    setEvidenceLink('')
    setEvidenceFileName('')
  }

  function handleSubmit() {
    if (!active) return
    const requiresEvidence = status === 'completed'
    const evidenceUrl = evidenceMode === 'file' ? (evidenceFileName || null) : (evidenceLink.trim() || null)
    if (requiresEvidence && active.goal?.evidenceType !== undefined && !evidenceUrl) return

    addProgressUpdate({
      assignmentId: active.id,
      updatedBy: currentUserId,
      status,
      completionPct: status === 'completed' ? 100 : pct,
      note,
      evidenceUrl,
    })
    setActiveId(null)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">My Goals</h1>
        <p className="mt-0.5 text-sm text-text-secondary">Update your progress and submit completion evidence</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <Input placeholder="Search goals…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-text-muted" />
          <Select className="w-auto" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}>
            <option value="all">All statuses</option>
            <option value="not_started">Not Started</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="overdue">Overdue</option>
          </Select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState title="No goals match" description="Try a different search or status filter." />
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((a) => (
            <Card key={a.id} className="flex flex-col">
              <CardBody className="flex-1">
                <div className="flex items-start justify-between gap-2">
                  <Badge tone={a.goal?.type === 'certification' ? 'accent' : 'neutral'} dot={false}>
                    {a.goal?.type === 'certification' ? 'Certification' : 'Training'}
                  </Badge>
                  <Badge tone={PRIORITY_META[a.priority].tone} dot={false}>
                    {PRIORITY_META[a.priority].label}
                  </Badge>
                </div>
                <h3 className="mt-3 text-sm font-semibold text-text-primary">{a.goal?.title}</h3>
                <p className="mt-1 text-xs text-text-muted line-clamp-2">{a.goal?.description}</p>

                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-text-muted">
                    <span>Progress</span>
                    <span>{a.completionPct}%</span>
                  </div>
                  <ProgressBar value={a.completionPct} tone={a.effective === 'overdue' ? 'danger' : 'accent'} className="mt-1" />
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <Badge tone={STATUS_META[a.effective].tone}>{STATUS_META[a.effective].label}</Badge>
                  <span className="text-xs text-text-muted">Due {formatDate(a.dueDate)}</span>
                </div>
              </CardBody>
              <div className="border-t border-border/10 p-3">
                <Button variant="secondary" size="sm" className="w-full" onClick={() => openUpdate(a.id)}>
                  Update progress
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={active !== undefined}
        onClose={() => setActiveId(null)}
        title={active?.goal?.title ?? 'Update Progress'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setActiveId(null)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>Save update</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="u-status">Status</Label>
              <Select id="u-status" value={status} onChange={(e) => setStatus(e.target.value as AssignmentStatus)}>
                <option value="not_started">Not Started</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="u-pct">Completion %</Label>
              <Input
                id="u-pct"
                type="number"
                min={0}
                max={100}
                value={status === 'completed' ? 100 : pct}
                disabled={status === 'completed'}
                onChange={(e) => setPct(Math.max(0, Math.min(100, Number(e.target.value))))}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="u-note">Milestone note</Label>
            <Textarea
              id="u-note"
              rows={3}
              placeholder="What did you complete or learn?"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          {status === 'completed' && (
            <div>
              <Label>Completion evidence {active?.goal?.evidenceType === 'file' ? '(file required)' : active?.goal?.evidenceType === 'link' ? '(link required)' : '(file or link)'}</Label>
              {active?.goal?.evidenceType === 'either' && (
                <div className="mb-2 flex rounded-lg border border-border/20 p-0.5 w-fit">
                  <button
                    onClick={() => setEvidenceMode('link')}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${evidenceMode === 'link' ? 'bg-accent text-white' : 'text-text-secondary hover:text-text-primary'}`}
                  >
                    Link
                  </button>
                  <button
                    onClick={() => setEvidenceMode('file')}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${evidenceMode === 'file' ? 'bg-accent text-white' : 'text-text-secondary hover:text-text-primary'}`}
                  >
                    File
                  </button>
                </div>
              )}
              {(active?.goal?.evidenceType === 'file' ? true : active?.goal?.evidenceType === 'link' ? false : evidenceMode === 'file') ? (
                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-border/30 px-4 py-4 text-sm text-text-secondary hover:bg-bg-raised">
                  <UploadCloud size={18} className="text-text-muted" />
                  <span className="flex-1 truncate">{evidenceFileName || 'Click to upload certificate file'}</span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => setEvidenceFileName(e.target.files?.[0]?.name ?? '')}
                  />
                </label>
              ) : (
                <div className="relative">
                  <Paperclip size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                  <Input
                    className="pl-9"
                    placeholder="https://…"
                    value={evidenceLink}
                    onChange={(e) => setEvidenceLink(e.target.value)}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}
