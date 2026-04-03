import api from './client'
import type { AuthResponse } from '../types'

export const register = (data: { username: string; email: string; password: string; displayName?: string; birthDate: string }) =>
  api.post<AuthResponse>('/auth/register', data).then(r => r.data)

export const login = (data: { username: string; password: string }) =>
  api.post<AuthResponse>('/auth/login', data).then(r => r.data)
