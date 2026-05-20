import axios from 'axios'
import { useAuthStore } from '../store/authStore'

const api = axios.create({ baseURL: '/api' })

api.interceptors.request.use(config => {
  // FIX: read the token exclusively from Zustand store state (persisted under
  // 'hp-auth' in localStorage). The old code used a separate 'hp_token' key
  // that could become stale after logout if the persist middleware cleared
  // 'hp-auth' but 'hp_token' was left behind.
  const token = useAuthStore.getState().token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
