import { useState } from 'react'
import { completeTutorial } from '../../api/user'
import { useAuthStore } from '../../store/authStore'

const STEPS = [
  {
    emoji: '👋',
    title: 'Bentornato su HappyPath!',
    desc: 'Questo breve tutorial ti mostra le funzionalità principali. Puoi saltarlo in qualsiasi momento.',
    highlight: null,
  },
  {
    emoji: '🌻',
    title: 'Il tuo Feed',
    desc: 'Nel feed trovi i contenuti delle persone che segui. Solo storie positive e ispiranti — la moderazione automatica filtra tutto il resto.',
    highlight: 'feed',
  },
  {
    emoji: '✍️',
    title: 'Crea un contenuto',
    desc: 'Premi il pulsante ✏️ in alto per condividere una storia, un\'emozione o un\'ispirazione. Aggiungi foto, mood e dediche.',
    highlight: 'create',
  },
  {
    emoji: '🎭',
    title: 'Alter Ego',
    desc: 'Vuoi condividere qualcosa con una identità diversa? Crea fino a 3 Alter Ego dal menu impostazioni. Ogni ego ha il suo profilo!',
    highlight: 'alter-ego',
  },
  {
    emoji: '🎨',
    title: 'Temi personalizzati',
    desc: 'Vai su Temi per cambiare i colori dell\'interfaccia. Puoi scegliere tra quelli della community o creare il tuo.',
    highlight: 'themes',
  },
  {
    emoji: '💌',
    title: 'Messaggi e dediche',
    desc: 'Usa i messaggi privati per chattare con gli amici. Puoi anche dedicare un post a qualcuno di speciale direttamente durante la creazione!',
    highlight: 'messages',
  },
  {
    emoji: '🚀',
    title: 'Sei pronto!',
    desc: 'Inizia a esplorare HappyPath. Ricorda: ogni piccola storia positiva rende il mondo un po\' più felice. ✨',
    highlight: null,
  },
]

interface Props {
  onClose: () => void
}

export default function TutorialOverlay({ onClose }: Props) {
  const [step, setStep] = useState(0)
  const { user, setUser } = useAuthStore()

  const current = STEPS[step]
  const isLast = step === STEPS.length - 1
  const progress = ((step + 1) / STEPS.length) * 100

  const handleClose = async () => {
    // Chiama il BE per segnare il tutorial come completato
    try {
      await completeTutorial()
    } catch {
      // silenzioso: se fallisce non blocchiamo l'utente
    }
    if (user) {
      setUser({ ...user, tutorialCompleted: true })
    }
    onClose()
  }

  const next = () => {
    if (isLast) {
      handleClose()
    } else {
      setStep(s => s + 1)
    }
  }

  const prev = () => setStep(s => Math.max(0, s - 1))

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      role="dialog"
      aria-modal="true"
      aria-label="Tutorial di benvenuto"
    >
      <div
        className="card w-full max-w-md relative animate-fade-in"
        style={{ maxHeight: '90vh', overflowY: 'auto' }}
      >
        {/* Skip button */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 text-sm px-3 py-1 rounded-full transition-colors"
          style={{ color: 'var(--text-faint)', background: 'var(--surface-2)' }}
          aria-label="Salta il tutorial"
        >
          Salta ×
        </button>

        {/* Progress bar */}
        <div className="h-1 rounded-full mb-6 overflow-hidden" style={{ background: 'var(--surface-2)' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%`, background: 'var(--happy-500, #eab308)' }}
          />
        </div>

        {/* Step indicator */}
        <p className="text-xs mb-4 text-center" style={{ color: 'var(--text-faint)' }}>
          Passo {step + 1} di {STEPS.length}
        </p>

        {/* Content */}
        <div className="text-center px-2 py-4">
          <span className="text-6xl block mb-4" role="img" aria-hidden>{current.emoji}</span>
          <h2 className="font-display text-xl font-bold mb-3" style={{ color: 'var(--text-base)' }}>
            {current.title}
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            {current.desc}
          </p>
        </div>

        {/* Dot navigation */}
        <div className="flex justify-center gap-2 mt-4 mb-6">
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className="w-2 h-2 rounded-full transition-all"
              style={{
                background: i === step ? 'var(--happy-500, #eab308)' : 'var(--surface-2)',
                transform: i === step ? 'scale(1.3)' : 'scale(1)',
              }}
              aria-label={`Vai al passo ${i + 1}`}
            />
          ))}
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={prev}
            disabled={step === 0}
            className="btn-secondary flex-1"
            style={{ opacity: step === 0 ? 0.3 : 1 }}
          >
            ← Indietro
          </button>
          <button
            onClick={next}
            className="btn-primary flex-1"
          >
            {isLast ? '🎉 Inizia!' : 'Avanti →'}
          </button>
        </div>
      </div>
    </div>
  )
}
