const RULES = [
  { id: 'length', label: 'Pelo menos 8 caracteres', test: (value: string) => value.length >= 8 },
  { id: 'letter', label: 'Pelo menos 1 letra', test: (value: string) => /[A-Za-zÀ-ÿ]/.test(value) },
  { id: 'number', label: 'Pelo menos 1 número', test: (value: string) => /\d/.test(value) },
] as const

export function getPasswordRules() {
  return RULES
}

export function isStrongPassword(value: string): boolean {
  return RULES.every((rule) => rule.test(value))
}
