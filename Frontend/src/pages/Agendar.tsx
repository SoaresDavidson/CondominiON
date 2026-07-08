import { useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { createMeeting } from '../api/meetings'
import { Button, Card, ErrorBanner, Field, Input, PageHeader, Select } from '../components/ui'
import { meetingTypeLabels } from '../utils/labels'
import { ApiError } from '../api/client'
import type { MeetingType } from '../api/types'

export function Agendar() {
  const { condominiumId } = useParams<{ condominiumId: string }>()
  const condId = Number(condominiumId)
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [startsAt, setStartsAt] = useState('')
  const [meetingType, setMeetingType] = useState<MeetingType>('with_owners')

  const mutation = useMutation({
    mutationFn: () => createMeeting(condId, { title, starts_at: new Date(startsAt).toISOString(), meeting_type: meetingType }),
    onSuccess: () => navigate(`/condominios/${condId}/reunioes`),
  })

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    mutation.mutate()
  }

  return (
    <>
      <PageHeader eyebrow="Nova Reunião" title="Agendamento de Reunião" />
      <Card className="max-w-3xl">
        <ErrorBanner message={mutation.error instanceof ApiError ? mutation.error.message : null} />
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <Field label="Título">
            <Input required value={title} onChange={(event) => setTitle(event.target.value)} />
          </Field>
          <Field label="Data e hora">
            <Input type="datetime-local" required value={startsAt} onChange={(event) => setStartsAt(event.target.value)} />
          </Field>
          <Field label="Tipo">
            <Select value={meetingType} onChange={(event) => setMeetingType(event.target.value as MeetingType)}>
              {Object.entries(meetingTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
          <div className="mt-2 flex gap-2">
            <Button variant="secondary" onClick={() => navigate(`/condominios/${condId}/reunioes`)}>
              Voltar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Salvando...' : 'Confirmar'}
            </Button>
          </div>
        </form>
      </Card>
    </>
  )
}
