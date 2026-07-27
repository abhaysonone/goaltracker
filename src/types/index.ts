export type Role = 'admin' | 'employee'

export type UserStatus = 'active' | 'inactive'

export interface User {
  id: string
  name: string
  email: string
  role: Role
  department: string
  managerId: string | null
  status: UserStatus
  avatarColor: string
}

export type GoalType = 'training' | 'certification'
export type EvidenceType = 'file' | 'link' | 'either'
export type GoalPriority = 'low' | 'medium' | 'high'

export interface Goal {
  id: string
  title: string
  description: string
  type: GoalType
  category: string
  createdBy: string
  evidenceType: EvidenceType
  createdAt: string
  archived: boolean
}

export type AssignmentStatus = 'not_started' | 'in_progress' | 'completed' | 'overdue'

export interface GoalAssignment {
  id: string
  goalId: string
  employeeId: string
  assignedBy: string
  assignedAt: string
  dueDate: string
  status: AssignmentStatus
  priority: GoalPriority
  completionPct: number
}

export interface ProgressUpdate {
  id: string
  assignmentId: string
  updatedBy: string
  status: AssignmentStatus
  completionPct: number
  note: string
  evidenceUrl: string | null
  isOverride: boolean
  overrideReason: string | null
  createdAt: string
}

export type NotificationType = 'goal_assigned' | 'due_soon' | 'goal_completed' | 'overdue'

export interface Notification {
  id: string
  userId: string
  type: NotificationType
  message: string
  readAt: string | null
  createdAt: string
}
