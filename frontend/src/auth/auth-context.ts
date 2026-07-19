import { createContext } from 'react'
import type { AuthRole } from '../api/auth'

export interface AuthContextValue {
  email: string | null
  role: AuthRole | null
  isAuthenticated: boolean
  bootstrapping: boolean
  loginAdmin: (email: string, password: string) => Promise<void>
  loginClient: (email: string, password: string) => Promise<void>
  registerClient: (payload: {
    fullName: string
    phone: string
    email: string
    password: string
  }) => Promise<void>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
