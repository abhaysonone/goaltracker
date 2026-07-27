import { useMemo, useState } from 'react'
import { Archive, ArchiveRestore, Pencil, Plus, Search } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useDataStore } from '../../store/dataStore'
import type { EvidenceType, Goal, GoalType } from '../../types'
import { Card, CardBody } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Input, Label, Select, Textarea } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { EmptyState } from '../../components/ui/EmptyState'
import { formatDate } from '../../lib/format'

const EVIDENCE_LABEL: Record<EvidenceType, string> = {
  file: 'File upload',
  link: 'External link',
  either: 'File or link',
}

const emptyForm = {
  title: '',
  description: '',
  type: 'training' as GoalType,
  category: '',
  evidenceType: 'either' as EvidenceType,
}

export function AdminGoals() {
  const currentUserId = useAuthStore((s) => s.currentUserId)!
  const goals = useDataStore((s) => s.goals)
  const assignments = useDataStore((s) => s.assignments)
  const createGoal = useDataStore((s) => s.createGoal)
  const updateGoal = useDataStore((s) => s.updateGoal)
  const archiveGoal = useDataStore((s) => s.archiveGoal)

  const [search, setSearch] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)

  const assignmentCounts = useMemo(() => {
    const map = new Map<string, number>()
    for (const a of assignments) map.set(a.goalId, (map.get(a.goalId) ?? 0) + 1)
    return map
  }, [assignments])

  const filtered = goals.filter((g) => {
    if (g.archived !== showArchived) return false
    if (search && !g.title.toLowerCase().includes(search.toLowerCase()) && !g.category.toLowerCase().includes(search.toLowerCase())) {
      return false
    }
    return true
  })

  function openCreate() {
    setEditingId(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  function openEdit(goal: Goal) {
    setEditingId(goal.id)
    setForm({
      title: goal.title,
      description: goal.description,
      type: goal.type,
      category: goal.category,
      evidenceType: goal.evidenceType,
    })
    setModalOpen(true)
  }

  function handleSave() {
    if (!form.title.trim() || !form.category.trim()) return
    if (editingId) {
      updateGoal(editingId, form)
    } else {
      createGoal({ ...form, createdBy: currentUserId })
    }
    setModalOpen(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Goals</h1>
          <p className="mt-0.5 text-sm text-text-secondary">Master catalog of training and certification goals</p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} /> New Goal
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <Input
            placeholder="Search by title or category…"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex rounded-lg border border-border/20 p-0.5">
          <button
            onClick={() => setShowArchived(false)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${!showArchived ? 'bg-accent text-white' : 'text-text-secondary hover:text-text-primary'}`}
          >
            Active
          </button>
          <button
            onClick={() => setShowArchived(true)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${showArchived ? 'bg-accent text-white' : 'text-text-secondary hover:text-text-primary'}`}
          >
            Archived
          </button>
        </div>
      </div>

      <Card>
        <CardBody className="!px-0 !py-0">
          {filtered.length === 0 ? (
            <EmptyState
              title={showArchived ? 'No archived goals' : 'No goals yet'}
              description={showArchived ? undefined : 'Create your first training or certification goal.'}
              action={!showArchived ? <Button onClick={openCreate}>New Goal</Button> : undefined}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/10 text-left text-xs uppercase tracking-wide text-text-muted">
                    <th className="px-5 py-3 font-medium">Goal</th>
                    <th className="px-5 py-3 font-medium">Type</th>
                    <th className="px-5 py-3 font-medium">Category</th>
                    <th className="px-5 py-3 font-medium">Evidence</th>
                    <th className="px-5 py-3 font-medium">Assigned</th>
                    <th className="px-5 py-3 font-medium">Created</th>
                    <th className="px-5 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((g) => (
                    <tr key={g.id} className="border-b border-border/5 last:border-b-0 hover:bg-bg-raised/50">
                      <td className="px-5 py-3">
                        <p className="font-medium text-text-primary">{g.title}</p>
                        <p className="mt-0.5 max-w-xs truncate text-xs text-text-muted">{g.description}</p>
                      </td>
                      <td className="px-5 py-3">
                        <Badge tone={g.type === 'certification' ? 'accent' : 'neutral'} dot={false}>
                          {g.type === 'certification' ? 'Certification' : 'Training'}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-text-secondary">{g.category}</td>
                      <td className="px-5 py-3 text-text-secondary">{EVIDENCE_LABEL[g.evidenceType]}</td>
                      <td className="px-5 py-3 text-text-secondary">{assignmentCounts.get(g.id) ?? 0}</td>
                      <td className="px-5 py-3 text-text-secondary">{formatDate(g.createdAt)}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEdit(g)}
                            className="rounded-lg p-1.5 text-text-muted hover:bg-bg-raised hover:text-text-primary"
                            aria-label="Edit goal"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => archiveGoal(g.id, !g.archived)}
                            className="rounded-lg p-1.5 text-text-muted hover:bg-bg-raised hover:text-text-primary"
                            aria-label={g.archived ? 'Restore goal' : 'Archive goal'}
                          >
                            {g.archived ? <ArchiveRestore size={15} /> : <Archive size={15} />}
                          </button>
                        </div>
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
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Edit Goal' : 'New Goal'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>{editingId ? 'Save changes' : 'Create goal'}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="g-title">Title</Label>
            <Input
              id="g-title"
              placeholder="e.g. AWS Certified Solutions Architect"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="g-desc">Description</Label>
            <Textarea
              id="g-desc"
              rows={3}
              placeholder="What does this goal cover?"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="g-type">Type</Label>
              <Select
                id="g-type"
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as GoalType }))}
              >
                <option value="training">Training</option>
                <option value="certification">Certification</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="g-category">Category</Label>
              <Input
                id="g-category"
                placeholder="e.g. Engineering"
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="g-evidence">Required evidence type</Label>
            <Select
              id="g-evidence"
              value={form.evidenceType}
              onChange={(e) => setForm((f) => ({ ...f, evidenceType: e.target.value as EvidenceType }))}
            >
              <option value="file">File upload</option>
              <option value="link">External link</option>
              <option value="either">File or link</option>
            </Select>
          </div>
        </div>
      </Modal>
    </div>
  )
}
