/**
 * Dispara um ping leve o mais cedo possível para reduzir cold start do Render
 * enquanto o restante do app monta. Usa no-cors para não depender de CORS no health.
 */
export function warmupApi(): void {
  const base = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api/v1'
  const origin = base.replace(/\/api\/v1\/?$/, '')
  const healthUrl = `${origin}/actuator/health`

  try {
    void fetch(healthUrl, {
      method: 'GET',
      mode: 'no-cors',
      cache: 'no-store',
      keepalive: true,
    }).catch(() => {
      // ignore — só queremos acordar o serviço
    })
  } catch {
    // ignore
  }
}
