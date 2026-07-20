import { forwardRef, type ReactNode } from 'react'

export const Card = forwardRef<HTMLDivElement, { children: ReactNode; className?: string }>(
  function Card({ children, className = '' }, ref) {
    return (
      <div
        ref={ref}
        className={`rounded-2xl border border-ink-200/80 bg-white/90 p-4 shadow-sm backdrop-blur sm:p-5 ${className}`}
      >
        {children}
      </div>
    )
  },
)
