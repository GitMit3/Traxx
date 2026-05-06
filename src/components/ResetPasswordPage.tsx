import { useState, useEffect } from 'react'
import { Button, Input, Card, CardContent, CardHeader, CardTitle } from '@blinkdotnew/ui'
import { Briefcase, Lock, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface ResetPasswordPageProps {}

export function ResetPasswordPage({}: ResetPasswordPageProps) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  // Ensure the recovery session from the URL hash is fully initialized
  // before the user can submit the new password.
  useEffect(() => {
    supabase.auth.getSession()
  }, [])

  const goToLogin = () => {
    window.location.replace('/')
  }

  const handlePostReset = async () => {
    await supabase.auth.signOut()
    window.location.replace('/')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!password || !confirm) {
      setError('Please fill in both fields.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      setSuccess(true)
    } catch (err: any) {
      const msg = err?.message || ''
      if (msg.toLowerCase().includes('expired') || msg.toLowerCase().includes('invalid')) {
        setError('This reset link has expired or is invalid. Please request a new one.')
      } else {
        setError(msg || 'Something went wrong. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="flex items-center justify-center gap-3">
          <div className="p-2 bg-primary rounded-xl text-primary-foreground">
            <Briefcase size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">JobTrack Simple</h1>
            <p className="text-sm text-muted-foreground">Set a new password for your account.</p>
          </div>
        </div>

        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-center relative">
              {!success && (
                <button
                  onClick={goToLogin}
                  className="absolute left-0 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Back to sign in"
                >
                  <ArrowLeft size={20} />
                </button>
              )}
              {success ? 'Password Updated' : 'Set New Password'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {success ? (
              <div className="space-y-6 text-center py-4">
                <div className="flex justify-center">
                  <div className="p-4 bg-emerald-50 rounded-full">
                    <CheckCircle2 size={36} className="text-emerald-600" />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="font-semibold text-base">Password reset successful!</p>
                  <p className="text-sm text-muted-foreground">
                    You can now sign in with your new password.
                  </p>
                </div>
                <Button className="w-full" onClick={handlePostReset}>
                  Go to Sign In
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <p className="text-sm text-muted-foreground pb-1">
                  Enter your new password below. It must be at least 8 characters.
                </p>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="password"
                      placeholder="At least 8 characters"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="pl-9"
                      required
                      autoComplete="new-password"
                      autoFocus
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={confirm}
                      onChange={e => setConfirm(e.target.value)}
                      className="pl-9"
                      required
                      autoComplete="new-password"
                    />
                  </div>
                </div>

                {error && (
                  <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
                    <AlertCircle size={14} className="mt-0.5 shrink-0" />
                    <div className="space-y-1">
                      <span>{error}</span>
                      {error.includes('expired') && (
                        <button
                          type="button"
                          onClick={goToLogin}
                          className="block text-xs text-primary hover:underline font-medium"
                        >
                          Request a new reset link →
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Resetting...' : 'Reset Password'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
