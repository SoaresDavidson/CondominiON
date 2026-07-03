import { apiFetch } from './client'
import type { VoteOption } from './types'

export function listVoteOptions(voteId: number) {
  return apiFetch<VoteOption[]>(`/votes/${voteId}/vote_options`)
}

export function createVoteOption(voteId: number, data: { description: string; position: number }) {
  return apiFetch<VoteOption>(`/votes/${voteId}/vote_options`, {
    method: 'POST',
    body: { vote_option: data },
  })
}

export function updateVoteOption(id: number, data: Partial<{ description: string; position: number }>) {
  return apiFetch<VoteOption>(`/vote_options/${id}`, { method: 'PATCH', body: { vote_option: data } })
}

export function deleteVoteOption(id: number) {
  return apiFetch<void>(`/vote_options/${id}`, { method: 'DELETE' })
}
