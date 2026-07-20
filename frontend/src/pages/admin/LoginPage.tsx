import { zodResolver } from '@hookform/resolvers/zod'
import { CalendarDays } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { useAuth } from '../../auth/useAuth'
import { getApiErrorMessage } from '../../api/client'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { PasswordInput } from '../../components/ui/PasswordInput'
import { SeoHead } from '../../components/SeoHead'
import { Spinner } from '../../components/ui/Spinner'

const loginSchema = z.object({
  email: z.email('Informe um e-mail válido'),
  password: z.string().min(1, 'Informe sua senha'),
})

type LoginFormValues = z.infer<typeof loginSchema>

export function LoginPage() {
  const navigate = useNavigate()
  const { bootstrapping, isAuthenticated, role, loginAdmin } = useAuth()
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
      await loginAdmin(values.email, values.password)
      navigate('/admin', { replace: true })
    } catch (error) {
      setSubmitError(getApiErrorMessage(error, 'Não foi possível entrar. Verifique suas credenciais.'))
    }
  })

  if (bootstrapping) {
    return <Spinner label="Verificando sessão..." />
  }

  if (isAuthenticated && role === 'ADMIN') {
    return <Navigate to="/admin" replace />
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-ink-50 px-4 py-10">
      <SeoHead
        title="Login administrativo"
        description="Acesso restrito à área administrativa do AgendaPro."
        path="/admin/login"
        noIndex
      />
      <Card className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Link
            to="/"
            className="mx-auto mb-4 inline-flex flex-col items-center gap-2 rounded-2xl outline-none transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2"
            aria-label="Voltar para a página inicial do AgendaPro"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-white">
              <CalendarDays className="h-6 w-6" aria-hidden="true" />
            </span>
            <span className="font-display text-lg font-bold tracking-tight text-ink-900">
              AgendaPro
            </span>
          </Link>
          <h1 className="font-display text-3xl font-bold text-ink-900">Área administrativa</h1>
          <p className="mt-2 text-sm text-ink-600">Entre para gerenciar os agendamentos.</p>
        </div>

        <form className="space-y-4" noValidate onSubmit={onSubmit}>
          <Input
            label="E-mail"
            type="email"
            placeholder="seu@email.com"
            autoComplete="email"
            error={errors.email?.message}
            {...register('email')}
          />
          <PasswordInput
            label="Senha"
            placeholder="Sua senha"
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
        </form>

        <p className="text-center text-sm text-ink-500">
          <Link to="/" className="font-medium text-brand-700 hover:underline">
            Voltar ao início
          </Link>
        </p>
      </Card>
    </main>
  )
}
