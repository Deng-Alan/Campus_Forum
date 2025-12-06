export interface ApiResponse<T> {
  code: number
  message: string
  data: T
  timestamp?: number
}

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api/v1'

const ACCESS_TOKEN_KEY = 'cf_access_token'
const REFRESH_TOKEN_KEY = 'cf_refresh_token'

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage.getItem(ACCESS_TOKEN_KEY)
  } catch {
    return null
  }
}

function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage.getItem(REFRESH_TOKEN_KEY)
  } catch {
    return null
  }
}

export function saveTokens(accessToken: string, refreshToken?: string | null) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
    if (refreshToken) {
      window.localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
    }
  } catch {
    // ignore
  }
}

export function getAuthHeader(): Record<string, string> {
  const token = getAccessToken()
  if (!token) return {}
  return {
    Authorization: `Bearer ${token}`,
  }
}

export function clearTokens() {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(ACCESS_TOKEN_KEY)
    window.localStorage.removeItem(REFRESH_TOKEN_KEY)
  } catch {
    // ignore
  }
}

function buildQuery(params?: Record<string, any>): string {
  if (!params) return ''
  const search = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return
    search.append(key, String(value))
  })
  const qs = search.toString()
  return qs ? `?${qs}` : ''
}

async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) return false

  try {
    const url = `${API_BASE_URL}/auth/refresh-token${buildQuery({ refreshToken })}`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })

    const json = (await res.json()) as ApiResponse<{
      accessToken: string
      refreshToken: string
      tokenType: string
      expiresIn: number
      user: any
    }>

    if (json.code !== 200 || !json.data) {
      clearTokens()
      return false
    }

    saveTokens(json.data.accessToken, json.data.refreshToken)
    return true
  } catch {
    clearTokens()
    return false
  }
}

export async function apiRequest<T>(
  path: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
    body?: any
    query?: Record<string, any>
  } = {},
  _retry = false,
): Promise<T> {
  const { method = 'GET', body, query } = options
  const url = `${API_BASE_URL}${path}${buildQuery(query)}`

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  const token = getAccessToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(url, {
    method,
    headers,
    body: method === 'GET' ? undefined : body != null ? JSON.stringify(body) : undefined,
  })

  const json = (await res.json()) as ApiResponse<T>

  if (json.code === 200) {
    return json.data
  }

  // Token 过期或无效，尝试刷新一次
  if ((json.code === 1005 || json.code === 1006) && !_retry) {
    const ok = await refreshAccessToken()
    if (ok) {
      return apiRequest<T>(path, options, true)
    }
  }

  const error: any = new Error(json.message || '请求失败')
  error.code = json.code
  throw error
}

export async function apiGet<T>(path: string, query?: Record<string, any>) {
  return apiRequest<T>(path, { method: 'GET', query })
}

export async function apiPost<T>(path: string, body?: any, query?: Record<string, any>) {
  return apiRequest<T>(path, { method: 'POST', body, query })
}

export async function apiPut<T>(path: string, body?: any, query?: Record<string, any>) {
  return apiRequest<T>(path, { method: 'PUT', body, query })
}

export async function apiDelete<T>(path: string, query?: Record<string, any>) {
  return apiRequest<T>(path, { method: 'DELETE', query })
}

/**
 * 统一的图片上传方法
 * @param file 要上传的文件
 * @param type 上传类型：'post' | 'avatar'
 * @returns 上传后的图片URL
 */
export async function uploadImage(file: File, type: 'post' | 'avatar'): Promise<string> {
  const token = localStorage.getItem('token')

  const formData = new FormData()
  formData.append('file', file)

  try {
    const response = await fetch(`${API_BASE_URL}/upload/image?type=${type}`, {
      method: 'POST',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
      },
      body: formData,
    })

    const json = await response.json()

    if (json.code === 200 && json.data) {
      return json.data // 返回图片URL
    }

    // 处理业务错误
    const error: any = new Error(json.message || '上传失败')
    error.code = json.code
    throw error
  } catch (error: any) {
    console.error('Upload error:', error)
    if (error.code) {
      // 业务错误，直接抛出
      throw error
    }
    // 网络或其他错误
    throw new Error('图片上传失败，请检查网络连接')
  }
}

