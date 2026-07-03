import { useMemo, useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { createUser, deactivateUser, getUser, updateUser } from '../api/users'
import { Button, Card, ErrorBanner, Field, Input, PageHeader, Select } from '../components/ui'
import { roleLabels } from '../utils/labels'
import { ApiError } from '../api/client'
import type { Role } from '../api/types'

export function UsuarioForm() {
  const { condominiumId, id } = useParams<{ condominiumId?: string; id?: string }>()
  const isEditing = Boolean(id)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: existingUser } = useQuery({
    queryKey: ['user', id],
    queryFn: () => getUser(Number(id)),
    enabled: isEditing,
  })

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<Role>('owner')
  const [lotsCount, setLotsCount] = useState(0)
  const [housesCount, setHousesCount] = useState(0)
  const [delinquent, setDelinquent] = useState(false)
  const [credential, setCredential] = useState<string | null>(null)
  const [syncedUserId, setSyncedUserId] = useState<number | null>(null)

  if (existingUser && existingUser.id !== syncedUserId) {
    setSyncedUserId(existingUser.id)
    setName(existingUser.name)
    setEmail(existingUser.email)
    setRole(existingUser.role)
    setLotsCount(existingUser.lots_count)
    setHousesCount(existingUser.houses_count)
    setDelinquent(existingUser.delinquent)
  }

  const voteWeight = useMemo(() => lotsCount * 2 + housesCount, [lotsCount, housesCount])

  const createMutation = useMutation({
    mutationFn: () =>
      createUser(Number(condominiumId), {
        name,
        email,
        role,
        lots_count: role === 'owner' ? lotsCount : undefined,
        houses_count: role === 'owner' ? housesCount : undefined,
      }),
    onSuccess: (user) => setCredential(user.initial_password ?? user.access_token ?? null),
  })

  const updateMutation = useMutation({
    mutationFn: () =>
      updateUser(Number(id), {
        name,
        email,
        lots_count: role === 'owner' ? lotsCount : undefined,
        houses_count: role === 'owner' ? housesCount : undefined,
        delinquent: role === 'owner' ? delinquent : undefined,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['user', id] }),
  })

  const deactivateMutation = useMutation({
    mutationFn: () => deactivateUser(Number(id)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['user', id] }),
  })

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (isEditing) updateMutation.mutate()
    else createMutation.mutate()
  }

  const mutationError = createMutation.error ?? updateMutation.error ?? deactivateMutation.error
  const backTarget = existingUser ? `/condominios/${existingUser.condominium_id}/usuarios` : `/condominios/${condominiumId}/usuarios`

  return (
    <>
      <PageHeader eyebrow="Cadastro" title={isEditing ? 'Edicao de usuario' : 'Cadastro de usuario'} />
      <Card className="max-w-4xl">
        <ErrorBanner message={mutationError instanceof ApiError ? mutationError.message : null} />

        {credential && (
          <div className="mb-4 rounded-md bg-amber-50 p-3 text-sm text-amber-800 ring-1 ring-amber-200">
            Envio automatico de e-mail ainda nao esta disponivel. Credencial gerada: <strong>{credential}</strong>
          </div>
        )}

        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <Field label="Nome">
            <Input required value={name} onChange={(event) => setName(event.target.value)} />
          </Field>
          <Field label="E-mail">
            <Input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
          </Field>
          <Field label="Tipo">
            <Select disabled={isEditing} value={role} onChange={(event) => setRole(event.target.value as Role)}>
              {Object.entries(roleLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>

          {role === 'owner' && (
            <>
              <Field label="Terrenos">
                <Input type="number" min={0} value={lotsCount} onChange={(event) => setLotsCount(Number(event.target.value))} />
              </Field>
              <Field label="Casas">
                <Input type="number" min={0} value={housesCount} onChange={(event) => setHousesCount(Number(event.target.value))} />
              </Field>
              <Field label="Peso total">
                <Input readOnly value={voteWeight} />
              </Field>
              {isEditing && (
                <Field label="Inadimplente">
                  <Select value={delinquent ? 'sim' : 'nao'} onChange={(event) => setDelinquent(event.target.value === 'sim')}>
                    <option value="nao">Nao</option>
                    <option value="sim">Sim</option>
                  </Select>
                </Field>
              )}
            </>
          )}

          {isEditing && existingUser && (
            <Field label="Status">
              <Input readOnly value={existingUser.active ? 'Ativo' : 'Inativo'} />
            </Field>
          )}

          <div className="mt-2 flex gap-2 md:col-span-2">
            <Button variant="secondary" onClick={() => navigate(backTarget)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
              Salvar
            </Button>
            {isEditing && (existingUser?.role === 'guest' || existingUser?.role === 'proxy') && existingUser.active && (
              <Button variant="danger" onClick={() => deactivateMutation.mutate()} disabled={deactivateMutation.isPending}>
                Desativar
              </Button>
            )}
          </div>
        </form>
      </Card>
    </>
  )
}
