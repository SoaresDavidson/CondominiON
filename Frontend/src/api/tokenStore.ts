export type StoredUser = {
  id: number
  condominium_id: number
  proxy_for_id: number | null
  meeting_id: number | null
  name: string
  email: string
  role: 'administrator' | 'owner' | 'proxy' | 'guest'
  lots_count: number
  houses_count: number
  vote_weight: string
  active: boolean
  delinquent: boolean
}

const TOKEN_KEY = 'condominion.token'
const USER_KEY = 'condominion.user'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function getStoredUser(): StoredUser | null {
  const raw = localStorage.getItem(USER_KEY)
  return raw ? (JSON.parse(raw) as StoredUser) : null
}

export function setSession(token: string, user: StoredUser) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}
