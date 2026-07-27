import type {
  Goal,
  GoalAssignment,
  Notification,
  ProgressUpdate,
  User,
} from '../types'

// "Today" is fixed for the demo so due-date-relative badges (overdue / due soon)
// are stable across reloads instead of drifting with the real clock.
export const TODAY = new Date('2026-07-22T09:00:00')

export const seedUsers: User[] = [
  { id: 'u-priya', name: 'Priya Nair', email: 'priya.nair@kyyba.com', role: 'admin', department: 'HR', managerId: null, status: 'active', avatarColor: '#D98B3F' },
  { id: 'u-marcus', name: 'Marcus Webb', email: 'marcus.webb@kyyba.com', role: 'admin', department: 'Operations', managerId: null, status: 'active', avatarColor: '#3FA97A' },

  { id: 'u-jordan', name: 'Jordan Lee', email: 'jordan.lee@kyyba.com', role: 'employee', department: 'Engineering', managerId: 'u-priya', status: 'active', avatarColor: '#5B8FD9' },
  { id: 'u-amara', name: 'Amara Chukwu', email: 'amara.chukwu@kyyba.com', role: 'employee', department: 'Engineering', managerId: 'u-priya', status: 'active', avatarColor: '#9B6FD9' },
  { id: 'u-diego', name: 'Diego Fernandez', email: 'diego.fernandez@kyyba.com', role: 'employee', department: 'Sales', managerId: 'u-marcus', status: 'active', avatarColor: '#D96F9B' },
  { id: 'u-hannah', name: 'Hannah Kim', email: 'hannah.kim@kyyba.com', role: 'employee', department: 'Sales', managerId: 'u-marcus', status: 'active', avatarColor: '#4FB0C6' },
  { id: 'u-oliver', name: 'Oliver Grant', email: 'oliver.grant@kyyba.com', role: 'employee', department: 'Finance', managerId: 'u-priya', status: 'active', avatarColor: '#C6A54F' },
  { id: 'u-sofia', name: 'Sofia Rossi', email: 'sofia.rossi@kyyba.com', role: 'employee', department: 'Marketing', managerId: 'u-marcus', status: 'active', avatarColor: '#D9834F' },
  { id: 'u-liam', name: 'Liam O’Connor', email: 'liam.oconnor@kyyba.com', role: 'employee', department: 'Customer Success', managerId: 'u-priya', status: 'active', avatarColor: '#6FD9B0' },
  { id: 'u-nina', name: 'Nina Petrova', email: 'nina.petrova@kyyba.com', role: 'employee', department: 'Engineering', managerId: 'u-priya', status: 'active', avatarColor: '#D95B5B' },
  { id: 'u-ravi', name: 'Ravi Shankar', email: 'ravi.shankar@kyyba.com', role: 'employee', department: 'Customer Success', managerId: 'u-priya', status: 'inactive', avatarColor: '#8F9BB3' },
]

