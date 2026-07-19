import { apiClient } from './client'

export type AuthRole = 'ADMIN' | 'CLIENT'

export interface AuthTokenResponse {
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresIn: number
  email: string
  role: AuthRole
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface ClientRegisterPayload {
  fullName: string
  phone: string
  email: string
  password: string
}

export async function loginAdmin(credentials: LoginCredentials): Promise<AuthTokenResponse> {
  const { data } = await apiClient.post<AuthTokenResponse>('/auth/login', credentials)
  return data
}

export async function loginClient(credentials: LoginCredentials): Promise<AuthTokenResponse> {
  const { data } = await apiClient.post<AuthTokenResponse>('/client/auth/login', credentials)
  return data
}

export async function registerClient(payload: ClientRegisterPayload): Promise<AuthTokenResponse> {
  const { data } = await apiClient.post<AuthTokenResponse>('/client/auth/register', payload)
  return data
}

export async function refresh(refreshToken: string): Promise<AuthTokenResponse> {
  const { data } = await apiClient.post<AuthTokenResponse>('/auth/refresh', { refreshToken })
  return data
}

export async function logout(refreshToken?: string): Promise<void> {
  await apiClient.post('/auth/logout', refreshToken ? { refreshToken } : { refreshToken: '' })
}
