import { create } from 'zustand'
import { supabase } from '../lib/supabaseClient'
import type {
  AssignmentStatus,
  Goal,
  GoalAssignment,
  GoalPriority,
  Notification,
  ProgressUpdate,
  Role,
  User,
} from '../types'
import type { Tables } from '../types/supabase'

export function isPastDue(dueDate: string): boolean {
  return new Date(dueDate) < new Date()
}

export function isDueSoon(dueDate: string, withinDays = 7): boolean {
  const due = new Date(dueDate)
  const diffMs = due.getTime() - Date.now()
  const diffDays = diffMs / (1000 * 60 * 60 * 24)
  return diffDays >= 0 && diffDays <= withinDays
}

/** Effective display status: an unmarked-complete assignment past its due date reads as overdue. */
export function effectiveStatus(a: GoalAssignment): AssignmentStatus {
  if (a.status === 'completed') return 'completed'
  if (a.status === 'overdue' || isPastDue(a.dueDate)) return 'overdue'
  return a.status
}

function mapUser(row: Tables<'profiles'>): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    department: row.department,
    managerId: row.manager_id,
    status: row.status,
    avatarColor: row.avatar_color,
    companyId: row.company_id,
  }
}

function mapGoal(row: Tables<'goals'>): Goal {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    type: row.type,
    category: row.category,
    createdBy: row.created_by,
    evidenceType: row.evidence_type,
    createdAt: row.created_at,
    archived: row.archived,
  }
}

function mapAssignment(row: Tables<'goal_assignments'>): GoalAssignment {
  return {
    id: row.id,
    goalId: row.goal_id,
    employeeId: row.employee_id,
    assignedBy: row.assigned_by,
    assignedAt: row.assigned_at,
    dueDate: row.due_date,
    status: row.status,
    priority: row.priority,
    completionPct: row.completion_pct,
  }
}

function mapProgressUpdate(row: Tables<'progress_updates'>): ProgressUpdate {
  return {
    id: row.id,
    assignmentId: row.assignment_id,
    updatedBy: row.updated_by,
    status: row.status,
    completionPct: row.completion_pct,
    note: row.note,
    evidenceUrl: row.evidence_url,
    isOverride: row.is_override,
    overrideReason: row.override_reason,
    createdAt: row.created_at,
  }
}

function mapNotification(row: Tables<'notifications'>): Notification {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    message: row.message,
    readAt: row.read_at,
    createdAt: row.created_at,
  }
}

// company_id is NOT NULL with no default — the insert triggers always overwrite it
// with the server-derived value regardless, but the client still has to send
// *something* to satisfy the column. Send the real value we already have locally
// so a lookup miss surfaces immediately as an error rather than silently relying on
// the trigger to paper over a bad id.
function companyIdOf(users: User[], userId: string): string {
  const companyId = users.find((u) => u.id === userId)?.companyId
  if (!companyId) throw new Error(`No company_id found for user ${userId}`)
  return companyId
}

interface DataState {
  users: User[]
  goals: Goal[]
  assignments: GoalAssignment[]
  progressUpdates: ProgressUpdate[]
  notifications: Notification[]
  loaded: boolean

  // Loads/reloads everything from Supabase. Called once after login, and again
  // after every mutation below so local state always reflects trigger-derived
  // changes (assignment sync, auto-notifications) the client doesn't compute itself.
  fetchAll: () => Promise<void>
  reset: () => void

  // Goals (Admin)
  createGoal: (goal: Omit<Goal, 'id' | 'createdAt' | 'archived'>) => Promise<void>
  updateGoal: (id: string, patch: Partial<Omit<Goal, 'id'>>) => Promise<void>
  archiveGoal: (id: string, archived: boolean) => Promise<void>

  // Assignments (Admin)
  assignGoal: (input: {
    goalId: string
    employeeIds: string[]
    assignedBy: string
    dueDate: string
    priority: GoalPriority
  }) => Promise<void>
  overrideAssignmentStatus: (
    assignmentId: string,
    status: AssignmentStatus,
    reason: string,
    updatedBy: string,
  ) => Promise<void>

  // Employees (Admin)
  // company_id is never client-supplied: new hires join the calling admin's own
  // company server-side (see admin-create-employee), and it's not reassignable after.
  addEmployee: (user: Omit<User, 'id' | 'status' | 'companyId'>) => Promise<void>
  updateEmployee: (id: string, patch: Partial<Omit<User, 'id' | 'companyId'>>) => Promise<void>
  toggleEmployeeStatus: (id: string) => Promise<void>

  // Progress (Employee)
  addProgressUpdate: (input: {
    assignmentId: string
    updatedBy: string
    status: AssignmentStatus
    completionPct: number
    note: string
    evidenceUrl: string | null
  }) => Promise<void>

  // Notifications
  markNotificationRead: (id: string) => Promise<void>
  markAllNotificationsRead: (userId: string) => Promise<void>
}

