import type { ReactNode } from 'react'

export function Card({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={`rounded-2xl border border-ink-200/80 bg-white/90 p-5 shadow-sm backdrop-blur ${className}`}
    >
      {children}
    </div>
  )
}
