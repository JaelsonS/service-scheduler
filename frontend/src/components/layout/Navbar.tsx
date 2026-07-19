import { CalendarDays, LayoutDashboard, LogOut } from 'lucide-react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import { Button } from '../ui/Button'

export function Navbar() {
  const { isAuthenticated, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const showLogout = isAuthenticated || location.pathname.startsWith('/admin')

  async function handleLogout() {
    try {
      await logout()
    } finally {
      navigate('/', { replace: true })
    }
  }

  return (
    <header className="sticky top-0 z-30 border-b border-ink-200/70 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
            <CalendarDays className="h-5 w-5" />
          </span>
          <span className="font-display text-xl font-bold tracking-tight text-ink-900">
            AgendaPro
          </span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `rounded-lg px-3 py-2 text-sm font-medium transition ${
                isActive ? 'bg-brand-50 text-brand-700' : 'text-ink-600 hover:bg-ink-100'
              }`
            }
          >
            Agendar
          </NavLink>
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
                isActive ? 'bg-ink-900 text-white' : 'text-ink-600 hover:bg-ink-100'
              }`
            }
          >
            <LayoutDashboard className="h-4 w-4" />
            Admin
          </NavLink>
          {showLogout ? (
            <Button
              type="button"
              variant="secondary"
              className="!rounded-lg !px-3 !py-2"
              onClick={() => void handleLogout()}
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Sair
            </Button>
          ) : null}
        </nav>
      </div>
    </header>
  )
}
