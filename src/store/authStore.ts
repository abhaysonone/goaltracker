import { create } from 'zustand'
import { supabase } from '../lib/supabaseClient'

interface AuthState {
  currentUserId: string | null
  initialized: boolean
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
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>(() => ({
  currentUserId: null,
  initialized: false,
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
  logout: async () => {
    await supabase.auth.signOut()
  },
}))

// Fires immediately with the current session (INITIAL_SESSION) and again on every
// sign-in/sign-out, so this single subscription covers both initial load and updates.
supabase.auth.onAuthStateChange((_event, session) => {
  useAuthStore.setState({ currentUserId: session?.user.id ?? null, initialized: true })
})
