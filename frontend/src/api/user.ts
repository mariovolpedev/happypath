import api from './client'

/**
 * Segna il tutorial come completato per l'utente autenticato.
 * POST /users/me/tutorial-completed
 */
export const completeTutorial = () =>
  api.post('/users/me/tutorial-completed').then(r => r.data)
