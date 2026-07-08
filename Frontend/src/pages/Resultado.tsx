import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { downloadVoteResultPdf, downloadVoteResultXlsx, getVoteResult } from '../api/votes'
import { Button, Card, ErrorBanner, LoadingState, PageHeader, Table } from '../components/ui'
import { formatDateTime, visibilityLabels, voteStatusLabels } from '../utils/labels'
import { ApiError } from '../api/client'
import { useAuth } from '../context/useAuth'

export function Resultado() {
  const { id } = useParams<{ id: string }>()
  const voteId = Number(id)
  const navigate = useNavigate()
  const { user } = useAuth()
  const isAdmin = user?.role === 'administrator'

  const { data, isLoading, error } = useQuery({
    queryKey: ['voteResult', voteId],
    queryFn: () => getVoteResult(voteId),
    enabled: Number.isFinite(voteId),
  })
  const pdfMutation = useMutation({ mutationFn: () => downloadVoteResultPdf(voteId) })
  const xlsxMutation = useMutation({ mutationFn: () => downloadVoteResultXlsx(voteId) })

  if (isLoading) return <LoadingState />
  if (error instanceof ApiError) return <ErrorBanner message={error.message} />
  if (!data) return null

  const { vote, summary, ballots } = data
  const totalWeight = summary.reduce((total, item) => total + item.weight_total, 0)
  const winner = summary.reduce((best, item) => (item.weight_total > (best?.weight_total ?? -1) ? item : best), summary[0])

  return (
    <>
      <PageHeader eyebrow="Apuração" title="Resultado da Votação" />
      <ErrorBanner
        message={
          pdfMutation.error instanceof ApiError
            ? pdfMutation.error.message
            : xlsxMutation.error instanceof ApiError
              ? xlsxMutation.error.message
              : null
        }
      />
      <Card>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['Status', voteStatusLabels[vote.status]],
            ['Visibilidade', visibilityLabels[vote.visibility]],
            ['Início', formatDateTime(vote.started_at)],
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
          headers={['Opção', 'Qtd. votos', 'Peso total', '% Peso', 'Resultado']}
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
            headers={['Participante', 'Voto', 'Peso', 'Horário do voto']}
            rows={ballots.map((ballot) => [ballot.user.name, ballot.option, ballot.weight.toFixed(2), formatDateTime(ballot.cast_at)])}
          />
        </Card>
      )}
      <div className="mt-4">
        {isAdmin && (
          <div className="mb-3 flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => pdfMutation.mutate()} disabled={pdfMutation.isPending}>
              Exportar PDF
            </Button>
            <Button variant="secondary" onClick={() => xlsxMutation.mutate()} disabled={xlsxMutation.isPending}>
              Exportar Excel
            </Button>
          </div>
        )}
        <Button variant="secondary" onClick={() => navigate(`/reunioes/${vote.meeting_id}/votacoes`)}>
          Voltar para votações
        </Button>
      </div>
    </>
  )
}
