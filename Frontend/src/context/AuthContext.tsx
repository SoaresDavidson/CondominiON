import { useMemo, useState, type ReactNode } from 'react'
import { exchangeMeetingAccess, login as loginRequest, logout as logoutRequest } from '../api/auth'
import { clearSession, getStoredUser, getToken, setSession, type StoredUser } from '../api/tokenStore'
import { AuthContext, type AuthContextValue } from './auth-context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<StoredUser | null>(() => (getToken() ? getStoredUser() : null))

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      async login(email, password) {
        const response = await loginRequest(email, password)
        setSession(response.token, response.user)
        setUser(response.user)
        return response.user
      },
      async loginWithAccessToken(accessToken) {
        const response = await exchangeMeetingAccess(accessToken)
        setSession(response.token, response.user)
        setUser(response.user)
        return response.user
      },
      async logout() {
        try {
          await logoutRequest()
        } finally {
          clearSession()
          setUser(null)
        }
      },
    }),
    [user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
