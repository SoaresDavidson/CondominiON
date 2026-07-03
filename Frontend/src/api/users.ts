import { apiFetch } from './client'
import type { Role, User } from './types'

export function listUsers(condominiumId: number, filters: { name?: string; email?: string; role?: Role } = {}) {
  return apiFetch<User[]>(`/condominiums/${condominiumId}/users`, { params: filters })
}

export function getUser(id: number) {
  return apiFetch<User>(`/users/${id}`)
}

export interface CreateUserPayload {
  name: string
  email: string
  role: Role
  lots_count?: number
  houses_count?: number
  delinquent?: boolean
  proxy_for_id?: number
  meeting_id?: number
}

export function createUser(condominiumId: number, data: CreateUserPayload) {
  return apiFetch<User>(`/condominiums/${condominiumId}/users`, { method: 'POST', body: { user: data } })
}

export function updateUser(
  id: number,
  data: Partial<{
    name: string
    email: string
    lots_count: number
    houses_count: number
    active: boolean
    delinquent: boolean
  }>,
) {
  return apiFetch<User>(`/users/${id}`, { method: 'PATCH', body: { user: data } })
}

export function deactivateUser(id: number) {
  return apiFetch<User>(`/users/${id}`, { method: 'DELETE' })
}
