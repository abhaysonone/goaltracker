alter table public.profiles enable row level security;
alter table public.goals enable row level security;
alter table public.goal_assignments enable row level security;
alter table public.progress_updates enable row level security;
alter table public.notifications enable row level security;

alter table public.profiles force row level security;
alter table public.goals force row level security;
alter table public.goal_assignments force row level security;
alter table public.progress_updates force row level security;
alter table public.notifications force row level security;

-- Explicit grants: don't rely on the project's Data API auto-expose setting.
-- No `anon` grants — this app requires an authenticated session throughout.
grant usage on schema public to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update on public.goals to authenticated;
grant select, insert, update on public.goal_assignments to authenticated;
grant select, insert on public.progress_updates to authenticated;
grant select, insert, update on public.notifications to authenticated;

-- profiles: org directory is readable by everyone signed in; only admins manage records.
create policy "profiles_select_all_authenticated"
on public.profiles for select
to authenticated
using (true);

create policy "profiles_insert_admin_only"
on public.profiles for insert
to authenticated
with check (private.is_admin());

create policy "profiles_update_admin_only"
on public.profiles for update
to authenticated
using (private.is_admin())
with check (private.is_admin());

-- goals: catalog is readable by everyone signed in; only admins create/edit goals.
create policy "goals_select_all_authenticated"
on public.goals for select
to authenticated
using (true);

create policy "goals_insert_admin_only"
on public.goals for insert
to authenticated
with check (private.is_admin());

create policy "goals_update_admin_only"
on public.goals for update
to authenticated
using (private.is_admin())
with check (private.is_admin());

-- goal_assignments: employees see/update only their own; admins see/manage everything.
-- Only admins create assignments. Employee updates are how the sync trigger is allowed
-- to write derived status/completion_pct back onto their own row.
create policy "goal_assignments_select_own_or_admin"
on public.goal_assignments for select
to authenticated
using (employee_id = (select auth.uid()) or private.is_admin());

create policy "goal_assignments_insert_admin_only"
on public.goal_assignments for insert
to authenticated
with check (private.is_admin());

create policy "goal_assignments_update_own_or_admin"
on public.goal_assignments for update
to authenticated
using (employee_id = (select auth.uid()) or private.is_admin())
with check (employee_id = (select auth.uid()) or private.is_admin());

-- progress_updates: append-only (no update/delete policy exists, so both are always denied).
-- Employees can insert non-override rows only for their own assignment, attributed to themselves.
-- Admins can insert any row, including overrides.
create policy "progress_updates_select_own_or_admin"
on public.progress_updates for select
to authenticated
using (
  private.is_admin()
  or exists (
    select 1 from public.goal_assignments ga
    where ga.id = assignment_id and ga.employee_id = (select auth.uid())
  )
);

create policy "progress_updates_insert_own_or_admin"
on public.progress_updates for insert
to authenticated
with check (
  updated_by = (select auth.uid())
  and (
    private.is_admin()
    or (
      not is_override
      and exists (
        select 1 from public.goal_assignments ga
        where ga.id = assignment_id and ga.employee_id = (select auth.uid())
      )
    )
  )
);

-- notifications: users see/mark-read only their own; direct inserts are admin-only
-- (the triggers above bypass this for the assignment/completion notification flows).
create policy "notifications_select_own_or_admin"
on public.notifications for select
to authenticated
using (user_id = (select auth.uid()) or private.is_admin());

create policy "notifications_insert_admin_only"
on public.notifications for insert
to authenticated
with check (private.is_admin());

create policy "notifications_update_own"
on public.notifications for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));
