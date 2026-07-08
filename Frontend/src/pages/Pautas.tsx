import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { createAgendaItemWithAttachment, deleteAgendaItem, listAgendaItems, updateAgendaItemWithAttachment } from '../api/agendaItems'
import { getMeeting } from '../api/meetings'
import { Button, Card, ErrorBanner, Field, Input, LoadingState, PageHeader, Table, Textarea } from '../components/ui'
import { ApiError, apiDownload } from '../api/client'
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
  const [attachment, setAttachment] = useState<File | null>(null)
  const [removeAttachment, setRemoveAttachment] = useState(false)

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['agendaItems', id] })

  const createMutation = useMutation({
    mutationFn: () => createAgendaItemWithAttachment(id, { title, description: description || undefined, attachment }),
    onSuccess: () => {
      invalidate()
      resetForm()
    },
  })

  const updateMutation = useMutation({
    mutationFn: () =>
      updateAgendaItemWithAttachment(editing!.id, {
        title,
        description: description || undefined,
        attachment,
        remove_attachment: removeAttachment,
      }),
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
    setAttachment(null)
    setRemoveAttachment(false)
  }

  function startEdit(item: AgendaItem) {
    setEditing(item)
    setTitle(item.title)
    setDescription(item.description ?? '')
    setAttachment(null)
    setRemoveAttachment(false)
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (editing) updateMutation.mutate()
    else createMutation.mutate()
  }

  const mutationError = createMutation.error ?? updateMutation.error ?? deleteMutation.error

  return (
    <>
      <PageHeader eyebrow="Gestão de pautas" title={meeting ? `Pautas - ${meeting.title}` : 'Pautas da reuniao'} />
      <ErrorBanner message={error instanceof ApiError ? error.message : mutationError instanceof ApiError ? mutationError.message : null} />

      <Card className="max-w-2xl">
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <Field label="Titulo">
            <Input required value={title} onChange={(event) => setTitle(event.target.value)} />
          </Field>
          <Field label="Descricao detalhada">
            <Textarea value={description} onChange={(event) => setDescription(event.target.value)} />
          </Field>
          <Field label="Anexo PDF">
            <Input
              type="file"
              accept="application/pdf,.pdf"
              onChange={(event) => {
                setAttachment(event.target.files?.[0] ?? null)
                setRemoveAttachment(false)
              }}
            />
          </Field>
          {editing?.attachment_url && !attachment && (
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={removeAttachment}
                onChange={(event) => setRemoveAttachment(event.target.checked)}
              />
              Remover anexo atual ({editing.attachment_filename ?? 'PDF'})
            </label>
          )}
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
                <button
                  className="font-semibold text-emerald-700 hover:underline"
                  type="button"
                  onClick={() => apiDownload(item.attachment_url!, item.attachment_filename ?? `pauta-${item.id}.pdf`)}
                >
                  Baixar
                </button>
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
