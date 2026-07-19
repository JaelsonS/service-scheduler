import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { cancelMyAppointment, fetchMyAppointments } from '../../api/clientAppointments'
import { getApiErrorMessage } from '../../api/client'
import { useAuth } from '../../auth/useAuth'
import { useToast } from '../../hooks/useToast'
import { statusLabel } from '../../utils/appointmentStatus'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { ErrorState } from '../../components/ui/ErrorState'
import { Spinner } from '../../components/ui/Spinner'
import { StatusBadge } from '../../components/ui/StatusBadge'
import type { Appointment } from '../../types/appointment'

export function MyAppointmentsPage() {
  const { email } = useAuth()
  const { showToast } = useToast()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cancellingId, setCancellingId] = useState<number | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchMyAppointments()
      setAppointments(data.appointments)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Não foi possível carregar seus agendamentos'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function handleCancel(appointment: Appointment) {
    setCancellingId(appointment.id)
    try {
      await cancelMyAppointment(appointment.id)
      showToast('Agendamento cancelado', 'success')
      await load()
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Não foi possível cancelar'), 'error')
    } finally {
      setCancellingId(null)
    }
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink-900">Minha conta</h1>
          <p className="mt-1 text-sm text-ink-600">
            Olá{email ? `, ${email}` : ''}. Aqui estão seus agendamentos vinculados à conta.
          </p>
        </div>
        <Link
          to="/"
          className="inline-flex items-center justify-center rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Novo agendamento
        </Link>
      </div>

      {loading ? (
        <Card>
          <Spinner label="Carregando agendamentos..." />
        </Card>
      ) : error ? (
        <Card>
          <ErrorState message={error} onRetry={load} soft />
        </Card>
      ) : appointments.length === 0 ? (
        <Card>
          <EmptyState
            title="Nenhum agendamento ainda"
            description="Faça um agendamento enquanto estiver logado para vê-lo aqui."
            action={
              <Link
                to="/"
                className="inline-flex rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white"
              >
                Agendar agora
              </Link>
            }
          />
        </Card>
      ) : (
        <div className="grid gap-4">
          {appointments.map((appointment) => {
            const canCancel =
              appointment.status === 'AGENDADO' || appointment.status === 'CONFIRMADO'

            return (
              <Card key={appointment.id} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-lg font-semibold text-ink-900">
                      {appointment.service.name}
                    </h2>
                    <StatusBadge status={appointment.status} />
                  </div>
                  <p className="text-sm text-ink-600">
                    {appointment.appointmentDate} às {appointment.appointmentTime.slice(0, 5)}
                  </p>
                  <p className="text-xs text-ink-500">{statusLabel(appointment.status)}</p>
                </div>
                {canCancel ? (
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={cancellingId === appointment.id}
                    onClick={() => void handleCancel(appointment)}
                  >
                    {cancellingId === appointment.id ? 'Cancelando...' : 'Cancelar'}
                  </Button>
                ) : null}
              </Card>
            )
          })}
        </div>
      )}
    </section>
  )
}
