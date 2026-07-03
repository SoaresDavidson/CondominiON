import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { requestPasswordReset } from '../api/auth'
import { Button, Card, Field, Input, PageHeader } from '../components/ui'

export function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [devToken, setDevToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setLoading(true)
    try {
      const response = await requestPasswordReset(email)
      setMessage(response.message)
      setDevToken(response.reset_token ?? null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
      <PageHeader eyebrow="Acesso" title="Recuperacao de senha" />
      <Card>
        {message ? (
          <div className="grid gap-3">
            <p className="text-sm font-semibold text-slate-700">{message}</p>
            {devToken && (
              <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-800 ring-1 ring-amber-200">
                Ambiente de desenvolvimento (sem envio de e-mail ainda): use o link{' '}
                <Link className="font-bold underline" to={`/redefinir-senha/${devToken}`}>
                  redefinir senha
                </Link>
                .
              </div>
            )}
          </div>
        ) : (
          <form className="grid gap-4" onSubmit={handleSubmit}>
            <Field label="E-mail cadastrado">
              <Input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
            </Field>
            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>
                {loading ? 'Enviando...' : 'Enviar link de recuperacao'}
              </Button>
              <Link to="/login">
                <Button variant="secondary">Voltar ao login</Button>
              </Link>
            </div>
          </form>
        )}
      </Card>
    </div>
  )
}
