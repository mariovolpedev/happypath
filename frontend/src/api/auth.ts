import api from './client'
import type { AuthResponse } from '../types'

export type RegisterPayload = {
  username: string
  email: string
  password: string
  displayName: string
  firstName: string
  lastName: string
  birthDate: string
  birthPlace: string
  gender: 'M' | 'F'
}

export const register = (data: RegisterPayload) =>
  api.post<AuthResponse>('/auth/register', data).then(r => r.data)

export const login = (data: { username: string; password: string }) =>
  api.post<AuthResponse>('/auth/login', data).then(r => r.data)
