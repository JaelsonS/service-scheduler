import { useCallback, useEffect, useState } from 'react'
import { fetchActiveServices, readServicesCache } from '../api/services'
import { getApiErrorMessage } from '../api/client'
import type { ServiceItem } from '../types/appointment'

export function useServices() {
  const [services, setServices] = useState<ServiceItem[]>(() => readServicesCache() ?? [])
  const [loading, setLoading] = useState(() => readServicesCache() === null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (opts?: { force?: boolean }) => {
    const cached = !opts?.force ? readServicesCache() : null
    if (cached) {
      setServices(cached)
      setLoading(false)
      setError(null)
    } else {
      setLoading(true)
    }

    try {
      const data = await fetchActiveServices()
      setServices(data)
      setError(null)
    } catch (err) {
      if (!cached) {
        setError(getApiErrorMessage(err, 'Não foi possível carregar os serviços'))
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const hasData = services.length > 0

  return {
    services,
    loading: loading && !hasData,
    error: hasData ? null : error,
    reload: () => void load({ force: true }),
  }
}
