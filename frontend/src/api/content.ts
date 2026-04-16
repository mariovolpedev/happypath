import api from './client'
import type { ContentResponse, CommentResponse, Page } from '../types'

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

/**
 * Cambia il profilo con cui è pubblicato un contenuto.
 * @param id        id del contenuto
 * @param alterEgoId  id alter ego oppure null per tornare al profilo reale
 */
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
