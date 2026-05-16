import { useEffect, useState } from 'react'
import { getPendingVerificationRequests } from '../api/verification'

/**
 * Polling ogni 60 s per recuperare il conteggio delle richieste di
 * verifica PENDING. Usato dalla Navbar per mostrare il badge.
 *
 * Il parametro `enabled` deve essere `true` solo se l'utente è
 * moderatore o admin: evita chiamate inutili (e 403) per utenti normali.
 */
export function usePendingVerifications(enabled: boolean) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!enabled) return

    const fetchCount = () =>
      getPendingVerificationRequests(0)
        .then((page: any) => setCount(page.totalElements ?? 0))
        .catch(() => {})

    fetchCount()
    const id = setInterval(fetchCount, 60_000)
    return () => clearInterval(id)
  }, [enabled])

  return count
}
