import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'
import Cookies from 'js-cookie'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Attach access token to every request
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = Cookies.get('access_token')
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Auto-refresh access token on 401
let isRefreshing = false
let failedQueue: Array<{ resolve: (v: string) => void; reject: (e: unknown) => void }> = []

const processQueue = (error: unknown, token: string | null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error)
    else resolve(token!)
  })
  failedQueue = []
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`
          return api(original)
        })
      }

      original._retry = true
      isRefreshing = true

      const refresh = Cookies.get('refresh_token')
      if (!refresh) {
        isRefreshing = false
        clearAuth()
        window.location.href = '/auth/login'
        return Promise.reject(error)
      }

      try {
        const { data } = await axios.post(`${API_URL}/auth/token/refresh/`, { refresh })
        const newAccess: string = data.access
        Cookies.set('access_token', newAccess, { expires: 1 / 12 }) // 2 hours
        api.defaults.headers.common.Authorization = `Bearer ${newAccess}`
        processQueue(null, newAccess)
        return api(original)
      } catch (refreshError) {
        processQueue(refreshError, null)
        clearAuth()
        window.location.href = '/auth/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export function setAuthTokens(access: string, refresh: string) {
  Cookies.set('access_token', access, { expires: 1 / 12 })
  Cookies.set('refresh_token', refresh, { expires: 7 })
}

export function clearAuth() {
  Cookies.remove('access_token')
  Cookies.remove('refresh_token')
}

export function isAuthenticated() {
  return !!Cookies.get('access_token') || !!Cookies.get('refresh_token')
}

// ── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data: { username: string; email: string; password: string; password2: string; role?: string }) =>
    api.post('/auth/register/', data),
  login: (email: string, password: string) =>
    api.post('/auth/login/', { email, password }),
  logout: (refresh: string) =>
    api.post('/auth/logout/', { refresh }),
  me: () => api.get('/auth/me/'),
  updateProfile: (data: FormData | Record<string, unknown>) =>
    api.patch('/auth/me/', data, {
      headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
    }),
  leaderboard: (params?: Record<string, string>) =>
    api.get('/auth/leaderboard/', { params }),
  badges: () => api.get('/auth/badges/'),
  notifications: () => api.get('/auth/notifications/'),
  markNotificationsRead: () => api.post('/auth/notifications/read/'),
  searchUsers: (q: string) => api.get('/auth/search/', { params: { q } }),
}

// ── Quizzes ───────────────────────────────────────────────────────────────────
export const quizApi = {
  list: (params?: Record<string, string>) =>
    api.get('/quizzes/', { params }),
  get: (id: string) => api.get(`/quizzes/${id}/`),
  status: (id: string) => api.get(`/quizzes/${id}/status/`),
  create: (data: Record<string, unknown>) => api.post('/quizzes/', data),
  update: (id: string, data: Record<string, unknown>) => api.patch(`/quizzes/${id}/`, data),
  delete: (id: string) => api.delete(`/quizzes/${id}/`),

  // Attempts
  startAttempt: (quizId: string) => api.post(`/quizzes/${quizId}/start/`),
  submitAnswer: (attemptId: string, data: {
    question_id: string
    selected_option_ids: string[]
    time_taken_seconds: number
  }) => api.post(`/quizzes/attempts/${attemptId}/answer/`, data),
  completeAttempt: (attemptId: string, data: {
    time_taken_seconds: number
    tab_switches: number
  }) => api.post(`/quizzes/attempts/${attemptId}/complete/`, data),
  getAttempt: (attemptId: string) => api.get(`/quizzes/attempts/${attemptId}/`),
  myAttempts: (params?: Record<string, string>) =>
    api.get('/quizzes/attempts/', { params }),

  // Smart revision
  createRevision: () => api.post('/quizzes/revision/'),

  // Multiplayer
  createRoom: (quizId: string, maxParticipants?: number) =>
    api.post('/quizzes/rooms/create/', { quiz_id: quizId, max_participants: maxParticipants }),
  joinRoom: (code: string) => api.post('/quizzes/rooms/join/', { code }),
  getRoom: (roomId: string) => api.get(`/quizzes/rooms/${roomId}/`),
}

// ── Analytics ─────────────────────────────────────────────────────────────────
export const analyticsApi = {
  me: () => api.get('/analytics/me/'),
  teacher: () => api.get('/analytics/teacher/'),
  update: (attemptId: string) => api.post('/analytics/update/', { attempt_id: attemptId }),
}

// ── Challenges ────────────────────────────────────────────────────────────────
export const challengesApi = {
  today: () => api.get('/challenges/today/'),
}

export default api
