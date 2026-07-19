import { apiClient } from './client'

export interface AuthTokenResponse {
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresIn: number
  email: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export async function login(credentials: LoginCredentials): Promise<AuthTokenResponse> {
  const { data } = await apiClient.post<AuthTokenResponse>('/auth/login', credentials)
  return data
}

export async function refresh(refreshToken: string): Promise<AuthTokenResponse> {
  const { data } = await apiClient.post<AuthTokenResponse>('/auth/refresh', { refreshToken })
  return data
}

export async function logout(refreshToken?: string): Promise<void> {
  await apiClient.post('/auth/logout', refreshToken ? { refreshToken } : undefined)
}
