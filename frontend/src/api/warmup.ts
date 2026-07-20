import { prefetchServices } from './services'

/**
 * Acorda a API e já puxa o catálogo (único GET necessário na home).
 * Warmup e useServices compartilham a mesma Promise (sem request duplicada).
 */
export function warmupApi(): void {
  prefetchServices()
}
