import { clearSession, getToken } from './tokenStore'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1'

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  body?: unknown
  params?: Record<string, string | number | undefined>
  skipAuth?: boolean
}

function buildUrl(path: string, params?: RequestOptions['params']) {
  const url = new URL(`${BASE_URL}${path}`)
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== '') url.searchParams.set(key, String(value))
    }
  }
  return url.toString()
}

async function extractErrorMessage(response: Response): Promise<string> {
  try {
    const body = await response.json()
    if (Array.isArray(body.error)) return body.error.join(', ')
    if (typeof body.error === 'string') return body.error
    if (typeof body.message === 'string') return body.message
  } catch {
    /* resposta sem corpo JSON */
  }
  return `Erro inesperado (${response.status})`
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }

  const token = getToken()
  if (token && !options.skipAuth) headers.Authorization = `Bearer ${token}`

  const response = await fetch(buildUrl(path, options.params), {
    method: options.method ?? 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  })

  if (response.status === 401) {
    clearSession()
  }

  if (!response.ok) {
    throw new ApiError(response.status, await extractErrorMessage(response))
  }

  if (response.status === 204) return undefined as T

  return (await response.json()) as T
}
