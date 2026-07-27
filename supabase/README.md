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

## Frontend integration

`src/lib/supabaseClient.ts`, `src/store/authStore.ts`, and `src/store/dataStore.ts`
are wired to the real project: auth uses `supabase.auth` sessions, and every
CRUD action in the data store reads/writes the tables above (mutations refetch
everything afterward rather than hand-computing derived state, since triggers
do things like sync `goal_assignments` and create notifications server-side).
`src/types/supabase.ts` holds the MCP-generated `Database` type; regenerate it
with `generate_typescript_types` after any schema change.

Creating a new employee account needs the Auth Admin API (service_role), which
can't run in the browser — that goes through the `admin-create-employee` edge
function (`supabase/functions/admin-create-employee/`) instead, deployed via
MCP `deploy_edge_function`. It checks the caller is signed in and has
`profiles.role = 'admin'` before creating the auth user and updating their
profile.

## Seeding demo data

```bash
cp .env.example .env.local   # already done; just fill in SUPABASE_SERVICE_ROLE_KEY
npm run db:seed
```

`scripts/seed.mjs` needs `SUPABASE_SERVICE_ROLE_KEY` (Project Settings -> API
-> service_role) to create real Auth users via the Admin API — this key never
goes in frontend code and stays script-only. It creates the same 11 demo
users / 10 goals / 22 assignments / 9 progress-update rows the old mock store
shipped with, all sharing the password `Demo-Password-123!` (override via
`SEED_DEMO_PASSWORD`). Safe to re-run — it looks up existing users/goals/
assignments by natural key before inserting.

## What's not done yet

- **Bootstrapping the first admin.** Every signup defaults to `role =
  'employee'` (RLS only lets admins change `profiles.role`), so the very
  first admin has to be flipped manually via SQL — the seed script handles
  this for the demo users, but a fresh non-seeded project needs it done by
  hand once.
- **Evidence file upload.** Nothing in the UI calls the
  `certification-evidence` storage bucket yet — `EmployeeGoals.tsx`'s file
  picker only stores a filename string, it doesn't actually upload.
- **`due_soon` / `overdue` notifications.** The `goal_assigned` and
  `goal_completed` notification types are trigger-generated as a side effect
  of inserts; there's no scheduled job (e.g. `pg_cron`) yet to generate
  `due_soon`/`overdue` notifications as due dates approach or pass.
