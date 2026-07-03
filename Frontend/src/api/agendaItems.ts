import { apiFetch } from './client'
import type { AgendaItem } from './types'

export function listAgendaItems(meetingId: number) {
  return apiFetch<AgendaItem[]>(`/meetings/${meetingId}/agenda_items`)
}

export function getAgendaItem(id: number) {
  return apiFetch<AgendaItem>(`/agenda_items/${id}`)
}

export function createAgendaItem(
  meetingId: number,
  data: { title: string; description?: string; attachment_url?: string; position?: number },
) {
  return apiFetch<AgendaItem>(`/meetings/${meetingId}/agenda_items`, {
    method: 'POST',
    body: { agenda_item: data },
  })
}

export function updateAgendaItem(
  id: number,
  data: Partial<{ title: string; description: string; attachment_url: string; position: number }>,
) {
  return apiFetch<AgendaItem>(`/agenda_items/${id}`, { method: 'PATCH', body: { agenda_item: data } })
}

export function deleteAgendaItem(id: number) {
  return apiFetch<void>(`/agenda_items/${id}`, { method: 'DELETE' })
}
