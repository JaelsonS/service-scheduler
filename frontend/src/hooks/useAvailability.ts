import { useCallback, useEffect, useState } from 'react'
import { fetchAvailability } from '../api/appointments'
import { getApiErrorMessage } from '../api/client'

export function useAvailability(date: string | null, serviceId: string | null) {
  const [slots, setSlots] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!date || !serviceId) {
      setSlots([])
      setError(null)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const data = await fetchAvailability(date, Number(serviceId))
      setSlots(data.availableSlots)
    } catch (err) {
      setSlots([])
      setError(getApiErrorMessage(err, 'Não foi possível consultar a disponibilidade'))
    } finally {
      setLoading(false)
    }
  }, [date, serviceId])

  useEffect(() => {
    void load()
  }, [load])

  return { slots, loading, error, reload: load }
}
