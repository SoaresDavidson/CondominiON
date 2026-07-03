import { apiFetch } from './client'
import type { Ballot } from './types'

export function listBallots(voteId: number) {
  return apiFetch<Ballot[]>(`/votes/${voteId}/ballots`)
}

export function castBallot(voteId: number, userId: number, voteOptionId: number) {
  return apiFetch<Ballot>(`/votes/${voteId}/ballots`, {
    method: 'POST',
    body: { user_id: userId, vote_option_id: voteOptionId },
  })
}
