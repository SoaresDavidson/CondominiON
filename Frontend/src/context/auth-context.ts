import { createContext } from 'react'
import type { StoredUser } from '../api/tokenStore'

export interface AuthContextValue {
  user: StoredUser | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<StoredUser>
  loginWithAccessToken: (accessToken: string) => Promise<StoredUser>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
