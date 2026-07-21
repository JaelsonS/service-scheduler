import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchAvailability } from '../api/appointments'
import { getApiErrorMessage } from '../api/client'
import { filterSlotsFromNow, getClientTimeZone } from '../lib/datetime'

/**
 * Só busca horários quando há data + serviço e `enabled` (ex.: passo Horário).
 * Filtra slots passados com a hora local do utilizador e atualiza ao vivo.
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
  const rawSlots = useRef<string[]>([])

  const applyLiveFilter = useCallback((dateIso: string, source: string[]) => {
    setSlots(filterSlotsFromNow(dateIso, source))
  }, [])

  const load = useCallback(async () => {
    if (!enabled || !date || !serviceId) {
      rawSlots.current = []
      setSlots([])
      setError(null)
      setLoading(false)
      return
    }

    const id = ++requestId.current
    setLoading(true)
    setError(null)
    try {
      const data = await fetchAvailability(date, Number(serviceId), getClientTimeZone())
      if (id !== requestId.current) return
      rawSlots.current = data.availableSlots
      applyLiveFilter(date, data.availableSlots)
    } catch (err) {
      if (id !== requestId.current) return
      rawSlots.current = []
      setSlots([])
      setError(getApiErrorMessage(err, 'Não foi possível consultar a disponibilidade'))
    } finally {
      if (id === requestId.current) {
        setLoading(false)
      }
    }
  }, [date, serviceId, enabled, applyLiveFilter])

  useEffect(() => {
    void load()
  }, [load])

  // Ao vivo: a cada 30s remove slots que acabaram de passar (sem nova chamada).
  useEffect(() => {
    if (!enabled || !date) {
      return
    }

    const timer = window.setInterval(() => {
      if (rawSlots.current.length > 0) {
        applyLiveFilter(date, rawSlots.current)
      }
    }, 30_000)

    return () => window.clearInterval(timer)
  }, [enabled, date, applyLiveFilter])

  return { slots, loading, error, reload: load }
}
