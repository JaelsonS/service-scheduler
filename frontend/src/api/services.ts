import { apiClient } from './client'
import type { ServiceItem } from '../types/appointment'

export async function fetchActiveServices(): Promise<ServiceItem[]> {
  const { data } = await apiClient.get<ServiceItem[]>('/services')
  return data
}
