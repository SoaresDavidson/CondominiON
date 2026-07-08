import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { listMeetings, startMeeting, joinMeeting } from '../api/meetings'

import { useAuth } from '../context/useAuth'
import { Button, Card, ConfirmDialog, ErrorBanner, Field, Input, LoadingState, PageHeader, Select, StatusBadge, Table } from '../components/ui'
import { meetingStatusLabels, meetingTypeLabels, formatDateTime } from '../utils/labels'
import { ApiError } from '../api/client'
import { getCondominium } from '../api/condominiums'
import type { MeetingStatus, MeetingType } from '../api/types'

export function Reunioes() {
  const { condominiumId } = useParams<{ condominiumId: string }>()
  const condId = Number(condominiumId)
  const navigate = useNavigate()
  const { user } = useAuth()
  const queryClient = useQueryClient()

const joinMutation = useMutation({
  mutationFn: (meetingId: number) => joinMeeting(meetingId, user!.id),
})


  const [title, setTitle] = useState('')
  const [meetingType, setMeetingType] = useState<MeetingType | ''>('')
  const [status, setStatus] = useState<MeetingStatus | ''>('')
  const [meetingToStart, setMeetingToStart] = useState<{ id: number; title: string } | null>(null)

    const { data: condominium } = useQuery({
    queryKey: ['condominium', condId],
    queryFn: () => getCondominium(condId),
    enabled: Number.isFinite(condId),
  })

  const { data, isLoading, error } = useQuery({
    queryKey: ['meetings', condId, title, meetingType, status],
    queryFn: () =>
      listMeetings(condId, {
        title: title || undefined,
        meeting_type: meetingType || undefined,
        status: status || undefined,
      }),
    enabled: Number.isFinite(condId),
  })

  const startMutation = useMutation({
    mutationFn: startMeeting,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings', condId] })
      setMeetingToStart(null)
    },
  })

  const isAdmin = user?.role === 'administrator'

  return (
    <>
      <PageHeader eyebrow="Gestão de Reuniões" title={`Últimas Reuniões do Condomínio${condominium?.name ? ` ${condominium.name}` : ''}`} />
      <ErrorBanner message={error instanceof ApiError ? error.message : startMutation.error instanceof ApiError ? startMutation.error.message : null} />
      <Card>
        <div className="grid gap-3 lg:grid-cols-4">
          <Field label="Titulo">
            <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Lei do Silêncio" />
          </Field>
          <Field label="Tipo">
            <Select value={meetingType} onChange={(event) => setMeetingType(event.target.value as MeetingType | '')}>
              <option value="">Todos</option>
              {Object.entries(meetingTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Status">
            <Select value={status} onChange={(event) => setStatus(event.target.value as MeetingStatus | '')}>
              <option value="">Todos</option>
              {Object.entries(meetingStatusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            variant="secondary"
            onClick={() => {
              setTitle('')
              setMeetingType('')
              setStatus('')
            }}
          >
            Limpar filtros
          </Button>
          {isAdmin && <Button onClick={() => navigate(`/condominios/${condId}/reunioes/nova`)}>Agendar Reunião</Button>}
        </div>
      </Card>
      <Card className="mt-4 overflow-hidden p-0">
        {isLoading ? (
          <div className="p-4">
            <LoadingState />
          </div>
        ) : (
          <Table
            headers={['Titulo', 'Data', 'Tipo', 'Status', 'Acoes']}
            rows={(data ?? []).map((meeting) => [
              meeting.title,
              formatDateTime(meeting.starts_at),
              meetingTypeLabels[meeting.meeting_type],
              <StatusBadge value={meetingStatusLabels[meeting.status]} />,
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" onClick={() => navigate(`/reunioes/${meeting.id}`)}>
                  Detalhes
                </Button>
                {isAdmin && meeting.status === 'scheduled' && (
                  <Button onClick={() => setMeetingToStart({ id: meeting.id, title: meeting.title })}>Iniciar</Button>
                )}
                {!isAdmin && meeting.status === 'scheduled' && (
                  <Button variant="secondary" onClick={() => navigate(`/reunioes/${meeting.id}/procurador`)}>
                    Cadastrar Procurador
                  </Button>
                )}
                {meeting.status === 'in_progress' && (
                   <Button
                    onClick={async () => {
                      if (!isAdmin) {
                        try {
                          await joinMutation.mutateAsync(meeting.id)
                        } catch (error) {
                          return
                        }
                      }
                      navigate(`/reunioes/${meeting.id}`)
                    }}
                    disabled={joinMutation.isPending && joinMutation.variables === meeting.id}
                  >
                    {joinMutation.isPending && joinMutation.variables === meeting.id
                      ? 'Entrando...'
                      : 'Entrar'}
                  </Button>
)}
                {isAdmin && meeting.status === 'in_progress' && (
                  <Button variant="secondary" /*onClick={() => navigate(`/reunioes/${meeting.id}/convites`)}*/ disabled>
                    Disparar convites
                  </Button>
                )}
              </div>,
            ])}
          />
        )}
      </Card>
      <ConfirmDialog
        open={meetingToStart !== null}
        title="Iniciar Reunião"
        message={`Tem certeza que deseja iniciar a reunião "${meetingToStart?.title ?? ''}"? Os participantes poderão entrar assim que ela for iniciada.`}
        confirmLabel="Iniciar"
        isLoading={startMutation.isPending || joinMutation.isPending}
        onConfirm={async () => {
          try {
            await startMutation.mutateAsync(meetingToStart!.id)
            await joinMutation.mutateAsync(meetingToStart!.id)
          } catch (error) {
            return
          } finally {
            setMeetingToStart(null)
          }
        }}
        onCancel={() => setMeetingToStart(null)}
      />
    </>
  )
}
