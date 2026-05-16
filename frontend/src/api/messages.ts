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
  senderAlterEgoId?: number,
  attachedContentId?: number,
  attachedUserId?: number,
  imageUrl?: string
) =>
  api
    .post<MessageResponse>('/messages', {
      recipientId,
      text: text || undefined,
      senderAlterEgoId,
      attachedContentId,
      attachedUserId,
      imageUrl,
    })
    .then(r => r.data)

/**
 * Carica un'immagine su MinIO e restituisce il suo URL pubblico.
 * Da usare prima di sendMessage per ottenere imageUrl.
 */
export const uploadMessageImage = async (file: File): Promise<string> => {
  const form = new FormData()
  form.append('file', file)
  const res = await api.post<{ url: string }>('/media/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data.url
}

export const getConversation = (otherId: number, page = 0) =>
  api
    .get<Page<MessageResponse>>(`/messages/conversation/${otherId}`, {
      params: { page, size: 50 },
    })
    .then(r => r.data)

export const getConversations = () =>
  api.get<ConversationSummary[]>('/messages/conversations').then(r => r.data)

export const markConversationAsRead = (otherId: number) =>
  api.post(`/messages/conversation/${otherId}/read`)

export const getUnreadCount = () =>
  api
    .get<{ count: number }>('/messages/unread-count')
    .then(r => r.data.count)