export const useDataStore = create<DataState>((set, get) => ({
  users: [],
  goals: [],
  assignments: [],
  progressUpdates: [],
  notifications: [],
  loaded: false,

  fetchAll: async () => {
    const [profilesRes, goalsRes, assignmentsRes, progressRes, notificationsRes] = await Promise.all([
      supabase.from('profiles').select('*'),
      supabase.from('goals').select('*').order('created_at', { ascending: false }),
      supabase.from('goal_assignments').select('*'),
      supabase.from('progress_updates').select('*').order('created_at', { ascending: false }),
      supabase.from('notifications').select('*').order('created_at', { ascending: false }),
    ])
    for (const res of [profilesRes, goalsRes, assignmentsRes, progressRes, notificationsRes]) {
      if (res.error) throw res.error
    }
    set({
      users: (profilesRes.data ?? []).map(mapUser),
      goals: (goalsRes.data ?? []).map(mapGoal),
      assignments: (assignmentsRes.data ?? []).map(mapAssignment),
      progressUpdates: (progressRes.data ?? []).map(mapProgressUpdate),
      notifications: (notificationsRes.data ?? []).map(mapNotification),
      loaded: true,
    })
  },

  reset: () => {
    set({ users: [], goals: [], assignments: [], progressUpdates: [], notifications: [], loaded: false })
  },

  createGoal: async (goal) => {
    const { error } = await supabase.from('goals').insert({
      title: goal.title,
      description: goal.description,
      type: goal.type,
      category: goal.category,
      created_by: goal.createdBy,
      evidence_type: goal.evidenceType,
      company_id: companyIdOf(get().users, goal.createdBy),
    })
    if (error) throw error
    await get().fetchAll()
  },

  updateGoal: async (id, patch) => {
    const { error } = await supabase
      .from('goals')
      .update({
        ...(patch.title !== undefined && { title: patch.title }),
        ...(patch.description !== undefined && { description: patch.description }),
        ...(patch.type !== undefined && { type: patch.type }),
        ...(patch.category !== undefined && { category: patch.category }),
        ...(patch.evidenceType !== undefined && { evidence_type: patch.evidenceType }),
        ...(patch.archived !== undefined && { archived: patch.archived }),
      })
      .eq('id', id)
    if (error) throw error
    await get().fetchAll()
  },

  archiveGoal: async (id, archived) => {
    const { error } = await supabase.from('goals').update({ archived }).eq('id', id)
    if (error) throw error
    await get().fetchAll()
  },

  assignGoal: async ({ goalId, employeeIds, assignedBy, dueDate, priority }) => {
    const companyId = companyIdOf(get().users, assignedBy)
    const { error } = await supabase.from('goal_assignments').insert(
      employeeIds.map((employeeId) => ({
        goal_id: goalId,
        employee_id: employeeId,
        assigned_by: assignedBy,
        due_date: dueDate,
        priority,
        company_id: companyId,
      })),
    )
    if (error) throw error
    await get().fetchAll()
  },

  overrideAssignmentStatus: async (assignmentId, status, reason, updatedBy) => {
    const assignment = get().assignments.find((a) => a.id === assignmentId)
    if (!assignment) return
    // Insert-only: the sync_assignment_from_progress trigger derives the
    // goal_assignments update and any completion notification from this row.
    const { error } = await supabase.from('progress_updates').insert({
      assignment_id: assignmentId,
      updated_by: updatedBy,
      status,
      completion_pct: status === 'completed' ? 100 : assignment.completionPct,
      note: 'Status manually overridden by admin.',
      is_override: true,
      override_reason: reason,
      company_id: companyIdOf(get().users, updatedBy),
    })
    if (error) throw error
    await get().fetchAll()
  },

  addEmployee: async (user) => {
    // Creating a login-capable account requires the Auth admin API (service_role),
    // which can't run in the browser — this goes through the admin-create-employee
    // edge function instead.
    const { error } = await supabase.functions.invoke('admin-create-employee', {
      body: {
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        managerId: user.managerId,
        avatarColor: user.avatarColor,
      },
    })
    if (error) throw error
    await get().fetchAll()
  },

  updateEmployee: async (id, patch) => {
    const { error } = await supabase
      .from('profiles')
      .update({
        ...(patch.name !== undefined && { name: patch.name }),
        ...(patch.email !== undefined && { email: patch.email }),
        ...(patch.role !== undefined && { role: patch.role }),
        ...(patch.department !== undefined && { department: patch.department }),
        ...(patch.managerId !== undefined && { manager_id: patch.managerId }),
        ...(patch.status !== undefined && { status: patch.status }),
        ...(patch.avatarColor !== undefined && { avatar_color: patch.avatarColor }),
      })
      .eq('id', id)
    if (error) throw error
    await get().fetchAll()
  },

  toggleEmployeeStatus: async (id) => {
    const user = get().users.find((u) => u.id === id)
    if (!user) return
    const { error } = await supabase
      .from('profiles')
      .update({ status: user.status === 'active' ? 'inactive' : 'active' })
      .eq('id', id)
    if (error) throw error
    await get().fetchAll()
  },

  addProgressUpdate: async ({ assignmentId, updatedBy, status, completionPct, note, evidenceUrl }) => {
    const { error } = await supabase.from('progress_updates').insert({
      assignment_id: assignmentId,
      updated_by: updatedBy,
      status,
      completion_pct: completionPct,
      note,
      evidence_url: evidenceUrl,
      company_id: companyIdOf(get().users, updatedBy),
    })
    if (error) throw error
    await get().fetchAll()
  },

  markNotificationRead: async (id) => {
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', id)
      .is('read_at', null)
    if (error) throw error
    await get().fetchAll()
  },

  markAllNotificationsRead: async (userId) => {
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .is('read_at', null)
    if (error) throw error
    await get().fetchAll()
  },
}))

export function roleLabel(role: Role): string {
  return role === 'admin' ? 'Admin' : 'Employee'
}
