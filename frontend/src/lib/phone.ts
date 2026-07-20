export type PhoneCountry = {
  code: string
  dial: string
  flag: string
  name: string
  /** Dígitos locais esperados (mínimo) */
  minLocalDigits: number
  maxLocalDigits: number
}

export const PHONE_COUNTRIES: PhoneCountry[] = [
  { code: 'BR', dial: '+55', flag: '🇧🇷', name: 'Brasil', minLocalDigits: 10, maxLocalDigits: 11 },
  { code: 'PT', dial: '+351', flag: '🇵🇹', name: 'Portugal', minLocalDigits: 9, maxLocalDigits: 9 },
  { code: 'US', dial: '+1', flag: '🇺🇸', name: 'EUA', minLocalDigits: 10, maxLocalDigits: 10 },
  { code: 'ES', dial: '+34', flag: '🇪🇸', name: 'Espanha', minLocalDigits: 9, maxLocalDigits: 9 },
  { code: 'AO', dial: '+244', flag: '🇦🇴', name: 'Angola', minLocalDigits: 9, maxLocalDigits: 9 },
  
]

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, '')
}

export function composePhone(dial: string, localDigits: string): string {
  return `${dial}${digitsOnly(localDigits)}`
}

export function validatePhoneForCountry(country: PhoneCountry, localDigits: string): string | null {
  const digits = digitsOnly(localDigits)
  if (digits.length < country.minLocalDigits || digits.length > country.maxLocalDigits) {
    return `Informe ${country.minLocalDigits}${
      country.minLocalDigits === country.maxLocalDigits ? '' : ` a ${country.maxLocalDigits}`
    } dígitos do número`
  }
  return null
}
