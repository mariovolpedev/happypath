import api from './client'
import type { FeedItemResponse, FeedSettings } from '../types'

export const getFeed = (page = 0, size = 20) =>
  api.get<FeedItemResponse[]>('/feed', { params: { page, size } }).then(r => r.data)

export const getFeedSettings = () =>
  api.get<FeedSettings>('/feed/settings').then(r => r.data)

export const updateFeedSettings = (settings: Partial<FeedSettings>) =>
  api.put<FeedSettings>('/feed/settings', settings).then(r => r.data)
