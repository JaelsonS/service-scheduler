import axios, { type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios'
import type { ApiErrorBody } from '../types/appointment'

const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api/v1'
const accessTokenKey = 'agendapro.accessToken'
const refreshTokenKey = 'agendapro.refreshToken'
const emailKey = 'agendapro.email'

/** Render free tier cold starts can take 30–60s. */
const DEFAULT_TIMEOUT_MS = 60_000

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: DEFAULT_TIMEOUT_MS,
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
        { headers: { 'Content-Type': 'application/json' }, timeout: DEFAULT_TIMEOUT_MS },
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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

function isRetryableNetworkError(error: unknown): boolean {
  if (!axios.isAxiosError(error)) {
    return false
  }

  if (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK') {
    return true
  }

  return !error.response
}

/**
 * Retries transient network failures (Render cold start / brief outages).
 */
export async function getWithRetry<T>(
  url: string,
  config?: AxiosRequestConfig,
  attempts = 3,
): Promise<T> {
  let lastError: unknown

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const { data } = await apiClient.get<T>(url, config)
      return data
    } catch (error) {
      lastError = error
      if (!isRetryableNetworkError(error) || attempt === attempts) {
        throw error
      }
      await sleep(1500 * attempt)
    }
  }

  throw lastError
}

export function getApiErrorMessage(error: unknown, fallback = 'Ocorreu um erro inesperado'): string {
  if (!axios.isAxiosError(error)) {
    return fallback
  }

  const data = error.response?.data as ApiErrorBody | undefined
  if (data?.message) {
    return data.message
  }

  if (error.code === 'ECONNABORTED') {
    return 'A conexão demorou demais. O servidor pode estar iniciando — tente novamente em instantes.'
  }

  if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
    return 'Não foi possível conectar à API. Aguarde alguns segundos (o servidor pode estar acordando) e tente novamente.'
  }

  if (error.response?.status === 403) {
    return 'Acesso negado pela API. Verifique a configuração de CORS no backend.'
  }

  if (error.response?.status && error.response.status >= 500) {
    return 'O servidor está temporariamente indisponível. Tente novamente em instantes.'
  }

  return fallback
}