export const seedGoals: Goal[] = [
  { id: 'g-aws-sa', title: 'AWS Certified Solutions Architect', description: 'Associate-level certification covering core AWS architecture patterns, cost optimization, and resilience.', type: 'certification', category: 'Engineering', createdBy: 'u-priya', evidenceType: 'file', createdAt: '2026-05-01', archived: false },
  { id: 'g-infosec', title: 'Information Security Awareness', description: 'Annual mandatory training covering phishing, data handling, and incident reporting.', type: 'training', category: 'Compliance', createdBy: 'u-priya', evidenceType: 'either', createdAt: '2026-04-10', archived: false },
  { id: 'g-pmp', title: 'PMP Certification', description: 'Project Management Professional certification from PMI.', type: 'certification', category: 'Project Management', createdBy: 'u-priya', evidenceType: 'file', createdAt: '2026-03-18', archived: false },
  { id: 'g-harassment', title: 'Workplace Conduct & Anti-Harassment Training', description: 'Mandatory annual training on workplace conduct policy.', type: 'training', category: 'Compliance', createdBy: 'u-priya', evidenceType: 'link', createdAt: '2026-02-01', archived: false },
  { id: 'g-excel', title: 'Advanced Excel for Finance', description: 'Financial modeling, pivot tables, and macros for the finance team.', type: 'training', category: 'Finance', createdBy: 'u-marcus', evidenceType: 'either', createdAt: '2026-05-20', archived: false },
  { id: 'g-sf-admin', title: 'Salesforce Administrator Certification', description: 'Official Salesforce Admin certification for the sales & CS orgs.', type: 'certification', category: 'Sales', createdBy: 'u-marcus', evidenceType: 'file', createdAt: '2026-04-28', archived: false },
  { id: 'g-leadership', title: 'Leadership Essentials Workshop', description: 'Four-part workshop series on people management fundamentals.', type: 'training', category: 'Management', createdBy: 'u-priya', evidenceType: 'link', createdAt: '2026-06-02', archived: false },
  { id: 'g-scrum', title: 'Scrum Master Certification', description: 'Certified ScrumMaster (CSM) credential for engineering leads.', type: 'certification', category: 'Engineering', createdBy: 'u-priya', evidenceType: 'file', createdAt: '2026-06-15', archived: false },
  { id: 'g-hipaa', title: 'HIPAA Compliance Training', description: 'Required for teams handling any customer health-adjacent data.', type: 'training', category: 'Compliance', createdBy: 'u-priya', evidenceType: 'either', createdAt: '2026-01-15', archived: false },
  { id: 'g-dei', title: 'Diversity & Inclusion Fundamentals', description: 'Foundational D&I training, superseded by the 2026 refreshed curriculum.', type: 'training', category: 'Culture', createdBy: 'u-priya', evidenceType: 'link', createdAt: '2025-09-01', archived: true },
]

