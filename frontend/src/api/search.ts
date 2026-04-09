import api from './client'
import type { ContentResponse, UserSummary, AlterEgoResponse } from '../types'

export interface SearchResult {
  contents: ContentResponse[]
  users: UserSummary[]
  alterEgos: AlterEgoResponse[]
}

export type SearchType = 'CONTENT' | 'USER' | 'ALTER_EGO'

export const searchAll = (q: string, type?: SearchType, themeId?: number) =>
  api.get<SearchResult>('/search', {
    params: {
      q,
      ...(type ? { type } : {}),
      ...(themeId ? { themeId } : {}),
    },
  }).then(r => r.data)
