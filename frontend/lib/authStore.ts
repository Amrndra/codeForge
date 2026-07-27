let accessToken: string | null = null

let rotateTokenFn: (() => Promise<string | null>) | null = null
let clearAuthFn: (() => void) | null = null

export function setAccessToken(token: string | null) {
  accessToken = token ?? null
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem('token', token)
    } else {
      localStorage.removeItem('token')
    }
  }
}

export function getAccessToken() {
  if (!accessToken && typeof window !== 'undefined') {
    accessToken = localStorage.getItem('token')
  }
  return accessToken
}

export function setRotateToken(fn: (() => Promise<string | null>) | null) {
  rotateTokenFn = fn
}

export async function rotateToken(): Promise<string | null> {
  if (!rotateTokenFn) return null
  try {
    const t = await rotateTokenFn()
    setAccessToken(t)
    return t ?? null
  } catch (err) {
    return null
  }
}

export function setClearAuth(fn: (() => void) | null) {
  clearAuthFn = fn
}

export function clearAuth() {
  try {
    clearAuthFn?.()
  } finally {
    accessToken = null
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token')
    }
  }
}

export default {
  setAccessToken,
  getAccessToken,
  setRotateToken,
  rotateToken,
  setClearAuth,
  clearAuth,
}
