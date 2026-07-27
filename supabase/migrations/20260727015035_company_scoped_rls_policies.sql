-- profiles
drop policy "profiles_select_all_authenticated" on public.profiles;
drop policy "profiles_insert_admin_only" on public.profiles;
drop policy "profiles_update_admin_only" on public.profiles;

create policy "profiles_select_same_company"
on public.profiles for select
to authenticated
using (company_id = private.current_company_id());

create policy "profiles_insert_admin_same_company"
on public.profiles for insert
to authenticated
with check (private.is_admin() and company_id = private.current_company_id());

create policy "profiles_update_admin_same_company"
on public.profiles for update
to authenticated
using (private.is_admin() and company_id = private.current_company_id())
with check (private.is_admin() and company_id = private.current_company_id());

-- goals
drop policy "goals_select_all_authenticated" on public.goals;
drop policy "goals_insert_admin_only" on public.goals;
drop policy "goals_update_admin_only" on public.goals;

create policy "goals_select_same_company"
on public.goals for select
to authenticated
using (company_id = private.current_company_id());

create policy "goals_insert_admin_same_company"
on public.goals for insert
to authenticated
with check (private.is_admin() and company_id = private.current_company_id());

create policy "goals_update_admin_same_company"
on public.goals for update
to authenticated
using (private.is_admin() and company_id = private.current_company_id())
with check (private.is_admin() and company_id = private.current_company_id());

-- goal_assignments
drop policy "goal_assignments_select_own_or_admin" on public.goal_assignments;
drop policy "goal_assignments_insert_admin_only" on public.goal_assignments;
drop policy "goal_assignments_update_own_or_admin" on public.goal_assignments;

create policy "goal_assignments_select_same_company"
on public.goal_assignments for select
to authenticated
using (
  company_id = private.current_company_id()
  and (employee_id = (select auth.uid()) or private.is_admin())
);

create policy "goal_assignments_insert_admin_same_company"
on public.goal_assignments for insert
to authenticated
with check (private.is_admin() and company_id = private.current_company_id());

create policy "goal_assignments_update_same_company"
on public.goal_assignments for update
to authenticated
using (
  company_id = private.current_company_id()
  and (employee_id = (select auth.uid()) or private.is_admin())
)
with check (
  company_id = private.current_company_id()
  and (employee_id = (select auth.uid()) or private.is_admin())
);

-- progress_updates
drop policy "progress_updates_select_own_or_admin" on public.progress_updates;
drop policy "progress_updates_insert_own_or_admin" on public.progress_updates;

create policy "progress_updates_select_same_company"
on public.progress_updates for select
to authenticated
using (
  company_id = private.current_company_id()
  and (
    private.is_admin()
    or exists (
      select 1 from public.goal_assignments ga
      where ga.id = assignment_id and ga.employee_id = (select auth.uid())
    )
  )
);

create policy "progress_updates_insert_same_company"
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

-- notifications
drop policy "notifications_select_own_or_admin" on public.notifications;
drop policy "notifications_insert_admin_only" on public.notifications;
drop policy "notifications_update_own" on public.notifications;

create policy "notifications_select_same_company"
on public.notifications for select
to authenticated
using (
  company_id = private.current_company_id()
  and (user_id = (select auth.uid()) or private.is_admin())
);

create policy "notifications_insert_admin_same_company"
on public.notifications for insert
to authenticated
with check (private.is_admin() and company_id = private.current_company_id());

create policy "notifications_update_own_same_company"
on public.notifications for update
to authenticated
using (company_id = private.current_company_id() and user_id = (select auth.uid()))
with check (company_id = private.current_company_id() and user_id = (select auth.uid()));

-- companies: readable only for your own company; no client-side insert/update
-- (companies are only ever created by the handle_new_user trigger)
alter table public.companies enable row level security;
alter table public.companies force row level security;
grant select on public.companies to authenticated;

create policy "companies_select_own"
on public.companies for select
to authenticated
using (id = private.current_company_id());

-- storage: admins may only view evidence belonging to their own company's users
drop policy "evidence_select_own_or_admin" on storage.objects;

create policy "evidence_select_own_or_admin"
on storage.objects for select
to authenticated
using (
  bucket_id = 'certification-evidence'
  and (
    (storage.foldername(name))[1] = (select auth.uid()::text)
    or (
      private.is_admin()
      and exists (
        select 1 from public.profiles p
        where p.id = (storage.foldername(name))[1]::uuid
        and p.company_id = private.current_company_id()
      )
    )
  )
);
