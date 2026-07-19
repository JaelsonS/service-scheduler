import { CalendarCheck2, ClipboardList } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const links = [
  { to: '/admin', label: 'Agendamentos', icon: ClipboardList, end: true },
]

export function AdminSidebar() {
  return (
    <aside className="hidden w-60 shrink-0 border-r border-ink-200 bg-white/70 p-4 md:block">
      <p className="mb-4 px-2 text-xs font-semibold uppercase tracking-wider text-ink-400">
        Administração
      </p>
      <nav className="flex flex-col gap-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) =>
              `flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                isActive
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-ink-700 hover:bg-ink-100'
              }`
            }
          >
            <link.icon className="h-4 w-4" />
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-8 rounded-xl bg-brand-50 p-3 text-sm text-brand-800">
        <div className="mb-1 flex items-center gap-2 font-semibold">
          <CalendarCheck2 className="h-4 w-4" />
          Dica
        </div>
        Filtre por data para localizar atendimentos do dia.
      </div>
    </aside>
  )
}
