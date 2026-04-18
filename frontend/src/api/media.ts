import api from './client'

export interface MediaUploadResponse {
  url: string
  objectKey: string
  mimeType: string
  sizeBytes: number
}

/**
 * Carica un file (immagine o video) su MinIO tramite il backend.
 * Restituisce l'URL pubblico e i metadati del file caricato.
 */
export const uploadMedia = async (
  file: File,
  onProgress?: (percent: number) => void
): Promise<MediaUploadResponse> => {
  const formData = new FormData()
  formData.append('file', file)

  const response = await api.post<MediaUploadResponse>('/media/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (event) => {
      if (onProgress && event.total) {
        onProgress(Math.round((event.loaded * 100) / event.total))
      }
    },
  })

  return response.data
}

/**
 * Elimina un file da MinIO tramite il backend.
 */
export const deleteMedia = async (objectKey: string): Promise<void> => {
  await api.delete(`/media/${encodeURIComponent(objectKey)}`)
}
