import { apiDownload, apiFetch } from './client'
import type { Meeting, MeetingType, MeetingStatus, MeetingUser } from './types'

export function listMeetings(
  condominiumId: number,
  filters: { title?: string; meeting_type?: MeetingType; status?: MeetingStatus } = {},
) {
  return apiFetch<Meeting[]>(`/condominiums/${condominiumId}/meetings`, { params: filters })
}

export function getMeeting(id: number) {
  return apiFetch<Meeting>(`/meetings/${id}`)
}

export function createMeeting(
  condominiumId: number,
  data: { title: string; starts_at: string; meeting_type: MeetingType },
) {
  return apiFetch<Meeting>(`/condominiums/${condominiumId}/meetings`, {
    method: 'POST',
    body: { meeting: data },
  })
}

export function updateMeeting(
  id: number,
  data: Partial<{ title: string; starts_at: string; meeting_type: MeetingType; status: MeetingStatus }>,
) {
  return apiFetch<Meeting>(`/meetings/${id}`, { method: 'PATCH', body: { meeting: data } })
}

export function deleteMeeting(id: number) {
  return apiFetch<void>(`/meetings/${id}`, { method: 'DELETE' })
}

export function startMeeting(id: number) {
  return apiFetch<Meeting>(`/meetings/${id}/start`, { method: 'PATCH' })
}

export function finishMeeting(id: number) {
  return apiFetch<Meeting>(`/meetings/${id}/finish`, { method: 'PATCH' })
}

export function cancelMeeting(id: number) {
  return apiFetch<Meeting>(`/meetings/${id}/cancel`, { method: 'PATCH' })
}

export function joinMeeting(id: number, userId: number) {
  return apiFetch<MeetingUser>(`/meetings/${id}/join`, { method: 'POST', body: { user_id: userId } })
}


export function leaveMeeting(id: number, userId: number) {
  return apiFetch<MeetingUser>(`/meetings/${id}/leave`, { method: 'POST', body: { user_id: userId } })
}

export function sendInvitations(id: number, totalRecipients: number) {
  return apiFetch<{ meeting_id: number; status: string; total_recipients: number }>(
    `/meetings/${id}/send_invitations`,
    { method: 'POST', body: { total_recipients: totalRecipients } },
  )
}

export function downloadAccessLog(id: number) {
  return apiDownload(`/meetings/${id}/access_log`, `log-reuniao-${id}.html`)
}

export function downloadManagerialReport(id: number) {
  return apiDownload(`/meetings/${id}/managerial_report`, `relatorio-gerencial-reuniao-${id}.pdf`)
}
