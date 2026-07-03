import { useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { ApiError } from '../api/client'
import { Button, Card, ErrorBanner, Field, Input, PageHeader } from '../components/ui'

export function MeetingAccess() {
  const { token: tokenFromUrl } = useParams<{ token?: string }>()
  const { loginWithAccessToken } = useAuth()
  const navigate = useNavigate()
  const [accessToken, setAccessToken] = useState(tokenFromUrl ?? '')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const user = await loginWithAccessToken(accessToken)
      navigate(user.meeting_id ? `/reunioes/${user.meeting_id}` : '/condominios')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Token de acesso invalido.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
      <PageHeader eyebrow="Acesso de convidado/procurador" title="Entrar com link de convite" />
      <Card>
        <ErrorBanner message={error} />
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <Field label="Token de acesso">
            <Input
              required
              value={accessToken}
              onChange={(event) => setAccessToken(event.target.value)}
              placeholder="Cole aqui o token recebido por e-mail"
            />
          </Field>
          <Button type="submit" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar na reuniao'}
          </Button>
        </form>
      </Card>
    </div>
  )
}
