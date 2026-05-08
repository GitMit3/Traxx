import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BlinkUIProvider, Toaster } from '@blinkdotnew/ui'
import { LanguageProvider } from './lib/LanguageContext'
import { ThemeProvider } from './lib/ThemeContext'
import App from './App'
import './index.css'

const queryClient = new QueryClient()

try {
  const oldLang = localStorage.getItem('jobtrack_language')
  if (oldLang) { localStorage.setItem('traxx_language', oldLang); localStorage.removeItem('jobtrack_language') }
  const oldTheme = localStorage.getItem('trackify_theme')
  if (oldTheme) { localStorage.setItem('traxx_theme', oldTheme); localStorage.removeItem('trackify_theme') }
  const oldMode = localStorage.getItem('trackify_colormode')
  if (oldMode) { localStorage.setItem('traxx_colormode', oldMode); localStorage.removeItem('trackify_colormode') }
} catch {}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BlinkUIProvider theme="linear" darkMode="system">
        <ThemeProvider>
          <LanguageProvider>
            <Toaster />
            <App />
          </LanguageProvider>
        </ThemeProvider>
      </BlinkUIProvider>
    </QueryClientProvider>
  </React.StrictMode>,
)
