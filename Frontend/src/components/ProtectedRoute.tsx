import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import type { Role } from '../api/types'

export function ProtectedRoute({ roles, children }: { roles?: Role[]; children: ReactNode }) {
  const { isAuthenticated, user } = useAuth()

  if (!isAuthenticated || !user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/condominios" replace />

  return <>{children}</>
}
