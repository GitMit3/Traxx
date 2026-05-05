import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'

export type ThemeOption = 'forest' | 'ocean' | 'purple' | 'slate' | 'sand' | 'midnight' | 'rose' | 'nordic'
export type ColorMode = 'light' | 'dark' | 'system'

interface ThemeContextValue {
  theme: ThemeOption
  setTheme: (theme: ThemeOption) => void
  colorMode: ColorMode
  setColorMode: (mode: ColorMode) => void
}

const THEME_STORAGE_KEY = 'trackify_theme'
const COLOR_MODE_STORAGE_KEY = 'trackify_colormode'

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
  // Ocean Blue — cool professional blues
  ocean: {
    light: {
      primary: '213 78% 32%', primaryFg: '0 0% 100%', accent: '195 75% 45%', ring: '213 78% 32%',
      background: '210 40% 97%', foreground: '213 50% 10%',
      card: '0 0% 100%', cardFg: '213 50% 10%',
      popover: '0 0% 100%', popoverFg: '213 50% 10%',
      secondary: '210 30% 91%', secondaryFg: '213 50% 10%',
      muted: '210 30% 91%', mutedFg: '210 20% 38%',
      border: '210 25% 87%', input: '210 25% 87%',
      sidebar: '210 35% 94%', sidebarFg: '213 50% 10%', sidebarBorder: '210 25% 87%',
    },
    dark: {
      primary: '213 78% 55%', primaryFg: '0 0% 100%', accent: '195 75% 58%', ring: '213 78% 55%',
      background: '213 40% 4%', foreground: '210 15% 95%',
      card: '213 35% 8%', cardFg: '210 15% 95%',
      popover: '213 35% 8%', popoverFg: '210 15% 95%',
      secondary: '213 22% 13%', secondaryFg: '210 15% 95%',
      muted: '213 22% 13%', mutedFg: '210 15% 55%',
      border: '213 22% 13%', input: '213 22% 13%',
      sidebar: '213 40% 4%', sidebarFg: '210 15% 95%', sidebarBorder: '213 22% 13%',
    },
  },
  // Deep Purple — creative and distinct
  purple: {
    light: {
      primary: '268 55% 40%', primaryFg: '0 0% 100%', accent: '305 55% 55%', ring: '268 55% 40%',
      background: '265 30% 97%', foreground: '268 40% 10%',
      card: '0 0% 100%', cardFg: '268 40% 10%',
      popover: '0 0% 100%', popoverFg: '268 40% 10%',
      secondary: '265 22% 91%', secondaryFg: '268 40% 10%',
      muted: '265 22% 91%', mutedFg: '265 15% 40%',
      border: '265 18% 87%', input: '265 18% 87%',
      sidebar: '265 25% 94%', sidebarFg: '268 40% 10%', sidebarBorder: '265 18% 87%',
    },
    dark: {
      primary: '268 60% 62%', primaryFg: '0 0% 100%', accent: '305 55% 65%', ring: '268 60% 62%',
      background: '268 35% 5%', foreground: '265 15% 95%',
      card: '268 30% 8%', cardFg: '265 15% 95%',
      popover: '268 30% 8%', popoverFg: '265 15% 95%',
      secondary: '268 20% 13%', secondaryFg: '265 15% 95%',
      muted: '268 20% 13%', mutedFg: '265 15% 55%',
      border: '268 20% 13%', input: '268 20% 13%',
      sidebar: '268 35% 5%', sidebarFg: '265 15% 95%', sidebarBorder: '268 20% 13%',
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
  // Warm Sand — warm earthy tones
  sand: {
    light: {
      primary: '28 55% 35%', primaryFg: '0 0% 100%', accent: '35 90% 52%', ring: '28 55% 35%',
      background: '35 30% 97%', foreground: '28 40% 10%',
      card: '0 0% 100%', cardFg: '28 40% 10%',
      popover: '0 0% 100%', popoverFg: '28 40% 10%',
      secondary: '35 25% 91%', secondaryFg: '28 40% 10%',
      muted: '35 25% 91%', mutedFg: '32 18% 40%',
      border: '32 20% 87%', input: '32 20% 87%',
      sidebar: '35 28% 94%', sidebarFg: '28 40% 10%', sidebarBorder: '32 20% 87%',
    },
    dark: {
      primary: '28 55% 55%', primaryFg: '0 0% 100%', accent: '35 90% 62%', ring: '28 55% 55%',
      background: '28 30% 5%', foreground: '32 12% 95%',
      card: '28 25% 8%', cardFg: '32 12% 95%',
      popover: '28 25% 8%', popoverFg: '32 12% 95%',
      secondary: '28 18% 13%', secondaryFg: '32 12% 95%',
      muted: '28 18% 13%', mutedFg: '32 10% 55%',
      border: '28 18% 13%', input: '28 18% 13%',
      sidebar: '28 30% 5%', sidebarFg: '32 12% 95%', sidebarBorder: '28 18% 13%',
    },
  },
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
  // Rose Gold — warm pink/gold
  rose: {
    light: {
      primary: '330 65% 40%', primaryFg: '0 0% 100%', accent: '25 90% 52%', ring: '330 65% 40%',
      background: '330 30% 97%', foreground: '330 45% 10%',
      card: '0 0% 100%', cardFg: '330 45% 10%',
      popover: '0 0% 100%', popoverFg: '330 45% 10%',
      secondary: '330 22% 91%', secondaryFg: '330 45% 10%',
      muted: '330 22% 91%', mutedFg: '330 15% 40%',
      border: '330 18% 87%', input: '330 18% 87%',
      sidebar: '330 25% 94%', sidebarFg: '330 45% 10%', sidebarBorder: '330 18% 87%',
    },
    dark: {
      primary: '330 65% 60%', primaryFg: '0 0% 100%', accent: '25 90% 62%', ring: '330 65% 60%',
      background: '330 35% 5%', foreground: '330 12% 95%',
      card: '330 28% 8%', cardFg: '330 12% 95%',
      popover: '330 28% 8%', popoverFg: '330 12% 95%',
      secondary: '330 20% 13%', secondaryFg: '330 12% 95%',
      muted: '330 20% 13%', mutedFg: '330 10% 55%',
      border: '330 20% 13%', input: '330 20% 13%',
      sidebar: '330 35% 5%', sidebarFg: '330 12% 95%', sidebarBorder: '330 20% 13%',
    },
  },
  // Nordic Gray — cool gray
  nordic: {
    light: {
      primary: '215 14% 28%', primaryFg: '0 0% 100%', accent: '199 60% 42%', ring: '215 14% 28%',
      background: '215 15% 97%', foreground: '215 20% 10%',
      card: '0 0% 100%', cardFg: '215 20% 10%',
      popover: '0 0% 100%', popoverFg: '215 20% 10%',
      secondary: '215 12% 91%', secondaryFg: '215 20% 10%',
      muted: '215 12% 91%', mutedFg: '215 10% 40%',
      border: '215 10% 87%', input: '215 10% 87%',
      sidebar: '215 14% 94%', sidebarFg: '215 20% 10%', sidebarBorder: '215 10% 87%',
    },
    dark: {
      primary: '215 14% 58%', primaryFg: '0 0% 100%', accent: '199 60% 55%', ring: '215 14% 58%',
      background: '215 20% 5%', foreground: '215 8% 95%',
      card: '215 16% 8%', cardFg: '215 8% 95%',
      popover: '215 16% 8%', popoverFg: '215 8% 95%',
      secondary: '215 12% 13%', secondaryFg: '215 8% 95%',
      muted: '215 12% 13%', mutedFg: '215 8% 55%',
      border: '215 12% 13%', input: '215 12% 13%',
      sidebar: '215 20% 5%', sidebarFg: '215 8% 95%', sidebarBorder: '215 12% 13%',
    },
  },
}

function getStoredTheme(): ThemeOption {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    // migrate old theme key names
    if (stored === 'default') return 'forest'
    if (stored === 'blue') return 'ocean'
    if (stored && stored in THEMES) return stored as ThemeOption
  } catch {}
  return 'forest'
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
  // Charts
  root.style.setProperty('--chart-1', p.primary)
  root.style.setProperty('--chart-2', p.accent)
  root.style.setProperty('--chart-3', '47 96% 53%')
  root.style.setProperty('--chart-4', '213 78% 45%')
  root.style.setProperty('--chart-5', '268 55% 50%')
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
  theme: 'default',
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
