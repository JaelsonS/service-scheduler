import { Eye, EyeOff } from 'lucide-react'
import { useId, useState, type InputHTMLAttributes } from 'react'

interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string
  error?: string
  hint?: string
}

export function PasswordInput({
  label,
  error,
  hint,
  id,
  className = '',
  'aria-describedby': ariaDescribedBy,
  ...props
}: PasswordInputProps) {
  const generatedId = useId()
  const inputId = id ?? props.name ?? generatedId
  const errorId = `${inputId}-error`
  const hintId = `${inputId}-hint`
  const [visible, setVisible] = useState(false)
  const describedBy =
    [ariaDescribedBy, hint ? hintId : undefined, error ? errorId : undefined].filter(Boolean).join(' ') ||
    undefined

  return (
    <label className="flex flex-col gap-1.5 text-sm" htmlFor={inputId}>
      <span className="font-medium text-ink-700">{label}</span>
      <div className="relative">
        <input
          id={inputId}
          type={visible ? 'text' : 'password'}
          className={`w-full rounded-xl border bg-white py-2.5 pr-11 pl-3.5 text-ink-900 outline-none transition placeholder:text-ink-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 ${
            error ? 'border-red-400' : 'border-ink-200'
          } ${className}`}
          {...props}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
        />
        <button
          type="button"
          className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-lg p-1.5 text-ink-500 hover:bg-ink-50 hover:text-ink-800"
          onClick={() => setVisible((value) => !value)}
          aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {hint && !error ? (
        <span id={hintId} className="text-xs text-ink-500">
          {hint}
        </span>
      ) : null}
      {error ? (
        <span id={errorId} className="text-xs text-red-600">
          {error}
        </span>
      ) : null}
    </label>
  )
}
