import api from './client'
import type { ThemeResponse, Page } from '../types'

export const getAllThemes     = (page = 0, size = 30) =>
  api.get<Page<ThemeResponse>>('/themes', { params: { page, size } }).then(r => r.data)

export const getPresetThemes  = (page = 0, size = 30) =>
  api.get<Page<ThemeResponse>>('/themes/presets', { params: { page, size } }).then(r => r.data)

export const getCustomThemes  = (page = 0, size = 30) =>
  api.get<Page<ThemeResponse>>('/themes/custom', { params: { page, size } }).then(r => r.data)

export const getMyThemes      = () =>
  api.get<ThemeResponse[]>('/themes/me').then(r => r.data)

export const getThemeById     = (id: number) =>
  api.get<ThemeResponse>(`/themes/${id}`).then(r => r.data)

export const createTheme      = (payload: { name: string; description?: string; iconEmoji?: string }) =>
  api.post<ThemeResponse>('/themes', payload).then(r => r.data)

export const followTheme      = (id: number) =>
  api.post(`/themes/${id}/follow`).then(r => r.data)

export const unfollowTheme    = (id: number) =>
  api.delete(`/themes/${id}/follow`).then(r => r.data)
