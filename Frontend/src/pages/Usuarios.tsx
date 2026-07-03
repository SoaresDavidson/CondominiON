import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { listUsers } from '../api/users'
import { Button, Card, ErrorBanner, Field, Input, LoadingState, PageHeader, Select, Table } from '../components/ui'
import { roleLabels } from '../utils/labels'
import { ApiError } from '../api/client'
import type { Role } from '../api/types'

export function Usuarios() {
  const { condominiumId } = useParams<{ condominiumId: string }>()
  const condId = Number(condominiumId)
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<Role | ''>('')

  const { data, isLoading, error } = useQuery({
    queryKey: ['users', condId, name, email, role],
    queryFn: () => listUsers(condId, { name: name || undefined, email: email || undefined, role: role || undefined }),
    enabled: Number.isFinite(condId),
  })

  return (
    <>
      <PageHeader eyebrow="Gestao de usuarios" title="Usuarios cadastrados" />
      <ErrorBanner message={error instanceof ApiError ? error.message : null} />
      <Card>
        <div className="grid gap-3 lg:grid-cols-3">
          <Field label="Nome">
            <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Jose Roberto Reis" />
          </Field>
          <Field label="E-mail">
            <Input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="jrs@gmail.com" />
          </Field>
          <Field label="Tipo">
            <Select value={role} onChange={(event) => setRole(event.target.value as Role | '')}>
              <option value="">Todos</option>
              {Object.entries(roleLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={() => navigate(`/condominios/${condId}/usuarios/novo`)}>Cadastrar usuario</Button>
        </div>
      </Card>
      <Card className="mt-4 p-0">
        {isLoading ? (
          <div className="p-4">
            <LoadingState />
          </div>
        ) : (
          <Table
            headers={['Nome', 'E-mail', 'Tipo', 'Status', 'Acoes']}
            rows={(data ?? []).map((user) => [
              user.name,
              user.email,
              roleLabels[user.role],
              user.active ? 'Ativo' : 'Inativo',
              <Button variant="secondary" onClick={() => navigate(`/usuarios/${user.id}`)}>
                Visualizar
              </Button>,
            ])}
          />
        )}
      </Card>
    </>
  )
}
