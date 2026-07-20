import { BookingForm } from '../components/booking/BookingForm'
import { SeoHead } from '../components/SeoHead'

export function HomePage() {
  return (
    <section className="space-y-5 sm:space-y-6">
      <SeoHead
        title="Agende seu horário"
        description="Escolha o serviço, a data e o horário. Confirmação imediata, sem filas."
        path="/"
      />
      <div className="mx-auto max-w-5xl">
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">
          AgendaPro
        </p>
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl md:text-4xl">
          Agende seu horário
        </h1>
        <p className="mt-2 max-w-xl text-sm text-ink-600 sm:text-base">
          Serviço, data e horário — em poucos passos, com confirmação imediata.
        </p>
      </div>

      <BookingForm />
    </section>
  )
}
