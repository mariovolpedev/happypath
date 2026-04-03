import api from './client'
import type { ContentResponse, CommentResponse, Page } from '../types'

export const getFeed = (page = 0, themeId?: number) =>
  api.get<Page<ContentResponse>>('/contents', { params: { page, themeId } }).then(r => r.data)

export const getHomeFeed = (page = 0) =>
  api.get<Page<ContentResponse>>('/contents/home', { params: { page } }).then(r => r.data)

export const getContent = (id: number) =>
  api.get<ContentResponse>(`/contents/${id}`).then(r => r.data)

export const createContent = (data: { title: string; body?: string; mediaUrl?: string; themeId?: number; alterEgoId?: number }) =>
  api.post<ContentResponse>('/contents', data).then(r => r.data)

export const updateContent = (id: number, data: { title: string; body?: string; mediaUrl?: string; themeId?: number }) =>
  api.put<ContentResponse>(`/contents/${id}`, data).then(r => r.data)

export const deleteContent = (id: number) =>
  api.delete(`/contents/${id}`)

export const react = (contentId: number, type: string) =>
  api.post(`/contents/${contentId}/reactions`, null, { params: { type } })

export const removeReaction = (contentId: number) =>
  api.delete(`/contents/${contentId}/reactions`)

export const getComments = (contentId: number, page = 0) =>
  api.get<Page<CommentResponse>>(`/contents/${contentId}/comments`, { params: { page } }).then(r => r.data)

export const addComment = (contentId: number, text: string, parentId?: number) =>
  api.post<CommentResponse>(`/contents/${contentId}/comments`, { text, parentId }).then(r => r.data)

export const deleteComment = (contentId: number, commentId: number) =>
  api.delete(`/contents/${contentId}/comments/${commentId}`)
