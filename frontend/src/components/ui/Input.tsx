import { useId, type InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

export function Input({
  label,
  error,
  id,
  className = '',
  'aria-describedby': ariaDescribedBy,
  ...props
}: InputProps) {
  const generatedId = useId()
  const inputId = id ?? props.name ?? generatedId
  const errorId = `${inputId}-error`
  const describedBy = [ariaDescribedBy, error ? errorId : undefined].filter(Boolean).join(' ') || undefined

  return (
    <label className="flex flex-col gap-1.5 text-sm" htmlFor={inputId}>
      <span className="font-medium text-ink-700">{label}</span>
      <input
        id={inputId}
        className={`rounded-xl border bg-white px-3.5 py-2.5 text-ink-900 outline-none transition placeholder:text-ink-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 ${
          error ? 'border-red-400' : 'border-ink-200'
        } ${className}`}
        {...props}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
      />
      {error ? (
        <span id={errorId} className="text-xs text-red-600">
          {error}
        </span>
      ) : null}
    </label>
  )
}
