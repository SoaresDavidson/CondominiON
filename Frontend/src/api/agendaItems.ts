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

export function createAgendaItemWithAttachment(
  meetingId: number,
  data: { title: string; description?: string; position?: number; attachment?: File | null },
) {
  const formData = agendaItemFormData(data)
  return apiFetch<AgendaItem>(`/meetings/${meetingId}/agenda_items`, { method: 'POST', body: formData })
}

export function updateAgendaItem(
  id: number,
  data: Partial<{ title: string; description: string; attachment_url: string; position: number }>,
) {
  return apiFetch<AgendaItem>(`/agenda_items/${id}`, { method: 'PATCH', body: { agenda_item: data } })
}

export function updateAgendaItemWithAttachment(
  id: number,
  data: Partial<{ title: string; description: string; position: number; attachment: File | null; remove_attachment: boolean }>,
) {
  const formData = agendaItemFormData(data)
  if (data.remove_attachment) formData.append('remove_attachment', 'true')
  return apiFetch<AgendaItem>(`/agenda_items/${id}`, { method: 'PATCH', body: formData })
}

export function deleteAgendaItem(id: number) {
  return apiFetch<void>(`/agenda_items/${id}`, { method: 'DELETE' })
}

function agendaItemFormData(data: Partial<{ title: string; description: string; position: number; attachment: File | null }>) {
  const formData = new FormData()
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || value === null || key === 'attachment') continue
    formData.append(`agenda_item[${key}]`, String(value))
  }
  if (data.attachment) formData.append('agenda_item[attachment]', data.attachment)
  return formData
}
