import api from './client'
import type { Page } from '../types'

export interface NotificationResponse {
  id: number
  actor: { id: number; username: string; displayName: string; avatarUrl?: string; role: string; verified: boolean }
  type: 'REACTION' | 'COMMENT' | 'FOLLOW'
  contentId?: number
  contentTitle?: string
  commentId?: number
  commentPreview?: string
  read: boolean
  createdAt: string
}

export const getNotifications = (page = 0) =>
  api.get<Page<NotificationResponse>>('/notifications', { params: { page } }).then(r => r.data)

export const getUnreadCount = () =>
  api.get<{ count: number }>('/notifications/unread-count').then(r => r.data)

export const markAllRead = () =>
  api.post('/notifications/read-all')

export const markRead = (id: number) =>
  api.patch(`/notifications/${id}/read`)
