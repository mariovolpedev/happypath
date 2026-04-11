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

export const follow = (id: number) => api.post(`/users/${id}/follow`)
export const unfollow = (id: number) => api.delete(`/users/${id}/follow`)

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

/** Follower dell'utente corrente (chi mi segue) */
export const getMyFollowers = () =>
  api.get<UserSummary[]>('/users/me/followers').then(r => r.data)

/** Utenti seguiti dall'utente corrente */
export const getMyFollowing = () =>
  api.get<UserSummary[]>('/users/me/following').then(r => r.data)
