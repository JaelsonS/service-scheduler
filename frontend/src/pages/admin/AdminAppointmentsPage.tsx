import { useEffect, useState } from 'react'
import { getApiErrorMessage } from '../../api/client'
import { useAdminAppointments } from '../../hooks/useAdminAppointments'
import { useToast } from '../../hooks/useToast'
import { statusLabel } from '../../utils/appointmentStatus'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { ErrorState } from '../../components/ui/ErrorState'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { Spinner } from '../../components/ui/Spinner'
import { StatusBadge } from '../../components/ui/StatusBadge'
import type { Appointment, AppointmentStatus } from '../../types/appointment'

const nextStatusOptions: Partial<Record<AppointmentStatus, AppointmentStatus[]>> = {
  AGENDADO: ['CONFIRMADO', 'CANCELADO'],
  CONFIRMADO: ['CONCLUIDO', 'CANCELADO'],
}

export function AdminAppointmentsPage() {
  const { showToast } = useToast()
  const [dateFilter, setDateFilter] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [selected, setSelected] = useState<Appointment | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Appointment | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const {
    appointments,
    summary,
    totalPages,
    totalElements,
    loading,
    error,
    reload,
    changeStatus,
    cancel,
    remove,
  } = useAdminAppointments(dateFilter, search, page)

  useEffect(() => {
    setPage(0)
  }, [dateFilter, search])

  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(searchInput.trim()), 300)
    return () => window.clearTimeout(timer)
  }, [searchInput])

  async function handleStatusChange(appointment: Appointment, status: AppointmentStatus) {
    setActionLoading(true)
    try {
      if (status === 'CANCELADO') {
        await cancel(appointment.id)
      } else {
        await changeStatus(appointment.id, status)
      }
      showToast('Status atualizado', 'success')
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Falha ao atualizar status'), 'error')
    } finally {
      setActionLoading(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) {
      return
    }
    setActionLoading(true)
    try {
      await remove(deleteTarget.id)
      showToast('Agendamento excluído', 'success')
      setDeleteTarget(null)
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Falha ao excluir agendamento'), 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const count = (status: AppointmentStatus) => summary?.byStatus?.[status] ?? 0

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink-900">Agendamentos</h1>
          <p className="mt-1 text-sm text-ink-600">
            {totalElements} registro{totalElements === 1 ? '' : 's'} encontrados
          </p>
        </div>
        <div className="grid w-full gap-3 sm:grid-cols-2 lg:w-auto lg:min-w-[28rem]">
          <Input
            label="Buscar nome ou telefone"
            placeholder="Ex.: Maria ou 11999"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
          />
          <Input
            label="Filtrar por data"
            type="date"
            value={dateFilter}
            onChange={(event) => setDateFilter(event.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {(
          [
            ['AGENDADO', 'Agendados'],
            ['CONFIRMADO', 'Confirmados'],
            ['CONCLUIDO', 'Concluídos'],
            ['CANCELADO', 'Cancelados'],
          ] as const
        ).map(([status, label]) => (
          <Card key={status} className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">{label}</p>
            <p className="font-display text-2xl font-bold text-ink-900">{count(status)}</p>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden p-0">
        {loading ? <Spinner /> : null}
        {!loading && error ? <ErrorState message={error} onRetry={reload} /> : null}
        {!loading && !error && appointments.length === 0 ? (
          <EmptyState
            title="Nenhum agendamento"
            description="Não há agendamentos para o filtro selecionado."
            action={
              dateFilter || search ? (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setDateFilter('')
                    setSearchInput('')
                    setSearch('')
                  }}
                >
                  Limpar filtros
                </Button>
              ) : undefined
            }
          />
        ) : null}

        {!loading && !error && appointments.length > 0 ? (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-ink-200 bg-ink-50 text-xs uppercase tracking-wide text-ink-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Cliente</th>
                    <th className="px-4 py-3 font-semibold">Serviço</th>
                    <th className="px-4 py-3 font-semibold">Data</th>
                    <th className="px-4 py-3 font-semibold">Horário</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((appointment) => (
                    <tr key={appointment.id} className="border-b border-ink-100 last:border-0">
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          className="text-left font-semibold text-ink-900 hover:text-brand-700"
                          onClick={() => setSelected(appointment)}
                        >
                          {appointment.customerName}
                        </button>
                        <p className="text-xs text-ink-500">{appointment.customerPhone}</p>
                      </td>
                      <td className="px-4 py-3 text-ink-700">{appointment.service.name}</td>
                      <td className="px-4 py-3 text-ink-700">
                        {new Date(`${appointment.appointmentDate}T00:00:00`).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-4 py-3 text-ink-700">
                        {appointment.appointmentTime.slice(0, 5)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={appointment.status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          {(nextStatusOptions[appointment.status] ?? []).map((status) => (
                            <Button
                              key={status}
                              type="button"
                              variant="secondary"
                              className="!px-2.5 !py-1.5 text-xs"
                              disabled={actionLoading}
                              onClick={() => void handleStatusChange(appointment, status)}
                            >
                              {statusLabel(status)}
                            </Button>
                          ))}
                          <Button
                            type="button"
                            variant="danger"
                            className="!px-2.5 !py-1.5 text-xs"
                            disabled={actionLoading}
                            onClick={() => setDeleteTarget(appointment)}
                          >
                            Excluir
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-3 p-4 md:hidden">
              {appointments.map((appointment) => (
                <div key={appointment.id} className="rounded-xl border border-ink-100 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <button
                      type="button"
                      className="text-left"
                      onClick={() => setSelected(appointment)}
                    >
                      <p className="font-semibold text-ink-900">{appointment.customerName}</p>
                      <p className="text-xs text-ink-500">{appointment.customerPhone}</p>
                    </button>
                    <StatusBadge status={appointment.status} />
                  </div>
                  <p className="mt-2 text-sm text-ink-700">{appointment.service.name}</p>
                  <p className="text-sm text-ink-600">
                    {new Date(`${appointment.appointmentDate}T00:00:00`).toLocaleDateString('pt-BR')}{' '}
                    às {appointment.appointmentTime.slice(0, 5)}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(nextStatusOptions[appointment.status] ?? []).map((status) => (
                      <Button
                        key={status}
                        type="button"
                        variant="secondary"
                        className="!px-2.5 !py-1.5 text-xs"
                        disabled={actionLoading}
                        onClick={() => void handleStatusChange(appointment, status)}
                      >
                        {statusLabel(status)}
                      </Button>
                    ))}
                    <Button
                      type="button"
                      variant="danger"
                      className="!px-2.5 !py-1.5 text-xs"
                      disabled={actionLoading}
                      onClick={() => setDeleteTarget(appointment)}
                    >
                      Excluir
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : null}
      </Card>

      {totalPages > 1 ? (
        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="secondary"
            disabled={page === 0}
            onClick={() => setPage((current) => Math.max(current - 1, 0))}
          >
            Anterior
          </Button>
          <span className="text-sm text-ink-600">
            Página {page + 1} de {totalPages}
          </span>
          <Button
            type="button"
            variant="secondary"
            disabled={page + 1 >= totalPages}
            onClick={() => setPage((current) => current + 1)}
          >
            Próxima
          </Button>
        </div>
      ) : null}

      <Modal
        open={Boolean(deleteTarget)}
        title="Excluir agendamento"
        description="Esta ação remove o registro permanentemente. Deseja continuar?"
        confirmLabel="Excluir"
        danger
        loading={actionLoading}
        onConfirm={() => void handleDelete()}
        onCancel={() => setDeleteTarget(null)}
      />

      <Modal
        open={Boolean(selected)}
        title="Dados do cliente"
        description={
          selected
            ? `Nome: ${selected.customerName}
Telefone: ${selected.customerPhone}
Serviço: ${selected.service.name}
Data/hora: ${new Date(`${selected.appointmentDate}T00:00:00`).toLocaleDateString(
  'pt-BR',
)} às ${selected.appointmentTime.slice(0, 5)}
Status: ${statusLabel(selected.status)}`
            : ''
        }
        confirmLabel="Fechar"
        cancelLabel="Voltar"
        onConfirm={() => setSelected(null)}
        onCancel={() => setSelected(null)}
      />
    </section>
  )
}
