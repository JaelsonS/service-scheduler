import { AlertCircle, WifiOff } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from './Button'

export function ErrorState({
  message,
  onRetry,
  action,
  soft = false,
}: {
  message: string
  onRetry?: () => void
  action?: ReactNode
  /** Visual mais suave para falhas transitórias (servidor acordando / rede). */
  soft?: boolean
}) {
  const Icon = soft ? WifiOff : AlertCircle

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
      <div
        className={
          soft
            ? 'rounded-full bg-brand-50 p-3 text-brand-700'
            : 'rounded-full bg-red-50 p-3 text-red-600'
        }
      >
        <Icon className="h-6 w-6" aria-hidden="true" />
      </div>
      <div className="max-w-md space-y-1">
        <p className="text-sm font-medium text-ink-800">
          {soft ? 'Conectando ao servidor' : 'Algo deu errado'}
        </p>
        <p className="text-sm text-ink-600">{message}</p>
      </div>
      {onRetry ? (
        <Button type="button" variant="secondary" onClick={onRetry}>
          Tentar novamente
        </Button>
      ) : null}
      {action}
    </div>
  )
}
