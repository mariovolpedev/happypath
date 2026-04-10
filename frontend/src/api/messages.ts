import api from './client'
import type { MessageResponse, Page } from '../types'

export interface ConversationSummary {
  partner: import('../types').UserSummary
  lastMessageText: string
  lastMessageSender: import('../types').UserSummary
  lastMessageAt: string
  unreadCount: number
}

export const sendMessage = (
  recipientId: number,
  text: string,
  attachedContentId?: number,
  attachedUserId?: number
) =>
  api
    .post<MessageResponse>('/messages', {
      recipientId,
      text,
      attachedContentId,
      attachedUserId,
    })
    .then((r) => r.data)

export const getConversation = (otherId: number, page = 0) =>
  api
    .get<Page<MessageResponse>>(`/messages/conversation/${otherId}`, {
      params: { page, size: 50 },
    })
    .then((r) => r.data)

export const getConversations = () =>
  api.get<ConversationSummary[]>('/messages/conversations').then((r) => r.data)

export const markConversationAsRead = (otherId: number) =>
  api.post(`/messages/conversation/${otherId}/read`)

export const getUnreadCount = () =>
  api.get<{ count: number }>('/messages/unread-count').then((r) => r.data.count)
