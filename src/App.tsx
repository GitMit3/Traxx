import { useState, useEffect, useMemo } from 'react'
import { 
  Button, 
  Tabs, 
  TabsContent, 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Input,
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
  Textarea,
  toast
} from '@blinkdotnew/ui'
import { Briefcase, Plus, LayoutDashboard, Settings, LogOut, Search, FolderOpen, MoreHorizontal, X, Bell, UserCircle } from 'lucide-react'
import { supabase } from './lib/supabase'
import { AuthScreen } from './components/AuthScreen'
import { LandingPage } from './components/LandingPage'
import { ResetPasswordPage } from './components/ResetPasswordPage'
import { AlertBanner } from './components/AlertBanner'
import { useAppData } from './hooks/useAppData'
import { useUserProfile } from './hooks/useUserProfile'
import { DashboardTab } from './features/dashboard/DashboardTab'
import { ApplicationsTab } from './features/applications/ApplicationsTab'
import { AddJobTab } from './features/applications/AddJobTab'
import { SettingsTab } from './features/settings/SettingsTab'
import { ProfileTab } from './features/profile/ProfileTab'
import { JobSearchTab } from './features/jobsearch/JobSearchTab'
import { DocumentsTab } from './features/documents/DocumentsTab'
import { Job, JobStatus, JobPriority } from './types/job'
import { useLanguage } from './lib/LanguageContext'
import { getFollowUpStatus, formatDate } from './lib/utils/date'
import { getStatusLabel } from './lib/utils'

// ─── Mobile Bottom Navigation ────────────────────────────────────────────────

interface MobileNavProps {
  activeTab: string
  onTabChange: (tab: string) => void
  t: (key: any) => string
}

