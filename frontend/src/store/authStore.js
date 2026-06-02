import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      hydrated: false,

      login({ access, refresh, user }) {
        set({ accessToken: access, refreshToken: refresh, user })
      },

      logout() {
        set({ accessToken: null, refreshToken: null, user: null })
      },

      setAccessToken(access) {
        set({ accessToken: access })
      },
    }),
    {
      name: 'auth',
      // Only persist refresh token and user — access token is short-lived
      partialize: (state) => ({
        refreshToken: state.refreshToken,
        user: state.user,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true
      },
    }
  )
)
