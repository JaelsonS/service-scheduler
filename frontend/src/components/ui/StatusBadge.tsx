import type { AppointmentStatus } from '../../types/appointment'
import { APPOINTMENT_STATUS_LABELS } from '../../utils/appointmentStatus'

const styles: Record<AppointmentStatus, string> = {
  AGENDADO: 'bg-amber-50 text-amber-800 border-amber-200',
  CONFIRMADO: 'bg-brand-50 text-brand-800 border-brand-200',
  CONCLUIDO: 'bg-ink-100 text-ink-700 border-ink-200',
  CANCELADO: 'bg-red-50 text-red-700 border-red-200',
}

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  return (
    <span
      className={`inline-flex rounded-lg border px-2.5 py-1 text-xs font-semibold ${styles[status]}`}
    >
      {APPOINTMENT_STATUS_LABELS[status]}
    </span>
  )
}
