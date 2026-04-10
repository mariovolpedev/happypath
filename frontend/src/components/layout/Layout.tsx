import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import { useThemeStore } from '../../store/themeStore'

export default function Layout() {
  const { mode, getEffective } = useThemeStore()

  /* Apply / remove "dark" class on <html> whenever mode changes */
  useEffect(() => {
    const html = document.documentElement
    const apply = () => {
      const effective = getEffective()
      html.classList.toggle('dark', effective === 'dark')
    }
    apply()

    /* Re-evaluate when the OS preference changes (only relevant for "system") */
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [mode, getEffective])

  return (
    <div className="min-h-screen transition-colors duration-200" style={{ backgroundColor: 'var(--bg-base)' }}>
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <Outlet />
      </main>
      <footer className="text-center text-sm py-8" style={{ color: 'var(--text-faint)' }}>
        HappyPath — Contenuti semplici e felici 🌻
      </footer>
    </div>
  )
}
