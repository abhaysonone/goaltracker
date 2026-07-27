-- Supabase auto-grants EXECUTE to anon/authenticated on new public-schema functions via
-- default privileges, separate from the plain PUBLIC grant revoked in the prior migration.
-- The security advisor flagged both handle_new_user() and sync_assignment_from_progress()
-- as callable via /rest/v1/rpc/<fn> as a result; revoke explicitly for each role.
revoke all on function public.handle_new_user() from anon, authenticated, public;
revoke all on function public.sync_assignment_from_progress() from anon, authenticated, public;
