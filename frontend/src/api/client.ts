import axios, { type InternalAxiosRequestConfig } from 'axios'
import type { ApiErrorBody } from '../types/appointment'

const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api/v1'
const accessTokenKey = 'agendapro.accessToken'
const refreshTokenKey = 'agendapro.refreshToken'
const emailKey = 'agendapro.email'

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
})

export interface StoredAuthTokens {
  accessToken: string
  refreshToken: string
  email?: string
}

interface RefreshResponse {
  accessToken: string
  refreshToken: string
  email: string
}

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean
}

export function getAccessToken(): string | null {
  return sessionStorage.getItem(accessTokenKey)
}

export function setTokens({ accessToken, refreshToken, email }: StoredAuthTokens): void {
  sessionStorage.setItem(accessTokenKey, accessToken)
  sessionStorage.setItem(refreshTokenKey, refreshToken)

  if (email) {
    sessionStorage.setItem(emailKey, email)
  }
}

export function clearTokens(): void {
  sessionStorage.removeItem(accessTokenKey)
  sessionStorage.removeItem(refreshTokenKey)
  sessionStorage.removeItem(emailKey)
}

apiClient.interceptors.request.use((config) => {
  const accessToken = getAccessToken()

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }

  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!axios.isAxiosError(error) || error.response?.status !== 401 || !error.config) {
      return Promise.reject(error)
    }

    const originalRequest = error.config as RetryableRequestConfig
    const refreshToken = sessionStorage.getItem(refreshTokenKey)
    const isAuthRequest = originalRequest.url?.startsWith('/auth/')

    if (originalRequest._retry || !refreshToken || isAuthRequest) {
      return Promise.reject(error)
    }

    originalRequest._retry = true

    try {
      const { data } = await axios.post<RefreshResponse>(
        `${apiBaseUrl}/auth/refresh`,
        { refreshToken },
        { headers: { 'Content-Type': 'application/json' }, timeout: 15000 },
      )

      setTokens(data)
      originalRequest.headers.Authorization = `Bearer ${data.accessToken}`
      return apiClient(originalRequest)
    } catch (refreshError) {
      clearTokens()

      if (window.location.pathname !== '/admin/login') {
        window.location.assign('/admin/login')
      }

      return Promise.reject(refreshError)
    }
  },
)

export function getApiErrorMessage(error: unknown, fallback = 'Ocorreu um erro inesperado'): string {
  if (!axios.isAxiosError(error)) {
    return fallback
  }

  const data = error.response?.data as ApiErrorBody | undefined
  if (data?.message) {
    return data.message
  }

  if (error.message) {
    return error.message
  }

  return fallback
}
