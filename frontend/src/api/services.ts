import { getWithRetry } from './client'
import type { ServiceItem } from '../types/appointment'

export async function fetchActiveServices(): Promise<ServiceItem[]> {
  return getWithRetry<ServiceItem[]>('/services')
}
