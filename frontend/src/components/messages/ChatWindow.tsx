import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import type { MessageResponse, UserSummary, AlterEgoResponse } from '../../types'
import { getConversation, sendMessage, markConversationAsRead } from '../../api/messages'
import { getMyAlterEgos } from '../../api/alterEgos'
import MessageBubble from './MessageBubble'
import ShareModal from './ShareModal'
import Avatar from '../common/Avatar'
import VerifiedBadge from '../common/VerifiedBadge'
import Spinner from '../common/Spinner'

interface Props {
  partner: UserSummary
  currentUserId: number
  onMessageSent?: () => void
}

export default function ChatWindow({ partner, currentUserId, onMessageSent }: Props) {
  const [messages,          setMessages]          = useState<MessageResponse[]>([])
  const [text,              setText]              = useState('')
  const [loading,           setLoading]           = useState(true)
  const [sending,           setSending]           = useState(false)
  const [showShare,         setShowShare]         = useState(false)
  const [myAlterEgos,       setMyAlterEgos]       = useState<AlterEgoResponse[]>([])
  const [senderAeId,        setSenderAeId]        = useState<number | undefined>()
  const [pendingAttachment, setPendingAttachment] = useState<{
    type: 'content' | 'profile'; id: number; label: string
  } | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setLoading(true)
    getConversation(partner.id)
      .then(page => setMessages(page.content))
      .finally(() => setLoading(false))
    markConversationAsRead(partner.id).catch(() => {})
    getMyAlterEgos().then(setMyAlterEgos).catch(() => {})
  }, [partner.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim() && !pendingAttachment) return
    setSending(true)
    try {
      const msg = await sendMessage(
        partner.id,
        text.trim() || '👇',
        senderAeId,
        pendingAttachment?.type === 'content' ? pendingAttachment.id : undefined,
        pendingAttachment?.type === 'profile' ? pendingAttachment.id : undefined
      )
      setMessages(prev => [...prev, msg])
      setText('')
      setPendingAttachment(null)
      onMessageSent?.()
    } catch (err: any) {
      alert(err.response?.data?.message ?? 'Errore invio messaggio')
    } finally {
      setSending(false)
    }
  }

  const handleShareSelect = (type: 'content' | 'profile', id: number) => {
    setPendingAttachment({ type, id, label: type === 'content' ? `Contenuto #${id}` : `Profilo #${id}` })
    setShowShare(false)
  }

  const selectedAe = myAlterEgos.find(a => a.id === senderAeId)

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <Link to={`/u/${partner.username}`} className="flex items-center gap-3 group">
          <Avatar user={partner} size="md" />
          <div>
            <div className="flex items-center gap-1.5 font-semibold group-hover:text-happy-600"
              style={{ color: 'var(--text-primary)' }}>
              {partner.displayName}
              {partner.verified && <VerifiedBadge />}
            </div>
            <p className="text-xs" style={{ color: 'var(--text-faint)' }}>@{partner.username}</p>
          </div>
        </Link>
      </div>

      {/* Messaggi */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ backgroundColor: 'var(--bg-base)' }}>
        {loading ? (
          <Spinner />
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <span className="text-5xl mb-3">💬</span>
            <p className="font-medium" style={{ color: 'var(--text-muted)' }}>Inizia la conversazione!</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-faint)' }}>
              Invia un messaggio a {partner.displayName}
            </p>
          </div>
        ) : (
          messages.map(msg => (
            <MessageBubble key={msg.id} message={msg} isOwn={msg.sender.id === currentUserId} />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Allegato in attesa */}
      {pendingAttachment && (
        <div className="px-4 py-2 border-t flex items-center gap-2"
          style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border)' }}>
          <span className="text-sm flex-1" style={{ color: 'var(--text-muted)' }}>
            {pendingAttachment.type === 'content' ? '📄' : '👤'} {pendingAttachment.label}
          </span>
          <button onClick={() => setPendingAttachment(null)}
            className="text-xs text-red-400 hover:text-red-600">✕ rimuovi</button>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSend} className="flex flex-col gap-2 px-4 py-3 border-t"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>

        {/* Selezione identità mittente */}
        {myAlterEgos.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs shrink-0" style={{ color: 'var(--text-faint)' }}>Scrivi come:</span>
            <select
              className="input text-xs py-1 w-auto"
              value={senderAeId ?? ''}
              onChange={e => setSenderAeId(e.target.value ? Number(e.target.value) : undefined)}>
              <option value="">👤 Tu</option>
              {myAlterEgos.map(ae => (
                <option key={ae.id} value={ae.id}>🎭 {ae.name}</option>
              ))}
            </select>
          </div>
        )}

        <div className="flex items-end gap-2">
          <button type="button" onClick={() => setShowShare(true)}
            title="Condividi contenuto o profilo"
            className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-full
                       transition-colors text-lg"
            style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-muted)' }}>
            📎
          </button>

          <textarea
            className="input flex-1 resize-none h-10 min-h-[2.5rem] max-h-32 py-2 text-sm
                       leading-5 overflow-auto"
            placeholder={`Messaggio${selectedAe ? ` come ${selectedAe.name}` : ''} a ${partner.displayName}…`}
            value={text}
            onChange={e => {
              setText(e.target.value)
              e.target.style.height = 'auto'
              e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px'
            }}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e as any) }
            }}
            maxLength={2000}
          />

          <button type="submit"
            disabled={sending || (!text.trim() && !pendingAttachment)}
            className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-full
                       bg-happy-500 hover:bg-happy-600 text-white disabled:opacity-40 transition-colors"
            title="Invia (Enter)">
            {sending ? (
              <span className="animate-spin text-xs">⏳</span>
            ) : (
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            )}
          </button>
        </div>
      </form>

      {showShare && (
        <ShareModal onSelect={handleShareSelect} onClose={() => setShowShare(false)} />
      )}
    </div>
  )
}
