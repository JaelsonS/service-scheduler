import { BookingForm } from '../components/booking/BookingForm'
import { SeoHead } from '../components/SeoHead'

export function HomePage() {
  return (
    <section className="space-y-8">
      <SeoHead
        title="Agende seu horário"
        description="Escolha o serviço, a data e um horário disponível. Confirmação imediata, sem filas."
        path="/"
      />
      <div className="max-w-2xl">
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-brand-600">
          AgendaPro
        </p>
        <h1 className="font-display text-4xl font-bold tracking-tight text-ink-900 sm:text-5xl">
          Agende seu horário com praticidade
        </h1>
        <p className="mt-3 text-base text-ink-600 sm:text-lg">
          Escolha o serviço, a data e um horário disponível. Confirmação imediata, sem filas.
        </p>
      </div>

      <BookingForm />
    </section>
  )
}
