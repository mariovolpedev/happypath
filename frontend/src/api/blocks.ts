import api from './client'
import type { UserSummary } from '../types'

export const blockUser = (id: number) =>
  api.post(`/users/${id}/block`)

export const unblockUser = (id: number) =>
  api.delete(`/users/${id}/block`)

export const getBlockedUsers = () =>
  api.get<UserSummary[]>('/users/me/blocked').then(r => r.data)
