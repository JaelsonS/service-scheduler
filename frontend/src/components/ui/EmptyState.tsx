import { Inbox } from 'lucide-react'
import type { ReactNode } from 'react'

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
      <div className="rounded-full bg-ink-100 p-3 text-ink-500">
        <Inbox className="h-6 w-6" />
      </div>
      <h3 className="font-display text-lg font-semibold text-ink-900">{title}</h3>
      <p className="max-w-sm text-sm text-ink-600">{description}</p>
      {action}
    </div>
  )
}
