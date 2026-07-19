import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  loginAdmin as loginAdminRequest,
  loginClient as loginClientRequest,
  logout as logoutRequest,
  registerClient as registerClientRequest,
  type AuthRole,
} from '../api/auth'
import { clearTokens, setTokens } from '../api/client'
import { AuthContext, type AuthContextValue } from './auth-context'

const accessTokenKey = 'agendapro.accessToken'
const refreshTokenKey = 'agendapro.refreshToken'
const emailKey = 'agendapro.email'
const roleKey = 'agendapro.role'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [email, setEmail] = useState<string | null>(null)
  const [role, setRole] = useState<AuthRole | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [bootstrapping, setBootstrapping] = useState(true)

  useEffect(() => {
    const accessToken = sessionStorage.getItem(accessTokenKey)
    const refreshToken = sessionStorage.getItem(refreshTokenKey)
    const storedEmail = sessionStorage.getItem(emailKey)
    const storedRole = sessionStorage.getItem(roleKey) as AuthRole | null

    if (accessToken && refreshToken && (storedRole === 'ADMIN' || storedRole === 'CLIENT')) {
      setEmail(storedEmail)
      setRole(storedRole)
      setIsAuthenticated(true)
    } else {
      clearTokens()
    }

    setBootstrapping(false)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      email,
      role,
      isAuthenticated,
      bootstrapping,
      loginAdmin: async (loginEmail, password) => {
        const tokens = await loginAdminRequest({ email: loginEmail, password })
        setTokens(tokens)
        setEmail(tokens.email)
        setRole(tokens.role)
        setIsAuthenticated(true)
      },
      loginClient: async (loginEmail, password) => {
        const tokens = await loginClientRequest({ email: loginEmail, password })
        setTokens(tokens)
        setEmail(tokens.email)
        setRole(tokens.role)
        setIsAuthenticated(true)
      },
      registerClient: async (payload) => {
        const tokens = await registerClientRequest(payload)
        setTokens(tokens)
        setEmail(tokens.email)
        setRole(tokens.role)
        setIsAuthenticated(true)
      },
      logout: async () => {
        const refreshToken = sessionStorage.getItem(refreshTokenKey) ?? undefined

        try {
          await logoutRequest(refreshToken)
        } finally {
          clearTokens()
          setEmail(null)
          setRole(null)
          setIsAuthenticated(false)
        }
      },
    }),
    [bootstrapping, email, isAuthenticated, role],
  )

  return <AuthContext value={value}>{children}</AuthContext>
}
