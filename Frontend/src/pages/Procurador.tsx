import { useState, type FormEvent } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { createUser, listUsers } from '../api/users'
import { getMeeting } from '../api/meetings'
import { Button, Card, ErrorBanner, Field, Input, PageHeader, Select } from '../components/ui'
import { ApiError } from '../api/client'

export function Procurador() {
  const { id } = useParams<{ id: string }>()
  const meetingId = Number(id)
  const navigate = useNavigate()

  const { data: meeting } = useQuery({ queryKey: ['meeting', meetingId], queryFn: () => getMeeting(meetingId), enabled: Number.isFinite(meetingId) })
  const { data: owners } = useQuery({
    queryKey: ['users', meeting?.condominium_id, 'owner'],
    queryFn: () => listUsers(meeting!.condominium_id, { role: 'owner' }),
    enabled: Boolean(meeting),
  })

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [proxyForId, setProxyForId] = useState('')
  const [createdToken, setCreatedToken] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () =>
      createUser(meeting!.condominium_id, {
        name,
        email,
        role: 'proxy',
        proxy_for_id: Number(proxyForId),
        meeting_id: meetingId,
      }),
    onSuccess: (user) => setCreatedToken(user.access_token ?? null),
  })

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    mutation.mutate()
  }

  return (
    <>
      <PageHeader eyebrow="Representacao" title="Cadastro de procurador" />
      <Card className="max-w-3xl">
        <ErrorBanner message={mutation.error instanceof ApiError ? mutation.error.message : null} />
        {createdToken ? (
          <div className="grid gap-3">
            <p className="text-sm font-semibold text-slate-700">Procurador cadastrado com sucesso.</p>
            <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-800 ring-1 ring-amber-200">
              Envio automatico de e-mail ainda nao esta disponivel: repasse manualmente o token de acesso ao procurador:{' '}
              <strong>{createdToken}</strong>
            </div>
            <Button variant="secondary" onClick={() => navigate(`/condominios/${meeting?.condominium_id}/reunioes`)}>
              Voltar
            </Button>
          </div>
        ) : (
          <form className="grid gap-4" onSubmit={handleSubmit}>
            <Field label="Reuniao selecionada">
              <Input readOnly value={meeting?.title ?? ''} />
            </Field>
            <Field label="Proprietario representado">
              <Select required value={proxyForId} onChange={(event) => setProxyForId(event.target.value)}>
                <option value="">Selecione um proprietario</option>
                {(owners ?? [])
                  .filter((owner) => !owner.delinquent)
                  .map((owner) => (
                    <option key={owner.id} value={owner.id}>
                      {owner.name}
                    </option>
                  ))}
              </Select>
            </Field>
            <Field label="Nome">
              <Input required value={name} onChange={(event) => setName(event.target.value)} />
            </Field>
            <Field label="E-mail">
              <Input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
            </Field>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => navigate(-1)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                Cadastrar procurador
              </Button>
            </div>
          </form>
        )}
      </Card>
    </>
  )
}
