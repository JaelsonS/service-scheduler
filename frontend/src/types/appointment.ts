export type AppointmentStatus =
  | 'AGENDADO'
  | 'CONFIRMADO'
  | 'CONCLUIDO'
  | 'CANCELADO'

export interface ServiceItem {
  id: number
  name: string
  durationMinutes: number
  active: boolean
}

export interface Appointment {
  id: number
  customerName: string
  customerPhone: string
  appointmentDate: string
  appointmentTime: string
  status: AppointmentStatus
  service: ServiceItem
  createdAt: string
  updatedAt: string
}

export interface AppointmentListResponse {
  appointments: Appointment[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export interface AvailabilityResponse {
  date: string
  availableSlots: string[]
}

export interface CreateAppointmentPayload {
  customerName: string
  customerPhone: string
  appointmentDate: string
  appointmentTime: string
  serviceId: number
  timezone?: string
}

export interface ApiErrorBody {
  timestamp: string
  status: number
  code: string
  message: string
  path: string
  fieldErrors: Record<string, string>
}
