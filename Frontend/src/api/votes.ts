import { apiFetch } from './client'
import type { ResponseType, Visibility, Vote, VoteResult, VoteStatus } from './types'

export function listVotes(
  meetingId: number,
  filters: { status?: VoteStatus; response_type?: ResponseType; visibility?: Visibility } = {},
) {
  return apiFetch<Vote[]>(`/meetings/${meetingId}/votes`, { params: filters })
}

export function getVote(id: number) {
  return apiFetch<Vote>(`/votes/${id}`)
}

export interface CreateVotePayload {
  agenda_item_id: number
  statement: string
  response_type: ResponseType
  visibility: Visibility
  duration_minutes: number
}

export function createVote(meetingId: number, data: CreateVotePayload, options?: string[]) {
  return apiFetch<Vote>(`/meetings/${meetingId}/votes`, {
    method: 'POST',
    body: { vote: data, options },
  })
}

export function updateVote(id: number, data: Partial<CreateVotePayload>) {
  return apiFetch<Vote>(`/votes/${id}`, { method: 'PATCH', body: { vote: data } })
}

export function deleteVote(id: number) {
  return apiFetch<void>(`/votes/${id}`, { method: 'DELETE' })
}

export function startVote(id: number) {
  return apiFetch<Vote>(`/votes/${id}/start`, { method: 'PATCH' })
}

export function finishVote(id: number) {
  return apiFetch<Vote>(`/votes/${id}/finish`, { method: 'PATCH' })
}

export function getVoteResult(id: number) {
  return apiFetch<VoteResult>(`/votes/${id}/result`)
}
