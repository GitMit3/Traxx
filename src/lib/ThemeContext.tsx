import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'

export type ThemeOption = 'midnight' | 'forest' | 'slate'
export type ColorMode = 'light' | 'dark' | 'system'

interface ThemeContextValue {
  theme: ThemeOption
  setTheme: (theme: ThemeOption) => void
  colorMode: ColorMode
  setColorMode: (mode: ColorMode) => void
}

const THEME_STORAGE_KEY = 'traxx_theme'
const COLOR_MODE_STORAGE_KEY = 'traxx_colormode'

function deriveCharts(primary: string, accent: string, isDark: boolean): string[] {
  const parse = (s: string) => { const [h, sat, l] = s.split(' ').map((x) => parseFloat(x)); return { h, s: sat, l } }
  const fmt = (h: number, s: number, l: number) => `${((h % 360) + 360) % 360} ${Math.max(20, Math.min(95, s))}% ${Math.max(25, Math.min(75, l))}%`
  const p = parse(primary)
  const baseL = isDark ? 58 : 45
  return [primary, accent, fmt(p.h + 30, Math.max(p.s - 20, 50), baseL), fmt(p.h - 50, Math.max(p.s - 15, 50), baseL - 5), fmt(p.h + 180, 90, baseL + 8)]
}

interface Palette {
  primary: string
  primaryFg: string
  accent: string
  ring: string
  background: string
  card: string
  cardFg: string
  popover: string
  popoverFg: string
  foreground: string
  secondary: string
  secondaryFg: string
  muted: string
  mutedFg: string
  border: string
  input: string
  sidebar: string
  sidebarFg: string
  sidebarBorder: string
}

// Each theme defines complete light + dark palettes for full-page theming
const THEMES: Record<ThemeOption, { light: Palette; dark: Palette }> = {
  // Midnight Blue — deep navy blue
  midnight: {
    light: {
      primary: '221 83% 38%', primaryFg: '0 0% 100%', accent: '199 89% 48%', ring: '221 83% 38%',
      background: '220 30% 97%', foreground: '221 50% 10%',
      card: '0 0% 100%', cardFg: '221 50% 10%',
      popover: '0 0% 100%', popoverFg: '221 50% 10%',
      secondary: '220 25% 91%', secondaryFg: '221 50% 10%',
      muted: '220 25% 91%', mutedFg: '220 20% 40%',
      border: '220 20% 87%', input: '220 20% 87%',
      sidebar: '220 28% 94%', sidebarFg: '221 50% 10%', sidebarBorder: '220 20% 87%',
    },
    dark: {
      primary: '221 83% 58%', primaryFg: '0 0% 100%', accent: '199 89% 60%', ring: '221 83% 58%',
      background: '222 47% 5%', foreground: '220 15% 95%',
      card: '222 40% 8%', cardFg: '220 15% 95%',
      popover: '222 40% 8%', popoverFg: '220 15% 95%',
      secondary: '222 28% 13%', secondaryFg: '220 15% 95%',
      muted: '222 28% 13%', mutedFg: '220 15% 55%',
      border: '222 28% 13%', input: '222 28% 13%',
      sidebar: '222 47% 5%', sidebarFg: '220 15% 95%', sidebarBorder: '222 28% 13%',
    },
  },
  // Forest Green — deep rich greens, earthy and calm
  forest: {
    light: {
      primary: '155 60% 22%', primaryFg: '0 0% 100%', accent: '28 85% 55%', ring: '155 60% 22%',
      background: '150 25% 97%', foreground: '155 60% 10%',
      card: '0 0% 100%', cardFg: '155 60% 10%',
      popover: '0 0% 100%', popoverFg: '155 60% 10%',
      secondary: '150 20% 91%', secondaryFg: '155 60% 10%',
      muted: '150 20% 91%', mutedFg: '155 20% 38%',
      border: '150 18% 88%', input: '150 18% 88%',
      sidebar: '150 22% 94%', sidebarFg: '155 60% 10%', sidebarBorder: '150 18% 88%',
    },
    dark: {
      primary: '155 55% 42%', primaryFg: '0 0% 100%', accent: '28 85% 62%', ring: '155 55% 42%',
      background: '155 30% 5%', foreground: '150 15% 95%',
      card: '155 28% 8%', cardFg: '150 15% 95%',
      popover: '155 28% 8%', popoverFg: '150 15% 95%',
      secondary: '155 18% 13%', secondaryFg: '150 15% 95%',
      muted: '155 18% 13%', mutedFg: '155 15% 55%',
      border: '155 18% 13%', input: '155 18% 13%',
      sidebar: '155 30% 5%', sidebarFg: '150 15% 95%', sidebarBorder: '155 18% 13%',
    },
  },
  // Dark Slate — neutral and corporate
  slate: {
    light: {
      primary: '215 28% 22%', primaryFg: '0 0% 100%', accent: '215 65% 50%', ring: '215 28% 22%',
      background: '215 20% 97%', foreground: '215 28% 10%',
      card: '0 0% 100%', cardFg: '215 28% 10%',
      popover: '0 0% 100%', popoverFg: '215 28% 10%',
      secondary: '215 18% 91%', secondaryFg: '215 28% 10%',
      muted: '215 18% 91%', mutedFg: '215 12% 40%',
      border: '215 15% 87%', input: '215 15% 87%',
      sidebar: '215 20% 94%', sidebarFg: '215 28% 10%', sidebarBorder: '215 15% 87%',
    },
    dark: {
      primary: '215 28% 58%', primaryFg: '0 0% 100%', accent: '215 65% 62%', ring: '215 28% 58%',
      background: '215 25% 5%', foreground: '215 10% 95%',
      card: '215 22% 8%', cardFg: '215 10% 95%',
      popover: '215 22% 8%', popoverFg: '215 10% 95%',
      secondary: '215 18% 13%', secondaryFg: '215 10% 95%',
      muted: '215 18% 13%', mutedFg: '215 10% 55%',
      border: '215 18% 13%', input: '215 18% 13%',
      sidebar: '215 25% 5%', sidebarFg: '215 10% 95%', sidebarBorder: '215 18% 13%',
    },
  },
}

