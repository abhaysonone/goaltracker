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
| `20260727014950_add_companies_and_company_scoping.sql` | Multi-tenancy: `companies` table, `company_id` on every other table (server-derived via `BEFORE INSERT` triggers, never client-supplied), `private.current_company_id()` helper |
| `20260727015001_company_id_not_null.sql` | Enforces `company_id` `NOT NULL` everywhere once the triggers above are in place |
| `20260727015014_handle_new_user_multi_tenant.sql` | Rewrites the signup trigger with the three-case company resolution described below |
| `20260727015035_company_scoped_rls_policies.sql` | Every policy (profiles/goals/goal_assignments/progress_updates/notifications/storage) now also requires `company_id = private.current_company_id()` |

Ran `get_advisors` (security + performance) after applying everything —
clean except for expected "unused index" info notices on empty tables.

## Multi-tenancy

Every company's data is isolated at the database level, not just filtered in
the UI. `companies` holds one row per registered company (`name`, unique
`domain`); every other table has a `company_id` column that RLS checks
against `private.current_company_id()` (the caller's own `profiles.company_id`,
resolved via the same recursion-safe `SECURITY DEFINER` pattern as
`private.is_admin()`). `company_id` is **never accepted from the client** —
`BEFORE INSERT` triggers derive it from context (a goal's `company_id` comes
from its creator's profile; an assignment's from its goal, while also
rejecting the insert if the goal/employee/assigner aren't all in the same
company; etc.), so there's no way to write a cross-company row even by
directly crafting a Supabase client call.

`handle_new_user` decides which company a new signup belongs to, in this
priority order:

1. **`raw_app_meta_data.invited_company_id`** — set only by the
   `admin-create-employee` edge function via the service_role Admin API. A
   public `signUp()` call can only ever set `user_metadata`, never
   `app_metadata`, so a self-registering user cannot forge this to jump into
   an arbitrary company. Used when an admin adds an employee directly.
2. **`raw_user_meta_data.company_name`** (client-supplied via the signup
   form's "I'm setting up a new company" checkbox) — registers a *new*
   company. The domain is derived from the signer's own email
   (`split_part(email, '@', 2)`), never manually typed, so nobody can claim a
   domain by just typing it in. The signer becomes that company's `admin`.
   Fails (rolling back the whole signup) if the domain is already registered.
3. **Otherwise** — regular employee signup. Looks up an existing company
   whose `domain` matches the signer's email domain and joins it as
   `employee`. Fails (rolling back the whole signup, no orphaned auth user)
   if no company is registered for that domain yet.

Verified live (see conversation/commit history): founding-admin signup
creates the company + admin profile correctly; a second signup on the same
domain joins that company as an employee; a signup on an unregistered domain
is rejected and rolls back cleanly with no orphaned `auth.users` row; two
different companies' data doesn't cross-contaminate `profiles`.

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

## Self-service signup

`LoginPage.tsx` has a Sign up / Sign in toggle. New signups go through
`supabase.auth.signUp()` (see `authStore.ts`), which — on hosted Supabase
projects, confirmation is required by default — sends a confirmation email
and returns no session until the user clicks the link. The UI reflects this:
it shows a "check your email" screen instead of trying to log the user in
immediately. `handle_new_user` still fires as soon as the (unconfirmed)
`auth.users` row is created, so the `profiles` row exists right away — role
is always either the safe default `employee` (joining an existing company)
or `admin` (only when founding a brand new one, see Multi-tenancy below),
never something the signup payload gets to claim directly. `department`
defaults to `Unassigned` either way.

Signup is domain-gated per the multi-tenancy section above: self-registering
as a plain employee only works if some admin has already founded a company
for that email domain.

Note: Supabase's own email sending has a rate limit (hit this a few times
while testing — "email rate limit exceeded"). It fails the whole signup
atomically when that happens (no orphaned user), so it's safe, just
occasionally slow to test against repeatedly.

Two things need verifying in the dashboard that no MCP tool here can check
or set:
- **Authentication -> Providers -> Email -> "Confirm email"** should be on
  (this is the hosted-project default, and is what makes the flow above
  meaningful — if it's off, `signUp()` returns a session immediately and the
  "check your email" screen never shows).
- **Authentication -> URL Configuration -> Redirect URLs** needs to include
  wherever the app actually runs (`http://localhost:5173` for local dev, plus
  any deployed URL later) — `emailRedirectTo` is set dynamically to
  `window.location.origin`, but Supabase will only honor it if that origin is
  on the allowlist.

## Password recovery / admin-created employee passwords

`admin-create-employee` creates the auth user via the Admin API with no
password at all — there's no field for one in the UI, and there shouldn't
be (an admin choosing a new hire's password would mean the admin knows it).
Instead, right after creating the account it calls the same public
`supabase.auth.resetPasswordForEmail()` the login page's "Forgot password?"
uses, which works fine on an account that's never had a password — it's the
account's *first* password-setup step, not just a reset.

Clicking that email link brings the user back to the app with a
`PASSWORD_RECOVERY` session (`authStore.ts` sets `passwordRecovery: true` on
that specific event). `App.tsx` checks this before anything else and renders
`SetNewPasswordPage` instead of the normal dashboard, so the user can't land
in the app without actually setting a password first. Submitting there calls
`supabase.auth.updateUser({ password })`, which clears the flag and lets
normal routing resume.

Signing up again with an email that's already registered correctly returns
"User already registered" — that's not a bug, it means the account already
exists (e.g. an admin created it). The UI now suggests "Forgot password?" in
that specific case.

Gotcha hit while wiring this up: `admin-create-employee` was originally
deployed with `verify_jwt=true`. Supabase's platform-level `verify_jwt` check
runs before the function code and rejects the browser's CORS preflight
(`OPTIONS`, no `Authorization` header) with 401 — which blocks the real POST
from ever being sent. Fixed by deploying with `verify_jwt=false` and doing
auth verification manually inside the function (already done via
`callerClient.auth.getUser()`), plus handling `OPTIONS`/CORS headers
explicitly. See [Authorization headers](https://supabase.com/docs/guides/functions/auth-headers)
in the Edge Functions docs.

## Seeding demo data

```bash
cp .env.example .env.local   # already done; just fill in SUPABASE_SERVICE_ROLE_KEY
npm run db:seed
```

`scripts/seed.mjs` needs `SUPABASE_SERVICE_ROLE_KEY` (Project Settings -> API
-> service_role) to create real Auth users via the Admin API — this key never
goes in frontend code and stays script-only. It creates one "Kyyba" company
(domain `kyyba.com`) plus the same 11 demo users / 10 goals / 22 assignments
/ 9 progress-update rows the old mock store shipped with, all sharing the
password `Demo-Password-123!` (override via `SEED_DEMO_PASSWORD`) and all
assigned to that company via `invited_company_id` (the same trusted
`app_metadata` channel `admin-create-employee` uses). Safe to re-run — it
looks up the existing company/users/goals/assignments by natural key before
inserting.

## What's not done yet

- **Evidence file upload.** Nothing in the UI calls the
  `certification-evidence` storage bucket yet — `EmployeeGoals.tsx`'s file
  picker only stores a filename string, it doesn't actually upload.
- **`due_soon` / `overdue` notifications.** The `goal_assigned` and
  `goal_completed` notification types are trigger-generated as a side effect
  of inserts; there's no scheduled job (e.g. `pg_cron`) yet to generate
  `due_soon`/`overdue` notifications as due dates approach or pass.
