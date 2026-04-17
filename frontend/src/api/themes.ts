import api from './client'
import type { ThemeResponse } from '../types'

export const getAllThemes     = () =>
  api.get<ThemeResponse[]>('/themes').then(r => r.data)

export const getPresetThemes  = () =>
  api.get<ThemeResponse[]>('/themes/presets').then(r => r.data)

export const getCustomThemes  = () =>
  api.get<ThemeResponse[]>('/themes/custom').then(r => r.data)

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
