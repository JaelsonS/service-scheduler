import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { login as loginRequest, logout as logoutRequest } from '../api/auth'
import { clearTokens, setTokens } from '../api/client'
import { AuthContext, type AuthContextValue } from './auth-context'

const accessTokenKey = 'agendapro.accessToken'
const refreshTokenKey = 'agendapro.refreshToken'
const emailKey = 'agendapro.email'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [email, setEmail] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [bootstrapping, setBootstrapping] = useState(true)

  useEffect(() => {
    const accessToken = sessionStorage.getItem(accessTokenKey)
    const refreshToken = sessionStorage.getItem(refreshTokenKey)
    const storedEmail = sessionStorage.getItem(emailKey)

    if (accessToken && refreshToken) {
      setEmail(storedEmail)
      setIsAuthenticated(true)
    } else {
      clearTokens()
    }

    setBootstrapping(false)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      email,
      isAuthenticated,
      bootstrapping,
      login: async (loginEmail, password) => {
        const tokens = await loginRequest({ email: loginEmail, password })
        setTokens(tokens)
        setEmail(tokens.email)
        setIsAuthenticated(true)
      },
      logout: async () => {
        const refreshToken = sessionStorage.getItem(refreshTokenKey) ?? undefined

        try {
          await logoutRequest(refreshToken)
        } finally {
          clearTokens()
          setEmail(null)
          setIsAuthenticated(false)
        }
      },
    }),
    [bootstrapping, email, isAuthenticated],
  )

  return <AuthContext value={value}>{children}</AuthContext>
}
