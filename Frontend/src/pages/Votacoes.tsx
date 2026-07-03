import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { listVotes, startVote } from '../api/votes'
import { getMeeting } from '../api/meetings'
import { useAuth } from '../context/useAuth'
import { Button, Card, ErrorBanner, LoadingState, PageHeader, Select, StatusBadge, Table } from '../components/ui'
import { responseTypeLabels, visibilityLabels, voteStatusLabels } from '../utils/labels'
import { ApiError } from '../api/client'
import type { VoteStatus } from '../api/types'

export function Votacoes() {
  const { meetingId } = useParams<{ meetingId: string }>()
  const id = Number(meetingId)
  const navigate = useNavigate()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<VoteStatus | ''>('')

  const { data: meeting } = useQuery({ queryKey: ['meeting', id], queryFn: () => getMeeting(id), enabled: Number.isFinite(id) })
  const { data: votes, isLoading, error } = useQuery({
    queryKey: ['votes', id, status],
    queryFn: () => listVotes(id, { status: status || undefined }),
    enabled: Number.isFinite(id),
  })

  const startMutation = useMutation({
    mutationFn: startVote,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['votes', id] }),
  })

  const isAdmin = user?.role === 'administrator'

  return (
    <>
      <PageHeader eyebrow="Gestao de votacoes" title={meeting ? `Votacoes - ${meeting.title}` : 'Votacoes cadastradas'} />
      <ErrorBanner message={error instanceof ApiError ? error.message : startMutation.error instanceof ApiError ? startMutation.error.message : null} />
      <Card>
        <div className="grid gap-3 lg:grid-cols-5">
          <Select value={status} onChange={(event) => setStatus(event.target.value as VoteStatus | '')}>
            <option value="">Todos os status</option>
            {Object.entries(voteStatusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>
        <div className="mt-4 flex gap-2">
          {isAdmin && <Button onClick={() => navigate(`/reunioes/${id}/votacoes/nova`)}>Nova votacao</Button>}
          <Button variant="secondary" onClick={() => navigate(`/reunioes/${id}`)}>
            Voltar para a reuniao
          </Button>
        </div>
      </Card>
      <Card className="mt-4 p-0">
        {isLoading ? (
          <div className="p-4">
            <LoadingState />
          </div>
        ) : (
          <Table
            headers={['Pauta / Enunciado', 'Tipo', 'Visib.', 'Status', 'Comandos']}
            rows={(votes ?? []).map((vote) => [
              vote.statement,
              responseTypeLabels[vote.response_type],
              visibilityLabels[vote.visibility],
              <StatusBadge value={voteStatusLabels[vote.status]} />,
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" onClick={() => navigate(`/votacoes/${vote.id}`)}>
                  Visualizar
                </Button>
                {isAdmin && vote.status === 'waiting' && (
                  <Button onClick={() => startMutation.mutate(vote.id)}>Iniciar</Button>
                )}
                {vote.status === 'active' && <Button onClick={() => navigate(`/votacoes/${vote.id}/votar`)}>Votar</Button>}
                {vote.status === 'closed' && (
                  <Button variant="secondary" onClick={() => navigate(`/votacoes/${vote.id}/resultado`)}>
                    Resultado
                  </Button>
                )}
              </div>,
            ])}
          />
        )}
      </Card>
    </>
  )
}
