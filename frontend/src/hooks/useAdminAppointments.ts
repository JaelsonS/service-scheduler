import { useCallback, useEffect, useState } from 'react'
import {
  cancelAppointment,
  deleteAppointment,
  fetchAdminAppointments,
  updateAppointmentStatus,
} from '../api/appointments'
import { getApiErrorMessage } from '../api/client'
import type { Appointment, AppointmentStatus } from '../types/appointment'

export function useAdminAppointments(dateFilter: string, page: number) {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchAdminAppointments({
        date: dateFilter || undefined,
        page,
        size: 10,
      })
      setAppointments(data.appointments)
      setTotalPages(data.totalPages)
      setTotalElements(data.totalElements)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Não foi possível carregar os agendamentos'))
    } finally {
      setLoading(false)
    }
  }, [dateFilter, page])

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
