import { zodResolver } from '@hookform/resolvers/zod'
import { Check, ChevronLeft } from 'lucide-react'
import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { createAppointment } from '../../api/appointments'
import { fetchClientProfile } from '../../api/clientAppointments'
import { getApiErrorMessage } from '../../api/client'
import { useAvailability } from '../../hooks/useAvailability'
import { useServices } from '../../hooks/useServices'
import { useToast } from '../../hooks/useToast'
import { useAuth } from '../../auth/useAuth'
import { isValidPhoneNumber } from '../../lib/phone'
import { getClientTimeZone } from '../../lib/datetime'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { EmptyState } from '../ui/EmptyState'
import { ErrorState } from '../ui/ErrorState'
import { Input } from '../ui/Input'
import { Spinner } from '../ui/Spinner'
import { Calendar } from './Calendar'
import { TimeSlotPicker } from './TimeSlotPicker'
import type { ApiErrorBody } from '../../types/appointment'

const PhoneField = lazy(() =>
  import('../ui/PhoneField').then((m) => ({ default: m.PhoneField })),
)

function ServiceListSkeleton() {
  return (
    <div className="grid gap-2 sm:gap-3" aria-hidden="true">
      {[0, 1, 2].map((item) => (
        <div
          key={item}
          className="h-[4.25rem] animate-pulse rounded-2xl border border-ink-100 bg-ink-50"
        />
      ))}
    </div>
  )
}

const bookingSchema = z.object({
  customerName: z
    .string()
    .min(2, 'Informe o nome completo')
    .max(120, 'Nome muito longo'),
  customerPhone: z
    .string()
    .min(1, 'Informe o telefone')
    .refine((value) => isValidPhoneNumber(value), 'Telefone inválido para o país selecionado'),
  serviceId: z.string().min(1, 'Selecione um serviço'),
  appointmentDate: z.string().min(1, 'Selecione uma data'),
  appointmentTime: z.string().min(1, 'Selecione um horário'),
})

type BookingFormValues = z.infer<typeof bookingSchema>

type StepId = 1 | 2 | 3 | 4

const STEPS: { id: StepId; label: string }[] = [
  { id: 1, label: 'Serviço' },
  { id: 2, label: 'Data' },
  { id: 3, label: 'Horário' },
  { id: 4, label: 'Dados' },
]

function formatDateLabel(iso: string): string {
  if (!iso) return ''
  const date = new Date(`${iso}T00:00:00`)
  return date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  })
}

function formatDateShort(iso: string): string {
  if (!iso) return ''
  const date = new Date(`${iso}T00:00:00`)
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
  })
}

