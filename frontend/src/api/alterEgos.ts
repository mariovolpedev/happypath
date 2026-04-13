import api from './client'
import type { AlterEgoResponse, ContentResponse, Page } from '../types'

export const getMyAlterEgos = () =>
  api.get<AlterEgoResponse[]>('/alter-egos').then(r => r.data)

export const createAlterEgo = (data: {
  name: string
  description?: string
  avatarUrl?: string
}) =>
  api.post<AlterEgoResponse>('/alter-egos', data).then(r => r.data)

export const deleteAlterEgo = (id: number) =>
  api.delete(`/alter-egos/${id}`)

/** Profilo pubblico di un alter ego */
export const getAlterEgoProfile = (id: number) =>
  api.get<AlterEgoResponse>(`/alter-egos/${id}/profile`).then(r => r.data)

/** Contenuti pubblicati come questo alter ego */
export const getAlterEgoContents = (id: number, page = 0) =>
  api
    .get<Page<ContentResponse>>(`/alter-egos/${id}/contents`, { params: { page } })
    .then(r => r.data)
