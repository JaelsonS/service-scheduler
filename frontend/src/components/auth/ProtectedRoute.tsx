import { Navigate, Outlet, useLocation } from 'react-router-dom'
import type { AuthRole } from '../../api/auth'
import { useAuth } from '../../auth/useAuth'
import { Spinner } from '../ui/Spinner'

export function ProtectedRoute({ role }: { role: AuthRole }) {
  const { bootstrapping, isAuthenticated, role: currentRole } = useAuth()
  const location = useLocation()
  const loginPath = role === 'ADMIN' ? '/admin/login' : '/entrar'

  if (bootstrapping) {
    return <Spinner label="Verificando sessão..." />
  }

  if (!isAuthenticated || currentRole !== role) {
    return <Navigate to={loginPath} replace state={{ from: location }} />
  }

  return <Outlet />
}
