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
import { Spinner } from '../../components/ui/Spinner'

const registerSchema = z.object({
  fullName: z.string().min(2, 'Informe seu nome').max(120, 'Nome muito longo'),
  phone: z.string().regex(/^[0-9()+.\- ]{10,30}$/, 'Telefone inválido'),
  email: z.email('Informe um e-mail válido'),
  password: z.string().min(8, 'Senha com no mínimo 8 caracteres').max(72, 'Senha muito longa'),
})

type RegisterFormValues = z.infer<typeof registerSchema>

export function ClientRegisterPage() {
  const navigate = useNavigate()
  const { bootstrapping, isAuthenticated, role, registerClient } = useAuth()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: '', phone: '', email: '', password: '' },
  })

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null)
    try {
      await registerClient(values)
      navigate('/minha-conta', { replace: true })
    } catch (error) {
      setSubmitError(getApiErrorMessage(error, 'Não foi possível criar a conta.'))
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
      <Card className="space-y-6">
        <div className="text-center">
          <h1 className="font-display text-3xl font-bold text-ink-900">Criar conta</h1>
          <p className="mt-2 text-sm text-ink-600">
            Cadastre-se para acompanhar seus agendamentos. Agendar continua disponível sem login.
          </p>
        </div>

        <form className="space-y-4" noValidate onSubmit={onSubmit}>
          <Input label="Nome" error={errors.fullName?.message} {...register('fullName')} />
          <Input label="Telefone" error={errors.phone?.message} {...register('phone')} />
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
            autoComplete="new-password"
            error={errors.password?.message}
            {...register('password')}
          />

          {submitError ? (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              {submitError}
            </p>
          ) : null}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Criando...' : 'Criar conta'}
          </Button>
        </form>

        <p className="text-center text-sm text-ink-600">
          Já tem conta?{' '}
          <Link to="/entrar" className="font-medium text-brand-700 hover:underline">
            Entrar
          </Link>
        </p>
      </Card>
    </section>
  )
}
