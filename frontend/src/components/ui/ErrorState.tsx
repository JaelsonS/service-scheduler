import { AlertCircle } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from './Button'

export function ErrorState({
  message,
  onRetry,
  action,
}: {
  message: string
  onRetry?: () => void
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
      <div className="rounded-full bg-red-50 p-3 text-red-600">
        <AlertCircle className="h-6 w-6" />
      </div>
      <p className="max-w-md text-sm text-ink-700">{message}</p>
      {onRetry ? (
        <Button type="button" variant="secondary" onClick={onRetry}>
          Tentar novamente
        </Button>
      ) : null}
      {action}
    </div>
  )
}
