import { create } from 'zustand'
import { supabase } from '../lib/supabaseClient'

interface AuthState {
  currentUserId: string | null
  initialized: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>(() => ({
  currentUserId: null,
  initialized: false,
  signIn: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message ?? null }
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
