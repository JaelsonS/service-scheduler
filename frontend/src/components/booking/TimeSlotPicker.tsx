import { Spinner } from '../ui/Spinner'

interface TimeSlotPickerProps {
  slots: string[]
  selected: string
  loading: boolean
  error: string | null
  onSelect: (slot: string) => void
}

function formatSlot(slot: string): string {
  return slot.slice(0, 5)
}

export function TimeSlotPicker({
  slots,
  selected,
  loading,
  error,
  onSelect,
}: TimeSlotPickerProps) {
  if (loading) {
    return <Spinner label="Buscando horários..." />
  }

  if (error) {
    return <p className="py-6 text-center text-sm text-red-600">{error}</p>
  }

  if (slots.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-ink-500">
        Nenhum horário disponível para esta data.
      </p>
    )
  }

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {slots.map((slot) => {
        const active = selected === slot
        return (
          <button
            key={slot}
            type="button"
            onClick={() => onSelect(slot)}
            aria-pressed={active}
            className={`rounded-xl border px-2 py-2.5 text-sm font-semibold transition ${
              active
                ? 'border-brand-600 bg-brand-600 text-white'
                : 'border-ink-200 bg-white text-ink-700 hover:border-brand-400 hover:text-brand-700'
            }`}
          >
            {formatSlot(slot)}
          </button>
        )
      })}
    </div>
  )
}
