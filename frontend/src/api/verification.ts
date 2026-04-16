import api from './client'

export type VerificationStatus = 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED'

export interface VerificationRequestResponse {
  id: number
  userId: number
  username: string
  firstName: string
  lastName: string
  birthDate: string
  birthPlace: string
  gender: string
  fiscalCode: string
  status: VerificationStatus
  /** Nota di revisione del moderatore */
  reviewNote?: string
  reviewedByUsername?: string
  createdAt: string
  reviewedAt?: string
}

export interface SubmitVerificationRequest {
  firstName: string
  lastName: string
  birthDate: string   // ISO: 'YYYY-MM-DD'
  birthPlace: string
  gender: 'M' | 'F'
  fiscalCode: string
}

/** Invia la richiesta di verifica per l'utente corrente */
export const submitVerificationRequest = (data: SubmitVerificationRequest) =>
  api.post<VerificationRequestResponse>('/verification-requests/me', data).then(r => r.data)

/**
 * Legge lo stato dell'ultima richiesta dell'utente corrente.
 * 204 No Content → nessuna richiesta mai inviata → restituisce { status: 'NONE' }
 */
export const getMyVerificationStatus = (): Promise<VerificationRequestResponse | { status: 'NONE' }> =>
  api.get<VerificationRequestResponse>('/verification-requests/me')
    .then(r => r.data)
    .catch(err => {
      if (err?.response?.status === 204) return { status: 'NONE' as const }
      throw err
    })

/** Mod/Admin: lista richieste PENDING */
export const getPendingVerificationRequests = (page = 0) =>
  api.get('/moderation/verification-requests', { params: { page, size: 20 } }).then(r => r.data)

/** Mod/Admin: approva */
export const approveVerification = (id: number, note?: string) =>
  api.post<VerificationRequestResponse>(
    `/moderation/verification-requests/${id}/approve`,
    note ? { note } : {}
  ).then(r => r.data)

/** Mod/Admin: rifiuta */
export const rejectVerification = (id: number, note?: string) =>
  api.post<VerificationRequestResponse>(
    `/moderation/verification-requests/${id}/reject`,
    note ? { note } : {}
  ).then(r => r.data)
