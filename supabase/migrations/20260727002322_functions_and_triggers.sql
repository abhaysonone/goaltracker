-- Non-exposed schema for internal helper functions (never reachable via PostgREST)
create schema if not exists private;

-- RLS-safe admin check: SECURITY DEFINER to read role without recursive RLS on profiles.
-- Kept out of `public` and execute-restricted so it can't be invoked as a public API endpoint.
create or replace function private.is_admin()
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

revoke all on function private.is_admin() from public;
grant execute on function private.is_admin() to authenticated;

-- Auto-create a profile row when a new auth user signs up.
-- Role/department are never taken from user-editable signup metadata (see security checklist);
-- they default to 'employee' / 'Unassigned' and are set for real by an admin afterward.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', new.email),
    new.email
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Notify an employee when an admin assigns them a new goal.
create or replace function public.notify_on_assignment()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  goal_title text;
begin
  select title into goal_title from public.goals where id = new.goal_id;
  insert into public.notifications (user_id, type, message)
  values (
    new.employee_id,
    'goal_assigned',
    'You were assigned a new goal: ' || coalesce(goal_title, 'a new goal') || '.'
  );
  return new;
end;
$$;

create trigger on_goal_assignment_created
  after insert on public.goal_assignments
  for each row execute function public.notify_on_assignment();

-- Keep goal_assignments.status/completion_pct in sync with the latest progress_updates row,
-- and notify the assigning admin when a goal is marked complete.
-- SECURITY DEFINER: an employee submitting their own progress must be able to notify the
-- (different) admin who assigned the goal, which their own RLS grants wouldn't otherwise allow.
create or replace function public.sync_assignment_from_progress()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_assigned_by uuid;
  v_employee_name text;
begin
  update public.goal_assignments
  set status = new.status,
      completion_pct = new.completion_pct
  where id = new.assignment_id;

  if new.status = 'completed' then
    select assigned_by into v_assigned_by
    from public.goal_assignments where id = new.assignment_id;

    select name into v_employee_name
    from public.profiles where id = new.updated_by;

    insert into public.notifications (user_id, type, message)
    values (
      v_assigned_by,
      'goal_completed',
      coalesce(v_employee_name, 'An employee') || ' marked a goal complete — review evidence.'
    );
  end if;

  return new;
end;
$$;

create trigger on_progress_update_created
  after insert on public.progress_updates
  for each row execute function public.sync_assignment_from_progress();