export const seedAssignments: GoalAssignment[] = [
  { id: 'a-1', goalId: 'g-aws-sa', employeeId: 'u-jordan', assignedBy: 'u-priya', assignedAt: '2026-05-02', dueDate: '2026-08-15', status: 'in_progress', priority: 'high', completionPct: 60 },
  { id: 'a-2', goalId: 'g-infosec', employeeId: 'u-jordan', assignedBy: 'u-priya', assignedAt: '2026-04-11', dueDate: '2026-07-25', status: 'in_progress', priority: 'medium', completionPct: 40 },
  { id: 'a-3', goalId: 'g-harassment', employeeId: 'u-jordan', assignedBy: 'u-priya', assignedAt: '2026-02-02', dueDate: '2026-07-10', status: 'overdue', priority: 'high', completionPct: 0 },
  { id: 'a-4', goalId: 'g-scrum', employeeId: 'u-jordan', assignedBy: 'u-priya', assignedAt: '2026-06-16', dueDate: '2026-09-30', status: 'not_started', priority: 'medium', completionPct: 0 },
  { id: 'a-5', goalId: 'g-hipaa', employeeId: 'u-jordan', assignedBy: 'u-priya', assignedAt: '2026-01-16', dueDate: '2026-03-01', status: 'completed', priority: 'low', completionPct: 100 },

  { id: 'a-6', goalId: 'g-aws-sa', employeeId: 'u-amara', assignedBy: 'u-priya', assignedAt: '2026-05-02', dueDate: '2026-08-15', status: 'completed', priority: 'high', completionPct: 100 },
  { id: 'a-7', goalId: 'g-scrum', employeeId: 'u-amara', assignedBy: 'u-priya', assignedAt: '2026-06-16', dueDate: '2026-07-28', status: 'in_progress', priority: 'medium', completionPct: 75 },
  { id: 'a-8', goalId: 'g-infosec', employeeId: 'u-amara', assignedBy: 'u-priya', assignedAt: '2026-04-11', dueDate: '2026-07-25', status: 'not_started', priority: 'medium', completionPct: 0 },

  { id: 'a-9', goalId: 'g-sf-admin', employeeId: 'u-diego', assignedBy: 'u-marcus', assignedAt: '2026-04-29', dueDate: '2026-07-20', status: 'overdue', priority: 'high', completionPct: 30 },
  { id: 'a-10', goalId: 'g-harassment', employeeId: 'u-diego', assignedBy: 'u-priya', assignedAt: '2026-02-02', dueDate: '2026-07-10', status: 'completed', priority: 'high', completionPct: 100 },
  { id: 'a-11', goalId: 'g-leadership', employeeId: 'u-diego', assignedBy: 'u-marcus', assignedAt: '2026-06-03', dueDate: '2026-09-01', status: 'not_started', priority: 'low', completionPct: 0 },

  { id: 'a-12', goalId: 'g-sf-admin', employeeId: 'u-hannah', assignedBy: 'u-marcus', assignedAt: '2026-04-29', dueDate: '2026-08-10', status: 'in_progress', priority: 'high', completionPct: 50 },
  { id: 'a-13', goalId: 'g-infosec', employeeId: 'u-hannah', assignedBy: 'u-priya', assignedAt: '2026-04-11', dueDate: '2026-07-25', status: 'in_progress', priority: 'medium', completionPct: 20 },

  { id: 'a-14', goalId: 'g-excel', employeeId: 'u-oliver', assignedBy: 'u-marcus', assignedAt: '2026-05-21', dueDate: '2026-07-24', status: 'in_progress', priority: 'medium', completionPct: 85 },
  { id: 'a-15', goalId: 'g-harassment', employeeId: 'u-oliver', assignedBy: 'u-priya', assignedAt: '2026-02-02', dueDate: '2026-07-10', status: 'completed', priority: 'high', completionPct: 100 },
  { id: 'a-16', goalId: 'g-pmp', employeeId: 'u-oliver', assignedBy: 'u-priya', assignedAt: '2026-03-19', dueDate: '2026-10-01', status: 'not_started', priority: 'low', completionPct: 0 },

  { id: 'a-17', goalId: 'g-leadership', employeeId: 'u-sofia', assignedBy: 'u-marcus', assignedAt: '2026-06-03', dueDate: '2026-07-23', status: 'in_progress', priority: 'medium', completionPct: 65 },
  { id: 'a-18', goalId: 'g-infosec', employeeId: 'u-sofia', assignedBy: 'u-priya', assignedAt: '2026-04-11', dueDate: '2026-07-25', status: 'not_started', priority: 'medium', completionPct: 0 },

  { id: 'a-19', goalId: 'g-hipaa', employeeId: 'u-liam', assignedBy: 'u-priya', assignedAt: '2026-01-16', dueDate: '2026-07-05', status: 'overdue', priority: 'high', completionPct: 10 },
  { id: 'a-20', goalId: 'g-harassment', employeeId: 'u-liam', assignedBy: 'u-priya', assignedAt: '2026-02-02', dueDate: '2026-07-10', status: 'completed', priority: 'high', completionPct: 100 },

  { id: 'a-21', goalId: 'g-scrum', employeeId: 'u-nina', assignedBy: 'u-priya', assignedAt: '2026-06-16', dueDate: '2026-09-30', status: 'in_progress', priority: 'medium', completionPct: 30 },
  { id: 'a-22', goalId: 'g-aws-sa', employeeId: 'u-nina', assignedBy: 'u-priya', assignedAt: '2026-05-02', dueDate: '2026-08-15', status: 'not_started', priority: 'high', completionPct: 0 },
]

