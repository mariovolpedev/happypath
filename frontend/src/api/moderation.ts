import api from './client'

export const getPendingReports = (page = 0) =>
  api.get('/moderation/reports', { params: { page } }).then(r => r.data)

export const resolveReport = (id: number, note?: string, dismiss = false) =>
  api.post(`/moderation/reports/${id}/resolve`, { note }, { params: { dismiss } }).then(r => r.data)

export const censorContent = (id: number, note: string) =>
  api.post(`/moderation/contents/${id}/censor`, { note })

export const deleteContentByMod = (id: number, note: string) =>
  api.post(`/moderation/contents/${id}/delete`, { note })

export const warnUser = (id: number, note: string) =>
  api.post(`/moderation/users/${id}/warn`, { note })

export const banUser = (id: number, note: string, banDuration: string) =>
  api.post(`/moderation/users/${id}/ban`, { note, banDuration })

export const createReport = (targetType: string, targetId: number, reason: string) =>
  api.post('/reports', { targetType, targetId, reason })
