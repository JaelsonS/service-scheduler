import { apiClient, getWithRetry } from './client'
import type { AppointmentListResponse } from '../types/appointment'

export async function fetchMyAppointments(): Promise<AppointmentListResponse> {
  return getWithRetry<AppointmentListResponse>('/client/appointments')
}

export async function cancelMyAppointment(id: number): Promise<void> {
  await apiClient.post(`/client/appointments/${id}/cancel`)
}

export async function fetchClientProfile(): Promise<{
  id: number
  email: string
  fullName: string
  phone: string
}> {
  return getWithRetry('/client/me')
}
