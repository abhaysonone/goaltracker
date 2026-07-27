import { create } from 'zustand'

const STORAGE_KEY = 'egt-current-user'

interface AuthState {
  currentUserId: string | null
  login: (userId: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  currentUserId: sessionStorage.getItem(STORAGE_KEY),
  login: (userId) => {
    sessionStorage.setItem(STORAGE_KEY, userId)
    set({ currentUserId: userId })
  },
  logout: () => {
    sessionStorage.removeItem(STORAGE_KEY)
    set({ currentUserId: null })
  },
}))
