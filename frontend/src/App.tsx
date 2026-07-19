import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthProvider'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { AdminLayout } from './components/layout/AdminLayout'
import { ClientLayout } from './components/layout/ClientLayout'
import { ToastProvider } from './components/ui/ToastProvider'
import { AdminAppointmentsPage } from './pages/admin/AdminAppointmentsPage'
import { LoginPage } from './pages/admin/LoginPage'
import { ClientLoginPage } from './pages/client/ClientLoginPage'
import { ClientRegisterPage } from './pages/client/ClientRegisterPage'
import { MyAppointmentsPage } from './pages/client/MyAppointmentsPage'
import { ConfirmationPage } from './pages/ConfirmationPage'
import { HomePage } from './pages/HomePage'

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <AuthProvider>
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
        </AuthProvider>
      </BrowserRouter>
    </ToastProvider>
  )
}
