import api from './client'
import type { MessageResponse, Page } from '../types'

export const sendMessage = (recipientId: number, text: string) =>
  api.post<MessageResponse>('/messages', { recipientId, text }).then(r => r.data)

export const getConversation = (otherId: number, page = 0) =>
  api.get<Page<MessageResponse>>(`/messages/conversation/${otherId}`, { params: { page } }).then(r => r.data)
