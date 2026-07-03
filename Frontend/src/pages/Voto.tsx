import { useEffect, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { getVote } from '../api/votes'
import { castBallot } from '../api/ballots'
import { useAuth } from '../context/useAuth'
import { Button, Card, ErrorBanner, LoadingState, PageHeader } from '../components/ui'
import { responseTypeLabels, visibilityLabels } from '../utils/labels'
import { ApiError } from '../api/client'

function useCountdown(closesAt: string | null | undefined) {
  const [remainingMs, setRemainingMs] = useState(() => (closesAt ? new Date(closesAt).getTime() - Date.now() : 0))

  useEffect(() => {
    if (!closesAt) return
    const interval = setInterval(() => {
      setRemainingMs(new Date(closesAt).getTime() - Date.now())
    }, 1000)
    return () => clearInterval(interval)
  }, [closesAt])

  const clamped = Math.max(0, remainingMs)
  const minutes = String(Math.floor(clamped / 60000)).padStart(2, '0')
  const seconds = String(Math.floor((clamped % 60000) / 1000)).padStart(2, '0')
  return { label: `${minutes}:${seconds}`, expired: clamped <= 0 }
}

export function Voto() {
  const { id } = useParams<{ id: string }>()
  const voteId = Number(id)
  const navigate = useNavigate()
  const { user } = useAuth()
  const [selectedOptionId, setSelectedOptionId] = useState<number | null>(null)
  const [confirmed, setConfirmed] = useState(false)

  const { data: vote, isLoading, error, refetch } = useQuery({
    queryKey: ['vote', voteId],
    queryFn: () => getVote(voteId),
    enabled: Number.isFinite(voteId),
  })

  const countdown = useCountdown(vote?.closes_at)

  const mutation = useMutation({
    mutationFn: () => castBallot(voteId, user!.id, selectedOptionId!),
    onSuccess: () => setConfirmed(true),
  })

  useEffect(() => {
    if (countdown.expired && vote?.status === 'active') refetch()
  }, [countdown.expired, vote?.status, refetch])

  if (isLoading) return <LoadingState />
  if (error instanceof ApiError) return <ErrorBanner message={error.message} />
  if (!vote) return null

  if (vote.status !== 'active') {
    return (
      <Card>
        <p className="text-sm font-semibold text-slate-700">Esta votacao nao esta ativa no momento.</p>
        <div className="mt-3">
          <Button variant="secondary" onClick={() => navigate(`/votacoes/${voteId}`)}>
            Ver detalhes
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <>
      <PageHeader eyebrow="Votacao ativa" title="Realizacao de votacao" />
      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <Card>
          <ErrorBanner message={mutation.error instanceof ApiError ? mutation.error.message : null} />
          <dl className="grid gap-3 sm:grid-cols-2">
            {[
              ['Tipo', responseTypeLabels[vote.response_type]],
              ['Visibilidade', visibilityLabels[vote.visibility]],
            ].map(([label, value]) => (
              <div key={label} className="rounded-md bg-slate-50 p-3">
                <dt className="text-xs font-bold uppercase text-slate-500">{label}</dt>
                <dd className="mt-1 font-semibold text-slate-950">{value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-5 text-lg font-bold text-slate-950">{vote.statement}</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {(vote.vote_options ?? []).map((option) => (
              <button
                key={option.id}
                type="button"
                disabled={confirmed}
                onClick={() => setSelectedOptionId(option.id)}
                className={`h-14 rounded-md border text-base font-bold disabled:cursor-not-allowed disabled:opacity-60 ${
                  selectedOptionId === option.id
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                    : 'border-slate-300 bg-white text-slate-700'
                }`}
              >
                {option.description}
              </button>
            ))}
          </div>
          <div className="mt-5 flex gap-2">
            <Button onClick={() => mutation.mutate()} disabled={!selectedOptionId || confirmed || mutation.isPending}>
              Confirmar voto
            </Button>
          </div>
          {confirmed && (
            <div className="mt-4 rounded-md bg-emerald-50 p-3 text-sm font-semibold text-emerald-800 ring-1 ring-emerald-200">
              Voto registrado com sucesso! Obrigado pela sua participacao.
            </div>
          )}
        </Card>
        <Card>
          <p className="text-sm font-semibold uppercase text-slate-500">Tempo restante</p>
          <p className="mt-2 text-5xl font-black text-emerald-700">{countdown.label}</p>
          <div className="mt-5 rounded-md bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">
            Voto registrado com seguranca apos a confirmacao. Uma unidade nao pode votar duas vezes.
          </div>
        </Card>
      </div>
    </>
  )
}
