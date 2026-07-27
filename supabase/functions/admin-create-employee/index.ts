// Creates a login-capable employee account. Runs server-side because it needs the
// service_role key (Admin API) to create an auth.users row — something the browser
// client must never hold. Verifies the caller is signed in (platform-enforced via
// verify_jwt) AND is an admin (checked here against profiles.role) before doing anything.
import { createClient } from 'jsr:@supabase/supabase-js@2'

Deno.serve(async (req: Request) => {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), { status: 401 })
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
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }

    const admin = createClient(supabaseUrl, serviceRoleKey)

    const { data: callerProfile, error: callerProfileError } = await admin
      .from('profiles')
      .select('role, company_id')
      .eq('id', caller.id)
      .single()
    if (callerProfileError || callerProfile?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 })
    }

    const body = await req.json()
    const { name, email, role, department, managerId, avatarColor } = body ?? {}
    if (!name || !email || !department) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 })
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
      return new Response(JSON.stringify({ error: createError?.message ?? 'Failed to create user' }), {
        status: 400,
      })
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
      return new Response(JSON.stringify({ error: updateError.message }), { status: 400 })
    }

    return new Response(JSON.stringify({ id: created.user.id }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
})
