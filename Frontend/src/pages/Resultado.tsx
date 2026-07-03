import { useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { getVoteResult } from '../api/votes'
import { Button, Card, ErrorBanner, LoadingState, PageHeader, Table } from '../components/ui'
import { formatDateTime, visibilityLabels, voteStatusLabels } from '../utils/labels'
import { ApiError } from '../api/client'

export function Resultado() {
  const { id } = useParams<{ id: string }>()
  const voteId = Number(id)
  const navigate = useNavigate()

  const { data, isLoading, error } = useQuery({
    queryKey: ['voteResult', voteId],
    queryFn: () => getVoteResult(voteId),
    enabled: Number.isFinite(voteId),
  })

  if (isLoading) return <LoadingState />
  if (error instanceof ApiError) return <ErrorBanner message={error.message} />
  if (!data) return null

  const { vote, summary, ballots } = data
  const totalWeight = summary.reduce((total, item) => total + item.weight_total, 0)
  const winner = summary.reduce((best, item) => (item.weight_total > (best?.weight_total ?? -1) ? item : best), summary[0])

  return (
    <>
      <PageHeader eyebrow="Apuracao" title="Resultado da votacao" />
      <Card>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['Status', voteStatusLabels[vote.status]],
            ['Visibilidade', visibilityLabels[vote.visibility]],
            ['Inicio', formatDateTime(vote.started_at)],
            ['Encerramento', formatDateTime(vote.closed_at)],
          ].map(([label, value]) => (
            <div key={label} className="rounded-md bg-slate-50 p-3">
              <p className="text-xs font-bold uppercase text-slate-500">{label}</p>
              <p className="mt-1 font-semibold text-slate-950">{value}</p>
            </div>
          ))}
        </div>
      </Card>
      <Card className="mt-4 p-0">
        <Table
          headers={['Opcao', 'Qtd. votos', 'Peso total', '% Peso', 'Resultado']}
          rows={summary.map((item) => [
            item.description,
            item.ballots_count,
            item.weight_total.toFixed(2),
            `${item.weight_percentage.toFixed(2)}%`,
            totalWeight > 0 && item.option_id === winner?.option_id ? 'APROVADO' : '-',
          ])}
        />
      </Card>
      {vote.visibility === 'open_vote' && (
        <Card className="mt-4 p-0">
          <Table
            headers={['Participante', 'Voto', 'Peso', 'Horario do voto']}
            rows={ballots.map((ballot) => [ballot.user.name, ballot.option, ballot.weight.toFixed(2), formatDateTime(ballot.cast_at)])}
          />
        </Card>
      )}
      <div className="mt-4">
        <Button variant="secondary" onClick={() => navigate(`/reunioes/${vote.meeting_id}/votacoes`)}>
          Voltar para votacoes
        </Button>
      </div>
    </>
  )
}
