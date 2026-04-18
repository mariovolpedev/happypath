import { useRef, useState, useCallback } from 'react'
import { uploadMedia, deleteMedia } from '../../api/media'

interface Props {
  value: string          // URL corrente (stringa vuota = nessun file)
  onChange: (url: string, objectKey?: string) => void
  disabled?: boolean
}

const ACCEPTED = 'image/jpeg,image/png,image/gif,image/webp,image/avif,video/mp4,video/webm,video/ogg,video/quicktime'
const MAX_IMAGE_MB = 20
const MAX_VIDEO_MB = 100

function isVideo(mime: string) {
  return mime.startsWith('video/')
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function MediaUploader({ value, onChange, disabled }: Props) {
  const inputRef              = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [progress, setProgress] = useState<number | null>(null)
  const [error, setError]     = useState('')
  const [preview, setPreview] = useState<{ url: string; type: string; name: string; size: number } | null>(null)
  const [objectKey, setObjectKey] = useState<string | undefined>(undefined)

  const validate = (file: File): string | null => {
    const maxMb = isVideo(file.type) ? MAX_VIDEO_MB : MAX_IMAGE_MB
    if (file.size > maxMb * 1024 * 1024)
      return `File troppo grande. Massimo ${maxMb} MB per ${isVideo(file.type) ? 'video' : 'immagini'}.`
    if (!ACCEPTED.split(',').includes(file.type))
      return 'Formato non supportato. Usa JPEG, PNG, GIF, WebP, AVIF, MP4, WebM, OGG o MOV.'
    return null
  }

  const handleFile = useCallback(async (file: File) => {
    const validationError = validate(file)
    if (validationError) { setError(validationError); return }

    setError('')
    setProgress(0)
    const localPreview = URL.createObjectURL(file)
    setPreview({ url: localPreview, type: file.type, name: file.name, size: file.size })

    try {
      const result = await uploadMedia(file, setProgress)
      setObjectKey(result.objectKey)
      onChange(result.url, result.objectKey)
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Errore durante il caricamento. Riprova.')
      setPreview(null)
      onChange('', undefined)
    } finally {
      setProgress(null)
    }
  }, [onChange])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = ''
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  const handleRemove = async () => {
    if (objectKey) {
      try { await deleteMedia(objectKey) } catch { /* ignora errori di pulizia */ }
    }
    setPreview(null)
    setObjectKey(undefined)
    setError('')
    onChange('', undefined)
  }

  // Stato: file caricato con successo
  if (value && preview) {
    return (
      <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
        {isVideo(preview.type) ? (
          <video
            src={value}
            controls
            className="w-full max-h-72 object-cover"
          />
        ) : (
          <img
            src={value}
            alt="Anteprima media"
            className="w-full max-h-72 object-cover"
          />
        )}
        {/* Overlay info + rimuovi */}
        <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white px-3 py-2 flex items-center justify-between text-xs">
          <span className="truncate max-w-[70%]">
            {isVideo(preview.type) ? '🎬' : '🖼️'} {preview.name} · {formatBytes(preview.size)}
          </span>
          {!disabled && (
            <button
              type="button"
              onClick={handleRemove}
              className="ml-2 flex-shrink-0 bg-white/20 hover:bg-white/40 rounded-full w-6 h-6 flex items-center justify-center transition-colors"
              aria-label="Rimuovi media"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          )}
        </div>
      </div>
    )
  }

  // Stato: caricamento in corso
  if (progress !== null) {
    return (
      <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-6 flex flex-col items-center gap-3">
        <div className="w-full bg-indigo-100 rounded-full h-2 overflow-hidden">
          <div
            className="h-2 bg-indigo-500 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-sm text-indigo-600 font-medium">
          {progress < 100 ? `Caricamento… ${progress}%` : '✅ Elaborazione…'}
        </p>
      </div>
    )
  }

  // Stato: drop zone
  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        aria-label="Carica immagine o video"
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={e => e.key === 'Enter' && !disabled && inputRef.current?.click()}
        className={[
          'rounded-xl border-2 border-dashed p-8 flex flex-col items-center gap-2 cursor-pointer transition-colors select-none',
          dragging
            ? 'border-indigo-400 bg-indigo-50'
            : 'border-gray-200 bg-gray-50 hover:border-indigo-300 hover:bg-indigo-50/50',
          disabled ? 'opacity-50 cursor-not-allowed' : '',
        ].join(' ')}
      >
        {/* Icona upload */}
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" className="text-gray-400" stroke="currentColor" strokeWidth="1.5">
          <path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" strokeLinecap="round"/>
          <polyline points="16 12 12 8 8 12" strokeLinecap="round" strokeLinejoin="round"/>
          <line x1="12" y1="8" x2="12" y2="20" strokeLinecap="round"/>
          <path d="M20 8a8 8 0 10-16 0" strokeLinecap="round"/>
        </svg>

        <p className="text-sm font-medium text-gray-700">
          {dragging ? 'Rilascia qui il file' : 'Trascina un file o clicca per selezionarlo'}
        </p>
        <p className="text-xs text-gray-400">
          Immagini: JPEG, PNG, GIF, WebP, AVIF (max {MAX_IMAGE_MB} MB)
        </p>
        <p className="text-xs text-gray-400">
          Video: MP4, WebM, OGG, MOV (max {MAX_VIDEO_MB} MB)
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        className="sr-only"
        onChange={handleInputChange}
        disabled={disabled}
        aria-hidden="true"
      />

      {error && (
        <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="7" cy="7" r="6"/>
            <line x1="7" y1="4" x2="7" y2="7.5"/>
            <circle cx="7" cy="10" r="0.5" fill="currentColor"/>
          </svg>
          {error}
        </p>
      )}
    </div>
  )
}
