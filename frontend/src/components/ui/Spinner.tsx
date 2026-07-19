export function Spinner({ label = 'Carregando...' }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center gap-3 py-10 text-ink-600"
    >
      <div
        aria-hidden="true"
        className="h-9 w-9 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600"
      />
      <p className="text-sm">{label}</p>
    </div>
  )
}
