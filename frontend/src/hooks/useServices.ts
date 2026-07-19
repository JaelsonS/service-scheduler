import { useCallback, useEffect, useState } from 'react'
import { fetchActiveServices } from '../api/services'
import { getApiErrorMessage } from '../api/client'
import type { ServiceItem } from '../types/appointment'

export function useServices() {
  const [services, setServices] = useState<ServiceItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchActiveServices()
      setServices(data)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Não foi possível carregar os serviços'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return { services, loading, error, reload: load }
}
