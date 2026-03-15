import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import Cookies from 'js-cookie'
import { User } from '@/types'
import { authApi, setAuthTokens, clearAuth } from '@/lib/api'

interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean

  login: (email: string, password: string) => Promise<void>
  register: (data: {
    username: string
    email: string
    password: string
    password2: string
    role?: string
  }) => Promise<void>
  logout: () => Promise<void>
  fetchMe: () => Promise<void>
  updateUser: (updates: Partial<User>) => void
  addXP: (amount: number) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      isAuthenticated: !!(Cookies.get('access_token') || Cookies.get('refresh_token')),

      login: async (email, password) => {
        set({ isLoading: true })
        try {
          const { data } = await authApi.login(email, password)
          setAuthTokens(data.access, data.refresh)
          set({ isAuthenticated: true })
          await get().fetchMe()
        } finally {
          set({ isLoading: false })
        }
      },

      register: async (formData) => {
        set({ isLoading: true })
        try {
          await authApi.register(formData)
          await get().login(formData.email, formData.password)
        } finally {
          set({ isLoading: false })
        }
      },

      logout: async () => {
        const refresh = Cookies.get('refresh_token')
        if (refresh) {
          try { await authApi.logout(refresh) } catch {}
        }
        clearAuth()
        set({ user: null, isAuthenticated: false })
      },

      fetchMe: async () => {
        try {
          const { data } = await authApi.me()
          set({ user: data, isAuthenticated: true })
        } catch {
          clearAuth()
          set({ user: null, isAuthenticated: false })
        }
      },

      updateUser: (updates) => {
        const current = get().user
        if (current) set({ user: { ...current, ...updates } })
      },

      addXP: (amount) => {
        const user = get().user
        if (!user) return
        const newXP = user.xp + amount
        const newLevel = Math.floor(newXP / 500) + 1
        set({ user: { ...user, xp: newXP, level: newLevel } })
      },
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
)
