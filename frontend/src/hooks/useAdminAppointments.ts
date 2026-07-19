import { useCallback, useEffect, useState } from 'react'
import {
  cancelAppointment,
  deleteAppointment,
  fetchAdminAppointments,
  fetchAdminAppointmentSummary,
  updateAppointmentStatus,
  type AppointmentSummary,
} from '../api/appointments'
import { getApiErrorMessage } from '../api/client'
import type { Appointment, AppointmentStatus } from '../types/appointment'

export function useAdminAppointments(dateFilter: string, search: string, page: number) {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [summary, setSummary] = useState<AppointmentSummary | null>(null)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [data, summaryData] = await Promise.all([
        fetchAdminAppointments({
          date: dateFilter || undefined,
          q: search || undefined,
          page,
          size: 10,
        }),
        fetchAdminAppointmentSummary(dateFilter || undefined),
      ])
      setAppointments(data.appointments)
      setTotalPages(data.totalPages)
      setTotalElements(data.totalElements)
      setSummary(summaryData)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Não foi possível carregar os agendamentos'))
    } finally {
      setLoading(false)
    }
  }, [dateFilter, page, search])

  useEffect(() => {
    void load()
  }, [load])

  const changeStatus = useCallback(
    async (id: number, status: AppointmentStatus) => {
      await updateAppointmentStatus(id, status)
      await load()
    },
    [load],
  )

  const cancel = useCallback(
    async (id: number) => {
      await cancelAppointment(id)
      await load()
    },
    [load],
  )

  const remove = useCallback(
    async (id: number) => {
      await deleteAppointment(id)
      await load()
    },
    [load],
  )

  return {
    appointments,
    summary,
    totalPages,
    totalElements,
    loading,
    error,
    reload: load,
    changeStatus,
    cancel,
    remove,
  }
}
