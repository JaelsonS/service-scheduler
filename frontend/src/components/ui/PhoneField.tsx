import { useId } from 'react'
import PhoneInputWithCountry, { type Value } from 'react-phone-number-input/min'
import labels from 'react-phone-number-input/locale/pt'
import 'react-phone-number-input/style.css'

type PhoneFieldProps = {
  label: string
  value?: string
  onChange: (value?: string) => void
  onBlur?: () => void
  error?: string
  defaultCountry?: 'BR' | 'PT' | 'US' | 'AO' | 'ES'
  placeholder?: string
}

export function PhoneField({
  label,
  value,
  onChange,
  onBlur,
  error,
  defaultCountry = 'BR',
  placeholder = '11 99999-8888',
}: PhoneFieldProps) {
  const generatedId = useId()
  const inputId = `${generatedId}-phone`
  const errorId = `${generatedId}-error`

  return (
    <div className="flex flex-col gap-1.5 text-sm">
      <label className="font-medium text-ink-700" htmlFor={inputId}>
        {label}
      </label>
      <PhoneInputWithCountry
        id={inputId}
        international
        defaultCountry={defaultCountry}
        countryCallingCodeEditable={false}
        labels={labels}
        placeholder={placeholder}
        value={(value || undefined) as Value | undefined}
        onChange={(next) => onChange(next || undefined)}
        onBlur={onBlur}
        className={`PhoneInputField ${error ? 'PhoneInputField--error' : ''}`}
        numberInputProps={{
          className: 'PhoneInputField__input',
          autoComplete: 'tel',
          'aria-invalid': Boolean(error),
          'aria-describedby': error ? errorId : undefined,
        }}
      />
      {error ? (
        <span id={errorId} className="text-xs text-red-600">
          {error}
        </span>
      ) : (
        <span className="text-xs text-ink-500">
          Escolha o país e digite o número — a validação usa o padrão internacional.
        </span>
      )}
    </div>
  )
}