function getStoredTheme(): ThemeOption {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    if (stored === 'ocean' || stored === 'purple' || stored === 'rose') return 'midnight'
    if (stored === 'sand' || stored === 'nordic') return 'slate'
    if (stored === 'default' || stored === 'blue') return 'midnight'
    if (stored && stored in THEMES) return stored as ThemeOption
  } catch {}
  return 'midnight'
}

function getStoredColorMode(): ColorMode {
  try {
    const stored = localStorage.getItem(COLOR_MODE_STORAGE_KEY)
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored
  } catch {}
  return 'system'
}

function resolveIsDark(colorMode: ColorMode): boolean {
  if (colorMode === 'dark') return true
  if (colorMode === 'light') return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function applyTheme(theme: ThemeOption, isDark: boolean): void {
  const p = THEMES[theme][isDark ? 'dark' : 'light']
  const root = document.documentElement
  // Core
  root.style.setProperty('--primary', p.primary)
  root.style.setProperty('--primary-foreground', p.primaryFg)
  root.style.setProperty('--accent', p.accent)
  root.style.setProperty('--accent-foreground', p.primaryFg)
  root.style.setProperty('--ring', p.ring)
  // Backgrounds
  root.style.setProperty('--background', p.background)
  root.style.setProperty('--foreground', p.foreground)
  root.style.setProperty('--card', p.card)
  root.style.setProperty('--card-foreground', p.cardFg)
  root.style.setProperty('--popover', p.popover)
  root.style.setProperty('--popover-foreground', p.popoverFg)
  // Secondary / Muted
  root.style.setProperty('--secondary', p.secondary)
  root.style.setProperty('--secondary-foreground', p.secondaryFg)
  root.style.setProperty('--muted', p.muted)
  root.style.setProperty('--muted-foreground', p.mutedFg)
  // Borders & Input
  root.style.setProperty('--border', p.border)
  root.style.setProperty('--input', p.input)
  // Destructive (consistent across themes)
  root.style.setProperty('--destructive', '0 84% 60%')
  root.style.setProperty('--destructive-foreground', '0 0% 100%')
  // Charts (derived from palette)
  const charts = deriveCharts(p.primary, p.accent, isDark)
  charts.forEach((c, i) => root.style.setProperty(`--chart-${i + 1}`, c))
  // Sidebar
  root.style.setProperty('--sidebar', p.sidebar)
  root.style.setProperty('--sidebar-foreground', p.sidebarFg)
  root.style.setProperty('--sidebar-primary', p.primary)
  root.style.setProperty('--sidebar-primary-foreground', p.primaryFg)
  root.style.setProperty('--sidebar-accent', p.accent)
  root.style.setProperty('--sidebar-accent-foreground', p.primaryFg)
  root.style.setProperty('--sidebar-border', p.sidebarBorder)
  root.style.setProperty('--sidebar-ring', p.ring)
}

function applyColorModeClass(isDark: boolean): void {
  if (isDark) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'midnight',
  setTheme: () => {},
  colorMode: 'system',
  setColorMode: () => {},
})

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeOption>(getStoredTheme)
  const [colorMode, setColorModeState] = useState<ColorMode>(getStoredColorMode)

  // Apply theme + color mode whenever they change, and listen for system preference changes
  useEffect(() => {
    const isDark = resolveIsDark(colorMode)
    applyColorModeClass(isDark)
    applyTheme(theme, isDark)

    if (colorMode !== 'system') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e: MediaQueryListEvent) => {
      applyColorModeClass(e.matches)
      applyTheme(theme, e.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme, colorMode])

  const setTheme = useCallback((newTheme: ThemeOption) => {
    setThemeState(newTheme)
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme)
    } catch {}
  }, [])

  const setColorMode = useCallback((newMode: ColorMode) => {
    setColorModeState(newMode)
    try {
      localStorage.setItem(COLOR_MODE_STORAGE_KEY, newMode)
    } catch {}
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, colorMode, setColorMode }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
