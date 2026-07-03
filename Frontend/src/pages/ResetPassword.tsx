import { useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { redefinePassword } from '../api/auth'
import { ApiError } from '../api/client'
import { Button, Card, ErrorBanner, Field, Input, PageHeader } from '../components/ui'

export function ResetPassword() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!token) return
    setError(null)
    setLoading(true)
    try {
      await redefinePassword(token, password)
      navigate('/login')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Nao foi possivel redefinir a senha.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
      <PageHeader eyebrow="Acesso" title="Redefinir senha" />
      <Card>
        <ErrorBanner message={error} />
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <Field label="Nova senha">
            <Input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </Field>
          <Button type="submit" disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar nova senha'}
          </Button>
        </form>
      </Card>
    </div>
  )
}
