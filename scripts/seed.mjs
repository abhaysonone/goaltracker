// Seeds the same demo dataset the app's mock store used to ship with, but as real
// Supabase Auth users + Postgres rows. Safe to re-run: users/goals/assignments are
// looked up by natural key first, so nothing is duplicated. Progress-update history
// is only inserted the first time per assignment (each insert fires DB triggers that
// sync goal_assignments and create notifications, so re-inserting it would duplicate
// those side effects).
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const DEMO_PASSWORD = process.env.SEED_DEMO_PASSWORD || 'Demo-Password-123!'

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    'Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.\n' +
      'Fill in SUPABASE_SERVICE_ROLE_KEY in .env.local (Project Settings -> API -> service_role),\n' +
      'then run: npm run db:seed',
  )
  process.exit(1)
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// Same shape as src/data/seed.ts, keyed by the old mock ids so assignments/progress/
// goals below can cross-reference each other before real UUIDs exist.
const seedUsers = [
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

const seedGoals = [
  { id: 'g-aws-sa', title: 'AWS Certified Solutions Architect', description: 'Associate-level certification covering core AWS architecture patterns, cost optimization, and resilience.', type: 'certification', category: 'Engineering', createdBy: 'u-priya', evidenceType: 'file', archived: false },
  { id: 'g-infosec', title: 'Information Security Awareness', description: 'Annual mandatory training covering phishing, data handling, and incident reporting.', type: 'training', category: 'Compliance', createdBy: 'u-priya', evidenceType: 'either', archived: false },
  { id: 'g-pmp', title: 'PMP Certification', description: 'Project Management Professional certification from PMI.', type: 'certification', category: 'Project Management', createdBy: 'u-priya', evidenceType: 'file', archived: false },
  { id: 'g-harassment', title: 'Workplace Conduct & Anti-Harassment Training', description: 'Mandatory annual training on workplace conduct policy.', type: 'training', category: 'Compliance', createdBy: 'u-priya', evidenceType: 'link', archived: false },
  { id: 'g-excel', title: 'Advanced Excel for Finance', description: 'Financial modeling, pivot tables, and macros for the finance team.', type: 'training', category: 'Finance', createdBy: 'u-marcus', evidenceType: 'either', archived: false },
  { id: 'g-sf-admin', title: 'Salesforce Administrator Certification', description: 'Official Salesforce Admin certification for the sales & CS orgs.', type: 'certification', category: 'Sales', createdBy: 'u-marcus', evidenceType: 'file', archived: false },
  { id: 'g-leadership', title: 'Leadership Essentials Workshop', description: 'Four-part workshop series on people management fundamentals.', type: 'training', category: 'Management', createdBy: 'u-priya', evidenceType: 'link', archived: false },
  { id: 'g-scrum', title: 'Scrum Master Certification', description: 'Certified ScrumMaster (CSM) credential for engineering leads.', type: 'certification', category: 'Engineering', createdBy: 'u-priya', evidenceType: 'file', archived: false },
  { id: 'g-hipaa', title: 'HIPAA Compliance Training', description: 'Required for teams handling any customer health-adjacent data.', type: 'training', category: 'Compliance', createdBy: 'u-priya', evidenceType: 'either', archived: false },
  { id: 'g-dei', title: 'Diversity & Inclusion Fundamentals', description: 'Foundational D&I training, superseded by the 2026 refreshed curriculum.', type: 'training', category: 'Culture', createdBy: 'u-priya', evidenceType: 'link', archived: true },
]

const seedAssignments = [
  { id: 'a-1', goalId: 'g-aws-sa', employeeId: 'u-jordan', assignedBy: 'u-priya', dueDate: '2026-08-15', status: 'in_progress', priority: 'high', completionPct: 60 },
  { id: 'a-2', goalId: 'g-infosec', employeeId: 'u-jordan', assignedBy: 'u-priya', dueDate: '2026-07-25', status: 'in_progress', priority: 'medium', completionPct: 40 },
  { id: 'a-3', goalId: 'g-harassment', employeeId: 'u-jordan', assignedBy: 'u-priya', dueDate: '2026-07-10', status: 'overdue', priority: 'high', completionPct: 0 },
  { id: 'a-4', goalId: 'g-scrum', employeeId: 'u-jordan', assignedBy: 'u-priya', dueDate: '2026-09-30', status: 'not_started', priority: 'medium', completionPct: 0 },
  { id: 'a-5', goalId: 'g-hipaa', employeeId: 'u-jordan', assignedBy: 'u-priya', dueDate: '2026-03-01', status: 'completed', priority: 'low', completionPct: 100 },
  { id: 'a-6', goalId: 'g-aws-sa', employeeId: 'u-amara', assignedBy: 'u-priya', dueDate: '2026-08-15', status: 'completed', priority: 'high', completionPct: 100 },
  { id: 'a-7', goalId: 'g-scrum', employeeId: 'u-amara', assignedBy: 'u-priya', dueDate: '2026-07-28', status: 'in_progress', priority: 'medium', completionPct: 75 },
  { id: 'a-8', goalId: 'g-infosec', employeeId: 'u-amara', assignedBy: 'u-priya', dueDate: '2026-07-25', status: 'not_started', priority: 'medium', completionPct: 0 },
  { id: 'a-9', goalId: 'g-sf-admin', employeeId: 'u-diego', assignedBy: 'u-marcus', dueDate: '2026-07-20', status: 'overdue', priority: 'high', completionPct: 30 },
  { id: 'a-10', goalId: 'g-harassment', employeeId: 'u-diego', assignedBy: 'u-priya', dueDate: '2026-07-10', status: 'completed', priority: 'high', completionPct: 100 },
  { id: 'a-11', goalId: 'g-leadership', employeeId: 'u-diego', assignedBy: 'u-marcus', dueDate: '2026-09-01', status: 'not_started', priority: 'low', completionPct: 0 },
  { id: 'a-12', goalId: 'g-sf-admin', employeeId: 'u-hannah', assignedBy: 'u-marcus', dueDate: '2026-08-10', status: 'in_progress', priority: 'high', completionPct: 50 },
  { id: 'a-13', goalId: 'g-infosec', employeeId: 'u-hannah', assignedBy: 'u-priya', dueDate: '2026-07-25', status: 'in_progress', priority: 'medium', completionPct: 20 },
  { id: 'a-14', goalId: 'g-excel', employeeId: 'u-oliver', assignedBy: 'u-marcus', dueDate: '2026-07-24', status: 'in_progress', priority: 'medium', completionPct: 85 },
  { id: 'a-15', goalId: 'g-harassment', employeeId: 'u-oliver', assignedBy: 'u-priya', dueDate: '2026-07-10', status: 'completed', priority: 'high', completionPct: 100 },
  { id: 'a-16', goalId: 'g-pmp', employeeId: 'u-oliver', assignedBy: 'u-priya', dueDate: '2026-10-01', status: 'not_started', priority: 'low', completionPct: 0 },
  { id: 'a-17', goalId: 'g-leadership', employeeId: 'u-sofia', assignedBy: 'u-marcus', dueDate: '2026-07-23', status: 'in_progress', priority: 'medium', completionPct: 65 },
  { id: 'a-18', goalId: 'g-infosec', employeeId: 'u-sofia', assignedBy: 'u-priya', dueDate: '2026-07-25', status: 'not_started', priority: 'medium', completionPct: 0 },
  { id: 'a-19', goalId: 'g-hipaa', employeeId: 'u-liam', assignedBy: 'u-priya', dueDate: '2026-07-05', status: 'overdue', priority: 'high', completionPct: 10 },
  { id: 'a-20', goalId: 'g-harassment', employeeId: 'u-liam', assignedBy: 'u-priya', dueDate: '2026-07-10', status: 'completed', priority: 'high', completionPct: 100 },
  { id: 'a-21', goalId: 'g-scrum', employeeId: 'u-nina', assignedBy: 'u-priya', dueDate: '2026-09-30', status: 'in_progress', priority: 'medium', completionPct: 30 },
  { id: 'a-22', goalId: 'g-aws-sa', employeeId: 'u-nina', assignedBy: 'u-priya', dueDate: '2026-08-15', status: 'not_started', priority: 'high', completionPct: 0 },
]

// Chronological per assignment — the sync trigger applies these in order, so the
// last row per assignment_id is what goal_assignments ends up reflecting.
const seedProgressUpdates = [
  { assignmentId: 'a-1', updatedBy: 'u-jordan', status: 'not_started', completionPct: 0, note: 'Goal received, scheduling study time.', evidenceUrl: null },
  { assignmentId: 'a-1', updatedBy: 'u-jordan', status: 'in_progress', completionPct: 30, note: 'Finished domains 1-2 of the exam guide.', evidenceUrl: null },
  { assignmentId: 'a-1', updatedBy: 'u-jordan', status: 'in_progress', completionPct: 60, note: 'Completed practice exam #1, scored 68%.', evidenceUrl: null },
  { assignmentId: 'a-5', updatedBy: 'u-jordan', status: 'in_progress', completionPct: 50, note: 'Watched modules 1-4.', evidenceUrl: null },
  { assignmentId: 'a-5', updatedBy: 'u-jordan', status: 'completed', completionPct: 100, note: 'Completed full course and passed the quiz.', evidenceUrl: 'https://training.kyyba.com/certs/hipaa-jlee-2026.pdf' },
  { assignmentId: 'a-6', updatedBy: 'u-amara', status: 'completed', completionPct: 100, note: 'Passed AWS SAA-C03 on first attempt.', evidenceUrl: 'https://aws.amazon.com/verification/AC-9F21' },
  { assignmentId: 'a-9', updatedBy: 'u-diego', status: 'in_progress', completionPct: 30, note: 'Completed Trailhead modules 1-6, exam scheduled next month.', evidenceUrl: null },
  { assignmentId: 'a-9', updatedBy: 'u-marcus', status: 'overdue', completionPct: 30, note: 'Marked overdue after due date passed with no exam booking confirmed.', evidenceUrl: null, isOverride: true, overrideReason: 'Due date passed without evidence submitted; flagged for manager follow-up.' },
  { assignmentId: 'a-14', updatedBy: 'u-oliver', status: 'in_progress', completionPct: 85, note: 'Two modules remaining, on track to finish before due date.', evidenceUrl: null },
]

async function findOrCreateAuthUser(email, name) {
  const { data, error } = await admin.auth.admin.listUsers({ perPage: 200 })
  if (error) throw error
  const existing = data.users.find((u) => u.email === email)
  if (existing) return existing.id

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { name },
  })
  if (createError) throw createError
  return created.user.id
}

