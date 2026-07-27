alter table public.profiles alter column company_id set not null;
alter table public.goals alter column company_id set not null;
alter table public.goal_assignments alter column company_id set not null;
alter table public.progress_updates alter column company_id set not null;
alter table public.notifications alter column company_id set not null;
