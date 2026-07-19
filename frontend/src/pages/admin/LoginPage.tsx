import { zodResolver } from '@hookform/resolvers/zod'
import { LockKeyhole } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Navigate, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { useAuth } from '../../auth/useAuth'
import { getApiErrorMessage } from '../../api/client'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Spinner } from '../../components/ui/Spinner'

const loginSchema = z.object({
  email: z.email('Informe um e-mail válido'),
  password: z.string().min(1, 'Informe sua senha'),
})

type LoginFormValues = z.infer<typeof loginSchema>

export function LoginPage() {
  const navigate = useNavigate()
  const { bootstrapping, isAuthenticated, login } = useAuth()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null)

    try {
      await login(values.email, values.password)
      navigate('/admin', { replace: true })
    } catch (error) {
      setSubmitError(getApiErrorMessage(error, 'Não foi possível entrar. Verifique suas credenciais.'))
    }
  })

  if (bootstrapping) {
    return <Spinner label="Verificando sessão..." />
  }

  if (isAuthenticated) {
    return <Navigate to="/admin" replace />
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-ink-50 px-4 py-10">
      <Card className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-white">
            <LockKeyhole className="h-6 w-6" aria-hidden="true" />
          </div>
          <h1 className="font-display text-3xl font-bold text-ink-900">Área administrativa</h1>
          <p className="mt-2 text-sm text-ink-600">Entre para gerenciar os agendamentos.</p>
        </div>

        <form className="space-y-4" noValidate onSubmit={onSubmit}>
          <Input
            label="E-mail"
            type="email"
            autoComplete="email"
            error={errors.email?.message}
            {...register('email')}
          />
          <Input
            label="Senha"
            type="password"
            autoComplete="current-password"
            error={errors.password?.message}
            {...register('password')}
          />

          {submitError ? (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              {submitError}
            </p>
          ) : null}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Entrando...' : 'Entrar'}
          </Button>

          <p className="text-center text-xs text-ink-500">
            Demo: use o e-mail e a senha configurados no Render
            (<code className="text-ink-700">ADMIN_EMAIL</code> /{' '}
            <code className="text-ink-700">ADMIN_PASSWORD</code>).
            Se ainda for o bootstrap de desenvolvimento:{' '}
            <code className="text-ink-700">admin@agendapro.local</code> /{' '}
            <code className="text-ink-700">Admin@12345</code>.
          </p>
        </form>
      </Card>
    </main>
  )
}
