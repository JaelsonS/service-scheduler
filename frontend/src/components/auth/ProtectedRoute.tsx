import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import { Spinner } from '../ui/Spinner'

export function ProtectedRoute() {
  const { bootstrapping, isAuthenticated } = useAuth()
  const location = useLocation()

  if (bootstrapping) {
    return <Spinner label="Verificando sessão..." />
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />
  }

  return <Outlet />
}
