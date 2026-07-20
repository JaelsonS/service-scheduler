import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchAvailability } from '../api/appointments'
import { getApiErrorMessage } from '../api/client'

/**
 * Só busca horários quando há data + serviço e `enabled` (ex.: passo Horário).
 * Cancela resposta antiga se o usuário mudar data/serviço.
 */
export function useAvailability(
  date: string | null,
  serviceId: string | null,
  enabled = true,
) {
  const [slots, setSlots] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const requestId = useRef(0)

  const load = useCallback(async () => {
    if (!enabled || !date || !serviceId) {
      setSlots([])
      setError(null)
      setLoading(false)
      return
    }

    const id = ++requestId.current
    setLoading(true)
    setError(null)
    try {
      const data = await fetchAvailability(date, Number(serviceId))
      if (id !== requestId.current) return
      setSlots(data.availableSlots)
    } catch (err) {
      if (id !== requestId.current) return
      setSlots([])
      setError(getApiErrorMessage(err, 'Não foi possível consultar a disponibilidade'))
    } finally {
      if (id === requestId.current) {
        setLoading(false)
      }
    }
  }, [date, serviceId, enabled])

  useEffect(() => {
    void load()
  }, [load])

  return { slots, loading, error, reload: load }
}