export const seedProgressUpdates: ProgressUpdate[] = [
  { id: 'p-1', assignmentId: 'a-1', updatedBy: 'u-jordan', status: 'not_started', completionPct: 0, note: 'Goal received, scheduling study time.', evidenceUrl: null, isOverride: false, overrideReason: null, createdAt: '2026-05-03' },
  { id: 'p-2', assignmentId: 'a-1', updatedBy: 'u-jordan', status: 'in_progress', completionPct: 30, note: 'Finished domains 1-2 of the exam guide.', evidenceUrl: null, isOverride: false, overrideReason: null, createdAt: '2026-06-01' },
  { id: 'p-3', assignmentId: 'a-1', updatedBy: 'u-jordan', status: 'in_progress', completionPct: 60, note: 'Completed practice exam #1, scored 68%.', evidenceUrl: null, isOverride: false, overrideReason: null, createdAt: '2026-07-10' },

  { id: 'p-4', assignmentId: 'a-5', updatedBy: 'u-jordan', status: 'in_progress', completionPct: 50, note: 'Watched modules 1-4.', evidenceUrl: null, isOverride: false, overrideReason: null, createdAt: '2026-02-01' },
  { id: 'p-5', assignmentId: 'a-5', updatedBy: 'u-jordan', status: 'completed', completionPct: 100, note: 'Completed full course and passed the quiz.', evidenceUrl: 'https://training.kyyba.com/certs/hipaa-jlee-2026.pdf', isOverride: false, overrideReason: null, createdAt: '2026-02-28' },

  { id: 'p-6', assignmentId: 'a-6', updatedBy: 'u-amara', status: 'completed', completionPct: 100, note: 'Passed AWS SAA-C03 on first attempt.', evidenceUrl: 'https://aws.amazon.com/verification/AC-9F21', isOverride: false, overrideReason: null, createdAt: '2026-07-14' },

  { id: 'p-7', assignmentId: 'a-9', updatedBy: 'u-diego', status: 'in_progress', completionPct: 30, note: 'Completed Trailhead modules 1-6, exam scheduled next month.', evidenceUrl: null, isOverride: false, overrideReason: null, createdAt: '2026-07-02' },
  { id: 'p-8', assignmentId: 'a-9', updatedBy: 'u-marcus', status: 'overdue', completionPct: 30, note: 'Marked overdue after due date passed with no exam booking confirmed.', evidenceUrl: null, isOverride: true, overrideReason: 'Due date passed without evidence submitted; flagged for manager follow-up.', createdAt: '2026-07-21' },

  { id: 'p-9', assignmentId: 'a-14', updatedBy: 'u-oliver', status: 'in_progress', completionPct: 85, note: 'Two modules remaining, on track to finish before due date.', evidenceUrl: null, isOverride: false, overrideReason: null, createdAt: '2026-07-18' },
]

export const seedNotifications: Notification[] = [
  { id: 'n-1', userId: 'u-jordan', type: 'due_soon', message: 'Information Security Awareness is due in 3 days (Jul 25).', readAt: null, createdAt: '2026-07-22' },
  { id: 'n-2', userId: 'u-jordan', type: 'overdue', message: 'Workplace Conduct & Anti-Harassment Training is overdue.', readAt: null, createdAt: '2026-07-11' },
  { id: 'n-3', userId: 'u-jordan', type: 'goal_assigned', message: 'You were assigned a new goal: Scrum Master Certification.', readAt: '2026-06-17', createdAt: '2026-06-16' },
  { id: 'n-4', userId: 'u-jordan', type: 'goal_completed', message: 'Your HIPAA Compliance Training was marked complete.', readAt: '2026-03-01', createdAt: '2026-02-28' },

  { id: 'n-5', userId: 'u-priya', type: 'goal_completed', message: 'Amara Chukwu marked AWS Certified Solutions Architect complete — review evidence.', readAt: null, createdAt: '2026-07-14' },
  { id: 'n-6', userId: 'u-priya', type: 'overdue', message: 'Liam O’Connor is overdue on HIPAA Compliance Training.', readAt: null, createdAt: '2026-07-06' },
  { id: 'n-7', userId: 'u-priya', type: 'overdue', message: 'Jordan Lee is overdue on Workplace Conduct & Anti-Harassment Training.', readAt: null, createdAt: '2026-07-11' },
  { id: 'n-8', userId: 'u-priya', type: 'due_soon', message: '4 employees have goals due within 7 days.', readAt: '2026-07-20', createdAt: '2026-07-19' },
]
