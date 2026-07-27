import { create } from 'zustand'
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
import {
  seedAssignments,
  seedGoals,
  seedNotifications,
  seedProgressUpdates,
  seedUsers,
  TODAY,
} from '../data/seed'

let idCounter = 1000
const nextId = (prefix: string) => `${prefix}-${idCounter++}`

export function isPastDue(dueDate: string): boolean {
  return new Date(dueDate) < TODAY
}

export function isDueSoon(dueDate: string, withinDays = 7): boolean {
  const due = new Date(dueDate)
  const diffMs = due.getTime() - TODAY.getTime()
  const diffDays = diffMs / (1000 * 60 * 60 * 24)
  return diffDays >= 0 && diffDays <= withinDays
}

/** Effective display status: an unmarked-complete assignment past its due date reads as overdue. */
export function effectiveStatus(a: GoalAssignment): AssignmentStatus {
  if (a.status === 'completed') return 'completed'
  if (a.status === 'overdue' || isPastDue(a.dueDate)) return 'overdue'
  return a.status
}

interface DataState {
  users: User[]
  goals: Goal[]
  assignments: GoalAssignment[]
  progressUpdates: ProgressUpdate[]
  notifications: Notification[]

  // Goals (Admin)
  createGoal: (goal: Omit<Goal, 'id' | 'createdAt' | 'archived'>) => Goal
  updateGoal: (id: string, patch: Partial<Omit<Goal, 'id'>>) => void
  archiveGoal: (id: string, archived: boolean) => void

  // Assignments (Admin)
  assignGoal: (input: {
    goalId: string
    employeeIds: string[]
    assignedBy: string
    dueDate: string
    priority: GoalPriority
  }) => void
  overrideAssignmentStatus: (
    assignmentId: string,
    status: AssignmentStatus,
    reason: string,
    updatedBy: string,
  ) => void

  // Employees (Admin)
  addEmployee: (user: Omit<User, 'id' | 'status'>) => void
  updateEmployee: (id: string, patch: Partial<Omit<User, 'id'>>) => void
  toggleEmployeeStatus: (id: string) => void

  // Progress (Employee)
  addProgressUpdate: (input: {
    assignmentId: string
    updatedBy: string
    status: AssignmentStatus
    completionPct: number
    note: string
    evidenceUrl: string | null
  }) => void

  // Notifications
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: (userId: string) => void
}

export const useDataStore = create<DataState>((set, get) => ({
  users: seedUsers,
  goals: seedGoals,
  assignments: seedAssignments,
  progressUpdates: seedProgressUpdates,
  notifications: seedNotifications,

  createGoal: (goal) => {
    const newGoal: Goal = {
      ...goal,
      id: nextId('g'),
      createdAt: TODAY.toISOString().slice(0, 10),
      archived: false,
    }
    set((s) => ({ goals: [newGoal, ...s.goals] }))
    return newGoal
  },

  updateGoal: (id, patch) => {
    set((s) => ({
      goals: s.goals.map((g) => (g.id === id ? { ...g, ...patch } : g)),
    }))
  },

  archiveGoal: (id, archived) => {
    set((s) => ({
      goals: s.goals.map((g) => (g.id === id ? { ...g, archived } : g)),
    }))
  },

  assignGoal: ({ goalId, employeeIds, assignedBy, dueDate, priority }) => {
    const assignedAt = TODAY.toISOString().slice(0, 10)
    const newAssignments: GoalAssignment[] = employeeIds.map((employeeId) => ({
      id: nextId('a'),
      goalId,
      employeeId,
      assignedBy,
      assignedAt,
      dueDate,
      status: 'not_started',
      priority,
      completionPct: 0,
    }))
    const goal = get().goals.find((g) => g.id === goalId)
    const newNotifications: Notification[] = employeeIds.map((employeeId) => ({
      id: nextId('n'),
      userId: employeeId,
      type: 'goal_assigned',
      message: `You were assigned a new goal: ${goal?.title ?? 'a new goal'}.`,
      readAt: null,
      createdAt: assignedAt,
    }))
    set((s) => ({
      assignments: [...newAssignments, ...s.assignments],
      notifications: [...newNotifications, ...s.notifications],
    }))
  },

  overrideAssignmentStatus: (assignmentId, status, reason, updatedBy) => {
    const assignment = get().assignments.find((a) => a.id === assignmentId)
    if (!assignment) return
    set((s) => ({
      assignments: s.assignments.map((a) =>
        a.id === assignmentId
          ? { ...a, status, completionPct: status === 'completed' ? 100 : a.completionPct }
          : a,
      ),
      progressUpdates: [
        {
          id: nextId('p'),
          assignmentId,
          updatedBy,
          status,
          completionPct: status === 'completed' ? 100 : assignment.completionPct,
          note: 'Status manually overridden by admin.',
          evidenceUrl: null,
          isOverride: true,
          overrideReason: reason,
          createdAt: TODAY.toISOString().slice(0, 10),
        },
        ...s.progressUpdates,
      ],
    }))
  },

  addEmployee: (user) => {
    const newUser: User = { ...user, id: nextId('u'), status: 'active' }
    set((s) => ({ users: [...s.users, newUser] }))
  },

  updateEmployee: (id, patch) => {
    set((s) => ({
      users: s.users.map((u) => (u.id === id ? { ...u, ...patch } : u)),
    }))
  },

  toggleEmployeeStatus: (id) => {
    set((s) => ({
      users: s.users.map((u) =>
        u.id === id ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' } : u,
      ),
    }))
  },

  addProgressUpdate: ({ assignmentId, updatedBy, status, completionPct, note, evidenceUrl }) => {
    const assignment = get().assignments.find((a) => a.id === assignmentId)
    if (!assignment) return
    const createdAt = TODAY.toISOString().slice(0, 10)
    set((s) => ({
      assignments: s.assignments.map((a) =>
        a.id === assignmentId ? { ...a, status, completionPct } : a,
      ),
      progressUpdates: [
        {
          id: nextId('p'),
          assignmentId,
          updatedBy,
          status,
          completionPct,
          note,
          evidenceUrl,
          isOverride: false,
          overrideReason: null,
          createdAt,
        },
        ...s.progressUpdates,
      ],
      notifications:
        status === 'completed'
          ? [
              {
                id: nextId('n'),
                userId: assignment.assignedBy,
                type: 'goal_completed',
                message: `${s.users.find((u) => u.id === updatedBy)?.name ?? 'An employee'} marked a goal complete — review evidence.`,
                readAt: null,
                createdAt,
              },
              ...s.notifications,
            ]
          : s.notifications,
    }))
  },

  markNotificationRead: (id) => {
    set((s) => ({
      notifications: s.notifications.map((n) =>
        n.id === id ? { ...n, readAt: n.readAt ?? TODAY.toISOString().slice(0, 10) } : n,
      ),
    }))
  },

  markAllNotificationsRead: (userId) => {
    set((s) => ({
      notifications: s.notifications.map((n) =>
        n.userId === userId && !n.readAt
          ? { ...n, readAt: TODAY.toISOString().slice(0, 10) }
          : n,
      ),
    }))
  },
}))

export function roleLabel(role: Role): string {
  return role === 'admin' ? 'Admin' : 'Employee'
}
