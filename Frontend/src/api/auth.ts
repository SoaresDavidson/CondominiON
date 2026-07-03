import { apiFetch } from './client'
import type { StoredUser } from './tokenStore'

export interface LoginResponse {
  token: string
  user: StoredUser
}

export function login(email: string, password: string) {
  return apiFetch<LoginResponse>('/sessions', { method: 'POST', body: { email, password }, skipAuth: true })
}

export function logout() {
  return apiFetch<void>('/sessions', { method: 'DELETE' })
}

export function exchangeMeetingAccess(accessToken: string) {
  return apiFetch<LoginResponse>('/meeting_accesses', {
    method: 'POST',
    body: { access_token: accessToken },
    skipAuth: true,
  })
}

export function requestPasswordReset(email: string) {
  return apiFetch<{ message: string; reset_token?: string }>('/password_resets', {
    method: 'POST',
    body: { email },
    skipAuth: true,
  })
}

export function redefinePassword(token: string, password: string) {
  return apiFetch<{ message: string }>(`/password_resets/${token}`, {
    method: 'PATCH',
    body: { password },
    skipAuth: true,
  })
}
