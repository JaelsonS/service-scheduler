import { getPasswordRules } from '../../lib/password'

export function PasswordStrength({ value }: { value: string }) {
  const rules = getPasswordRules()

  if (!value) {
    return (
      <p className="text-xs text-ink-500">
        Use no mínimo 8 caracteres, incluindo letras e números.
      </p>
    )
  }

  const passed = rules.filter((rule) => rule.test(value)).length
  const tone =
    passed === rules.length ? 'text-emerald-700' : passed >= 2 ? 'text-amber-700' : 'text-red-600'

  return (
    <ul className={`space-y-1 text-xs ${tone}`} aria-live="polite">
      {rules.map((rule) => {
        const ok = rule.test(value)
        return (
          <li key={rule.id} className="flex items-center gap-1.5">
            <span aria-hidden="true">{ok ? '✓' : '○'}</span>
            <span>{rule.label}</span>
          </li>
        )
      })}
    </ul>
  )
}
