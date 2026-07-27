create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  domain text not null unique,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);
create index companies_domain_idx on public.companies(domain);

alter table public.profiles add column company_id uuid references public.companies(id);
alter table public.goals add column company_id uuid references public.companies(id);
alter table public.goal_assignments add column company_id uuid references public.companies(id);
alter table public.progress_updates add column company_id uuid references public.companies(id);
alter table public.notifications add column company_id uuid references public.companies(id);

create index profiles_company_id_idx on public.profiles(company_id);
create index goals_company_id_idx on public.goals(company_id);
create index goal_assignments_company_id_idx on public.goal_assignments(company_id);
create index progress_updates_company_id_idx on public.progress_updates(company_id);
create index notifications_company_id_idx on public.notifications(company_id);

-- RLS-safe "what company is the current user in" — same recursion-avoidance
-- pattern as private.is_admin().
create or replace function private.current_company_id()
returns uuid
language sql
security definer
set search_path = ''
stable
as $$
  select company_id from public.profiles where id = auth.uid();
$$;

revoke all on function private.current_company_id() from public;
grant execute on function private.current_company_id() to authenticated;

-- company_id is always server-derived from context, never client-supplied,
-- via BEFORE INSERT triggers (fires before RLS WITH CHECK evaluates the row).
create or replace function public.set_goal_company_id()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  select company_id into new.company_id from public.profiles where id = new.created_by;
  if new.company_id is null then
    raise exception 'created_by profile has no company_id';
  end if;
  return new;
end;
$$;
create trigger before_insert_goal_company_id
  before insert on public.goals
  for each row execute function public.set_goal_company_id();

create or replace function public.set_assignment_company_id()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_goal_company uuid;
  v_employee_company uuid;
  v_assigned_by_company uuid;
begin
  select company_id into v_goal_company from public.goals where id = new.goal_id;
  select company_id into v_employee_company from public.profiles where id = new.employee_id;
  select company_id into v_assigned_by_company from public.profiles where id = new.assigned_by;

  if v_goal_company is null or v_employee_company is null or v_assigned_by_company is null then
    raise exception 'Cannot resolve company for goal/employee/assigner';
  end if;
  if v_goal_company <> v_employee_company or v_goal_company <> v_assigned_by_company then
    raise exception 'Goal, employee, and assigner must all belong to the same company';
  end if;

  new.company_id := v_goal_company;
  return new;
end;
$$;
create trigger before_insert_assignment_company_id
  before insert on public.goal_assignments
  for each row execute function public.set_assignment_company_id();

create or replace function public.set_progress_update_company_id()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  select company_id into new.company_id from public.goal_assignments where id = new.assignment_id;
  if new.company_id is null then
    raise exception 'assignment has no company_id';
  end if;
  return new;
end;
$$;
create trigger before_insert_progress_update_company_id
  before insert on public.progress_updates
  for each row execute function public.set_progress_update_company_id();

create or replace function public.set_notification_company_id()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  select company_id into new.company_id from public.profiles where id = new.user_id;
  if new.company_id is null then
    raise exception 'user_id profile has no company_id';
  end if;
  return new;
end;
$$;
create trigger before_insert_notification_company_id
  before insert on public.notifications
  for each row execute function public.set_notification_company_id();
