import { zodResolver } from '@hookform/resolvers/zod'
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

export function ClientLoginPage() {
  const navigate = useNavigate()
  const { bootstrapping, isAuthenticated, role, loginClient } = useAuth()
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
      await loginClient(values.email.trim().toLowerCase(), values.password)
      navigate('/minha-conta', { replace: true })
    } catch (error) {
      setSubmitError(getApiErrorMessage(error, 'Não foi possível entrar. Verifique suas credenciais.'))
    }
  })

  if (bootstrapping) {
    return <Spinner label="Verificando sessão..." />
  }

  if (isAuthenticated && role === 'CLIENT') {
    return <Navigate to="/minha-conta" replace />
  }

  return (
    <section className="mx-auto max-w-md space-y-6 py-8">
      <SeoHead
        title="Entrar"
        description="Acesse sua conta de cliente no AgendaPro para ver e cancelar agendamentos."
        path="/entrar"
      />
      <Card className="space-y-6">
        <div className="text-center">
          <h1 className="font-display text-3xl font-bold text-ink-900">Entrar</h1>
          <p className="mt-2 text-sm text-ink-600">
            Acesse sua conta para ver e cancelar seus agendamentos.
          </p>
        </div>

        <form className="space-y-4" noValidate onSubmit={onSubmit}>
          <Input
            label="E-mail"
            type="email"
            placeholder="seuemail@exemplo.com"
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

        <p className="text-center text-sm text-ink-600">
          Ainda não tem conta?{' '}
          <Link to="/cadastro" className="font-medium text-brand-700 hover:underline">
            Criar conta
          </Link>
        </p>
      </Card>
    </section>
  )
}
