-- Enums
create type public.user_role as enum ('admin', 'employee');
create type public.user_status as enum ('active', 'inactive');
create type public.goal_type as enum ('training', 'certification');
create type public.evidence_type as enum ('file', 'link', 'either');
create type public.goal_priority as enum ('low', 'medium', 'high');
create type public.assignment_status as enum ('not_started', 'in_progress', 'completed', 'overdue');
create type public.notification_type as enum ('goal_assigned', 'due_soon', 'goal_completed', 'overdue');

-- One row per auth user
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  role public.user_role not null default 'employee',
  department text not null default 'Unassigned',
  manager_id uuid references public.profiles(id) on delete set null,
  status public.user_status not null default 'active',
  avatar_color text not null default '#5B8FD9',
  created_at timestamptz not null default now()
);
create index profiles_manager_id_idx on public.profiles(manager_id);
create index profiles_role_idx on public.profiles(role);

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  type public.goal_type not null,
  category text not null,
  created_by uuid not null references public.profiles(id),
  evidence_type public.evidence_type not null default 'either',
  archived boolean not null default false,
  created_at timestamptz not null default now()
);
create index goals_created_by_idx on public.goals(created_by);
create index goals_archived_idx on public.goals(archived);

create table public.goal_assignments (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.goals(id) on delete cascade,
  employee_id uuid not null references public.profiles(id) on delete cascade,
  assigned_by uuid not null references public.profiles(id),
  assigned_at timestamptz not null default now(),
  due_date date not null,
  status public.assignment_status not null default 'not_started',
  priority public.goal_priority not null default 'medium',
  completion_pct smallint not null default 0 check (completion_pct between 0 and 100),
  unique (goal_id, employee_id)
);
create index goal_assignments_employee_id_idx on public.goal_assignments(employee_id);
create index goal_assignments_goal_id_idx on public.goal_assignments(goal_id);
create index goal_assignments_status_idx on public.goal_assignments(status);

-- Append-only: history of progress on an assignment
create table public.progress_updates (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.goal_assignments(id) on delete cascade,
  updated_by uuid not null references public.profiles(id),
  status public.assignment_status not null,
  completion_pct smallint not null check (completion_pct between 0 and 100),
  note text not null default '',
  evidence_url text,
  is_override boolean not null default false,
  override_reason text,
  created_at timestamptz not null default now()
);
create index progress_updates_assignment_id_idx on public.progress_updates(assignment_id);
create index progress_updates_created_at_idx on public.progress_updates(created_at desc);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type public.notification_type not null,
  message text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_id_idx on public.notifications(user_id);
create index notifications_unread_idx on public.notifications(user_id) where read_at is null;
