import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toLocalIsoDate } from '../../lib/datetime'

interface CalendarProps {
  selectedDate: string
  onSelect: (date: string) => void
}

function toIsoDate(date: Date): string {
  return toLocalIsoDate(date)
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

export function Calendar({ selectedDate, onSelect }: CalendarProps) {
  const todayIso = toIsoDate(new Date())
  const initial = selectedDate ? new Date(`${selectedDate}T00:00:00`) : new Date()
  const [visibleMonth, setVisibleMonth] = useState(startOfMonth(initial))

  const days = useMemo(() => {
    const firstDay = startOfMonth(visibleMonth)
    const offset = firstDay.getDay()
    const gridStart = new Date(firstDay)
    gridStart.setDate(firstDay.getDate() - offset)

    return Array.from({ length: 42 }, (_, index) => {
      const day = new Date(gridStart)
      day.setDate(gridStart.getDate() + index)
      return day
    })
  }, [visibleMonth])

  const monthLabel = visibleMonth.toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="rounded-2xl border border-ink-100 bg-ink-50/40 p-3 sm:p-4">
      <div className="mb-3 flex items-center justify-between sm:mb-4">
        <button
          type="button"
          className="rounded-lg p-2 text-ink-600 hover:bg-ink-100"
          onClick={() =>
            setVisibleMonth(
              new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1),
            )
          }
          aria-label="Mês anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <h3 className="font-display text-sm font-semibold capitalize text-ink-900 sm:text-base">
          {monthLabel}
        </h3>
        <button
          type="button"
          className="rounded-lg p-2 text-ink-600 hover:bg-ink-100"
          onClick={() =>
            setVisibleMonth(
              new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1),
            )
          }
          aria-label="Próximo mês"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="mb-2 grid grid-cols-7 gap-0.5 text-center text-[0.65rem] font-semibold uppercase tracking-wide text-ink-400 sm:gap-1 sm:text-xs">
        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((label, index) => (
          <span key={`${label}-${index}`}>{label}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
        {days.map((day) => {
          const iso = toIsoDate(day)
          const inMonth = day.getMonth() === visibleMonth.getMonth()
          const isPast = iso < todayIso
          const isSelected = iso === selectedDate

          return (
            <button
              key={iso}
              type="button"
              disabled={isPast}
              onClick={() => onSelect(iso)}
              className={`h-9 rounded-lg text-sm transition sm:h-10 sm:rounded-xl ${
                isSelected
                  ? 'bg-brand-600 font-semibold text-white'
                  : isPast
                    ? 'cursor-not-allowed text-ink-300'
                    : inMonth
                      ? 'text-ink-800 hover:bg-brand-50 active:bg-brand-100'
                      : 'text-ink-300 hover:bg-ink-50'
              }`}
            >
              {day.getDate()}
            </button>
          )
        })}
      </div>
    </div>
  )
}
