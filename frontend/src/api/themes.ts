import api from './client'
import type { ThemeResponse } from '../types'

export const getThemes = () =>
  api.get<ThemeResponse[]>('/themes').then(r => r.data)
