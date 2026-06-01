export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'crowdrag-theme'

/** Resolves the active theme from storage, falling back to OS preference. */
export function getTheme(): Theme {
  if (typeof window === 'undefined') return 'light'
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'light' || stored === 'dark') return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

export function setTheme(theme: Theme) {
  localStorage.setItem(STORAGE_KEY, theme)
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

export function toggleTheme(): Theme {
  const next: Theme = getTheme() === 'dark' ? 'light' : 'dark'
  setTheme(next)
  return next
}

/**
 * Inline script injected into <head> to apply the theme before first paint,
 * preventing a flash of the wrong theme on SSR hydration. Keep dependency-free
 * and in sync with getTheme() above.
 */
export const themeInitScript = `(function(){try{var k='${STORAGE_KEY}',s=localStorage.getItem(k),d=s?s==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.toggle('dark',d);}catch(e){}})();`
