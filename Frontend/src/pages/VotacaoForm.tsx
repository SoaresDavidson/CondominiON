import { useMemo, useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { createVote, deleteVote, finishVote, getVote, startVote, updateVote } from '../api/votes'
import { listAgendaItems } from '../api/agendaItems'
import { getMeeting } from '../api/meetings'
import { Button, Card, ErrorBanner, Field, Input, PageHeader, Select, Table } from '../components/ui'
import { responseTypeLabels, visibilityLabels, voteStatusLabels } from '../utils/labels'
import { ApiError } from '../api/client'
import type { ResponseType, Visibility } from '../api/types'

export function VotacaoForm() {
  const { meetingId, id } = useParams<{ meetingId?: string; id?: string }>()
  const isCreating = !id
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: existingVote } = useQuery({
    queryKey: ['vote', id],
    queryFn: () => getVote(Number(id)),
    enabled: !isCreating,
  })

  const resolvedMeetingId = isCreating ? Number(meetingId) : existingVote?.meeting_id
  const { data: meeting } = useQuery({
    queryKey: ['meeting', resolvedMeetingId],
    queryFn: () => getMeeting(resolvedMeetingId!),
    enabled: Boolean(resolvedMeetingId),
  })
  const { data: agendaItems } = useQuery({
    queryKey: ['agendaItems', resolvedMeetingId],
    queryFn: () => listAgendaItems(resolvedMeetingId!),
    enabled: isCreating && Boolean(resolvedMeetingId),
  })

  const [agendaItemId, setAgendaItemId] = useState('')
  const [statement, setStatement] = useState('')
  const [responseType, setResponseType] = useState<ResponseType>('yes_no_abstain')
  const [visibility, setVisibility] = useState<Visibility>('open_vote')
  const [durationMinutes, setDurationMinutes] = useState(2)
  const [options, setOptions] = useState<string[]>([])
  const [newOption, setNewOption] = useState('')
  const [syncedVoteId, setSyncedVoteId] = useState<number | null>(null)

  if (existingVote && existingVote.id !== syncedVoteId) {
    setSyncedVoteId(existingVote.id)
    setStatement(existingVote.statement)
    setResponseType(existingVote.response_type)
    setVisibility(existingVote.visibility)
    setDurationMinutes(existingVote.duration_minutes)
  }

  const isWaiting = existingVote ? existingVote.status === 'waiting' : true
  const readOnly = !isCreating && !isWaiting
  const needsOptions = responseType === 'multiple_choice' || responseType === 'name_election'

  const createMutation = useMutation({
    mutationFn: () =>
      createVote(
        resolvedMeetingId!,
        { agenda_item_id: Number(agendaItemId), statement, response_type: responseType, visibility, duration_minutes: durationMinutes },
        needsOptions ? options : undefined,
      ),
    onSuccess: (vote) => navigate(`/votacoes/${vote.id}`),
  })

  const updateMutation = useMutation({
    mutationFn: () => updateVote(Number(id), { statement, visibility, duration_minutes: durationMinutes }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vote', id] }),
  })

  const startMutation = useMutation({
    mutationFn: () => startVote(Number(id)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vote', id] }),
  })

  const finishMutation = useMutation({
    mutationFn: () => finishVote(Number(id)),
    onSuccess: () => navigate(`/votacoes/${id}/resultado`),
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteVote(Number(id)),
    onSuccess: () => navigate(`/reunioes/${resolvedMeetingId}/votacoes`),
  })

  const mutationError =
    createMutation.error ?? updateMutation.error ?? startMutation.error ?? finishMutation.error ?? deleteMutation.error

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (isCreating) createMutation.mutate()
    else updateMutation.mutate()
  }

  function addOption() {
    if (!newOption.trim()) return
    setOptions((prev) => [...prev, newOption.trim()])
    setNewOption('')
  }

  const visibleOptions = isCreating ? options : (existingVote?.vote_options ?? []).map((option) => option.description)
  const currentAgendaItemTitle = useMemo(() => {
    if (!isCreating) return existingVote?.agenda_item?.title ?? ''
    return agendaItems?.find((item) => String(item.id) === agendaItemId)?.title ?? ''
  }, [isCreating, existingVote, agendaItems, agendaItemId])

  return (
    <>
      <PageHeader eyebrow="Votacao" title={isCreating ? 'Cadastro de votacao' : readOnly ? 'Visualizacao de votacao' : 'Edicao de votacao'} />
      <Card>
        <ErrorBanner message={mutationError instanceof ApiError ? mutationError.message : null} />
        <form className="grid gap-4 lg:grid-cols-2" onSubmit={handleSubmit}>
          <Field label="Reuniao">
            <Input readOnly value={meeting?.title ?? ''} />
          </Field>
          <Field label="Pauta / Item">
            {isCreating ? (
              <Select required value={agendaItemId} onChange={(event) => setAgendaItemId(event.target.value)}>
                <option value="">Selecione a pauta</option>
                {(agendaItems ?? []).map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title}
                  </option>
                ))}
              </Select>
            ) : (
              <Input readOnly value={currentAgendaItemTitle} />
            )}
          </Field>
          <Field label="Enunciado">
            <Input
              required
              maxLength={500}
              readOnly={readOnly}
              value={statement}
              onChange={(event) => setStatement(event.target.value)}
            />
          </Field>
          <Field label="Tipo de resposta">
            <Select disabled={!isCreating} value={responseType} onChange={(event) => setResponseType(event.target.value as ResponseType)}>
              {Object.entries(responseTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Visibilidade">
            <Select disabled={readOnly} value={visibility} onChange={(event) => setVisibility(event.target.value as Visibility)}>
              {Object.entries(visibilityLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Duracao da votacao (minutos)">
            <Input
              type="number"
              min={1}
              readOnly={readOnly}
              value={durationMinutes}
              onChange={(event) => setDurationMinutes(Number(event.target.value))}
            />
          </Field>

          {needsOptions && (
            <div className="lg:col-span-2 grid gap-3 rounded-lg bg-slate-50 p-3">
              {isCreating && (
                <div className="flex gap-2">
                  <Input placeholder="Candidato Silva" value={newOption} onChange={(event) => setNewOption(event.target.value)} />
                  <Button type="button" variant="secondary" onClick={addOption}>
                    Adicionar opcao
                  </Button>
                </div>
              )}
              <Table
                headers={['Ordem', 'Descricao da opcao', 'Remover']}
                rows={visibleOptions.map((description, index) => [
                  index + 1,
                  description,
                  isCreating ? (
                    <Button
                      type="button"
                      variant="danger"
                      onClick={() => setOptions((prev) => prev.filter((_, optionIndex) => optionIndex !== index))}
                    >
                      Remover
                    </Button>
                  ) : (
                    '-'
                  ),
                ])}
              />
            </div>
          )}

          {!existingVote ? null : (
            <p className="lg:col-span-2 text-sm text-slate-500">Status atual: {voteStatusLabels[existingVote.status]}</p>
          )}

          <div className="lg:col-span-2 flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => navigate(resolvedMeetingId ? `/reunioes/${resolvedMeetingId}/votacoes` : '/condominios')}>
              {readOnly ? 'Voltar' : 'Cancelar'}
            </Button>
            {!readOnly && (
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                Salvar
              </Button>
            )}
            {!isCreating && isWaiting && (
              <Button variant="danger" onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending}>
                Excluir
              </Button>
            )}
            {!isCreating && isWaiting && (
              <Button onClick={() => startMutation.mutate()} disabled={startMutation.isPending}>
                Iniciar
              </Button>
            )}
            {!isCreating && existingVote?.status === 'active' && (
              <Button onClick={() => finishMutation.mutate()} disabled={finishMutation.isPending}>
                Encerrar votacao
              </Button>
            )}
            {!isCreating && existingVote?.status === 'closed' && (
              <Button onClick={() => navigate(`/votacoes/${id}/resultado`)}>Ver resultado</Button>
            )}
          </div>
        </form>
      </Card>
    </>
  )
}
