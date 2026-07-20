import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { createAppointment } from '../../api/appointments'
import { fetchClientProfile } from '../../api/clientAppointments'
import { getApiErrorMessage } from '../../api/client'
import { useAvailability } from '../../hooks/useAvailability'
import { useServices } from '../../hooks/useServices'
import { useToast } from '../../hooks/useToast'
import { useAuth } from '../../auth/useAuth'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { EmptyState } from '../ui/EmptyState'
import { ErrorState } from '../ui/ErrorState'
import { Input } from '../ui/Input'
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
  // Mesmo padrão do backend (Bean Validation) — evita rejeição só depois do submit.
  customerPhone: z
    .string()
    .regex(/^[0-9()+.\- ]{10,30}$/, 'Telefone inválido'),
  serviceId: z.string().min(1, 'Selecione um serviço'),
  appointmentDate: z.string().min(1, 'Selecione uma data'),
  appointmentTime: z.string().min(1, 'Selecione um horário'),
})

type BookingFormValues = z.infer<typeof bookingSchema>

export function BookingForm() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { isAuthenticated, role } = useAuth()
  const { services, loading: servicesLoading, error: servicesError, reload } = useServices()
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
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
        // Se o perfil não carregar, deixo o formulário em branco mesmo.
      })

    return () => {
      cancelled = true
    }
  }, [isAuthenticated, role, setValue])

  const selectedDate = watch('appointmentDate')
  const selectedTime = watch('appointmentTime')
  const {
    slots,
    loading: slotsLoading,
    error: slotsError,
    reload: reloadAvailability,
  } = useAvailability(
    selectedDate || null,
  )

  useEffect(() => {
    setValue('appointmentTime', '')
  }, [selectedDate, setValue])

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
    <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <Card className="space-y-4">
        <div>
          <h2 className="font-display text-xl font-semibold text-ink-900">Seus dados</h2>
          <p className="mt-1 text-sm text-ink-500">
            Preencha as informações para reservar o horário.
          </p>
        </div>

        <Input
          label="Nome"
          placeholder="Seu nome completo"
          error={errors.customerName?.message}
          {...register('customerName')}
        />

        <Input
          label="Telefone"
          placeholder="(11) 99999-9999"
          error={errors.customerPhone?.message}
          {...register('customerPhone')}
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

        <input type="hidden" {...register('appointmentDate')} />
        <input type="hidden" {...register('appointmentTime')} />

        {errors.appointmentDate ? (
          <p className="text-xs text-red-600">{errors.appointmentDate.message}</p>
        ) : null}
        {errors.appointmentTime ? (
          <p className="text-xs text-red-600">{errors.appointmentTime.message}</p>
        ) : null}

        <Button type="submit" className="w-full sm:w-auto" disabled={submitting}>
          {submitting ? 'Agendando...' : 'Confirmar agendamento'}
        </Button>
      </Card>

      <div className="space-y-4">
        <Card>
          <h2 className="mb-3 font-display text-lg font-semibold text-ink-900">Data</h2>
          <Calendar
            selectedDate={selectedDate}
            onSelect={(date) => setValue('appointmentDate', date, { shouldValidate: true })}
          />
        </Card>

        <Card>
          <h2 className="mb-3 font-display text-lg font-semibold text-ink-900">Horários</h2>
          {!selectedDate ? (
            <p className="py-6 text-center text-sm text-ink-500">
              Selecione uma data para ver os horários disponíveis.
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
        </Card>
      </div>
    </form>
  )
}
