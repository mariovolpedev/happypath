import api from './client'
import type { UserProfile, UserSummary, Page, ContentResponse } from '../types'

export const getProfile = (username: string) =>
  api.get<UserProfile>(`/users/${username}/profile`).then(r => r.data)

export const updateProfile = (data: {
  displayName?: string
  bio?: string
  avatarUrl?: string
  profileColor?: string
}) =>
  api.patch<UserProfile>('/users/me', data).then(r => r.data)

/**
 * Carica un file immagine come avatar del profilo.
 * Chiama POST /users/me/avatar (multipart/form-data)
 * e restituisce l'URL pubblico MinIO del nuovo avatar.
 */
export const uploadAvatar = async (file: File): Promise<string> => {
  const form = new FormData()
  form.append('file', file)
  const res = await api.post<{ url: string }>('/users/me/avatar', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data.url
}

export const follow = (id: number) => api.post(`/users/${id}/follow`)
export const unfollow = (id: number) => api.delete(`/users/${id}/follow`)

/**
 * Rimuove un seguace dal proprio profilo.
 * Chiama DELETE /users/{followerId}/followers/me
 */
export const removeFollower = (followerId: number) =>
  api.delete(`/users/${followerId}/followers/me`)

export const search = (q: string) =>
  api.get<UserSummary[]>('/users/search', { params: { q } }).then(r => r.data)

export const getUserContents = (username: string, page = 0) =>
  api.get<Page<ContentResponse>>(`/users/${username}/contents`, { params: { page } }).then(r => r.data)

export interface UserReactionResponse {
  id: number
  content: { id: number; title: string; mediaUrl?: string }
  reactionType: string
  createdAt: string
}

export interface UserCommentActivityResponse {
  id: number
  text: string
  content: { id: number; title: string }
  status: string
  createdAt: string
}

export const getUserReactions = (username: string, page = 0) =>
  api.get<Page<UserReactionResponse>>(`/users/${username}/reactions`, { params: { page } }).then(r => r.data)

export const getUserCommentsActivity = (username: string, page = 0) =>
  api.get<Page<UserCommentActivityResponse>>(`/users/${username}/comments-activity`, { params: { page } }).then(r => r.data)

/** Seguaci dell'utente corrente autenticato (chi mi segue) */
export const getMyFollowers = () =>
  api.get<UserSummary[]>('/users/me/followers').then(r => r.data)

/** Utenti seguiti dall'utente corrente autenticato */
export const getMyFollowing = () =>
  api.get<UserSummary[]>('/users/me/following').then(r => r.data)

/** Seguaci pubblici di un utente per username */
export const getFollowersByUsername = (username: string) =>
  api.get<UserSummary[]>(`/users/${username}/followers`).then(r => r.data)

/** Seguiti pubblici di un utente per username */
export const getFollowingByUsername = (username: string) =>
  api.get<UserSummary[]>(`/users/${username}/following`).then(r => r.data)
