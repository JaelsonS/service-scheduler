import { CalendarDays, LayoutDashboard, LogOut, UserRound } from 'lucide-react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import { Button } from '../ui/Button'

function navClass(isActive: boolean, emphasis = false) {
  if (emphasis && isActive) {
    return 'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium bg-ink-900 text-white sm:px-3'
  }
  if (emphasis) {
    return 'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium text-ink-600 hover:bg-ink-100 sm:px-3'
  }
  return `inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium transition sm:px-3 ${
    isActive ? 'bg-brand-50 text-brand-700' : 'text-ink-600 hover:bg-ink-100'
  }`
}

export function Navbar() {
  const { isAuthenticated, role, logout } = useAuth()
  const navigate = useNavigate()
  const isClient = isAuthenticated && role === 'CLIENT'
  const isAdmin = isAuthenticated && role === 'ADMIN'
  // Admin só para visitante ou admin logado — cliente nunca vê esse atalho.
  const showAdminLink = !isClient

  async function handleLogout() {
    try {
      await logout()
    } finally {
      navigate('/', { replace: true })
    }
  }

  return (
    <header className="sticky top-0 z-30 border-b border-ink-200/70 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-3 sm:h-16 sm:px-6">
        <Link to="/" className="flex min-w-0 items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white sm:h-9 sm:w-9">
            <CalendarDays className="h-4 w-4 sm:h-5 sm:w-5" />
          </span>
          <span className="font-display text-lg font-bold tracking-tight text-ink-900 sm:text-xl">
            AgendaPro
          </span>
        </Link>

        <nav className="flex items-center gap-0.5 sm:gap-1.5" aria-label="Principal">
          <NavLink to="/" className={({ isActive }) => navClass(isActive)} end>
            Agendar
          </NavLink>

          {isClient ? (
            <NavLink to="/minha-conta" className={({ isActive }) => navClass(isActive)}>
              <UserRound className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Minha conta</span>
            </NavLink>
          ) : !isAdmin ? (
            <NavLink to="/entrar" className={({ isActive }) => navClass(isActive)}>
              Entrar
            </NavLink>
          ) : null}

          {showAdminLink ? (
            <NavLink to="/admin" className={({ isActive }) => navClass(isActive, true)}>
              <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Admin</span>
            </NavLink>
          ) : null}

          {isAuthenticated ? (
            <Button
              type="button"
              variant="secondary"
              className="!rounded-lg !px-2.5 !py-2 sm:!px-3"
              onClick={() => void handleLogout()}
              aria-label="Sair"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          ) : null}
        </nav>
      </div>
    </header>
  )
}
