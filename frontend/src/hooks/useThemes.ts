import { useState, useEffect } from 'react'
import { getAllThemes } from '../api/themes'
import type { ThemeResponse } from '../types'

export function useThemes() {
  const [themes, setThemes] = useState<ThemeResponse[]>([])
  useEffect(() => {
    getAllThemes(0, 100).then(page => setThemes(page.content)).catch(() => {})
  }, [])
  return themes
}
