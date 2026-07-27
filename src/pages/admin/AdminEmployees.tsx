import { useMemo, useState } from 'react'
import { Download, Pencil, Plus, Power, Search } from 'lucide-react'
import { useDataStore } from '../../store/dataStore'
import type { Role, User } from '../../types'
import { Card, CardBody } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Avatar } from '../../components/ui/Avatar'
import { Input, Label, Select } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { EmptyState } from '../../components/ui/EmptyState'
import { downloadCSV } from '../../lib/format'

const AVATAR_COLORS = ['#D98B3F', '#3FA97A', '#5B8FD9', '#9B6FD9', '#D96F9B', '#4FB0C6', '#C6A54F', '#6FD9B0']

const emptyForm = { name: '', email: '', department: '', role: 'employee' as Role, managerId: '' }

export function AdminEmployees() {
  const users = useDataStore((s) => s.users)
  const addEmployee = useDataStore((s) => s.addEmployee)
  const updateEmployee = useDataStore((s) => s.updateEmployee)
  const toggleEmployeeStatus = useDataStore((s) => s.toggleEmployeeStatus)

  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)

  const departments = useMemo(() => Array.from(new Set(users.map((u) => u.department))).sort(), [users])
  const managers = users.filter((u) => u.role === 'admin')
  const userById = useMemo(() => new Map(users.map((u) => [u.id, u])), [users])

  const filtered = users.filter((u) => {
    if (deptFilter !== 'all' && u.department !== deptFilter) return false
    if (search) {
      const q = search.toLowerCase()
      if (!u.name.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) return false
    }
    return true
  })

  function openCreate() {
    setEditingId(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  function openEdit(u: User) {
    setEditingId(u.id)
    setForm({ name: u.name, email: u.email, department: u.department, role: u.role, managerId: u.managerId ?? '' })
    setModalOpen(true)
  }

  function handleSave() {
    if (!form.name.trim() || !form.email.trim() || !form.department.trim()) return
    const payload = {
      name: form.name,
      email: form.email,
      department: form.department,
      role: form.role,
      managerId: form.managerId || null,
    }
    if (editingId) {
      updateEmployee(editingId, payload)
    } else {
      addEmployee({ ...payload, avatarColor: AVATAR_COLORS[users.length % AVATAR_COLORS.length] })
    }
    setModalOpen(false)
  }

  function handleExport() {
    downloadCSV(
      'employees.csv',
      filtered.map((u) => ({
        name: u.name,
        email: u.email,
        role: u.role,
        department: u.department,
        manager: u.managerId ? (userById.get(u.managerId)?.name ?? '') : '',
        status: u.status,
      })),
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Employees</h1>
          <p className="mt-0.5 text-sm text-text-secondary">Manage accounts, departments, and reporting lines</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleExport}>
            <Download size={16} /> Export CSV
          </Button>
          <Button onClick={openCreate}>
            <Plus size={16} /> Add Employee
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <Input placeholder="Search name or email…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select className="w-auto" value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
          <option value="all">All departments</option>
          {departments.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </Select>
      </div>

      <Card>
        <CardBody className="!px-0 !py-0">
          {filtered.length === 0 ? (
            <EmptyState title="No employees match" description="Try adjusting your search or filters." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/10 text-left text-xs uppercase tracking-wide text-text-muted">
                    <th className="px-5 py-3 font-medium">Name</th>
                    <th className="px-5 py-3 font-medium">Role</th>
                    <th className="px-5 py-3 font-medium">Department</th>
                    <th className="px-5 py-3 font-medium">Manager</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u) => (
                    <tr key={u.id} className="border-b border-border/5 last:border-b-0 hover:bg-bg-raised/50">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={u.name} color={u.avatarColor} size={30} />
                          <div>
                            <p className="font-medium text-text-primary">{u.name}</p>
                            <p className="text-xs text-text-muted">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <Badge tone={u.role === 'admin' ? 'accent' : 'neutral'} dot={false}>
                          {u.role === 'admin' ? 'Admin' : 'Employee'}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-text-secondary">{u.department}</td>
                      <td className="px-5 py-3 text-text-secondary">{u.managerId ? userById.get(u.managerId)?.name : '—'}</td>
                      <td className="px-5 py-3">
                        <Badge tone={u.status === 'active' ? 'success' : 'neutral'}>
                          {u.status === 'active' ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEdit(u)}
                            className="rounded-lg p-1.5 text-text-muted hover:bg-bg-raised hover:text-text-primary"
                            aria-label="Edit employee"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => toggleEmployeeStatus(u.id)}
                            className="rounded-lg p-1.5 text-text-muted hover:bg-bg-raised hover:text-text-primary"
                            aria-label={u.status === 'active' ? 'Deactivate' : 'Activate'}
                          >
                            <Power size={15} />
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
        title={editingId ? 'Edit Employee' : 'Add Employee'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>{editingId ? 'Save changes' : 'Add employee'}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="e-name">Full name</Label>
            <Input id="e-name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <Label htmlFor="e-email">Work email</Label>
            <Input
              id="e-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="e-dept">Department</Label>
              <Input id="e-dept" value={form.department} onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="e-role">Role</Label>
              <Select id="e-role" value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as Role }))}>
                <option value="employee">Employee</option>
                <option value="admin">Admin</option>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="e-manager">Manager</Label>
            <Select id="e-manager" value={form.managerId} onChange={(e) => setForm((f) => ({ ...f, managerId: e.target.value }))}>
              <option value="">No manager</option>
              {managers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </Modal>
    </div>
  )
}
