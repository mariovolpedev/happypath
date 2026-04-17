import api from './client'
import type { FeedItemResponse, FeedSettings } from '../types'

export const getFeed = (page = 0, size = 20) =>
  api.get<FeedItemResponse[]>('/feed', { params: { page, size } }).then(r => r.data)

export const getFeedSettings = () =>
  api.get<FeedSettings>('/feed/settings').then(r => r.data)

/** Invia sempre l'oggetto completo per evitare null su campi NOT NULL nel DB */
export const updateFeedSettings = (settings: FeedSettings) =>
  api.put<FeedSettings>('/feed/settings', settings).then(r => r.data)
