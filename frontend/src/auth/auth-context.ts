import { createContext } from 'react'

export interface AuthContextValue {
  email: string | null
  isAuthenticated: boolean
  bootstrapping: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
