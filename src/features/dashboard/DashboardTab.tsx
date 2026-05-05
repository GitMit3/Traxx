import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent, Badge, EmptyState, Button, toast, Dialog, DialogContent, DialogHeader, DialogTitle, Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@blinkdotnew/ui'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Briefcase, Clock, CalendarDays, Zap, ArrowRight, Sparkles, MapPin, Building2, BookmarkPlus, Check, FileText, Copy, Download } from 'lucide-react'
import { Job, JobStatus, JobPriority } from '../../types/job'
import { getFollowUpStatus } from '../../lib/utils/date'
import { useLanguage } from '../../lib/LanguageContext'
import { calculateMatchScore, PlatsbankenJob, UserProfile } from '../../lib/matchScore'
import { blink } from '../../blink/client'

interface DashboardTabProps {
  jobs: Job[]
  jobTypes: string[]
  onNavigateToApplications: (filter?: JobStatus | 'All') => void
  onNavigateToFollowUps: () => void
  userProfile?: UserProfile | null
  user?: any
  onJobSaved?: () => void
}

export function DashboardTab({ jobs, jobTypes, onNavigateToApplications, onNavigateToFollowUps, userProfile, user, onJobSaved }: DashboardTabProps) {
  const { t, lang } = useLanguage()

  // ── Activity report state ─────────────────────────────────────────────────
  const [reportOpen, setReportOpen] = useState(false)
  const _now = new Date()
  const [selectedMonth, setSelectedMonth] = useState(String(_now.getMonth()))
  const [selectedYear, setSelectedYear] = useState(String(_now.getFullYear()))

  const SV_MONTHS_FULL = ['Januari','Februari','Mars','April','Maj','Juni','Juli','Augusti','September','Oktober','November','December']
  const SV_MONTHS_LOWER = ['januari','februari','mars','april','maj','juni','juli','augusti','september','oktober','november','december']

  const reportJobs = jobs.filter(j => {
    if (!j.dateApplied) return false
    const d = new Date(j.dateApplied)
    return d.getMonth() === Number(selectedMonth) && d.getFullYear() === Number(selectedYear)
  }).sort((a, b) => a.dateApplied.localeCompare(b.dateApplied))

  const reportMonthLabel = `${SV_MONTHS_LOWER[Number(selectedMonth)]?.toUpperCase()} ${selectedYear}`

  const buildReportText = () => {
    const lines: string[] = [
      `AKTIVITETSRAPPORT \u2014 ${reportMonthLabel}`,
      `Namn: ${((userProfile as any)?.firstName || (userProfile as any)?.first_name) && ((userProfile as any)?.lastName || (userProfile as any)?.last_name) ? `${(userProfile as any)?.firstName || (userProfile as any)?.first_name} ${(userProfile as any)?.lastName || (userProfile as any)?.last_name}` : user?.email ?? ''}` ,
      '',
      'Jobbsökningsaktiviteter:',
    ]
    reportJobs.forEach((j, i) => {
      lines.push(`${i + 1}. ${j.dateApplied} \u2014 Ans\u00f6kan till ${j.role} p\u00e5 ${j.company} (${j.status})`)
    })
    lines.push('')
    lines.push(`Totalt antal ans\u00f6kningar: ${reportJobs.length}`)
    lines.push('')
    lines.push('Genererad av Trackson')
    return lines.join('\n')
  }

  const handleCopyReport = async () => {
    try {
      await navigator.clipboard.writeText(buildReportText())
      toast.success(lang === 'sv' ? 'Kopierat!' : 'Copied!')
    } catch {
      toast.error(lang === 'sv' ? 'Kunde inte kopiera' : 'Could not copy')
    }
  }

  const handlePrintReport = () => {
    const text = buildReportText()
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`<!DOCTYPE html><html><head><title>Aktivitetsrapport</title><style>body{font-family:monospace;padding:2rem;white-space:pre-wrap;font-size:14px;}@media print{body{padding:1rem;}}</style></head><body>${text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</body></html>`)
    win.document.close()
    win.focus()
    win.print()
  }

  // ── Suggested jobs state ──────────────────────────────────────────────────
  const [suggestedJobs, setSuggestedJobs] = useState<(PlatsbankenJob & { score: number })[]>([])
  const [suggestLoading, setSuggestLoading] = useState(false)
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [savingId, setSavingId] = useState<string | null>(null)

  // Fetch suggested jobs when profile is available
  useEffect(() => {
    const titles = userProfile?.preferredTitles?.split(/[,\n]+/).map(s => s.trim()).filter(Boolean) ?? []
    const locations = userProfile?.preferredLocations?.split(/[,\n]+/).map(s => s.trim()).filter(Boolean) ?? []
    if (titles.length === 0 && locations.length === 0) {
      setSuggestedJobs([])
      return
    }
    let cancelled = false
    const fetchSuggestions = async () => {
      setSuggestLoading(true)
      try {
        const q = [titles[0] ?? '', locations[0] ?? ''].filter(Boolean).join(' ')
        const url = `https://jobsearch.api.jobtechdev.se/search?q=${encodeURIComponent(q)}&limit=10&offset=0`
        const res = await fetch(url, { headers: { Accept: 'application/json' } })
        if (!res.ok) throw new Error('API error')
        const data = await res.json()
        const mapped: PlatsbankenJob[] = (data.hits || []).map((hit: any) => ({
          id: hit.id,
          title: hit.headline || '',
          employer: hit.employer?.name || '',
          location: hit.workplace_address?.municipality || hit.workplace_address?.region || '',
          publishedDate: hit.publication_date ? hit.publication_date.split('T')[0] : '',
          description: hit.description?.text || '',
          sourceUrl: hit.webpage_url || hit.application_details?.url || '',
          occupation: hit.occupation?.label || '',
        }))
        const scored = mapped
          .map(job => ({ ...job, score: userProfile ? calculateMatchScore(job, userProfile).score : 0 }))
          .sort((a, b) => b.score - a.score)
          .slice(0, 3)
        if (!cancelled) setSuggestedJobs(scored)
      } catch {
        // silently ignore — suggestions are best-effort
      } finally {
        if (!cancelled) setSuggestLoading(false)
      }
    }
    fetchSuggestions()
    return () => { cancelled = true }
  }, [userProfile?.preferredTitles, userProfile?.preferredLocations])

  const handleSaveSuggested = async (job: PlatsbankenJob & { score: number }) => {
    if (!user?.id) return
    setSavingId(job.id)
    try {
      const today = new Date().toISOString().split('T')[0]
      await blink.db.jobs.create({
        id: crypto.randomUUID(),
        userId: user.id,
        company: job.employer || job.title,
        role: job.title,
        status: 'Applied',
        jobType: job.occupation || '',
        dateApplied: today,
        nextStep: '',
        matchScore: job.score,
        priority: 'Medium',
        coverLetterStatus: 'Not started',
        followUpDate: '',
        interviewNotes: '',
        notes: job.sourceUrl ? `Source: ${job.sourceUrl}` : '',
        createdAt: Date.now(),
      })
      await blink.db.platsbankenJobs.create({
        id: crypto.randomUUID(),
        userId: user.id,
        externalId: job.id,
        title: job.title,
        employer: job.employer,
        location: job.location,
        publishedDate: job.publishedDate,
        description: job.description,
        sourceUrl: job.sourceUrl,
        jobType: job.occupation || '',
        rawJson: '',
        savedToApplications: 1,
        createdAt: Date.now(),
      })
      setSavedIds(prev => new Set(prev).add(job.id))
      onJobSaved?.()
      toast.success(t('jobSavedSuccess'))
    } catch {
      toast.error(t('jobSaveFailed'))
    } finally {
      setSavingId(null)
    }
  }

  const stats = {
    total: jobs.length,
    applied: jobs.filter(j => j.status === 'Applied').length,
    interviewing: jobs.filter(j => j.status === 'Interviewing').length,
    rejected: jobs.filter(j => j.status === 'Rejected').length,
    offers: jobs.filter(j => j.status === 'Offer').length,
    highPriority: jobs.filter(j => j.priority === 'High' && j.status !== 'Rejected' && j.status !== 'Offer').length,
    dueToday: jobs.filter(j => getFollowUpStatus(j.followUpDate) === 'today').length,
    overdue: jobs.filter(j => getFollowUpStatus(j.followUpDate) === 'overdue').length,
    thisWeek: jobs.filter(j => {
      const appliedDate = new Date(j.dateApplied)
      const oneWeekAgo = new Date()
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
      return appliedDate >= oneWeekAgo
    }).length,
    byType: jobTypes.reduce((acc, type) => {
      acc[type] = jobs.filter(j => j.jobType === type).length
      return acc
    }, {} as Record<string, number>)
  }

  const priorityOrder: Record<string, number> = { High: 0, Medium: 1, Low: 2 }
  const priorityJobs = [...jobs]
    .filter(j => j.status !== 'Rejected' && j.status !== 'Offer')
    .sort((a, b) => {
      const pa = priorityOrder[a.priority || 'Medium'] ?? 1
      const pb = priorityOrder[b.priority || 'Medium'] ?? 1
      if (pa !== pb) return pa - pb
      // Secondary sort: has follow-up date first
      if (!!a.followUpDate !== !!b.followUpDate) return a.followUpDate ? -1 : 1
      return b.createdAt - a.createdAt
    })
    .slice(0, 5)

  const weeklyData = Array.from({ length: 8 }, (_, i) => {
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - (7 * (7 - i)) - weekStart.getDay())
    weekStart.setHours(0, 0, 0, 0)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 7)
    const count = jobs.filter(j => {
      const d = new Date(j.dateApplied)
      return d >= weekStart && d < weekEnd
    }).length
    const months = ['jan','feb','mar','apr','maj','jun','jul','aug','sep','okt','nov','dec']
    const label = `${weekStart.getDate()} ${months[weekStart.getMonth()]}`
    return { week: label, count }
  })

  const clickableCardBase = "cursor-pointer transition-all duration-200 hover:shadow-lg hover:shadow-primary/8 hover:-translate-y-0.5 hover:border-primary/40 active:scale-[0.98] active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-1"

  const getScoreBadgeClass = (score: number) =>
    score >= 70
      ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400'
      : score >= 40
      ? 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400'
      : 'bg-secondary text-muted-foreground border-border'

  return (
    <div className="space-y-5 sm:space-y-8 animate-in fade-in duration-500">
      {/* Activity report export button */}
      <div className="flex justify-end">
        <Button variant="outline" size="sm" className="gap-2" onClick={() => setReportOpen(true)}>
          <FileText size={15} />
          {t('exportActivityReport')}
        </Button>
      </div>

      {/* Activity Report Dialog */}
      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText size={18} className="text-primary" />
              {t('activityReport')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {/* Month selector */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t('selectMonth')}</label>
              <div className="flex gap-3">
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SV_MONTHS_FULL.map((m, i) => (
                      <SelectItem key={i} value={String(i)}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[2024, 2025, 2026].map(y => (
                      <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Summary */}
            <p className="text-sm text-muted-foreground">
              {lang === 'sv' ? `${reportJobs.length} ansökningar` : `${reportJobs.length} applications`} — {SV_MONTHS_FULL[Number(selectedMonth)]} {selectedYear}
            </p>

            {/* Preview */}
            <div className="rounded-lg border border-border bg-muted/30 p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto">
              {buildReportText()}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              <Button variant="outline" size="sm" className="gap-1.5" onClick={handleCopyReport}>
                <Copy size={13} />
                {t('copyText')}
              </Button>
              <Button size="sm" className="gap-1.5" onClick={handlePrintReport}>
                <Download size={13} />
                {t('downloadPdf')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {/* Top stat row — 3 wide cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {/* Total Applications — clickable */}
        <button
          onClick={() => onNavigateToApplications('All')}
          className={`rounded-2xl border border-border/60 bg-card p-5 flex items-center gap-4 text-left shadow-sm ${clickableCardBase} group`}
          aria-label="View all applications"
        >
          <div className="p-3 rounded-xl bg-primary/10 text-primary shrink-0 group-hover:bg-primary/15 transition-colors">
            <Briefcase size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{t('totalApplications')}</p>
            <p className="text-3xl font-bold mt-0.5">{stats.total}</p>
          </div>
          <ArrowRight size={14} className="ml-auto text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
        </button>

        {/* High Priority — clickable */}
        <button
          onClick={() => onNavigateToApplications('All')}
          className={`rounded-2xl border border-border/60 bg-card p-5 flex items-center gap-4 text-left shadow-sm ${clickableCardBase} group`}
          aria-label="View high priority applications"
        >
          <div className="p-3 rounded-xl bg-rose-500/10 text-rose-600 shrink-0 group-hover:bg-rose-500/15 transition-colors">
            <Zap size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{t('priorityHigh')} {t('priority')}</p>
            <p className="text-3xl font-bold mt-0.5">{stats.highPriority}</p>
          </div>
          <ArrowRight size={14} className="ml-auto text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
        </button>

        {/* Apps This Week — clickable */}
        <button
          onClick={() => onNavigateToApplications('All')}
          className={`rounded-2xl border border-border/60 bg-card p-5 flex items-center gap-4 text-left shadow-sm ${clickableCardBase} group`}
          aria-label="View applications this week"
        >
          <div className="p-3 rounded-xl bg-primary/10 text-primary shrink-0 group-hover:bg-primary/15 transition-colors">
            <CalendarDays size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{t('appsThisWeek')}</p>
            <p className="text-3xl font-bold mt-0.5">{stats.thisWeek}</p>
          </div>
          <ArrowRight size={14} className="ml-auto text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
        </button>
      </div>
        
      {/* Status cards — all clickable */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
        <button
          onClick={() => onNavigateToApplications('Applied')}
          className={`rounded-2xl border border-amber-200/60 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800/30 p-5 flex flex-col items-start text-left gap-2 group ${clickableCardBase}`}
        >
          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">{t('applied')}</p>
          <p className="text-3xl font-bold">{stats.applied}</p>
          <span className="text-[10px] text-amber-500/70 group-hover:text-amber-600 font-medium flex items-center gap-1 transition-colors">
            {t('applied')} <ArrowRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
          </span>
        </button>

        <button
          onClick={() => onNavigateToApplications('Interviewing')}
          className={`rounded-2xl border border-primary/20 bg-primary/5 dark:bg-primary/10 p-5 flex flex-col items-start text-left gap-2 group ${clickableCardBase}`}
        >
          <p className="text-[10px] font-bold uppercase tracking-widest text-primary">{t('interviewing')}</p>
          <p className="text-3xl font-bold">{stats.interviewing}</p>
          <span className="text-[10px] text-primary/60 group-hover:text-primary font-medium flex items-center gap-1 transition-colors">
            {t('interviewing')} <ArrowRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
          </span>
        </button>

        <button
          onClick={() => onNavigateToApplications('Rejected')}
          className={`rounded-2xl border border-rose-200/60 bg-rose-50/50 dark:bg-rose-950/20 dark:border-rose-800/30 p-5 flex flex-col items-start text-left gap-2 group ${clickableCardBase}`}
        >
          <p className="text-[10px] font-bold uppercase tracking-widest text-rose-600 dark:text-rose-400">{t('rejected')}</p>
          <p className="text-3xl font-bold">{stats.rejected}</p>
          <span className="text-[10px] text-rose-500/70 group-hover:text-rose-600 font-medium flex items-center gap-1 transition-colors">
            {t('rejected')} <ArrowRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
          </span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Priority Applications */}
        <Card className="border-border/50 shadow-sm md:col-span-2 lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap size={18} className="text-amber-500 fill-amber-500" />
              {t('priorityApplications')}
            </CardTitle>
            <p className="text-xs text-muted-foreground">{t('priorityDesc')}</p>
          </CardHeader>
          <CardContent>
            {priorityJobs.length > 0 ? (
              <div className="space-y-3">
                {priorityJobs.map(job => (
                  <button
                    key={job.id}
                    onClick={() => onNavigateToApplications('All')}
                    className={`w-full flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 rounded-xl border border-border/30 bg-muted/20 gap-2 text-left ${clickableCardBase}`}
                  >
                    <div className="flex flex-col min-w-0">
                      <span className="font-bold text-sm truncate">{job.company}</span>
                      <span className="text-xs text-muted-foreground line-clamp-1">{job.role}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap shrink-0">
                      <Badge variant="outline" className="text-[9px] h-4 uppercase font-bold px-1.5">{job.status}</Badge>
                      {(() => {
                        const p = (job.priority || 'Medium') as JobPriority
                        const cls = p === 'High' ? 'text-rose-600' : p === 'Medium' ? 'text-amber-600' : 'text-sky-600'
                        return <span className={`text-[10px] font-bold ${cls}`}>{t(`priority${p}` as any)}</span>
                      })()}
                      {job.followUpDate && (
                        <Badge variant="secondary" className="bg-amber-100 text-amber-800 text-[9px] h-5 border-amber-200">
                          {getFollowUpStatus(job.followUpDate) === 'today' ? t('todayLabel') : job.followUpDate}
                        </Badge>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <EmptyState icon={<Briefcase />} title={t('noPriorityJobs')} description={t('noPriorityJobsDesc')} className="py-8" />
            )}
          </CardContent>
        </Card>

        {/* Action required + By job type */}
        <div className="space-y-6">
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2 text-rose-600">
                <Clock size={18} />
                {t('actionRequired')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <button
                onClick={onNavigateToFollowUps}
                className={`w-full flex items-center justify-between rounded-lg px-2 py-1.5 -mx-2 ${clickableCardBase}`}
              >
                <span className="text-sm font-medium">{t('dueTodaySection')}</span>
                <Badge className={`h-6 min-w-[24px] flex items-center justify-center ${stats.dueToday > 0 ? 'bg-primary' : 'bg-muted text-muted-foreground'}`}>{stats.dueToday}</Badge>
              </button>
              <button
                onClick={onNavigateToFollowUps}
                className={`w-full flex items-center justify-between rounded-lg px-2 py-1.5 -mx-2 ${clickableCardBase}`}
              >
                <span className="text-sm font-medium">{t('overdueSection')}</span>
                <Badge variant="destructive" className={`h-6 min-w-[24px] flex items-center justify-center ${stats.overdue > 0 ? '' : 'bg-muted text-muted-foreground border-0'}`}>{stats.overdue}</Badge>
              </button>
            </CardContent>
          </Card>

        </div>
      </div>

      {/* Weekly applications line chart */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{lang === 'sv' ? 'Ansökningar per vecka' : 'Applications per week'}</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={weeklyData} margin={{ top: 4, right: 12, left: -20, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
              <XAxis dataKey="week" tick={{ fontSize: 11 }} className="text-muted-foreground" />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(value: any) => [`${value} ansökningar`, 'Antal']}
                labelFormatter={(label) => `${label}`}
                contentStyle={{ fontSize: 12 }}
              />
              <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* ── Suggested for you ─────────────────────────────────────────────────── */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles size={18} className="text-primary" />
              {t('suggestedJobs')}
            </CardTitle>
            {suggestedJobs.length > 0 && (
              <button
                onClick={() => {/* navigate to jobsearch handled by parent */}}
                className="text-xs text-primary font-medium hover:underline underline-offset-2"
              >
                {t('viewInJobSearch')} →
              </button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {suggestLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          ) : !userProfile?.preferredTitles && !userProfile?.preferredLocations ? (
            <div className="py-6 text-center space-y-2">
              <p className="text-sm text-muted-foreground">{t('noProfileForSuggestions')}</p>
            </div>
          ) : suggestedJobs.length === 0 ? (
            <EmptyState icon={<Sparkles />} title={t('noJobsFound')} description={t('noJobsFoundDesc')} className="py-6" />
          ) : (
            <div className="space-y-3">
              {suggestedJobs.map(job => {
                const isSaved = savedIds.has(job.id)
                const isSaving = savingId === job.id
                return (
                  <div
                    key={job.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 rounded-xl border border-border/30 bg-muted/20 gap-3"
                  >
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="font-semibold text-sm text-foreground truncate">{job.title}</p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                        {job.employer && (
                          <span className="flex items-center gap-1"><Building2 size={11} className="shrink-0" />{job.employer}</span>
                        )}
                        {job.location && (
                          <span className="flex items-center gap-1"><MapPin size={11} className="shrink-0" />{job.location}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {job.score > 0 && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getScoreBadgeClass(job.score)}`}>
                          {job.score}%
                        </span>
                      )}
                      <Button
                        size="sm"
                        disabled={isSaved || isSaving || !user}
                        className="h-8 gap-1.5 text-xs"
                        onClick={() => handleSaveSuggested(job)}
                      >
                        {isSaved
                          ? <><Check size={12} />{t('alreadySaved')}</>
                          : <><BookmarkPlus size={12} />{isSaving ? t('saving') : t('saveToApplications')}</>
                        }
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
