import { create } from 'zustand'
import { supabase } from '../lib/supabaseClient'

interface AuthState {
  currentUserId: string | null
  initialized: boolean
  // True between clicking a password-reset/invite email link and successfully
  // calling updatePassword. While true, App renders the set-new-password screen
  // instead of the normal dashboard, even though a (recovery) session exists.
  passwordRecovery: boolean
  // Set when the URL carries an auth error (e.g. #error=access_denied&error_code=
  // otp_expired) instead of a session — most commonly a corporate email scanner
  // prefetching the link and burning its one-time token before the user clicks
  // it (see supabase.com/docs/guides/auth/redirect-urls). Without this, that
  // case silently drops the user on the plain sign-in form with no explanation.
  urlError: string | null
  clearUrlError: () => void
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  // Returns needsConfirmation: true when Supabase requires clicking an email link
  // before a session is granted (signUp() then returns no session, error: null).
  // Pass companyName to found a new company (email domain becomes that company's
  // domain); omit it to join whatever company is already registered for that
  // domain — the handle_new_user trigger enforces both, this just picks the branch.
  signUp: (
    email: string,
    password: string,
    name: string,
    companyName?: string,
  ) => Promise<{ error: string | null; needsConfirmation: boolean }>
  // Also how a passwordless admin-created account gets its first password —
  // the recovery flow works regardless of whether one was ever set.
  requestPasswordReset: (email: string) => Promise<{ error: string | null }>
  updatePassword: (newPassword: string) => Promise<{ error: string | null }>
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>(() => ({
  currentUserId: null,
  initialized: false,
  passwordRecovery: false,
  urlError: null,
  clearUrlError: () => useAuthStore.setState({ urlError: null }),
  signIn: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message ?? null }
  },
  signUp: async (email, password, name, companyName) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, ...(companyName && { company_name: companyName }) },
        emailRedirectTo: window.location.origin,
      },
    })
    if (error) return { error: error.message, needsConfirmation: false }
    return { error: null, needsConfirmation: !data.session }
  },
  requestPasswordReset: async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    })
    return { error: error?.message ?? null }
  },
  updatePassword: async (newPassword) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (!error) useAuthStore.setState({ passwordRecovery: false })
    return { error: error?.message ?? null }
  },
  logout: async () => {
    await supabase.auth.signOut()
  },
}))

// Auth redirects (recovery, invite, signup confirmation) put their result in the
// URL as either a hash (#error=...) or query string (?error=...) depending on
// flow. supabase-js consumes a *successful* one via detectSessionInUrl and fires
// onAuthStateChange below, but a failed one (invalid/expired/already-used token)
// is left for the app to notice itself — so check for it directly, once, before
// anything else runs, and strip it from the URL so a refresh doesn't re-show it.
function checkUrlForAuthError(): string | null {
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  const queryParams = new URLSearchParams(window.location.search)
  const description = hashParams.get('error_description') || queryParams.get('error_description')
  const errorCode = hashParams.get('error_code') || queryParams.get('error_code')
  if (!description && !errorCode) return null

  window.history.replaceState(null, '', window.location.pathname)
  return (description || errorCode || 'This link is invalid or has expired.').replace(/\+/g, ' ')
}

const initialUrlError = checkUrlForAuthError()
if (initialUrlError) {
  useAuthStore.setState({ urlError: initialUrlError })
}

// Fires immediately with the current session (INITIAL_SESSION) and again on every
// sign-in/sign-out/recovery, so this single subscription covers initial load and
// all updates. PASSWORD_RECOVERY still carries a real session (so currentUserId
// is set like any other sign-in), but passwordRecovery gates App into the
// set-new-password screen until updatePassword succeeds.
supabase.auth.onAuthStateChange((event, session) => {
  useAuthStore.setState({
    currentUserId: session?.user.id ?? null,
    initialized: true,
    ...(event === 'PASSWORD_RECOVERY' && { passwordRecovery: true }),
  })
})
