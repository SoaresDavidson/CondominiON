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
  const normalizedPath = path.startsWith('/api/v1/') ? path.replace(/^\/api\/v1/, '') : path
  const url = path.startsWith('http') ? new URL(path) : new URL(`${BASE_URL}${normalizedPath}`)
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
  const isFormData = options.body instanceof FormData
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (!isFormData) headers['Content-Type'] = 'application/json'

  const token = getToken()
  if (token && !options.skipAuth) headers.Authorization = `Bearer ${token}`

  let requestBody: BodyInit | undefined
  if (options.body instanceof FormData) {
    requestBody = options.body
  } else if (options.body !== undefined) {
    requestBody = JSON.stringify(options.body)
  }

  const response = await fetch(buildUrl(path, options.params), {
    method: options.method ?? 'GET',
    headers,
    body: requestBody,
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

export async function apiDownload(path: string, filename: string) {
  const headers: Record<string, string> = {}
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  const response = await fetch(buildUrl(path), { headers })
  if (!response.ok) throw new ApiError(response.status, await extractErrorMessage(response))

  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
