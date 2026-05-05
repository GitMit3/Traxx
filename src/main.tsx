import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BlinkUIProvider, Toaster } from '@blinkdotnew/ui'
import { LanguageProvider } from './lib/LanguageContext'
import { ThemeProvider } from './lib/ThemeContext'
import App from './App'
import './index.css'

const queryClient = new QueryClient()

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
