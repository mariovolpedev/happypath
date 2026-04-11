import api from './client'
import type { AlterEgoVerificationResponse, Page } from '../types'

export interface VerificationSubmitPayload {
  alterEgoId: number
  firstName: string
  lastName: string
  birthDate: string   // ISO date YYYY-MM-DD
  birthPlace: string
  codiceFiscale: string
}

/** Utente: invia richiesta di verifica */
export const submitVerificationRequest = (data: VerificationSubmitPayload) =>
  api.post<AlterEgoVerificationResponse>('/alter-egos/verifications', data)
    .then(r => r.data)

/** Utente: storico richieste personali */
export const getMyVerificationRequests = (page = 0) =>
  api.get<Page<AlterEgoVerificationResponse>>('/alter-egos/verifications/mine', {
    params: { page }
  }).then(r => r.data)

/** Mod/Admin: lista richieste pendenti */
export const getPendingVerifications = (page = 0) =>
  api.get<Page<AlterEgoVerificationResponse>>('/moderation/alter-ego-verifications', {
    params: { page }
  }).then(r => r.data)

/** Mod/Admin: approva o rifiuta */
export const reviewVerificationRequest = (
  id: number,
  approved: boolean,
  note?: string
) =>
  api.post<AlterEgoVerificationResponse>(
    `/moderation/alter-ego-verifications/${id}/review`,
    { approved, note }
  ).then(r => r.data)
