import { apiClient } from './client'
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
  const { data } = await apiClient.get<Appointment>(`/appointments/${id}`)
  return data
}

export async function fetchAvailability(date: string): Promise<AvailabilityResponse> {
  const { data } = await apiClient.get<AvailabilityResponse>('/appointments/availability', {
    params: { date },
  })
  return data
}

export async function fetchAdminAppointments(params: {
  date?: string
  page?: number
  size?: number
}): Promise<AppointmentListResponse> {
  const { data } = await apiClient.get<AppointmentListResponse>('/admin/appointments', {
    params,
  })
  return data
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
