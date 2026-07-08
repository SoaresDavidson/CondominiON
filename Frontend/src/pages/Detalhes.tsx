import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import {
  cancelMeeting,
  downloadAccessLog,
  downloadManagerialReport,
  finishMeeting,
  getMeeting,
  joinMeeting,
  leaveMeeting,
} from '../api/meetings'
import { useAuth } from '../context/useAuth'
import { Button, Card, ConfirmDialog, ErrorBanner, LoadingState, PageHeader } from '../components/ui'
import { meetingStatusLabels, meetingTypeLabels, formatDateTime, voteStatusLabels } from '../utils/labels'
import { ApiError } from '../api/client'

export function Detalhes() {
  const { id } = useParams<{ id: string }>()
  const meetingId = Number(id)
  const navigate = useNavigate()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [pendingAction, setPendingAction] = useState<'finish' | 'cancel' | null>(null)

  const { data: meeting, isLoading, error } = useQuery({
    queryKey: ['meeting', meetingId],
    queryFn: () => getMeeting(meetingId),
    enabled: Number.isFinite(meetingId),
  })

  const joinMutation = useMutation({
    mutationFn: () => joinMeeting(meetingId, user!.id),
  })

  const leaveMutation = useMutation({
    mutationFn: () => leaveMeeting(meetingId, user!.id),
  })

  const finishMutation = useMutation({
    mutationFn: () => finishMeeting(meetingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meeting', meetingId] })
      setPendingAction(null)
    },
  })

  const cancelMutation = useMutation({
    mutationFn: () => cancelMeeting(meetingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meeting', meetingId] })
      setPendingAction(null)
    },
  })

  const accessLogMutation = useMutation({ mutationFn: () => downloadAccessLog(meetingId) })
  const managerialReportMutation = useMutation({ mutationFn: () => downloadManagerialReport(meetingId) })

  const isAdmin = user?.role === 'administrator'
  const mutationError =
    joinMutation.error ??
    leaveMutation.error ??
    finishMutation.error ??
    cancelMutation.error ??
    accessLogMutation.error ??
    managerialReportMutation.error

  if (isLoading) return <LoadingState />
  if (error instanceof ApiError) return <ErrorBanner message={error.message} />
  if (!meeting) return null

  return (
    <>
      <PageHeader eyebrow="Relatórios" title="Detalhes da Reunião" />
      <ErrorBanner message={mutationError instanceof ApiError ? mutationError.message : null} />
      <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
        <Card>
          <dl className="grid gap-3 sm:grid-cols-2">
            {[
              ['Titulo', meeting.title],
              ['Data/Horario', formatDateTime(meeting.starts_at)],
              ['Tipo', meetingTypeLabels[meeting.meeting_type]],
              ['Status', meetingStatusLabels[meeting.status]],
              ['Pautas', String(meeting.agenda_items?.length ?? 0)],
              ['Votacoes totais', String(meeting.votes?.length ?? 0)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-md bg-slate-50 p-3">
                <dt className="text-xs font-bold uppercase text-slate-500">{label}</dt>
                <dd className="mt-1 font-semibold text-slate-950">{value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-4 flex flex-wrap gap-2">
            {/* {meeting.status === 'in_progress' && !isAdmin && (
              <Button onClick={() => joinMutation.mutate()} disabled={joinMutation.isPending}>
                Entrar na Reunião
              </Button>
            )} */}
            {meeting.status === 'in_progress' && !isAdmin && (
              <Button  onClick={() => leaveMutation.mutate()} disabled={leaveMutation.isPending}>
                Sair da Reunião
              </Button>
            )}

              {isAdmin && meeting.status === 'in_progress' && (
              <Button onClick={() => setPendingAction('finish')} disabled={finishMutation.isPending}>
                Finalizar Reunião
              </Button>
            )}
              {isAdmin && meeting.status === 'in_progress' && (
            <Button variant="secondary" onClick={() => navigate(`/reunioes/${meetingId}/votacoes`)} >
                Gerenciar Votações
              </Button>
            )}
            {isAdmin && meeting.status === 'scheduled' && (
              <Button variant="danger" onClick={() => setPendingAction('cancel')} disabled={cancelMutation.isPending}>
                Cancelar reuniao
              </Button>
            )}
            {isAdmin && (
              <Button variant="secondary" onClick={() => navigate(`/reunioes/${meetingId}/pautas`)}>
                Gerenciar Pautas
              </Button>
            )}
          </div>

          {meeting.status === 'finished' && (
            <div className="mt-4">
              <p className="mb-2 text-xs font-bold uppercase text-slate-500">Documentos da reuniao</p>
              <div className="flex flex-wrap gap-2">
                {isAdmin && (
                  <Button
                    variant="secondary"
                    // onClick={() => managerialReportMutation.mutate()}
                    // disabled={managerialReportMutation.isPending}
                    disabled
                  >
                    Relatório gerencial
                  </Button>
                )}
                {isAdmin && (
                  <Button variant="secondary" /*onClick={() => accessLogMutation.mutate()} */ disabled /*disabled={accessLogMutation.isPending} */>
                    Gerar Log
                  </Button>
                )}
                {['Gerar Ata', 'Baixar Gravacao', 'Baixar Chat', 'Gerar Transcricao'].map((label) => (
                  <Button key={label} variant="secondary" disabled>
                    {label}
                  </Button>
                ))}
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Ata, gravacao, chat e transcricao dependem de integracoes externas ou tempo real e ainda nao estao disponiveis.
              </p>
            </div>
          )}
        </Card>

        <Card>
          <h2 className="font-bold text-slate-950">Pautas e Votações da Reunião</h2>
          <div className="mt-3 grid gap-3">
            {(meeting.agenda_items ?? []).map((item) => {
              const vote = meeting.votes?.find((candidate) => candidate.agenda_item_id === item.id)
              return (
                <div key={item.id} className="rounded-md border border-slate-200 p-3">
                  <p className="font-semibold text-slate-900">{item.title}</p>
                  {vote ? (
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-sm text-slate-500">{voteStatusLabels[vote.status]}</span>
                       {vote.status === 'active' && <Button onClick={() => navigate(`/votacoes/${vote.id}/votar`)}>Votar</Button>}
                    </div>
                  ) : (
                    <p className="mt-1 text-sm text-slate-500">Sem votação cadastrada</p>
                  )}
                </div>
              )
            })}
            {(meeting.agenda_items ?? []).length === 0 && (
              <p className="text-sm text-slate-500">Nenhuma pauta cadastrada.</p>
            )}
          </div>
        </Card>
      </div>
      <ConfirmDialog
        open={pendingAction === 'finish'}
        title="Finalizar reuniao"
        message="Tem certeza que deseja finalizar esta reuniao? Nao sera possivel reabri-la depois."
        confirmLabel="Finalizar"
        isLoading={finishMutation.isPending}
        onConfirm={() => finishMutation.mutate()}
        onCancel={() => setPendingAction(null)}
      />
      <ConfirmDialog
        open={pendingAction === 'cancel'}
        title="Cancelar reuniao"
        message="Tem certeza que deseja cancelar esta reuniao? Esta acao nao pode ser desfeita."
        confirmLabel="Cancelar reuniao"
        variant="danger"
        isLoading={cancelMutation.isPending}
        onConfirm={() => cancelMutation.mutate()}
        onCancel={() => setPendingAction(null)}
      />
    </>
  )
}
