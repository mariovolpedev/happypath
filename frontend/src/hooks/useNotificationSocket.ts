import { useEffect, useRef, useCallback } from 'react'
import { Client, IMessage } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { useAuthStore } from '../store/authStore'

export interface NotificationPayload {
  id: number
  actor: { id: number; username: string; displayName: string; avatarUrl: string | null } | null
  type: string
  contentId: number | null
  contentTitle: string | null
  commentId: number | null
  commentPreview: string | null
  read: boolean
  createdAt: string
}

type Handler = (notification: NotificationPayload) => void

/**
 * Connects to the STOMP WebSocket endpoint and subscribes to
 * /user/queue/notifications for real-time notification delivery.
 *
 * Usage:
 *   const { disconnect } = useNotificationSocket((n) => {
 *     // handle incoming notification
 *   })
 *
 * The hook automatically:
 *  - Connects when the user is authenticated.
 *  - Disconnects when the user logs out (token becomes null).
 *  - Reconnects with exponential backoff on unexpected drops.
 *  - Passes the JWT in the STOMP CONNECT headers for server-side auth.
 */
export function useNotificationSocket(onNotification: Handler) {
  const token = useAuthStore(s => s.token)
  const clientRef = useRef<Client | null>(null)

  const disconnect = useCallback(() => {
    if (clientRef.current?.active) {
      clientRef.current.deactivate()
    }
  }, [])

  useEffect(() => {
    if (!token) {
      disconnect()
      return
    }

    const client = new Client({
      webSocketFactory: () => new SockJS('/api/ws'),
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe('/user/queue/notifications', (message: IMessage) => {
          try {
            const payload: NotificationPayload = JSON.parse(message.body)
            onNotification(payload)
          } catch (e) {
            console.warn('Failed to parse notification message', e)
          }
        })
      },
      onStompError: (frame) => {
        console.warn('STOMP error', frame.headers['message'])
      },
    })

    client.activate()
    clientRef.current = client

    return () => {
      client.deactivate()
    }
  }, [token, onNotification, disconnect])

  return { disconnect }
}
