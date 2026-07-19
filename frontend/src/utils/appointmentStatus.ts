import type { AppointmentStatus } from '../types/appointment'

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  AGENDADO: 'Agendado',
  CONFIRMADO: 'Confirmado',
  CONCLUIDO: 'Concluído',
  CANCELADO: 'Cancelado',
}

export function statusLabel(status: AppointmentStatus): string {
  return APPOINTMENT_STATUS_LABELS[status]
}
