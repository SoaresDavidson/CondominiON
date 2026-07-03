import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { listCondominiums } from '../api/condominiums'
import { Button, Card, ErrorBanner, LoadingState, PageHeader } from '../components/ui'
import { ApiError } from '../api/client'

export function Condominios() {
  const navigate = useNavigate()
  const { data, isLoading, error } = useQuery({ queryKey: ['condominiums'], queryFn: listCondominiums })

  return (
    <>
      <PageHeader eyebrow="Selecao de ambiente" title="Escolha o condominio" />
      <ErrorBanner message={error instanceof ApiError ? error.message : null} />
      {isLoading ? (
        <LoadingState />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {data?.map((condominium) => (
            <Card key={condominium.id}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-950">{condominium.name}</h2>
                  <p className="mt-1 text-sm text-slate-600">{condominium.address ?? 'Endereco nao informado'}</p>
                </div>
                <Button onClick={() => navigate(`/condominios/${condominium.id}/reunioes`)}>Acessar</Button>
              </div>
            </Card>
          ))}
          {data?.length === 0 && <p className="text-sm text-slate-500">Nenhum condominio disponivel.</p>}
        </div>
      )}
    </>
  )
}
