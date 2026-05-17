import { useState } from 'react'
import { Button, Input, Card, CardContent, CardHeader, CardTitle } from '@blinkdotnew/ui'
import { Mail, Lock, AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
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
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
      } else if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      } else if (mode === 'forgot-password') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        })
        if (error) throw error
        setMessage(t('resetLinkSent'))
      }
    } catch (err: any) {
      const msg: string = err?.message || ''
      if (msg.toLowerCase().includes('invalid login credentials') || msg.toLowerCase().includes('invalid credentials')) {
        setError(t('invalidCredentials'))
      } else if (msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('already exists')) {
        setError(t('emailAlreadyExists'))
      } else if (msg.toLowerCase().includes('password') && msg.toLowerCase().includes('characters')) {
        setError(t('weakPassword'))
      } else {
        setError(msg || t('somethingWentWrong'))
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
            Traxx
          </button>
        )}

        {/* Logo + tagline */}
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary rounded-xl text-primary-foreground shadow-lg shadow-primary/30">
              <svg width="28" height="28" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 44 C 24 32, 36 28, 50 28 L 78 28 C 88 28, 94 22, 100 14" stroke="currentColor" strokeWidth="11" strokeLinecap="round" fill="none"/>
                <path d="M60 30 L 60 104" stroke="currentColor" strokeWidth="11" strokeLinecap="round" fill="none"/>
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
