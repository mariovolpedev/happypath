import api from './client'
import type { UserProfile, UserSummary, Page, ContentResponse } from '../types'

export const getProfile = (username: string) =>
  api.get<UserProfile>(`/users/${username}/profile`).then(r => r.data)

export const updateProfile = (data: { displayName?: string; bio?: string; avatarUrl?: string }) =>
  api.patch<UserProfile>('/users/me', data).then(r => r.data)

export const follow = (id: number) => api.post(`/users/${id}/follow`)
export const unfollow = (id: number) => api.delete(`/users/${id}/follow`)

export const search = (q: string) =>
  api.get<UserSummary[]>('/users/search', { params: { q } }).then(r => r.data)

export const getUserContents = (username: string, page = 0) =>
  api.get<Page<ContentResponse>>(`/users/${username}/contents`, { params: { page } }).then(r => r.data)
