import { BookingForm } from '../components/booking/BookingForm'
import { SeoHead } from '../components/SeoHead'

export function HomePage() {
  return (
    <section className="space-y-6 sm:space-y-8">
      <SeoHead
        title="Agende seu horário"
        description="Escolha a data, o horário e o serviço. Confirmação imediata, sem filas."
        path="/"
      />
      <div className="mx-auto max-w-3xl text-center sm:text-left">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-brand-600 sm:text-sm">
          AgendaPro
        </p>
        <h1 className="font-display text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl md:text-5xl">
          Agende seu horário com praticidade
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-ink-600 sm:mx-0 sm:text-base md:text-lg">
          Data, horário e confirmação — nessa ordem, em poucos passos.
        </p>
      </div>

      <BookingForm />
    </section>
  )
}
