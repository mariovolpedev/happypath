import api from './client'
import type { AlterEgoResponse } from '../types'

export const getMyAlterEgos = () =>
  api.get<AlterEgoResponse[]>('/alter-egos').then(r => r.data)

export const createAlterEgo = (data: { name: string; description?: string; avatarUrl?: string }) =>
  api.post<AlterEgoResponse>('/alter-egos', data).then(r => r.data)

export const deleteAlterEgo = (id: number) =>
  api.delete(`/alter-egos/${id}`)
