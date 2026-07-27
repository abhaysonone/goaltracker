// Creates a login-capable employee account. Runs server-side because it needs the
// service_role key (Admin API) to create an auth.users row — something the browser
// client must never hold.
//
// Deployed with verify_jwt=false: the platform-level verify_jwt check rejects the
// browser's CORS preflight (OPTIONS, no Authorization header) with 401 before this
// code ever runs, which blocks the real POST from being sent at all. So auth is
// verified manually below instead (callerClient.auth.getUser()), and CORS/OPTIONS
// are handled explicitly.
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return json({ error: 'Missing authorization' }, 401)
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const {
      data: { user: caller },
      error: callerError,
    } = await callerClient.auth.getUser()
    if (callerError || !caller) {
      return json({ error: 'Unauthorized' }, 401)
    }

    const admin = createClient(supabaseUrl, serviceRoleKey)

    const { data: callerProfile, error: callerProfileError } = await admin
      .from('profiles')
      .select('role, company_id')
      .eq('id', caller.id)
      .single()
    if (callerProfileError || callerProfile?.role !== 'admin') {
      return json({ error: 'Forbidden' }, 403)
    }

    const body = await req.json()
    const { name, email, role, department, managerId, avatarColor, redirectTo } = body ?? {}
    if (!name || !email || !department) {
      return json({ error: 'Missing required fields' }, 400)
    }

    // invited_company_id goes in app_metadata, not user_metadata: only the Admin API
    // (this service-role client) can set app_metadata, so handle_new_user's trigger
    // can trust it — a public signUp() call can never forge its way into a company
    // this way, since it can only ever set user_metadata.
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { name },
      app_metadata: { invited_company_id: callerProfile.company_id },
    })
    if (createError || !created.user) {
      return json({ error: createError?.message ?? 'Failed to create user' }, 400)
    }

    // The on_auth_user_created trigger already inserted a bare profiles row (default
    // role 'employee', company_id from invited_company_id above) — fill in the rest
    // that HR specified.
    const { error: updateError } = await admin
      .from('profiles')
      .update({
        role: role ?? 'employee',
        department,
        manager_id: managerId ?? null,
        ...(avatarColor && { avatar_color: avatarColor }),
      })
      .eq('id', created.user.id)
    if (updateError) {
      return json({ error: updateError.message }, 400)
    }

    // createUser above sets no password — this is the account's only way in.
    // Uses the same public resetPasswordForEmail flow as the login page's own
    // "Forgot password?", which works regardless of whether a password was ever
    // set, so it doubles as this account's initial password-setup link.
    const anon = createClient(supabaseUrl, anonKey)
    const { error: resetError } = await anon.auth.resetPasswordForEmail(email, {
      redirectTo: redirectTo || supabaseUrl,
    })
    if (resetError) {
      // Account exists and is usable once emailed manually; don't fail the whole
      // request over the notification step.
      console.error('Failed to send password-setup email:', resetError.message)
    }

    return json({ id: created.user.id })
  } catch (err) {
    return json({ error: String(err) }, 500)
  }
})
