import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent, Button, Input, PageDescription, toast, Select, SelectTrigger, SelectContent, SelectItem, SelectValue, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@blinkdotnew/ui'
import { Download, Upload, LogOut, UserCircle, KeyRound, Globe, Palette, Trash2, AlertTriangle, Loader2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Job } from '../../types/job'
import { useLanguage } from '../../lib/LanguageContext'
import { Language } from '../../lib/i18n'
import { useTheme, ThemeOption, ColorMode } from '../../lib/ThemeContext'

interface SettingsTabProps {
  user: any
  jobTypes: string[]
  jobs: Job[]
  onRefresh: () => void
  onLogout: () => void
  lang: Language
  onLangChange: (lang: Language) => void
}

const THEME_SWATCHES: { key: ThemeOption; color: string; labelKey: string; description: string }[] = [
  { key: 'forest',   color: 'bg-[hsl(155,60%,22%)]',  labelKey: 'themeDefault',  description: 'Calm & earthy' },
  { key: 'ocean',    color: 'bg-[hsl(213,78%,32%)]',  labelKey: 'themeBlue',     description: 'Cool & professional' },
  { key: 'purple',   color: 'bg-[hsl(268,55%,40%)]',  labelKey: 'themePurple',   description: 'Creative & bold' },
  { key: 'slate',    color: 'bg-[hsl(215,28%,22%)]',  labelKey: 'themeSlate',    description: 'Neutral & corporate' },
  { key: 'sand',     color: 'bg-[hsl(28,55%,35%)]',   labelKey: 'themeSand',     description: 'Warm & natural' },
  { key: 'midnight', color: 'bg-[hsl(221,83%,38%)]',  labelKey: 'themeMidnight', description: 'Deep & professional' },
  { key: 'rose',     color: 'bg-[hsl(330,65%,40%)]',  labelKey: 'themeRose',     description: 'Warm & elegant' },
  { key: 'nordic',   color: 'bg-[hsl(215,14%,28%)]',  labelKey: 'themeNordic',   description: 'Cool & minimal' },
]

const COLOR_MODES: { key: ColorMode; labelKey: string }[] = [
  { key: 'light',  labelKey: 'colorModeLight' },
  { key: 'dark',   labelKey: 'colorModeDark' },
  { key: 'system', labelKey: 'colorModeSystem' },
]

