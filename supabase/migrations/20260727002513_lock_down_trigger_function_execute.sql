-- These are SECURITY DEFINER trigger functions, not meant to be called directly.
-- Trigger firing doesn't require the invoking role to hold EXECUTE, so it's safe to revoke.
revoke all on function public.handle_new_user() from public;
revoke all on function public.sync_assignment_from_progress() from public;
