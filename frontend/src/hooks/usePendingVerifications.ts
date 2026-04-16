import { useEffect, useState } from 'react'
import { getPendingVerificationRequests } from '../api/verification'

/**
 * Polling ogni 60 s per recuperare il conteggio delle richieste di
 * verifica PENDING. Usato dalla Navbar per mostrare il badge.
 */
export function usePendingVerifications() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const fetch = () =>
      getPendingVerificationRequests(0)
        .then((page: any) => setCount(page.totalElements ?? 0))
        .catch(() => {})

    fetch()
    const id = setInterval(fetch, 60_000)
    return () => clearInterval(id)
  }, [])

  return count
}