async function main() {
  console.log('Seeding users...')
  const idMap = {}
  for (const u of seedUsers) {
    idMap[u.id] = await findOrCreateAuthUser(u.email, u.name)
  }

  console.log('Filling in profile fields...')
  for (const u of seedUsers) {
    const { error } = await admin
      .from('profiles')
      .update({
        role: u.role,
        department: u.department,
        manager_id: u.managerId ? idMap[u.managerId] : null,
        status: u.status,
        avatar_color: u.avatarColor,
      })
      .eq('id', idMap[u.id])
    if (error) throw error
  }

  console.log('Seeding goals...')
  const goalIdMap = {}
  for (const g of seedGoals) {
    const { data: existing } = await admin.from('goals').select('id').eq('title', g.title).maybeSingle()
    if (existing) {
      goalIdMap[g.id] = existing.id
      continue
    }
    const { data: created, error } = await admin
      .from('goals')
      .insert({
        title: g.title,
        description: g.description,
        type: g.type,
        category: g.category,
        created_by: idMap[g.createdBy],
        evidence_type: g.evidenceType,
        archived: g.archived,
      })
      .select('id')
      .single()
    if (error) throw error
    goalIdMap[g.id] = created.id
  }

  console.log('Seeding goal assignments...')
  const assignmentIdMap = {}
  for (const a of seedAssignments) {
    const goalId = goalIdMap[a.goalId]
    const employeeId = idMap[a.employeeId]
    const { data: existing } = await admin
      .from('goal_assignments')
      .select('id')
      .eq('goal_id', goalId)
      .eq('employee_id', employeeId)
      .maybeSingle()
    if (existing) {
      assignmentIdMap[a.id] = existing.id
      continue
    }
    const { data: created, error } = await admin
      .from('goal_assignments')
      .insert({
        goal_id: goalId,
        employee_id: employeeId,
        assigned_by: idMap[a.assignedBy],
        due_date: a.dueDate,
        status: a.status,
        priority: a.priority,
        completion_pct: a.completionPct,
      })
      .select('id')
      .single()
    if (error) throw error
    assignmentIdMap[a.id] = created.id
  }

  console.log('Seeding progress update history (skipped for assignments that already have any)...')
  const assignmentsWithHistory = new Set()
  for (const p of seedProgressUpdates) {
    const assignmentId = assignmentIdMap[p.assignmentId]
    if (assignmentsWithHistory.has(assignmentId)) continue
    const { count } = await admin
      .from('progress_updates')
      .select('id', { count: 'exact', head: true })
      .eq('assignment_id', assignmentId)
    if (count && count > 0) {
      assignmentsWithHistory.add(assignmentId)
      continue
    }
    const { error } = await admin.from('progress_updates').insert({
      assignment_id: assignmentId,
      updated_by: idMap[p.updatedBy],
      status: p.status,
      completion_pct: p.completionPct,
      note: p.note,
      evidence_url: p.evidenceUrl,
      is_override: p.isOverride ?? false,
      override_reason: p.overrideReason ?? null,
    })
    if (error) throw error
  }

  console.log('Done. Demo users share the password:', DEMO_PASSWORD)
  console.log(
    'Note: goal_assigned/goal_completed notifications were generated by DB triggers as a side',
    'effect of the inserts above; due_soon/overdue notifications have no automated job yet.',
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
