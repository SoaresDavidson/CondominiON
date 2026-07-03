import { useState, type FormEvent } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { getMeeting, sendInvitations } from '../api/meetings'
import { Button, Card, ErrorBanner, Field, Input, PageHeader } from '../components/ui'
import { ApiError } from '../api/client'

export function Convites() {
  const { id } = useParams<{ id: string }>()
  const meetingId = Number(id)
  const navigate = useNavigate()
  const [file, setFile] = useState<File | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const { data: meeting } = useQuery({ queryKey: ['meeting', meetingId], queryFn: () => getMeeting(meetingId), enabled: Number.isFinite(meetingId) })

  const mutation = useMutation({
    mutationFn: () => sendInvitations(meetingId, 0),
    onSuccess: (response) => setSuccess(`Convites enfileirados para ${response.total_recipients} destinatarios.`),
  })

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    mutation.mutate()
  }

  return (
    <>
      <PageHeader eyebrow="Convites" title="Disparo em massa" />
      <Card className="max-w-3xl">
        <ErrorBanner message={mutation.error instanceof ApiError ? mutation.error.message : null} />
        {success && (
          <div className="mb-4 rounded-md bg-emerald-50 p-3 text-sm font-semibold text-emerald-800 ring-1 ring-emerald-200">
            {success}
          </div>
        )}
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <Field label="Reuniao">
            <Input readOnly value={meeting?.title ?? ''} />
          </Field>
          <Field label="Arquivo da planilha">
            <Input type="file" accept=".csv,.xlsx" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
          </Field>
          {file && <p className="text-sm text-slate-600">Arquivo selecionado: {file.name}</p>}
          <div className="rounded-md bg-slate-50 p-3 text-sm text-slate-700">
            Colunas obrigatorias: <strong>Nome, E-Mail, Unidades, Peso Total</strong>. O processamento do arquivo (leitura da
            planilha e envio de e-mails) ainda nao esta disponivel nesta versao; esta tela ja registra a solicitacao de
            disparo junto a API.
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={mutation.isPending}>
              Validar e disparar
            </Button>
            <Button variant="secondary" onClick={() => navigate(`/reunioes/${meetingId}`)}>
              Cancelar
            </Button>
          </div>
        </form>
      </Card>
    </>
  )
}
