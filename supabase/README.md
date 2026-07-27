# Supabase setup

This project connects to Supabase entirely through the Supabase MCP server
(`.mcp.json` at the repo root) — there's no local Supabase CLI or dev stack.
The files in `migrations/` are the version-controlled record of what's been
applied to the remote project (ref `osdzdrzcvoenpeyrwjfq`) via the MCP
`apply_migration` tool; they aren't run automatically and there's no local
database to push them to. If you ever reinstall the CLI, `supabase link`
against this project ref and its migration history should line up with
these filenames.

| Migration | What it does |
|---|---|
| `20260727002301_schema_and_enums.sql` | Tables: `profiles`, `goals`, `goal_assignments`, `progress_updates`, `notifications` + enums/indexes |
| `20260727002322_functions_and_triggers.sql` | Auto-creates a `profiles` row on signup; auto-notifies on assignment/completion; keeps `goal_assignments` in sync with the latest `progress_updates` row |
| `20260727002339_rls_policies.sql` | Row-level security — employees see/edit only their own records, admins see/manage everything, `progress_updates` is append-only |
| `20260727002348_storage_setup.sql` | Private `certification-evidence` storage bucket + per-user folder policies |
| `20260727002513_lock_down_trigger_function_execute.sql` | Security-advisor fix: revoke public `EXECUTE` on the two `SECURITY DEFINER` trigger functions |
| `20260727002619_revoke_trigger_function_execute_grants.sql` | Same fix, covering the `anon`/`authenticated` default-privilege grants the first pass missed |
| `20260727002723_fkey_covering_indexes.sql` | Performance-advisor fix: covering indexes for two previously unindexed foreign keys |

Ran `get_advisors` (security + performance) after applying everything —
clean except for expected "unused index" info notices on empty tables.

## What's not done yet

The React app still runs entirely on the in-memory mock store
(`src/store/dataStore.ts`) — it does not talk to Supabase yet. Swapping the
Zustand store's mock CRUD actions for real Supabase queries (plus wiring
Supabase Auth into the login screen) is a separate follow-up task.
