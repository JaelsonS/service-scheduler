import { useCallback, useEffect, useState } from 'react'
import { fetchActiveServices } from '../api/services'
import { getApiErrorMessage } from '../api/client'
import type { ServiceItem } from '../types/appointment'

const CACHE_KEY = 'agendapro.services.cache'
const CACHE_TTL_MS = 5 * 60 * 1000

interface ServicesCache {
  savedAt: number
  services: ServiceItem[]
}

function readCache(): ServiceItem[] | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as ServicesCache
    if (!parsed?.services || !Array.isArray(parsed.services)) return null
    if (Date.now() - parsed.savedAt > CACHE_TTL_MS) return null
    return parsed.services
  } catch {
    return null
  }
}

function writeCache(services: ServiceItem[]): void {
  try {
    const payload: ServicesCache = { savedAt: Date.now(), services }
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(payload))
  } catch {
    // quota / private mode — ignore
  }
}

export function useServices() {
  const [services, setServices] = useState<ServiceItem[]>(() => readCache() ?? [])
  const [loading, setLoading] = useState(() => readCache() === null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (opts?: { force?: boolean }) => {
    const existing = !opts?.force ? readCache() : null
    if (existing) {
      setServices(existing)
      setLoading(false)
      setError(null)
    } else {
      setLoading(true)
    }

    try {
      const data = await fetchActiveServices()
      setServices(data)
      writeCache(data)
      setError(null)
    } catch (err) {
      // Mantém cache antigo na tela se a rede falhar
      if (!existing) {
        setError(getApiErrorMessage(err, 'Não foi possível carregar os serviços'))
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return {
    services,
    loading,
    error,
    reload: () => void load({ force: true }),
  }
}
