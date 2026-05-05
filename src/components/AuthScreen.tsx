import { useState } from 'react'
import { Button, Input, Card, CardContent, CardHeader, CardTitle } from '@blinkdotnew/ui'
import { Mail, Lock, AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { blink } from '../blink/client'
import { useLanguage } from '../lib/LanguageContext'

interface AuthScreenProps {
  initialMode?: 'login' | 'signup'
  onBack?: () => void
}

export function AuthScreen({ initialMode = 'login', onBack }: AuthScreenProps) {
  const { t } = useLanguage()
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot-password'>(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)
    try {
      if (mode === 'signup') {
        await blink.auth.signUp({ email, password })
      } else if (mode === 'login') {
        await blink.auth.signInWithEmail(email, password)
      } else if (mode === 'forgot-password') {
        const redirectUrl = `${window.location.origin}/reset-password`
        await blink.auth.sendPasswordResetEmail(email, { redirectUrl })
        setMessage(t('resetLinkSent'))
      }
    } catch (err: any) {
      const code = err?.code || ''
      if (code === 'INVALID_CREDENTIALS') {
        setError(t('invalidCredentials'))
      } else if (code === 'EMAIL_ALREADY_EXISTS') {
        setError(t('emailAlreadyExists'))
      } else if (code === 'WEAK_PASSWORD') {
        setError(t('weakPassword'))
      } else {
        setError(err?.message || t('somethingWentWrong'))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,hsl(var(--primary)/0.06)_0%,transparent_50%),radial-gradient(ellipse_at_bottom_right,hsl(var(--accent)/0.04)_0%,transparent_50%)] pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Back to landing page */}
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
            Trackson
          </button>
        )}

        {/* Logo + tagline */}
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary rounded-xl text-primary-foreground shadow-lg shadow-primary/30">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 16 L10 16 L14 9 L20 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="4" cy="16" r="2" fill="currentColor"/>
                <circle cx="14" cy="9" r="2" fill="currentColor"/>
                <circle cx="20" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.75" fill="none" opacity="0.65"/>
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{t('appName')}</h1>
              <p className="text-xs text-muted-foreground">{t('appTagline')}</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground text-center max-w-xs">{t('appTaglineAuth')}</p>
        </div>

        {/* Auth card */}
        <Card className="border-border/50 shadow-lg">
          <CardHeader>
            <CardTitle className="text-center relative">
              {mode === 'forgot-password' && (
                <button
                  onClick={() => { setMode('login'); setError(''); setMessage('') }}
                  className="absolute left-0 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft size={20} />
                </button>
              )}
              {mode === 'login' ? t('signIn') :
               mode === 'signup' ? t('createAccount') :
               t('resetPassword')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">{t('emailLabel')}</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="pl-9"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              {mode !== 'forgot-password' && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">{t('passwordLabel')}</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="password"
                      placeholder={mode === 'signup' ? t('passwordPlaceholderSignup') : t('passwordPlaceholderLogin')}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="pl-9"
                      required
                      autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                    />
                  </div>
                </div>
              )}

              {mode === 'login' && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => { setMode('forgot-password'); setError(''); setMessage('') }}
                    className="text-xs text-primary hover:underline"
                  >
                    {t('forgotPassword')}
                  </button>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
                  <AlertCircle size={14} />
                  <span>{error}</span>
                </div>
              )}

              {message && (
                <div className="flex items-start gap-2 text-sm text-emerald-600 bg-emerald-50 rounded-md px-3 py-2">
                  <CheckCircle2 size={14} className="mt-0.5 shrink-0" />
                  <span>{message}</span>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t('pleaseWait') :
                 mode === 'login' ? t('signIn') :
                 mode === 'signup' ? t('createAccount') :
                 t('sendResetLink')}
              </Button>
            </form>

            <div className="mt-4 text-center text-sm text-muted-foreground">
              {mode === 'login' ? (
                <>
                  {t('noAccount')}{' '}
                  <button
                    type="button"
                    onClick={() => { setMode('signup'); setError(''); setMessage('') }}
                    className="text-primary font-medium hover:underline"
                  >
                    {t('signUp')}
                  </button>
                </>
              ) : mode === 'signup' ? (
                <>
                  {t('haveAccount')}{' '}
                  <button
                    type="button"
                    onClick={() => { setMode('login'); setError(''); setMessage('') }}
                    className="text-primary font-medium hover:underline"
                  >
                    {t('signIn')}
                  </button>
                </>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
