'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'

type ThemeMode = 'light' | 'dark' | 'system'

type A11yState = {
  theme: ThemeMode
  highContrast: boolean
  fontScale: number
}

type A11yContextValue = A11yState & {
  resolvedTheme: 'light' | 'dark'
  setTheme: (mode: ThemeMode) => void
  toggleTheme: () => void
  setHighContrast: (on: boolean) => void
  increaseFont: () => void
  decreaseFont: () => void
  resetFont: () => void
}

const STORAGE_KEY = 'clm-a11y'
const MIN_SCALE = 1
const MAX_SCALE = 1.5
const STEP = 0.125

const AccessibilityContext = createContext<A11yContextValue | null>(null)

function readInitial(): A11yState {
  if (typeof window === 'undefined') {
    return { theme: 'system', highContrast: false, fontScale: 1 }
  }
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    return {
      theme: raw.theme ?? 'system',
      highContrast: Boolean(raw.highContrast),
      fontScale: typeof raw.fontScale === 'number' ? raw.fontScale : 1,
    }
  } catch {
    return { theme: 'system', highContrast: false, fontScale: 1 }
  }
}

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<A11yState>(() => ({
    theme: 'system',
    highContrast: false,
    fontScale: 1,
  }))
  const [systemDark, setSystemDark] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Hydrate from storage on mount
  useEffect(() => {
    setState(readInitial())
    setMounted(true)
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    setSystemDark(mq.matches)
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const resolvedTheme: 'light' | 'dark' =
    state.theme === 'system' ? (systemDark ? 'dark' : 'light') : state.theme

  // Apply to <html> + persist
  useEffect(() => {
    if (!mounted) return
    const el = document.documentElement
    el.classList.toggle('dark', resolvedTheme === 'dark')
    el.classList.toggle('high-contrast', state.highContrast)
    el.style.setProperty('--font-scale', String(state.fontScale))
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state, resolvedTheme, mounted])

  const setTheme = useCallback((theme: ThemeMode) => {
    setState((s) => ({ ...s, theme }))
  }, [])

  const toggleTheme = useCallback(() => {
    setState((s) => ({ ...s, theme: resolvedTheme === 'dark' ? 'light' : 'dark' }))
  }, [resolvedTheme])

  const setHighContrast = useCallback((highContrast: boolean) => {
    setState((s) => ({ ...s, highContrast }))
  }, [])

  const increaseFont = useCallback(() => {
    setState((s) => ({ ...s, fontScale: Math.min(MAX_SCALE, s.fontScale + STEP) }))
  }, [])

  const decreaseFont = useCallback(() => {
    setState((s) => ({ ...s, fontScale: Math.max(MIN_SCALE, s.fontScale - STEP) }))
  }, [])

  const resetFont = useCallback(() => {
    setState((s) => ({ ...s, fontScale: 1 }))
  }, [])

  return (
    <AccessibilityContext.Provider
      value={{
        ...state,
        resolvedTheme,
        setTheme,
        toggleTheme,
        setHighContrast,
        increaseFont,
        decreaseFont,
        resetFont,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  )
}

export function useAccessibility() {
  const ctx = useContext(AccessibilityContext)
  if (!ctx) {
    throw new Error('useAccessibility must be used within AccessibilityProvider')
  }
  return ctx
}
