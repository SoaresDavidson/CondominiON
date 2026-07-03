import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { createAgendaItem, deleteAgendaItem, listAgendaItems, updateAgendaItem } from '../api/agendaItems'
import { getMeeting } from '../api/meetings'
import { Button, Card, ErrorBanner, Field, Input, LoadingState, PageHeader, Table, Textarea } from '../components/ui'
import { ApiError } from '../api/client'
import type { AgendaItem } from '../api/types'

export function Pautas() {
  const { meetingId } = useParams<{ meetingId: string }>()
  const id = Number(meetingId)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: meeting } = useQuery({ queryKey: ['meeting', id], queryFn: () => getMeeting(id), enabled: Number.isFinite(id) })
  const { data: items, isLoading, error } = useQuery({
    queryKey: ['agendaItems', id],
    queryFn: () => listAgendaItems(id),
    enabled: Number.isFinite(id),
  })

  const [editing, setEditing] = useState<AgendaItem | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [attachmentUrl, setAttachmentUrl] = useState('')

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['agendaItems', id] })

  const createMutation = useMutation({
    mutationFn: () => createAgendaItem(id, { title, description: description || undefined, attachment_url: attachmentUrl || undefined }),
    onSuccess: () => {
      invalidate()
      resetForm()
    },
  })

  const updateMutation = useMutation({
    mutationFn: () =>
      updateAgendaItem(editing!.id, { title, description: description || undefined, attachment_url: attachmentUrl || undefined }),
    onSuccess: () => {
      invalidate()
      resetForm()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteAgendaItem,
    onSuccess: invalidate,
  })

  function resetForm() {
    setEditing(null)
    setTitle('')
    setDescription('')
    setAttachmentUrl('')
  }

  function startEdit(item: AgendaItem) {
    setEditing(item)
    setTitle(item.title)
    setDescription(item.description ?? '')
    setAttachmentUrl(item.attachment_url ?? '')
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (editing) updateMutation.mutate()
    else createMutation.mutate()
  }

  const mutationError = createMutation.error ?? updateMutation.error ?? deleteMutation.error

  return (
    <>
      <PageHeader eyebrow="Gestao de pautas" title={meeting ? `Pautas - ${meeting.title}` : 'Pautas da reuniao'} />
      <ErrorBanner message={error instanceof ApiError ? error.message : mutationError instanceof ApiError ? mutationError.message : null} />

      <Card className="max-w-2xl">
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <Field label="Titulo">
            <Input required value={title} onChange={(event) => setTitle(event.target.value)} />
          </Field>
          <Field label="Descricao detalhada">
            <Textarea value={description} onChange={(event) => setDescription(event.target.value)} />
          </Field>
          <Field label="Anexo (URL do PDF)">
            <Input value={attachmentUrl} onChange={(event) => setAttachmentUrl(event.target.value)} placeholder="https://..." />
          </Field>
          <div className="flex gap-2">
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
              {editing ? 'Salvar alteracoes' : 'Nova pauta'}
            </Button>
            {editing && (
              <Button variant="secondary" onClick={resetForm}>
                Cancelar edicao
              </Button>
            )}
          </div>
        </form>
      </Card>

      <Card className="mt-4 overflow-hidden p-0">
        {isLoading ? (
          <div className="p-4">
            <LoadingState />
          </div>
        ) : (
          <Table
            headers={['Ordem', 'Titulo', 'Anexo', 'Comandos']}
            rows={(items ?? []).map((item) => [
              item.position,
              item.title,
              item.attachment_url ? (
                <a className="font-semibold text-emerald-700 hover:underline" href={item.attachment_url} target="_blank" rel="noreferrer">
                  Baixar
                </a>
              ) : (
                '-'
              ),
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" onClick={() => startEdit(item)}>
                  Alterar
                </Button>
                <Button variant="danger" onClick={() => deleteMutation.mutate(item.id)}>
                  Excluir
                </Button>
              </div>,
            ])}
          />
        )}
      </Card>

      <div className="mt-4">
        <Button variant="secondary" onClick={() => navigate(`/reunioes/${id}`)}>
          Voltar para a reuniao
        </Button>
      </div>
    </>
  )
}