function MobileNav({ activeTab, onTabChange, t }: MobileNavProps) {
  const [moreOpen, setMoreOpen] = useState(false)

  const primaryTabs = [
    { value: 'dashboard',    icon: <LayoutDashboard size={20} />, label: t('tabDashboard') },
    { value: 'applications', icon: <Briefcase size={20} />,       label: t('tabApplications') },
    { value: 'add',          icon: <Plus size={20} />,            label: t('tabAddJob') },
    { value: 'profile',      icon: <UserCircle size={20} />,      label: t('tabProfile') },
    { value: 'settings',     icon: <Settings size={20} />,        label: t('tabSettings') },
  ]

  const moreTabs = [
    { value: 'documents', icon: <FolderOpen size={20} />, label: t('tabDocuments') },
    { value: 'jobsearch', icon: <Search size={20} />,     label: t('tabJobSearch') },
  ]

  const isMoreActive = moreTabs.some(tab => tab.value === activeTab)

  const handleMoreTab = (value: string) => {
    onTabChange(value)
    setMoreOpen(false)
  }

  return (
    <>
      {/* More overlay backdrop */}
      {moreOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 md:hidden"
          onClick={() => setMoreOpen(false)}
        />
      )}

      {/* More drawer panel */}
      {moreOpen && (
        <div className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom))] left-4 right-4 z-50 md:hidden bg-background border border-border rounded-2xl shadow-2xl shadow-black/20 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('mobileNavMore')}</span>
            <button
              onClick={() => setMoreOpen(false)}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>
          <div className="p-2 grid grid-cols-2 gap-1.5">
            {moreTabs.map(tab => {
              const isActive = activeTab === tab.value
              return (
                <button
                  key={tab.value}
                  onClick={() => handleMoreTab(tab.value)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-foreground hover:bg-muted'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Bottom nav bar */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border/60 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex items-stretch">
          {primaryTabs.map(tab => {
            const isActive = activeTab === tab.value
            return (
              <button
                key={tab.value}
                onClick={() => onTabChange(tab.value)}
                className={`relative flex-1 flex flex-col items-center justify-center gap-0.5 min-h-[3.75rem] py-2 px-1 transition-all duration-150 ${
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground active:text-foreground'
                }`}
                aria-label={tab.label}
              >
                <span className={`transition-transform duration-150 ${isActive ? 'scale-110' : ''}`}>
                  {tab.icon}
                </span>
                <span className={`text-[10px] font-medium leading-none truncate max-w-full px-0.5 ${
                  isActive ? 'text-primary' : ''
                }`}>
                  {tab.label.split(' ')[0]}
                </span>
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-primary" />
                )}
              </button>
            )
          })}

          {/* More button */}
          <button
            onClick={() => setMoreOpen(prev => !prev)}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 min-h-[3.75rem] py-2 px-1 transition-all duration-150 ${
              isMoreActive || moreOpen
                ? 'text-primary'
                : 'text-muted-foreground active:text-foreground'
            }`}
            aria-label={t('mobileNavMore')}
          >
            <MoreHorizontal size={20} />
            <span className="text-[10px] font-medium leading-none">{t('mobileNavMore')}</span>
          </button>
        </div>
      </nav>
    </>
  )
}

// ─── Main App ─────────────────────────────────────────────────────────────────

function App() {
  const [user, setUser] = useState<any>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [authView, setAuthView] = useState<'landing' | 'login' | 'signup'>('landing')
  const [activeTab, setActiveTab] = useState('dashboard')
  const [editingJob, setEditingJob] = useState<Job | null>(null)
  const [applicationsFilter, setApplicationsFilter] = useState<JobStatus | 'All'>('All')
  const [notifOpen, setNotifOpen] = useState(false)
  const { t, lang, setLang } = useLanguage()

  const isPasswordReset = useMemo(() => {
    return (
      window.location.pathname === '/reset-password' ||
      window.location.hash.includes('type=recovery')
    )
  }, [])

  useEffect(() => {
    if (!notifOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Element
      if (!target.closest('[data-notif-panel]') && !target.closest('[data-notif-trigger]')) {
        setNotifOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [notifOpen])

  useEffect(() => {
    if (isPasswordReset) return

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setAuthLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setAuthLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [isPasswordReset])

  const { jobs, setJobs, jobTypes, dataLoading, refreshJobs, loadData } = useAppData(isPasswordReset ? null : user)
  const { profile, loadProfile } = useUserProfile(user?.id)

  if (isPasswordReset) {
    return <ResetPasswordPage />
  }

  const handleUpdateJob = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingJob) return
    try {
      const { error } = await supabase
        .from('jobs')
        .update({
          company: editingJob.company,
          role: editingJob.role,
          status: editingJob.status,
          job_type: editingJob.jobType,
          date_applied: editingJob.dateApplied,
          next_step: editingJob.nextStep,
          match_score: editingJob.matchScore,
          priority: editingJob.priority || 'Medium',
          cover_letter_status: editingJob.coverLetterStatus,
          follow_up_date: editingJob.followUpDate,
          interview_notes: editingJob.interviewNotes,
          notes: editingJob.notes,
          job_url: editingJob.jobUrl || '',
        })
        .eq('id', editingJob.id)
      if (error) throw error
      setJobs(prev => prev.map(j => j.id === editingJob.id ? editingJob : j))
      setEditingJob(null)
      setActiveTab('applications')
      toast.success(t('applicationUpdated'))
    } catch {
      toast.error(t('failedToUpdate'))
    }
  }

  const handleDeleteJob = async (id: string) => {
    try {
      const { error } = await supabase.from('jobs').delete().eq('id', id)
      if (error) throw error
      setJobs(prev => prev.filter(j => j.id !== id))
      toast.success(t('applicationDeleted'))
    } catch {
      toast.error(t('failedToDelete'))
    }
  }

  const handleMarkApplied = async (id: string) => {
    const today = new Date().toISOString().split('T')[0]
    try {
      const { error } = await supabase
        .from('jobs')
        .update({ status: 'Applied', date_applied: today })
        .eq('id', id)
      if (error) throw error
      setJobs(prev => prev.map(j => j.id === id ? { ...j, status: 'Applied', dateApplied: today } : j))
      toast.success(t('markedAsApplied'))
    } catch {
      toast.error(t('failedToUpdate'))
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setAuthView('landing')
    toast.success(t('signedOut'))
  }

  const handleNavigateToApplications = (filter: JobStatus | 'All' = 'All') => {
    setApplicationsFilter(filter)
    setActiveTab('applications')
  }

  const handleNavigateToFollowUps = () => {
    setActiveTab('applications')
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!user) {
    if (authView === 'landing') {
      return (
        <LandingPage
          onLogin={() => setAuthView('login')}
          onSignup={() => setAuthView('signup')}
        />
      )
    }
    return (
      <AuthScreen
        initialMode={authView === 'signup' ? 'signup' : 'login'}
        onBack={() => setAuthView('landing')}
      />
    )
  }

  const dueJobs = jobs.filter(j => {
    const status = getFollowUpStatus(j.followUpDate)
    return status === 'today' || status === 'overdue'
  })

  const sidebarItems = [
    { value: 'dashboard',    icon: <LayoutDashboard size={17} />, label: t('tabDashboard') },
    { value: 'applications', icon: <Briefcase size={17} />,       label: t('tabApplications') },
    { value: 'add',          icon: <Plus size={17} />,            label: t('tabAddJob') },
    { value: 'jobsearch',    icon: <Search size={17} />,          label: t('tabJobSearch') },
    { value: 'documents',    icon: <FolderOpen size={17} />,      label: t('tabDocuments') },
    { value: 'profile',      icon: <UserCircle size={17} />,      label: t('tabProfile') },
    { value: 'settings',     icon: <Settings size={17} />,        label: t('tabSettings') },
  ]

  return (
    <div className="min-h-screen bg-background flex">

      {/* ── Desktop Sidebar ─────────────────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 h-full w-56 border-r border-border/40 bg-background z-40">
        {/* Logo + tagline */}
        <button
          className="flex items-center gap-2.5 px-5 py-5 group focus:outline-none shrink-0"
          onClick={() => setActiveTab('dashboard')}
          aria-label="Go to Dashboard"
        >
          <div className="p-2 bg-primary rounded-xl text-primary-foreground shadow-md shadow-primary/25 group-hover:scale-105 transition-transform duration-150 shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 16 L10 16 L14 9 L20 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="4" cy="16" r="2" fill="currentColor"/>
              <circle cx="14" cy="9" r="2" fill="currentColor"/>
              <circle cx="20" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.75" fill="none" opacity="0.65"/>
            </svg>
          </div>
          <div className="text-left">
            <p className="text-sm font-bold leading-tight tracking-tight text-foreground group-hover:text-primary transition-colors">{t('appName')}</p>
            <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{t('appTagline')}</p>
          </div>
        </button>

        <div className="w-full h-px bg-border/40 shrink-0" />

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {sidebarItems.map(item => {
            const isActive = activeTab === item.value
            return (
              <button
                key={item.value}
                onClick={() => setActiveTab(item.value)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/70'
                }`}
              >
                <span className="shrink-0">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>

        {/* Notification bell */}
        <div className="px-3 pb-2 shrink-0 relative">
          <button
            data-notif-trigger
            onClick={() => setNotifOpen(prev => !prev)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/70 relative transition-all duration-150"
            aria-label={t('notifications')}
          >
            <span className="shrink-0"><Bell size={17} /></span>
            <span>{t('notifications')}</span>
            {dueJobs.length > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">
                {dueJobs.length > 99 ? '99+' : dueJobs.length}
              </span>
            )}
          </button>

          {/* Dropdown panel */}
          {notifOpen && (
            <div
              data-notif-panel
              className="fixed bottom-[calc(theme(spacing.16)+env(safe-area-inset-bottom))] left-2 w-52 z-50 bg-background border border-border rounded-xl shadow-xl shadow-black/10 overflow-hidden"
            >
              <div className="flex items-center justify-between px-3 py-2.5 border-b border-border/50">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{t('followUpsDueHeader')}</span>
                {dueJobs.length > 0 && (
                  <span className="min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold">
                    {dueJobs.length}
                  </span>
                )}
              </div>

              {dueJobs.length === 0 ? (
                <div className="px-3 py-4 text-center">
                  <p className="text-xs text-muted-foreground">{t('noFollowUpsDue')}</p>
                </div>
              ) : (
                <>
                  <ul className="max-h-[220px] overflow-y-auto divide-y divide-border/40">
                    {dueJobs.slice(0, 5).map(job => {
                      const status = getFollowUpStatus(job.followUpDate)
                      return (
                        <li key={job.id} className="px-3 py-2.5 hover:bg-muted/50 transition-colors">
                          <p className="text-xs font-semibold text-foreground truncate">{job.company}</p>
                          <p className="text-[11px] text-muted-foreground truncate">{job.role}</p>
                          <span className={`inline-flex items-center mt-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                            status === 'overdue'
                              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                          }`}>
                            {status === 'overdue' ? t('overdueSection') : t('todayLabel')} · {formatDate(job.followUpDate)}
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                  <div className="px-3 py-2 border-t border-border/50">
                    <button
                      onClick={() => { setActiveTab('applications'); setNotifOpen(false) }}
                      className="w-full text-center text-xs font-medium text-primary hover:underline py-0.5"
                    >
                      {t('viewAll')}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div className="w-full h-px bg-border/40 shrink-0" />

        {/* User + sign out */}
        <div className="px-4 py-4 shrink-0 space-y-2">
          <p className="text-[11px] text-muted-foreground truncate" title={user.email}>{user.email}</p>
          <Button variant="outline" size="sm" onClick={handleLogout} className="w-full h-8 gap-1.5 border-border/50 text-xs justify-start">
            <LogOut size={13} />
            {t('signOut')}
          </Button>
        </div>
      </aside>

      {/* ── Main content area ───────────────────────────────────────────────── */}
      <div className="flex-1 md:ml-56 min-w-0">

        {/* Mobile-only top header */}
        <header className="md:hidden sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border/40 shadow-sm px-4 h-14 flex items-center justify-between">
          <button
            className="flex items-center gap-2 group focus:outline-none"
            onClick={() => setActiveTab('dashboard')}
          >
            <div className="p-1.5 bg-primary rounded-lg text-primary-foreground">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 16 L10 16 L14 9 L20 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="4" cy="16" r="2" fill="currentColor"/>
                <circle cx="14" cy="9" r="2" fill="currentColor"/>
                <circle cx="20" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.75" fill="none" opacity="0.65"/>
              </svg>
            </div>
            <span className="font-bold text-sm tracking-tight">{t('appName')}</span>
          </button>
          <Button variant="outline" size="sm" onClick={handleLogout} className="h-8 gap-1.5 border-border/50 text-xs">
            <LogOut size={13} />
            <span className="sr-only">{t('signOut')}</span>
          </Button>
        </header>

        <AlertBanner jobs={jobs} onViewFollowUps={() => setActiveTab('applications')} />

        {/* Page content */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-10">
          {dataLoading ? (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
              <p className="text-sm text-muted-foreground animate-pulse">{t('syncingData')}</p>
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsContent value="dashboard" className="outline-none">
                {jobs.length === 0 && !dataLoading && (
                  <div className="mb-6 rounded-2xl border border-primary/20 bg-primary/5 p-6 space-y-4 animate-in fade-in duration-500">
                    <div className="space-y-1">
                      <h2 className="text-xl font-bold text-foreground">
                        {lang === 'sv' ? '👋 Välkommen till Trackson!' : '👋 Welcome to Trackson!'}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        {lang === 'sv'
                          ? 'Kom igång med tre enkla steg:'
                          : 'Get started with three simple steps:'}
                      </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <button
                        onClick={() => setActiveTab('add')}
                        className="flex flex-col items-start gap-2 p-4 rounded-xl border border-border/60 bg-background hover:border-primary/40 hover:bg-primary/5 transition-all text-left group"
                      >
                        <span className="text-2xl">📝</span>
                        <div>
                          <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                            {lang === 'sv' ? 'Lägg till din första ansökan' : 'Add your first application'}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {lang === 'sv' ? 'Spara ett jobb du sökt' : 'Save a job you applied for'}
                          </p>
                        </div>
                      </button>
                      <button
                        onClick={() => setActiveTab('profile')}
                        className="flex flex-col items-start gap-2 p-4 rounded-xl border border-border/60 bg-background hover:border-primary/40 hover:bg-primary/5 transition-all text-left group"
                      >
                        <span className="text-2xl">👤</span>
                        <div>
                          <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                            {lang === 'sv' ? 'Fyll i din profil' : 'Fill in your profile'}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {lang === 'sv' ? 'Få automatiska matchningspoäng' : 'Get automatic match scores'}
                          </p>
                        </div>
                      </button>
                      <button
                        onClick={() => setActiveTab('jobsearch')}
                        className="flex flex-col items-start gap-2 p-4 rounded-xl border border-border/60 bg-background hover:border-primary/40 hover:bg-primary/5 transition-all text-left group"
                      >
                        <span className="text-2xl">🔍</span>
                        <div>
                          <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                            {lang === 'sv' ? 'Sök jobb via Jobbsök' : 'Search jobs via Jobbsök'}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {lang === 'sv' ? 'Hitta nya möjligheter direkt' : 'Find new opportunities directly'}
                          </p>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
                <DashboardTab
                  jobs={jobs}
                  jobTypes={jobTypes}
                  onNavigateToApplications={handleNavigateToApplications}
                  onNavigateToFollowUps={handleNavigateToFollowUps}
                  userProfile={profile}
                  user={user}
                  onJobSaved={refreshJobs}
                />
              </TabsContent>

              <TabsContent value="applications" className="outline-none">
                <ApplicationsTab
                  jobs={jobs}
                  jobTypes={jobTypes}
                  onEdit={setEditingJob}
                  onDelete={handleDeleteJob}
                  onMarkApplied={handleMarkApplied}
                  initialFilterStatus={applicationsFilter}
                  onFilterConsumed={() => setApplicationsFilter('All')}
                />
              </TabsContent>

              <TabsContent value="add" className="outline-none">
                <AddJobTab user={user} jobTypes={jobTypes} onRefresh={refreshJobs} />
              </TabsContent>

              <TabsContent value="jobsearch" className="outline-none">
                <JobSearchTab
                  user={user}
                  onJobSaved={refreshJobs}
                  userProfile={profile}
                />
              </TabsContent>

              <TabsContent value="documents" className="outline-none">
                <DocumentsTab user={user} />
              </TabsContent>

              <TabsContent value="profile" className="outline-none">
                <ProfileTab
                  user={user}
                  profile={profile}
                  onProfileSaved={() => loadProfile(user.id)}
                />
              </TabsContent>

              <TabsContent value="settings" className="outline-none">
                <SettingsTab
                  user={user}
                  jobTypes={jobTypes}
                  jobs={jobs}
                  onRefresh={() => loadData(user.id)}
                  onLogout={handleLogout}
                  lang={lang}
                  onLangChange={setLang}
                />
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>

      {/* Mobile bottom navigation — only visible below md */}
      <MobileNav activeTab={activeTab} onTabChange={setActiveTab} t={t} />

      {/* EDIT JOB DIALOG */}
      <Dialog open={!!editingJob} onOpenChange={(open) => !open && setEditingJob(null)}>
        <DialogContent className="w-full mx-0 sm:mx-auto rounded-none sm:rounded-2xl max-w-full sm:max-w-[700px] max-h-[100dvh] sm:max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">{t('editApplication')}</DialogTitle>
          </DialogHeader>
          {editingJob && (
            <form onSubmit={handleUpdateJob} className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 py-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{t('company')}</label>
                <Input value={editingJob.company} onChange={e => setEditingJob({ ...editingJob, company: e.target.value })} className="h-10" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{t('role')}</label>
                <Input value={editingJob.role} onChange={e => setEditingJob({ ...editingJob, role: e.target.value })} className="h-10" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{t('jobType')}</label>
                <Select
                  value={editingJob.jobType || '__none__'}
                  onValueChange={(val: any) => setEditingJob({ ...editingJob, jobType: val === '__none__' ? '' : val })}
                >
                  <SelectTrigger className="h-10"><SelectValue placeholder={t('noneSelected')} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">{t('noneSelected')}</SelectItem>
                    {jobTypes.filter(tp => tp).map(tp => <SelectItem key={tp} value={tp}>{tp}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{t('status')}</label>
                <Select value={editingJob.status} onValueChange={(val: any) => setEditingJob({ ...editingJob, status: val, priority: val === 'Rejected' ? 'Low' : editingJob.priority })}>
                  <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(['Saved', 'Applied', 'Interviewing', 'Rejected', 'Offer'] as JobStatus[]).map(s => (
                      <SelectItem key={s} value={s}>{getStatusLabel(s, lang)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{t('dateApplied')}</label>
                <Input type="date" value={editingJob.dateApplied} onChange={e => setEditingJob({ ...editingJob, dateApplied: e.target.value })} className="h-10" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{t('followUpDate')}</label>
                <Input type="date" value={editingJob.followUpDate} onChange={e => setEditingJob({ ...editingJob, followUpDate: e.target.value })} className="h-10" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{t('nextStep')}</label>
                <Input value={editingJob.nextStep} onChange={e => setEditingJob({ ...editingJob, nextStep: e.target.value })} className="h-10" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{t('priority')}</label>
                <div className="flex gap-1.5">
                  {(['High', 'Medium', 'Low'] as JobPriority[]).map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setEditingJob({ ...editingJob, priority: p })}
                      className={`flex-1 h-10 rounded-lg border text-xs font-semibold transition-all ${
                        (editingJob.priority || 'Medium') === p
                          ? p === 'High' ? 'bg-rose-500 border-rose-500 text-white' : p === 'Medium' ? 'bg-amber-500 border-amber-500 text-white' : 'bg-sky-500 border-sky-500 text-white'
                          : 'bg-background border-border/60 text-muted-foreground hover:border-primary/40'
                      }`}
                    >
                      {t(`priority${p}` as any)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{t('jobUrlLabel')}</label>
                <Input value={editingJob.jobUrl || ''} onChange={e => setEditingJob({ ...editingJob, jobUrl: e.target.value })} className="h-10" placeholder="https://..." type="url" />
              </div>
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{t('interviewNotes')}</label>
                <Textarea value={editingJob.interviewNotes} onChange={e => setEditingJob({ ...editingJob, interviewNotes: e.target.value })} placeholder={t('interviewNotesPlaceholder')} className="min-h-[100px] resize-none border-border/50" />
              </div>
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{t('generalNotes')}</label>
                <Textarea value={editingJob.notes} onChange={e => setEditingJob({ ...editingJob, notes: e.target.value })} className="min-h-[80px] resize-none border-border/50" />
              </div>
              <DialogFooter className="md:col-span-2 flex items-center gap-3 pt-4 border-t border-border/30">
                <Button type="button" variant="ghost" onClick={() => setEditingJob(null)} className="h-10 px-6">{t('cancel')}</Button>
                <Button type="submit" className="h-10 px-8 shadow-md shadow-primary/10">{t('saveChanges')}</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default App
