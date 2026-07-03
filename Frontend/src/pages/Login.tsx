import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { ApiError } from '../api/client'
import { Button, Card, ErrorBanner, Field, Input, PageHeader } from '../components/ui'

export function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(email, password)
      navigate('/condominios')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Nao foi possivel entrar.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
      <PageHeader eyebrow="Acesso" title="Entrar no CondominiON" />
      <Card>
        <ErrorBanner message={error} />
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <Field label="E-mail">
            <Input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
          </Field>
          <Field label="Senha">
            <Input type="password" required value={password} onChange={(event) => setPassword(event.target.value)} />
          </Field>
          <Button type="submit" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>
        <div className="mt-4 flex flex-col gap-2 text-sm">
          <Link className="font-semibold text-emerald-700 hover:underline" to="/esqueci-senha">
            Esqueci minha senha
          </Link>
          <Link className="font-semibold text-emerald-700 hover:underline" to="/acesso">
            Acessar com link de convite (convidado/procurador)
          </Link>
        </div>
      </Card>
    </div>
  )
}
