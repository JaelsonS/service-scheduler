import { zodResolver } from '@hookform/resolvers/zod'
import { CalendarDays, CheckCircle2, Clock3, Scissors, UserRound } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
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
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { EmptyState } from '../ui/EmptyState'
import { ErrorState } from '../ui/ErrorState'
import { Input } from '../ui/Input'
import { PhoneField } from '../ui/PhoneField'
import { Select } from '../ui/Select'
import { BootAwareSpinner } from '../ui/Spinner'
import { Calendar } from './Calendar'
import { TimeSlotPicker } from './TimeSlotPicker'
import type { ApiErrorBody } from '../../types/appointment'

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

function StepHeading({
  step,
  title,
  description,
  done,
  icon: Icon,
}: {
  step: number
  title: string
  description: string
  done?: boolean
  icon: typeof CalendarDays
}) {
  return (
    <div className="mb-4 flex items-start gap-3">
      <span
        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
          done ? 'bg-brand-600 text-white' : 'bg-brand-50 text-brand-700'
        }`}
        aria-hidden="true"
      >
        {done ? <CheckCircle2 className="h-4 w-4" /> : step}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-brand-600" aria-hidden="true" />
          <h2 className="font-display text-lg font-semibold text-ink-900 sm:text-xl">{title}</h2>
        </div>
        <p className="mt-0.5 text-sm text-ink-500">{description}</p>
      </div>
    </div>
  )
}

function formatDateLabel(iso: string): string {
  if (!iso) return ''
  const date = new Date(`${iso}T00:00:00`)
  return date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  })
}

export function BookingForm() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { isAuthenticated, role } = useAuth()
  const { services, loading: servicesLoading, error: servicesError, reload } = useServices()
  const [submitting, setSubmitting] = useState(false)
  const timeSectionRef = useRef<HTMLDivElement>(null)
  const detailsSectionRef = useRef<HTMLDivElement>(null)

  const {
    register,
    control,
    handleSubmit,
    setValue,
    setError,
    watch,
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
    if (!isAuthenticated || role !== 'CLIENT') {
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
  }, [isAuthenticated, role, setValue])

  const selectedDate = watch('appointmentDate')
  const selectedTime = watch('appointmentTime')
  const selectedServiceId = watch('serviceId')
  const {
    slots,
    loading: slotsLoading,
    error: slotsError,
    reload: reloadAvailability,
  } = useAvailability(selectedDate || null, selectedServiceId || null)

  useEffect(() => {
    setValue('appointmentTime', '')
  }, [selectedDate, selectedServiceId, setValue])

  useEffect(() => {
    if (!selectedDate || !selectedServiceId) {
      return
    }
    timeSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [selectedDate, selectedServiceId])

  useEffect(() => {
    if (!selectedTime) {
      return
    }
    detailsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [selectedTime])

  const selectedService = useMemo(
    () => services.find((service) => String(service.id) === selectedServiceId),
    [services, selectedServiceId],
  )

  const summaryReady = Boolean(selectedDate && selectedTime && selectedService)

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

  if (servicesLoading) {
    return (
      <Card>
        <BootAwareSpinner label="Carregando serviços..." />
      </Card>
    )
  }

  if (servicesError) {
    const soft = /conectar|servidor|CORS|iniciando|acordando/i.test(servicesError)
    return (
      <Card>
        <ErrorState message={servicesError} onRetry={reload} soft={soft} />
      </Card>
    )
  }

  if (services.length === 0) {
    return (
      <Card>
        <EmptyState
          title="Nenhum serviço disponível"
          description="Não há serviços disponíveis para agendamento no momento."
          action={
            <Button type="button" variant="secondary" onClick={reload}>
              Atualizar
            </Button>
          }
        />
      </Card>
    )
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto flex w-full max-w-3xl flex-col gap-4 sm:gap-5">
      <input type="hidden" {...register('appointmentDate')} />
      <input type="hidden" {...register('appointmentTime')} />

      <Card className="space-y-4">
        <StepHeading
          step={1}
          title="Escolha o serviço"
          description="A duração define quanto tempo será reservado na agenda."
          done={Boolean(selectedServiceId)}
          icon={Scissors}
        />
        <Select
          label="Serviço"
          placeholder="Selecione um serviço"
          error={errors.serviceId?.message}
          options={services.map((service) => ({
            value: String(service.id),
            label: `${service.name} · ${service.durationMinutes} min`,
          }))}
          {...register('serviceId')}
        />
      </Card>

      <Card className="space-y-1">
        <StepHeading
          step={2}
          title="Escolha a data"
          description={
            selectedService
              ? `Dia para ${selectedService.name} (${selectedService.durationMinutes} min).`
              : 'Selecione o serviço acima para continuar.'
          }
          done={Boolean(selectedDate)}
          icon={CalendarDays}
        />
        {!selectedServiceId ? (
          <p className="rounded-xl bg-ink-50 px-4 py-8 text-center text-sm text-ink-500">
            Escolha o serviço primeiro.
          </p>
        ) : (
          <Calendar
            selectedDate={selectedDate}
            onSelect={(date) => setValue('appointmentDate', date, { shouldValidate: true })}
          />
        )}
        {errors.appointmentDate ? (
          <p className="pt-2 text-xs text-red-600">{errors.appointmentDate.message}</p>
        ) : null}
      </Card>

      <Card ref={timeSectionRef} className="space-y-1">
        <StepHeading
          step={3}
          title="Escolha o horário"
          description={
            selectedDate && selectedService
              ? `Horários livres para ${formatDateLabel(selectedDate)} · ${selectedService.durationMinutes} min.`
              : 'Depois do serviço e da data, os horários aparecem aqui.'
          }
          done={Boolean(selectedTime)}
          icon={Clock3}
        />
        {!selectedServiceId || !selectedDate ? (
          <p className="rounded-xl bg-ink-50 px-4 py-8 text-center text-sm text-ink-500">
            Selecione serviço e data para ver os horários.
          </p>
        ) : slotsError ? (
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
      </Card>

      <Card ref={detailsSectionRef} className="space-y-4">
        <StepHeading
          step={4}
          title="Seus dados"
          description="Confira o resumo e finalize o agendamento."
          done={summaryReady}
          icon={UserRound}
        />

        {summaryReady ? (
          <div className="rounded-xl border border-brand-200 bg-brand-50/70 px-4 py-3 text-sm text-brand-900">
            <p className="font-semibold">{selectedService?.name}</p>
            <p className="mt-0.5 capitalize">
              {formatDateLabel(selectedDate)} · {selectedTime.slice(0, 5)}
              {selectedService ? ` · ${selectedService.durationMinutes} min` : ''}
            </p>
          </div>
        ) : (
          <p className="rounded-xl bg-ink-50 px-4 py-3 text-sm text-ink-500">
            Complete serviço, data e horário para ver o resumo.
          </p>
        )}

        <div className="space-y-4">
          <Input
            label="Nome"
            placeholder="Seu nome completo"
            autoComplete="name"
            error={errors.customerName?.message}
            {...register('customerName')}
          />
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
        </div>

        <Button
          type="submit"
          className="w-full sm:w-auto sm:min-w-[14rem]"
          disabled={submitting || !summaryReady}
        >
          {submitting ? 'Agendando...' : 'Confirmar agendamento'}
        </Button>
      </Card>
    </form>
  )
}