export function SettingsTab({ user, jobTypes, jobs, onRefresh, onLogout, lang, onLangChange }: SettingsTabProps) {
  const { t } = useLanguage()
  const { theme, setTheme, colorMode, setColorMode } = useTheme()

  const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' })
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!passwordData.current || !passwordData.new || !passwordData.confirm) {
      toast.error(t('fillAllPasswordFields')); return
    }
    if (passwordData.new !== passwordData.confirm) {
      toast.error(t('newPasswordsDoNotMatch')); return
    }
    if (passwordData.new.length < 8) {
      toast.error(t('newPasswordMin8')); return
    }
    setPasswordLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: passwordData.new })
      if (error) throw error
      toast.success(t('passwordChangedSuccess'))
      setPasswordData({ current: '', new: '', confirm: '' })
    } catch (err: any) {
      toast.error(err?.message || t('failedToChangePassword'))
    } finally {
      setPasswordLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    setDeleteLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-account`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error ?? `Server error ${res.status}`)
      }

      await supabase.auth.signOut()
      setShowDeleteConfirm(false)
      onLogout()
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete account')
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleExport = () => {
    const data = { jobs, jobTypes, exportedAt: new Date().toISOString(), version: '4.0' }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `jobtrack-data-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success(t('exportedSuccessfully'))
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string)
        if (!data.jobs || !Array.isArray(data.jobs)) throw new Error('Invalid format')
        toast.loading(t('importingData'))
        if (data.jobTypes && Array.isArray(data.jobTypes)) {
          const newTypes = data.jobTypes.filter((tp: string) => !jobTypes.includes(tp))
          if (newTypes.length > 0) {
            await supabase.from('job_types').insert(
              newTypes.map((tp: string) => ({ user_id: user.id, name: tp }))
            )
          }
        }
        const toInsert = data.jobs.map((j: any) => ({
          user_id: user.id,
          company: j.company || '',
          role: j.role || '',
          status: j.status || 'Applied',
          job_type: j.jobType || '',
          date_applied: j.dateApplied || new Date().toISOString().split('T')[0],
          next_step: j.nextStep || '',
          match_score: j.matchScore || 0,
          priority: j.priority || 'Medium',
          cover_letter_status: j.coverLetterStatus || 'Not started',
          follow_up_date: j.followUpDate || '',
          interview_notes: j.interviewNotes || '',
          notes: j.notes || '',
          job_url: j.jobUrl || '',
        }))
        await supabase.from('jobs').insert(toInsert)
        onRefresh()
        toast.dismiss()
        toast.success(t('importedSuccessfully', { count: toInsert.length }))
      } catch {
        toast.dismiss()
        toast.error(t('failedToImport'))
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-500 pb-12">

      {/* Theme */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Palette size={18} className="text-primary" />
            {t('themeSettings')}
          </CardTitle>
          <PageDescription>{t('themeSettingsDesc')}</PageDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {THEME_SWATCHES.map(({ key, color, labelKey, description }) => (
              <button
                key={key}
                onClick={() => setTheme(key)}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200 focus:outline-none group ${
                  theme === key
                    ? 'border-primary bg-primary/5 shadow-md shadow-primary/10'
                    : 'border-border hover:border-primary/30 hover:bg-muted/40'
                }`}
                aria-label={t(labelKey as any)}
              >
                <span className={`w-10 h-10 rounded-full ${color} shadow-sm transition-all duration-200 ${theme === key ? 'scale-110 ring-2 ring-offset-2 ring-primary' : 'group-hover:scale-105'}`} />
                <div className="text-center">
                  <p className={`text-[12px] font-semibold leading-tight ${theme === key ? 'text-primary' : 'text-foreground'}`}>{t(labelKey as any)}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{description}</p>
                </div>
                {theme === key && (
                  <span className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                    <svg viewBox="0 0 12 12" fill="none" className="w-2.5 h-2.5">
                      <path d="M2 6l2.5 2.5L10 3.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t('colorMode')}</p>
            <div className="flex flex-wrap gap-2">
              {COLOR_MODES.map(({ key, labelKey }) => (
                <Button
                  key={key}
                  size="sm"
                  variant={colorMode === key ? 'default' : 'outline'}
                  onClick={() => setColorMode(key)}
                  className={`min-w-[72px] ${colorMode === key ? 'bg-primary text-primary-foreground' : ''}`}
                >
                  {t(labelKey as any)}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Change Password */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <KeyRound size={18} className="text-primary" />
              {t('changePassword')}
            </CardTitle>
            <PageDescription>{t('changePasswordDesc')}</PageDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">{t('currentPassword')}</label>
                <Input type="password" placeholder="••••••••" value={passwordData.current} onChange={e => setPasswordData({ ...passwordData, current: e.target.value })} required />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">{t('newPassword')}</label>
                  <Input type="password" placeholder={t('minChars')} value={passwordData.new} onChange={e => setPasswordData({ ...passwordData, new: e.target.value })} required />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">{t('confirmNewPassword')}</label>
                  <Input type="password" placeholder="••••••••" value={passwordData.confirm} onChange={e => setPasswordData({ ...passwordData, confirm: e.target.value })} required />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={passwordLoading}>
                {passwordLoading ? t('updating') : t('changePasswordBtn')}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Language */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Globe size={18} className="text-primary" />
              {t('language')}
            </CardTitle>
            <PageDescription>{t('languageDesc')}</PageDescription>
          </CardHeader>
          <CardContent>
            <Select value={lang} onValueChange={(val: Language) => onLangChange(val)}>
              <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="en">{t('languageEnglish')}</SelectItem>
                <SelectItem value="sv">{t('languageSwedish')}</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Data Backup */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Download size={18} className="text-blue-600" />
              {t('dataBackup')}
            </CardTitle>
            <PageDescription>{t('dataBackupDesc')}</PageDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-3">
            <Button variant="outline" className="flex-1 gap-2 h-12" onClick={handleExport}>
              <Download size={16} />{t('exportJson')}
            </Button>
            <label className="flex-1">
              <Button variant="outline" className="w-full gap-2 h-12" asChild>
                <span><Upload size={16} />{t('importJson')}</span>
              </Button>
              <input type="file" accept=".json" className="hidden" onChange={handleImport} />
            </label>
          </CardContent>
        </Card>

        {/* Account */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <UserCircle size={18} className="text-primary" />
              {t('account')}
            </CardTitle>
            <PageDescription>{t('loggedInAs')}: {user.email}</PageDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="destructive" onClick={onLogout} className="gap-2 w-full">
              <LogOut size={16} />
              {t('signOut')}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(true)}
              className="gap-2 w-full border-destructive/40 text-destructive hover:bg-destructive/5 hover:border-destructive"
            >
              <Trash2 size={16} />
              Delete Account
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Delete Account Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={open => { if (!deleteLoading) setShowDeleteConfirm(open) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle size={20} />
              Delete Account
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <p className="text-sm text-foreground font-medium">
              This will permanently delete your account and all associated data:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 list-none">
              {['All job applications', 'Job types & categories', 'Profile information', 'CV files & cover letters', 'Uploaded documents'].map(item => (
                <li key={item} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-destructive/60 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="rounded-lg bg-destructive/8 border border-destructive/20 px-3 py-2.5">
              <p className="text-xs font-semibold text-destructive">
                This action cannot be undone. Your email can be used to create a new account.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={deleteLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={deleteLoading}
              className="gap-2 min-w-[140px]"
            >
              {deleteLoading
                ? <><Loader2 size={14} className="animate-spin" /> Deleting…</>
                : <><Trash2 size={14} /> Delete Account</>
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}
