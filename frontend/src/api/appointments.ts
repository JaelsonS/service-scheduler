import { apiClient, getWithRetry } from './client'
import type {
  Appointment,
  AppointmentListResponse,
  AppointmentStatus,
  AvailabilityResponse,
  CreateAppointmentPayload,
} from '../types/appointment'

export async function createAppointment(payload: CreateAppointmentPayload): Promise<Appointment> {
  const { data } = await apiClient.post<Appointment>('/appointments', payload)
  return data
}

export async function fetchAppointmentById(id: number): Promise<Appointment> {
  return getWithRetry<Appointment>(`/appointments/${id}`)
}

export async function fetchAvailability(date: string, serviceId: number): Promise<AvailabilityResponse> {
  return getWithRetry<AvailabilityResponse>('/appointments/availability', {
    params: { date, serviceId },
  })
}

export async function fetchAdminAppointments(params: {
  date?: string
  q?: string
  page?: number
  size?: number
}): Promise<AppointmentListResponse> {
  return getWithRetry<AppointmentListResponse>('/admin/appointments', {
    params,
  })
}

export interface AppointmentSummary {
  total: number
  byStatus: Partial<Record<AppointmentStatus, number>>
}

export async function fetchAdminAppointmentSummary(date?: string): Promise<AppointmentSummary> {
  return getWithRetry<AppointmentSummary>('/admin/appointments/summary', {
    params: { date: date || undefined },
  })
}

export async function updateAppointmentStatus(
  id: number,
  status: AppointmentStatus,
): Promise<Appointment> {
  const { data } = await apiClient.patch<Appointment>(`/admin/appointments/${id}/status`, {
    status,
  })
  return data
}

export async function cancelAppointment(id: number): Promise<Appointment> {
  const { data } = await apiClient.post<Appointment>(`/admin/appointments/${id}/cancel`)
  return data
}

export async function deleteAppointment(id: number): Promise<void> {
  await apiClient.delete(`/admin/appointments/${id}`)
}
