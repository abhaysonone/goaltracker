import { create } from 'zustand'
import { supabase } from '../lib/supabaseClient'

interface AuthState {
  currentUserId: string | null
  initialized: boolean
  // True between clicking a password-reset/invite email link and successfully
  // calling updatePassword. While true, App renders the set-new-password screen
  // instead of the normal dashboard, even though a (recovery) session exists.
  passwordRecovery: boolean
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
