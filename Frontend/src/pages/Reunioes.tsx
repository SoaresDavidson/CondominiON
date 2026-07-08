import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { listMeetings, startMeeting } from '../api/meetings'
import { useAuth } from '../context/useAuth'
import { Button, Card, ConfirmDialog, ErrorBanner, Field, Input, LoadingState, PageHeader, Select, StatusBadge, Table } from '../components/ui'
import { meetingStatusLabels, meetingTypeLabels, formatDateTime } from '../utils/labels'
import { ApiError } from '../api/client'
import type { MeetingStatus, MeetingType } from '../api/types'

export function Reunioes() {
  const { condominiumId } = useParams<{ condominiumId: string }>()
  const condId = Number(condominiumId)
  const navigate = useNavigate()
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const [title, setTitle] = useState('')
  const [meetingType, setMeetingType] = useState<MeetingType | ''>('')
  const [status, setStatus] = useState<MeetingStatus | ''>('')
  const [meetingToStart, setMeetingToStart] = useState<{ id: number; title: string } | null>(null)

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
      <PageHeader eyebrow="Gestao de reunioes" title="Reunioes do condominio" />
      <ErrorBanner message={error instanceof ApiError ? error.message : startMutation.error instanceof ApiError ? startMutation.error.message : null} />
      <Card>
        <div className="grid gap-3 lg:grid-cols-4">
          <Field label="Titulo">
            <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Lei do silencio" />
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
            Limpar
          </Button>
          {isAdmin && <Button onClick={() => navigate(`/condominios/${condId}/reunioes/nova`)}>Agendar Reuniao</Button>}
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
                {isAdmin && meeting.status === 'scheduled' && (
                  <Button variant="secondary" onClick={() => navigate(`/reunioes/${meeting.id}/procurador`)}>
                    Cadastrar Procurador
                  </Button>
                )}
                {meeting.status === 'in_progress' && (
                  <Button onClick={() => navigate(`/reunioes/${meeting.id}`)}>Entrar</Button>
                )}
                {isAdmin && meeting.status === 'in_progress' && (
                  <Button variant="secondary" onClick={() => navigate(`/reunioes/${meeting.id}/convites`)}>
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
        title="Iniciar reuniao"
        message={`Tem certeza que deseja iniciar a reuniao "${meetingToStart?.title ?? ''}"? Os participantes poderao entrar assim que ela for iniciada.`}
        confirmLabel="Iniciar"
        isLoading={startMutation.isPending}
        onConfirm={() => startMutation.mutate(meetingToStart!.id)}
        onCancel={() => setMeetingToStart(null)}
      />
    </>
  )
}
