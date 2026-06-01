import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { getTheme, setTheme, type Theme } from '#/lib/theme'

export function ThemeToggle() {
  const [theme, setLocal] = useState<Theme>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setLocal(getTheme())
    setMounted(true)
  }, [])

  function flip() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    setLocal(next)
  }

  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={flip}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      className="grid size-9 place-items-center rounded-xl border border-border bg-surface text-muted transition-[color,background-color,border-color] duration-150 hover:border-border-strong hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-95"
    >
      {/* Avoid hydration mismatch: render a stable icon until mounted. */}
      {mounted && isDark ? <Moon size={17} /> : <Sun size={17} />}
    </button>
  )
}
