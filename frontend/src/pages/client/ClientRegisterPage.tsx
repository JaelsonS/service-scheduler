import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { useAuth } from '../../auth/useAuth'
import { getApiErrorMessage } from '../../api/client'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { PhoneInput } from '../../components/ui/PhoneInput'
import { PasswordInput } from '../../components/ui/PasswordInput'
import { PasswordStrength } from '../../components/ui/PasswordStrength'
import { SeoHead } from '../../components/SeoHead'
import { Spinner } from '../../components/ui/Spinner'
import { isStrongPassword } from '../../lib/password'
import {
  PHONE_COUNTRIES,
  composePhone,
  validatePhoneForCountry,
} from '../../lib/phone'

const registerSchema = z
  .object({
    fullName: z.string().trim().min(2, 'Informe seu nome completo').max(120, 'Nome muito longo'),
    countryCode: z.string().min(2),
    localPhone: z.string().min(1, 'Informe o telefone'),
    email: z.email('Informe um e-mail válido'),
    password: z
      .string()
      .min(8, 'Senha com no mínimo 8 caracteres')
      .max(72, 'Senha muito longa')
      .refine(isStrongPassword, 'Senha precisa ter letras e números'),
  })
  .superRefine((values, context) => {
    const country = PHONE_COUNTRIES.find((item) => item.code === values.countryCode) ?? PHONE_COUNTRIES[0]
    const phoneError = validatePhoneForCountry(country, values.localPhone)
    if (phoneError) {
      context.addIssue({ code: 'custom', path: ['localPhone'], message: phoneError })
    }
  })

type RegisterFormValues = z.infer<typeof registerSchema>

export function ClientRegisterPage() {
  const navigate = useNavigate()
  const { bootstrapping, isAuthenticated, role, registerClient } = useAuth()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: 'onChange',
    defaultValues: {
      fullName: '',
      countryCode: 'BR',
      localPhone: '',
      email: '',
      password: '',
    },
  })

  const passwordValue = watch('password')
  const countryCode = watch('countryCode')
  const phonePlaceholder = useMemo(() => {
    const country = PHONE_COUNTRIES.find((item) => item.code === countryCode) ?? PHONE_COUNTRIES[0]
    return country.code === 'BR' ? '11999998888' : '9'.repeat(country.minLocalDigits)
  }, [countryCode])

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null)
    const country = PHONE_COUNTRIES.find((item) => item.code === values.countryCode) ?? PHONE_COUNTRIES[0]
    try {
      await registerClient({
        fullName: values.fullName.trim(),
        phone: composePhone(country.dial, values.localPhone),
        email: values.email.trim().toLowerCase(),
        password: values.password,
      })
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
      <SeoHead
        title="Criar conta"
        description="Cadastre-se no AgendaPro para acompanhar e cancelar seus agendamentos."
        path="/cadastro"
      />
      <Card className="space-y-6">
        <div className="text-center">
          <h1 className="font-display text-3xl font-bold text-ink-900">Criar conta</h1>
          <p className="mt-2 text-sm text-ink-600">
            Cadastre-se para acompanhar seus agendamentos. Agendar continua disponível sem login.
          </p>
        </div>

        <form className="space-y-4" noValidate onSubmit={onSubmit}>
          <Input
            label="Nome completo"
            placeholder="Maria Silva"
            autoComplete="name"
            error={errors.fullName?.message}
            {...register('fullName')}
          />

          <Controller
            name="countryCode"
            control={control}
            render={({ field: countryField }) => (
              <Controller
                name="localPhone"
                control={control}
                render={({ field: phoneField }) => (
                  <PhoneInput
                    label="Telefone"
                    country={countryField.value}
                    localNumber={phoneField.value}
                    onCountryChange={countryField.onChange}
                    onLocalNumberChange={phoneField.onChange}
                    placeholder={phonePlaceholder}
                    error={errors.localPhone?.message}
                  />
                )}
              />
            )}
          />

          <Input
            label="E-mail"
            type="email"
            placeholder="seuemail@exemplo.com"
            autoComplete="email"
            error={errors.email?.message}
            {...register('email')}
          />

          <div className="space-y-2">
            <PasswordInput
              label="Senha"
              placeholder="Mínimo 8 caracteres"
              autoComplete="new-password"
              hint="Mínimo 8 caracteres, com letras e números."
              error={errors.password?.message}
              {...register('password')}
            />
            <PasswordStrength value={passwordValue} />
          </div>

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