function BookingStepper({
  currentStep,
  completedThrough,
}: {
  currentStep: StepId
  completedThrough: number
}) {
  return (
    <nav aria-label="Etapas do agendamento" className="w-full">
      <ol className="flex items-start justify-between gap-1 sm:gap-2">
        {STEPS.map((step, index) => {
          const isActive = currentStep === step.id
          const isDone = completedThrough >= step.id && !isActive
          const isReachable = step.id <= Math.max(currentStep, completedThrough + 1)

          return (
            <li key={step.id} className="relative flex flex-1 flex-col items-center">
              {index > 0 ? (
                <span
                  aria-hidden="true"
                  className={`absolute top-4 right-1/2 -z-0 h-0.5 w-full -translate-y-1/2 ${
                    completedThrough >= step.id - 1 || currentStep >= step.id
                      ? 'bg-brand-500'
                      : 'bg-ink-200'
                  }`}
                />
              ) : null}
              <span
                className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition ${
                  isDone
                    ? 'bg-brand-600 text-white'
                    : isActive
                      ? 'bg-brand-600 text-white ring-4 ring-brand-100'
                      : isReachable
                        ? 'border-2 border-ink-200 bg-white text-ink-500'
                        : 'border-2 border-ink-100 bg-ink-50 text-ink-300'
                }`}
                aria-current={isActive ? 'step' : undefined}
              >
                {isDone ? <Check className="h-4 w-4" strokeWidth={2.5} /> : step.id}
              </span>
              <span
                className={`mt-2 text-center text-[0.7rem] font-medium sm:text-xs ${
                  isActive ? 'text-brand-700' : isDone ? 'text-ink-700' : 'text-ink-400'
                }`}
              >
                {step.label}
              </span>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

function BookingSummary({
  serviceName,
  durationMinutes,
  date,
  time,
  currentStep,
  canContinue,
  submitting,
  onBack,
  onContinue,
  onConfirm,
}: {
  serviceName?: string
  durationMinutes?: number
  date: string
  time: string
  currentStep: StepId
  canContinue: boolean
  submitting: boolean
  onBack: () => void
  onContinue: () => void
  onConfirm: () => void
}) {
  const rows = [
    {
      label: 'Serviço',
      value: serviceName
        ? `${serviceName}${durationMinutes ? ` · ${durationMinutes} min` : ''}`
        : '—',
    },
    {
      label: 'Data',
      value: date ? formatDateShort(date) : '—',
    },
    {
      label: 'Horário',
      value: time ? time.slice(0, 5) : '—',
    },
  ]

  return (
    <aside className="flex h-full flex-col rounded-2xl border border-ink-100 bg-ink-50/80 p-4 sm:p-5">
      <h3 className="font-display text-sm font-semibold text-ink-900">Resumo</h3>
      <ul className="mt-4 space-y-3 text-sm">
        {rows.map((row) => (
          <li key={row.label} className="flex flex-col gap-0.5 border-b border-ink-100 pb-3 last:border-0">
            <span className="text-xs font-medium uppercase tracking-wide text-ink-400">
              {row.label}
            </span>
            <span className={`font-medium ${row.value === '—' ? 'text-ink-300' : 'text-ink-800'}`}>
              {row.value}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-auto flex flex-col gap-2 pt-6">
        {currentStep > 1 ? (
          <Button type="button" variant="secondary" className="w-full" onClick={onBack}>
            <ChevronLeft className="h-4 w-4" />
            Voltar
          </Button>
        ) : null}

        {currentStep < 4 ? (
          <Button
            type="button"
            className="w-full"
            disabled={!canContinue}
            onClick={onContinue}
          >
            Continuar
          </Button>
        ) : (
          <Button
            type="button"
            className="w-full"
            disabled={submitting || !canContinue}
            onClick={onConfirm}
          >
            {submitting ? 'Agendando...' : 'Confirmar agendamento'}
          </Button>
        )}
      </div>
    </aside>
  )
}

export function BookingForm() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { isAuthenticated, role } = useAuth()
  const { services, loading: servicesLoading, error: servicesError, reload } = useServices()
  const [submitting, setSubmitting] = useState(false)
  const [step, setStep] = useState<StepId>(1)

  const {
    register,
    control,
    handleSubmit,
    setValue,
    setError,
    watch,
    trigger,
    formState: { errors },
  } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      customerName: '',
      customerPhone: '',
      serviceId: '',
      appointmentDate: '',
      appointmentTime: '',
    },
  })

  useEffect(() => {
    if (!isAuthenticated || role !== 'CLIENT' || step !== 4) {
      return
    }

    let cancelled = false
    void fetchClientProfile()
      .then((profile) => {
        if (cancelled) {
          return
        }
        setValue('customerName', profile.fullName)
        setValue('customerPhone', profile.phone)
      })
      .catch(() => {
        // Perfil opcional: se falhar, o cliente preenche manualmente.
      })

    return () => {
      cancelled = true
    }
  }, [isAuthenticated, role, setValue, step])

  const selectedDate = watch('appointmentDate')
  const selectedTime = watch('appointmentTime')
  const selectedServiceId = watch('serviceId')
  const {
    slots,
    loading: slotsLoading,
    error: slotsError,
    reload: reloadAvailability,
  } = useAvailability(
    selectedDate || null,
    selectedServiceId || null,
    step >= 3,
  )

  useEffect(() => {
    setValue('appointmentTime', '')
  }, [selectedDate, selectedServiceId, setValue])

  useEffect(() => {
    if (!selectedTime || slotsLoading) {
      return
    }
    const stillAvailable = slots.some(
      (slot) => slot === selectedTime || slot.slice(0, 5) === selectedTime.slice(0, 5),
    )
    if (!stillAvailable) {
      setValue('appointmentTime', '')
    }
  }, [slots, slotsLoading, selectedTime, setValue])

  const selectedService = useMemo(
    () => services.find((service) => String(service.id) === selectedServiceId),
    [services, selectedServiceId],
  )

  const completedThrough = useMemo(() => {
    if (!selectedServiceId) return 0
    if (!selectedDate) return 1
    if (!selectedTime) return 2
    return 3
  }, [selectedServiceId, selectedDate, selectedTime])

  const canContinue = useMemo(() => {
    if (step === 1) return Boolean(selectedServiceId) && !servicesLoading
    if (step === 2) return Boolean(selectedDate)
    if (step === 3) return Boolean(selectedTime)
    return Boolean(selectedServiceId && selectedDate && selectedTime)
  }, [step, selectedServiceId, selectedDate, selectedTime, servicesLoading])

  const goNext = () => {
    if (step < 4 && canContinue) {
      setStep((step + 1) as StepId)
    }
  }

  const goBack = () => {
    if (step > 1) {
      setStep((step - 1) as StepId)
    }
  }

  const onSubmit = handleSubmit(async (values) => {
    setSubmitting(true)
    try {
      const appointment = await createAppointment({
        customerName: values.customerName.trim(),
        customerPhone: values.customerPhone.trim(),
        serviceId: Number(values.serviceId),
        appointmentDate: values.appointmentDate,
        appointmentTime: values.appointmentTime.length === 5
          ? `${values.appointmentTime}:00`
          : values.appointmentTime,
        timezone: getClientTimeZone(),
      })
      showToast('Agendamento criado com sucesso', 'success')
      navigate(`/confirmacao/${appointment.id}`)
    } catch (error) {
      const maybeError = error as Partial<{
        response: { data: ApiErrorBody }
      }>

      const fieldErrors = maybeError.response?.data?.fieldErrors
      const knownFields: (keyof BookingFormValues)[] = [
        'customerName',
        'customerPhone',
        'serviceId',
        'appointmentDate',
        'appointmentTime',
      ]

      if (fieldErrors) {
        for (const field of knownFields) {
          const message = fieldErrors[field]
          if (message) {
            setError(field, { type: 'server', message })
          }
        }
      }

      showToast(getApiErrorMessage(error, 'Não foi possível criar o agendamento'), 'error')
    } finally {
      setSubmitting(false)
    }
  })

  const handleConfirmClick = async () => {
    const valid = await trigger(['customerName', 'customerPhone'])
    if (!valid) {
      return
    }
    void onSubmit()
  }

  const stepTitles: Record<StepId, { title: string; description: string }> = {
    1: {
      title: 'Escolha o serviço',
      description: 'A duração define quanto tempo será reservado na agenda.',
    },
    2: {
      title: 'Escolha a data',
      description: selectedService
        ? `Dia para ${selectedService.name} (${selectedService.durationMinutes} min).`
        : 'Selecione um dia disponível.',
    },
    3: {
      title: 'Escolha o horário',
      description: selectedDate
        ? `Horários livres para ${formatDateLabel(selectedDate)}.`
        : 'Selecione um horário disponível.',
    },
    4: {
      title: 'Seus dados',
      description: 'Informe nome e telefone para confirmar o agendamento.',
    },
  }

  const softServicesError = Boolean(
    servicesError && /conectar|servidor|CORS|iniciando|acordando|demorou/i.test(servicesError),
  )

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        if (step === 4) {
          void handleConfirmClick()
        }
      }}
      className="mx-auto w-full max-w-5xl"
    >
      <input type="hidden" {...register('serviceId')} />
      <input type="hidden" {...register('appointmentDate')} />
      <input type="hidden" {...register('appointmentTime')} />

      <Card className="overflow-hidden p-0 sm:p-0">
        <div className="border-b border-ink-100 px-4 py-5 sm:px-6 sm:py-6">
          <BookingStepper currentStep={step} completedThrough={completedThrough} />
        </div>

        <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="space-y-5 px-4 py-5 sm:px-6 sm:py-6">
            <div>
              <h2 className="font-display text-xl font-semibold text-ink-900 sm:text-2xl">
                {stepTitles[step].title}
              </h2>
              <p className="mt-1 text-sm text-ink-500">{stepTitles[step].description}</p>
            </div>

            {step === 1 ? (
              <div className="grid gap-2 sm:gap-3">
                {servicesLoading ? (
                  <div className="space-y-3">
                    <ServiceListSkeleton />
                    <p className="text-center text-xs text-ink-500">
                      Buscando serviços…
                    </p>
                  </div>
                ) : null}

                {!servicesLoading && servicesError ? (
                  <ErrorState
                    message={servicesError}
                    onRetry={reload}
                    soft={softServicesError}
                  />
                ) : null}

                {!servicesLoading && !servicesError && services.length === 0 ? (
                  <EmptyState
                    title="Nenhum serviço disponível"
                    description="Não há serviços disponíveis para agendamento no momento."
                    action={
                      <Button type="button" variant="secondary" onClick={reload}>
                        Atualizar
                      </Button>
                    }
                  />
                ) : null}

                {!servicesLoading && !servicesError
                  ? services.map((service) => {
                      const active = String(service.id) === selectedServiceId
                      return (
                        <button
                          key={service.id}
                          type="button"
                          onClick={() => {
                            setValue('serviceId', String(service.id), { shouldValidate: true })
                            setValue('appointmentDate', '')
                            setValue('appointmentTime', '')
                          }}
                          className={`flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3.5 text-left transition sm:px-5 ${
                            active
                              ? 'border-brand-600 bg-brand-50/80 ring-2 ring-brand-200'
                              : 'border-ink-200 bg-white hover:border-brand-300 hover:bg-brand-50/40'
                          }`}
                          aria-pressed={active}
                        >
                          <span className="min-w-0">
                            <span className="block font-display text-base font-semibold text-ink-900">
                              {service.name}
                            </span>
                            <span className="mt-0.5 block text-sm text-ink-500">
                              {service.durationMinutes} min
                            </span>
                          </span>
                          <span
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                              active ? 'bg-brand-600 text-white' : 'border-2 border-ink-200'
                            }`}
                            aria-hidden="true"
                          >
                            {active ? <Check className="h-3.5 w-3.5" strokeWidth={2.5} /> : null}
                          </span>
                        </button>
                      )
                    })
                  : null}

                {errors.serviceId ? (
                  <p className="text-xs text-red-600">{errors.serviceId.message}</p>
                ) : null}
              </div>
            ) : null}

            {step === 2 ? (
              <div>
                <Calendar
                  selectedDate={selectedDate}
                  onSelect={(date) => setValue('appointmentDate', date, { shouldValidate: true })}
                />
                {errors.appointmentDate ? (
                  <p className="pt-2 text-xs text-red-600">{errors.appointmentDate.message}</p>
                ) : null}
              </div>
            ) : null}

            {step === 3 ? (
              <div>
                {slotsError ? (
                  <ErrorState
                    message={slotsError}
                    onRetry={reloadAvailability}
                    soft={/conectar|servidor|CORS|iniciando|acordando/i.test(slotsError)}
                  />
                ) : (
                  <TimeSlotPicker
                    slots={slots}
                    selected={selectedTime}
                    loading={slotsLoading}
                    error={null}
                    onSelect={(slot) => setValue('appointmentTime', slot, { shouldValidate: true })}
                  />
                )}
                {errors.appointmentTime ? (
                  <p className="pt-2 text-xs text-red-600">{errors.appointmentTime.message}</p>
                ) : null}
              </div>
            ) : null}

            {step === 4 ? (
              <div className="space-y-4">
                {canContinue ? (
                  <div className="rounded-xl border border-brand-200 bg-brand-50/70 px-4 py-3 text-sm text-brand-900">
                    <p className="font-semibold">{selectedService?.name}</p>
                    <p className="mt-0.5 capitalize">
                      {formatDateLabel(selectedDate)} · {selectedTime.slice(0, 5)}
                      {selectedService ? ` · ${selectedService.durationMinutes} min` : ''}
                    </p>
                  </div>
                ) : null}

                <Input
                  label="Nome"
                  placeholder="Seu nome completo"
                  autoComplete="name"
                  error={errors.customerName?.message}
                  {...register('customerName')}
                />
                <Suspense fallback={<Spinner label="Carregando telefone..." />}>
                  <Controller
                    name="customerPhone"
                    control={control}
                    render={({ field }) => (
                      <PhoneField
                        label="Telefone"
                        value={field.value}
                        onChange={(value) => field.onChange(value ?? '')}
                        onBlur={field.onBlur}
                        error={errors.customerPhone?.message}
                        defaultCountry="BR"
                      />
                    )}
                  />
                </Suspense>

                {/* Mobile-only actions (sidebar hidden below lg) */}
                <div className="flex flex-col gap-2 pt-2 lg:hidden">
                  <Button
                    type="button"
                    className="w-full"
                    disabled={submitting || !canContinue}
                    onClick={() => void handleConfirmClick()}
                  >
                    {submitting ? 'Agendando...' : 'Confirmar agendamento'}
                  </Button>
                  <Button type="button" variant="secondary" className="w-full" onClick={goBack}>
                    <ChevronLeft className="h-4 w-4" />
                    Voltar
                  </Button>
                </div>
              </div>
            ) : null}

            {step < 4 ? (
              <div className="flex flex-col gap-2 border-t border-ink-100 pt-5 lg:hidden">
                <Button
                  type="button"
                  className="w-full"
                  disabled={!canContinue}
                  onClick={goNext}
                >
                  Continuar
                </Button>
                {step > 1 ? (
                  <Button type="button" variant="secondary" className="w-full" onClick={goBack}>
                    <ChevronLeft className="h-4 w-4" />
                    Voltar
                  </Button>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="hidden border-t border-ink-100 lg:block lg:border-t-0 lg:border-l">
            <div className="sticky top-4 h-full p-5">
              <BookingSummary
                serviceName={selectedService?.name}
                durationMinutes={selectedService?.durationMinutes}
                date={selectedDate}
                time={selectedTime}
                currentStep={step}
                canContinue={canContinue}
                submitting={submitting}
                onBack={goBack}
                onContinue={goNext}
                onConfirm={() => void handleConfirmClick()}
              />
            </div>
          </div>
        </div>
      </Card>
    </form>
  )
}
