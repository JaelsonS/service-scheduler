import { useId, type SelectHTMLAttributes } from 'react'

interface SelectOption {
  value: string
  label: string
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  options: SelectOption[]
  error?: string
  placeholder?: string
}

export function Select({
  label,
  options,
  error,
  placeholder,
  id,
  className = '',
  'aria-describedby': ariaDescribedBy,
  ...props
}: SelectProps) {
  const generatedId = useId()
  const selectId = id ?? props.name ?? generatedId
  const errorId = `${selectId}-error`
  const describedBy = [ariaDescribedBy, error ? errorId : undefined].filter(Boolean).join(' ') || undefined

  return (
    <label className="flex flex-col gap-1.5 text-sm" htmlFor={selectId}>
      <span className="font-medium text-ink-700">{label}</span>
      <select
        id={selectId}
        className={`rounded-xl border bg-white px-3.5 py-2.5 text-ink-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200 ${
          error ? 'border-red-400' : 'border-ink-200'
        } ${className}`}
        {...props}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
      >
        {placeholder ? (
          <option value="" disabled>
            {placeholder}
          </option>
        ) : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? (
        <span id={errorId} className="text-xs text-red-600">
          {error}
        </span>
      ) : null}
    </label>
  )
}
