import * as authStore from './authStore'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

function isFormData(body: any) {
    return typeof FormData !== 'undefined' && body instanceof FormData
}

async function makeFetch(url: string, options: RequestInit) {
    return fetch(url, options)
}

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
    const apiPrefix = "/api/v1"
    const normalizedEndpoint = endpoint.startsWith("/api") ? endpoint : `${apiPrefix}${endpoint}`
    const url = `${API_URL}${normalizedEndpoint}`

    const originalHeaders = (options.headers as Record<string, string>) || {}
    const body = options.body
    const form = isFormData(body)

    const baseHeaders: Record<string, string> = { ...originalHeaders }
    if (!form && !baseHeaders['Content-Type'] && !baseHeaders['content-type']) {
        baseHeaders['Content-Type'] = 'application/json'
    }

    const makeRequestWithToken = async () => {
        const headers = { ...baseHeaders }

        const token = authStore.getAccessToken() || (typeof window !== 'undefined' ? localStorage.getItem('token') : null)
        if (token && !headers['Authorization'] && !headers['authorization']) {
            headers['Authorization'] = `Bearer ${token}`
        }

        const resp = await makeFetch(url, {
            ...options,
            headers,
        })
        return resp
    }

    // Try with current token
    let response = await makeRequestWithToken()

    if (response.status === 401 && endpoint !== '/users/rotate-tokens' && endpoint !== '/users/login' && endpoint !== '/users/register') {
        // Try rotating token once
        const newToken = await authStore.rotateToken()
        if (!newToken) {
            // rotation failed: clear auth and redirect via handler
            authStore.clearAuth()
            const text = await response.text().catch(() => '')
            throw new Error(text || 'Unauthorized')
        }

        // retry original request with new token
        response = await makeRequestWithToken()
        if (response.status === 401) {
            authStore.clearAuth()
            const text = await response.text().catch(() => '')
            throw new Error(text || 'Unauthorized')
        }
    }

    const contentType = response.headers.get('content-type') || ''
    if (!contentType.includes('application/json')) {
        const text = await response.text()
        throw new Error(`Expected JSON but received:\n${text}`)
    }

    const data = await response.json()

    if (!response.ok) {
        throw new Error(data.message || 'Request failed')
    }

    return data
}

export default apiFetch