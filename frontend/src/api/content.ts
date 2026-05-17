import api from './client'
import type { ContentResponse, CommentResponse, Page, ReactionType } from '../types'

export const getFeed = (page = 0, themeId?: number) =>
  api
    .get<Page<ContentResponse>>('/contents', { params: { page, themeId } })
    .then(r => r.data)

export const getHomeFeed = (page = 0) =>
  api
    .get<Page<ContentResponse>>('/contents/home', { params: { page } })
    .then(r => r.data)

export const getContent = (id: number) =>
  api.get<ContentResponse>(`/contents/${id}`).then(r => r.data)

export const createContent = (data: {
  title: string
  body?: string
  mediaUrl?: string
  themeId?: number
  alterEgoId?: number
}) =>
  api.post<ContentResponse>('/contents', data).then(r => r.data)

export const updateContent = (
  id: number,
  data: { title: string; body?: string; mediaUrl?: string; themeId?: number }
) =>
  api.put<ContentResponse>(`/contents/${id}`, data).then(r => r.data)

export const deleteContent = (id: number) =>
  api.delete(`/contents/${id}`)

export const changePublisher = (id: number, alterEgoId: number | null) =>
  api
    .patch<ContentResponse>(`/contents/${id}/publisher`, { alterEgoId })
    .then(r => r.data)

export const react = (contentId: number, type: string, alterEgoId?: number) =>
  api.post(`/contents/${contentId}/reactions`, null, {
    params: { type, ...(alterEgoId != null ? { alterEgoId } : {}) },
  })

export const removeReaction = (contentId: number) =>
  api.delete(`/contents/${contentId}/reactions`)

export const getComments = (contentId: number, page = 0) =>
  api
    .get<Page<CommentResponse>>(`/contents/${contentId}/comments`, { params: { page } })
    .then(r => r.data)

export const getReplies = (contentId: number, commentId: number, page = 0) =>
  api
    .get<Page<CommentResponse>>(`/contents/${contentId}/comments/${commentId}/replies`, {
      params: { page },
    })
    .then(r => r.data)

export const addComment = (
  contentId: number,
  text: string,
  parentId?: number,
  alterEgoId?: number
) =>
  api
    .post<CommentResponse>(`/contents/${contentId}/comments`, {
      text,
      parentId,
      alterEgoId,
    })
    .then(r => r.data)

export const deleteComment = (contentId: number, commentId: number) =>
  api.delete(`/contents/${contentId}/comments/${commentId}`)

/** Aggiunge o sostituisce la reazione dell'utente su un commento */
export const reactToComment = (
  contentId: number,
  commentId: number,
  type: ReactionType,
  alterEgoId?: number
) =>
  api
    .put(`/contents/${contentId}/comments/${commentId}/reactions`, {
      type,
      alterEgoId,
    })
    .then(r => r.data)

/** Rimuove la reazione dell'utente da un commento */
export const removeCommentReaction = (contentId: number, commentId: number) =>
  api.delete(`/contents/${contentId}/comments/${commentId}/reactions`).then(r => r.data)
