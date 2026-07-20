import { useId, useMemo, type SelectHTMLAttributes } from 'react'
import { digitsOnly, PHONE_COUNTRIES } from '../../lib/phone'

type PhoneInputProps = {
  label: string
  country: string
  localNumber: string
  onCountryChange: (code: string) => void
  onLocalNumberChange: (value: string) => void
  error?: string
  placeholder?: string
} & Omit<SelectHTMLAttributes<HTMLSelectElement>, 'value' | 'onChange'>

export function PhoneInput({
  label,
  country,
  localNumber,
  onCountryChange,
  onLocalNumberChange,
  error,
  placeholder = '11999998888',
}: PhoneInputProps) {
  const generatedId = useId()
  const selectId = `${generatedId}-country`
  const inputId = `${generatedId}-local`
  const errorId = `${generatedId}-error`
  const selected = useMemo(
    () => PHONE_COUNTRIES.find((item) => item.code === country) ?? PHONE_COUNTRIES[0],
    [country],
  )

  return (
    <div className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium text-ink-700">{label}</span>
      <div className="flex gap-2">
        <label className="sr-only" htmlFor={selectId}>
          País
        </label>
        <select
          id={selectId}
          value={selected.code}
          onChange={(event) => onCountryChange(event.target.value)}
          className={`max-w-[8.5rem] shrink-0 rounded-xl border bg-white px-2 py-2.5 text-ink-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200 ${
            error ? 'border-red-400' : 'border-ink-200'
          }`}
          aria-label="Código do país"
        >
          {PHONE_COUNTRIES.map((item) => (
            <option key={item.code} value={item.code}>
              {item.flag} {item.dial}
            </option>
          ))}
        </select>
        <input
          id={inputId}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          placeholder={placeholder}
          value={localNumber}
          onChange={(event) => onLocalNumberChange(digitsOnly(event.target.value).slice(0, selected.maxLocalDigits))}
          className={`min-w-0 flex-1 rounded-xl border bg-white px-3.5 py-2.5 text-ink-900 outline-none transition placeholder:text-ink-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 ${
            error ? 'border-red-400' : 'border-ink-200'
          }`}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
        />
      </div>
      {error ? (
        <span id={errorId} className="text-xs text-red-600">
          {error}
        </span>
      ) : (
        <span className="text-xs text-ink-500">
          {selected.flag} {selected.name} ({selected.dial}) — só os dígitos do número, sem DDI
        </span>
      )}
    </div>
  )
}
