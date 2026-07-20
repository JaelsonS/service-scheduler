import { CheckCircle2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchAppointmentById } from '../api/appointments'
import { getApiErrorMessage } from '../api/client'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { ErrorState } from '../components/ui/ErrorState'
import { SeoHead } from '../components/SeoHead'
import { Spinner } from '../components/ui/Spinner'
import { StatusBadge } from '../components/ui/StatusBadge'
import type { Appointment } from '../types/appointment'

function formatDate(value: string): string {
  return new Date(`${value}T00:00:00`).toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

function formatTime(value: string): string {
  return value.slice(0, 5)
}

export function ConfirmationPage() {
  const { id } = useParams()
  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      if (!id) {
        setError('Agendamento não encontrado')
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const data = await fetchAppointmentById(Number(id))
        setAppointment(data)
      } catch (err) {
        setError(getApiErrorMessage(err, 'Não foi possível carregar a confirmação'))
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [id])

  if (loading) {
    return (
      <Card>
        <Spinner label="Carregando confirmação..." />
      </Card>
    )
  }

  if (error || !appointment) {
    return (
      <Card>
        <ErrorState
          message={error ?? 'Agendamento não encontrado'}
          action={
            <Link to="/">
              <Button type="button" variant="secondary">
                Voltar para o início
              </Button>
            </Link>
          }
        />
      </Card>
    )
  }

  return (
    <section className="mx-auto max-w-xl space-y-6">
      <SeoHead
        title="Agendamento confirmado"
        description="Seu horário foi reservado com sucesso no AgendaPro."
        path={`/confirmacao/${appointment.id}`}
        noIndex
      />
      <Card className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-700">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <h1 className="font-display text-3xl font-bold text-ink-900">Agendamento confirmado</h1>
        <p className="mt-2 text-ink-600">
          Seu horário foi reservado. Guarde os detalhes abaixo.
        </p>
      </Card>

      <Card className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-ink-500">Status</span>
          <StatusBadge status={appointment.status} />
        </div>
        <Detail label="Código" value={`#${appointment.id}`} />
        <Detail label="Cliente" value={appointment.customerName} />
        <Detail label="Telefone" value={appointment.customerPhone} />
        <Detail label="Serviço" value={appointment.service.name} />
        <Detail label="Data" value={formatDate(appointment.appointmentDate)} />
        <Detail label="Horário" value={formatTime(appointment.appointmentTime)} />
      </Card>

      <div className="flex flex-wrap gap-3">
        <Link to="/">
          <Button type="button">Novo agendamento</Button>
        </Link>
      </div>
    </section>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-ink-100 pb-3 last:border-0 last:pb-0">
      <span className="text-sm text-ink-500">{label}</span>
      <span className="text-right text-sm font-semibold text-ink-900">{value}</span>
    </div>
  )
}
