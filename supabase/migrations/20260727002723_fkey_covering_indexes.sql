-- Flagged by the performance advisor: unindexed foreign keys.
create index goal_assignments_assigned_by_idx on public.goal_assignments(assigned_by);
create index progress_updates_updated_by_idx on public.progress_updates(updated_by);
