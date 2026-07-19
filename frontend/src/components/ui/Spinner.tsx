import { useEffect, useState } from 'react'

export function Spinner({
  label = 'Carregando...',
  hint,
}: {
  label?: string
  hint?: string
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center gap-3 py-10 text-ink-600"
    >
      <div
        aria-hidden="true"
        className="h-9 w-9 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600"
      />
      <p className="text-sm font-medium text-ink-800">{label}</p>
      {hint ? <p className="max-w-sm text-center text-xs text-ink-500">{hint}</p> : null}
    </div>
  )
}

/** Shows a calmer second message after a few seconds (Render cold start). */
export function BootAwareSpinner({
  label = 'Carregando serviços...',
}: {
  label?: string
}) {
  const [slow, setSlow] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => setSlow(true), 4000)
    return () => window.clearTimeout(timer)
  }, [])

  return (
    <Spinner
      label={slow ? 'Quase lá… acordando o servidor' : label}
      hint={
        slow
          ? 'No plano gratuito a API pode levar até um minuto na primeira visita.'
          : undefined
      }
    />
  )
}
