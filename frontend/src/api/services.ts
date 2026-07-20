import { getWithRetry } from './client'
import type { ServiceItem } from '../types/appointment'

const CACHE_KEY = 'agendapro.services.cache.v1'
const CACHE_TTL_MS = 30 * 60 * 1000

interface ServicesCache {
  savedAt: number
  services: ServiceItem[]
}

/** Uma única requisição em voo — warmup + hook compartilham a mesma Promise. */
let inflight: Promise<ServiceItem[]> | null = null

export function readServicesCache(): ServiceItem[] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as ServicesCache
    if (!parsed?.services || !Array.isArray(parsed.services) || parsed.services.length === 0) {
      return null
    }
    if (Date.now() - parsed.savedAt > CACHE_TTL_MS) return null
    return parsed.services
  } catch {
    return null
  }
}

export function writeServicesCache(services: ServiceItem[]): void {
  try {
    const payload: ServicesCache = { savedAt: Date.now(), services }
    localStorage.setItem(CACHE_KEY, JSON.stringify(payload))
  } catch {
    // quota / private mode
  }
}

export async function fetchActiveServices(): Promise<ServiceItem[]> {
  if (!inflight) {
    inflight = getWithRetry<ServiceItem[]>('/services')
      .then((data) => {
        writeServicesCache(data)
        return data
      })
      .finally(() => {
        inflight = null
      })
  }
  return inflight
}

/** Prefetch no boot: mesma Promise que o BookingForm vai usar. */
export function prefetchServices(): void {
  if (readServicesCache()) return
  void fetchActiveServices().catch(() => {
    // silencioso — a UI trata o erro
  })
}
