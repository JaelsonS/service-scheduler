import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { AuthProvider } from './auth/AuthProvider'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { ClientLayout } from './components/layout/ClientLayout'
import { ToastProvider } from './components/ui/ToastProvider'
import { Spinner } from './components/ui/Spinner'
import { HomePage } from './pages/HomePage'
import { warmupApi } from './api/warmup'

const ConfirmationPage = lazy(() =>
  import('./pages/ConfirmationPage').then((m) => ({ default: m.ConfirmationPage })),
)
const ClientLoginPage = lazy(() =>
  import('./pages/client/ClientLoginPage').then((m) => ({ default: m.ClientLoginPage })),
)
const ClientRegisterPage = lazy(() =>
  import('./pages/client/ClientRegisterPage').then((m) => ({ default: m.ClientRegisterPage })),
)
const MyAppointmentsPage = lazy(() =>
  import('./pages/client/MyAppointmentsPage').then((m) => ({ default: m.MyAppointmentsPage })),
)
const LoginPage = lazy(() =>
  import('./pages/admin/LoginPage').then((m) => ({ default: m.LoginPage })),
)
const AdminLayout = lazy(() =>
  import('./components/layout/AdminLayout').then((m) => ({ default: m.AdminLayout })),
)
const AdminAppointmentsPage = lazy(() =>
  import('./pages/admin/AdminAppointmentsPage').then((m) => ({
    default: m.AdminAppointmentsPage,
  })),
)

function RouteFallback() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <Spinner label="Carregando..." />
    </div>
  )
}

// Acorda a API o mais cedo possível (Render free dorme ~15 min).
warmupApi()

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route element={<ClientLayout />}>
                <Route index element={<HomePage />} />
                <Route path="confirmacao/:id" element={<ConfirmationPage />} />
                <Route path="entrar" element={<ClientLoginPage />} />
                <Route path="cadastro" element={<ClientRegisterPage />} />
                <Route element={<ProtectedRoute role="CLIENT" />}>
                  <Route path="minha-conta" element={<MyAppointmentsPage />} />
                </Route>
              </Route>
              <Route path="admin/login" element={<LoginPage />} />
              <Route path="login" element={<Navigate to="/entrar" replace />} />
              <Route element={<ProtectedRoute role="ADMIN" />}>
                <Route path="admin" element={<AdminLayout />}>
                  <Route index element={<AdminAppointmentsPage />} />
                </Route>
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </ToastProvider>
  )
}
