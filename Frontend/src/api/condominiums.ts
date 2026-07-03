import { apiFetch } from './client'
import type { Condominium } from './types'

export function listCondominiums() {
  return apiFetch<Condominium[]>('/condominiums')
}

export function getCondominium(id: number) {
  return apiFetch<Condominium>(`/condominiums/${id}`)
}

export function createCondominium(data: { name: string; address?: string }) {
  return apiFetch<Condominium>('/condominiums', { method: 'POST', body: { condominium: data } })
}

export function updateCondominium(id: number, data: Partial<{ name: string; address: string }>) {
  return apiFetch<Condominium>(`/condominiums/${id}`, { method: 'PATCH', body: { condominium: data } })
}

export function deleteCondominium(id: number) {
  return apiFetch<void>(`/condominiums/${id}`, { method: 'DELETE' })
}
