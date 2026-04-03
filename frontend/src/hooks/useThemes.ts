import { useState, useEffect } from 'react'
import { getThemes } from '../api/themes'
import type { ThemeResponse } from '../types'

export function useThemes() {
  const [themes, setThemes] = useState<ThemeResponse[]>([])
  useEffect(() => {
    getThemes().then(setThemes).catch(() => {})
  }, [])
  return themes
}
