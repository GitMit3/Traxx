import { useState, useEffect } from 'react'
import { Card, Input, Select, SelectTrigger, SelectContent, SelectItem, SelectValue, Badge, EmptyState, Dialog, DialogContent, DialogHeader, DialogTitle, Button } from '@blinkdotnew/ui'
import { Search, SortDesc, SortAsc, Filter, Edit2, Trash2, Clock, CheckCircle, XCircle, Calendar, MessageSquare, Briefcase, TrendingUp, ExternalLink, BookmarkPlus } from 'lucide-react'
import { Job, JobStatus, CoverLetterStatus, JobPriority } from '../../types/job'
import { getFollowUpStatus } from '../../lib/utils/date'
import { useLanguage } from '../../lib/LanguageContext'
import { getStatusLabel } from '../../lib/utils'

interface ApplicationsTabProps {
  jobs: Job[]
  jobTypes: string[]
  onEdit: (job: Job) => void
  onDelete: (id: string) => void
  onMarkApplied: (id: string) => void
  initialFilterStatus?: JobStatus | 'All'
  onFilterConsumed?: () => void
}

// ─── Mobile Job Card ──────────────────────────────────────────────────────────

interface MobileJobCardProps {
  job: Job
  onEdit: (job: Job) => void
  onDelete: (id: string) => void
  onMarkApplied: (id: string) => void
  onView: (job: Job) => void
  t: (key: any) => string
  lang: string
}

function MobileJobCard({ job, onEdit, onDelete, onMarkApplied, onView, t, lang }: MobileJobCardProps) {
  const priority = (job.priority || 'Medium') as JobPriority

  const statusVariants: Record<JobStatus, 'default' | 'secondary' | 'outline' | 'destructive'> = {
    Applied: 'secondary',
    Interviewing: 'default',
    Rejected: 'destructive',
    Offer: 'outline',
    Saved: 'secondary',
  }
  const statusIcons: Record<JobStatus, React.ReactNode> = {
    Applied:      <Clock size={11} className="mr-1 shrink-0" />,
    Interviewing: <TrendingUp size={11} className="mr-1 shrink-0" />,
    Rejected:     <XCircle size={11} className="mr-1 shrink-0" />,
    Offer:        <CheckCircle size={11} className="mr-1 shrink-0" />,
    Saved:        <BookmarkPlus size={11} className="mr-1 shrink-0" />,
  }
  const priorityStyles: Record<JobPriority, string> = {
    High:   'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/50',
    Medium: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/50',
    Low:    'bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-800/50',
  }
  const priorityDots: Record<JobPriority, string> = {
    High: 'bg-rose-500', Medium: 'bg-amber-500', Low: 'bg-sky-500',
  }

  const followUpStatus = job.followUpDate ? getFollowUpStatus(job.followUpDate) : null
  const isOverdue = followUpStatus === 'overdue'
  const isToday   = followUpStatus === 'today'
  const isSoon    = followUpStatus === 'soon'

  return (
    <div
      className="bg-background border border-border/60 rounded-2xl p-4 shadow-sm space-y-3 active:scale-[0.99] transition-transform cursor-pointer"
      onClick={() => onView(job)}
    >
      {/* Top row: company + job type */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-bold text-primary truncate text-base leading-snug flex items-center gap-1.5">
            {job.company}
          </p>
          {job.jobType && (
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mt-0.5">{job.jobType}</p>
          )}
        </div>
        {/* Actions */}
        <div className="flex items-center gap-0.5 shrink-0 -mt-0.5">
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(job) }}
            className="h-9 w-9 flex items-center justify-center rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
            aria-label={t('editLabel')}
          >
            <Edit2 size={15} />
          </button>
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(job.id) }}
            className="h-9 w-9 flex items-center justify-center rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            aria-label={t('deleteLabel')}
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* Role */}
      <p className="text-sm font-medium text-foreground leading-snug">{job.role}</p>

      {/* Status + Priority row */}
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant={statusVariants[job.status]} className="flex items-center w-fit text-[11px] h-6">
          {statusIcons[job.status]}
          {getStatusLabel(job.status, lang)}
        </Badge>
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[11px] font-semibold ${priorityStyles[priority]}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${priorityDots[priority]}`} />
          {t(`priority${priority}` as any)}
        </span>
      </div>

      {/* Mark as Applied button — only for Saved jobs */}
      {job.status === 'Saved' && (
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onMarkApplied(job.id) }}
          className="w-full h-8 rounded-lg border border-primary/40 text-primary text-xs font-semibold hover:bg-primary/10 transition-colors"
        >
          {t('markAsApplied')}
        </button>
      )}

      {/* Follow-up date (if set) */}
      {job.followUpDate && (
        <div className="flex items-center gap-2 pt-0.5">
          <Clock size={13} className={`shrink-0 ${isOverdue ? 'text-red-500' : isToday ? 'text-amber-500' : 'text-muted-foreground'}`} />
          <span className={`text-xs ${isOverdue ? 'text-destructive font-bold' : 'text-muted-foreground'}`}>
            {job.followUpDate}
          </span>
          {isOverdue && (
            <Badge variant="destructive" className="px-1.5 py-0 h-4 text-[9px]">{t('overdue')}</Badge>
          )}
          {isToday && (
            <Badge className="px-1.5 py-0 h-4 text-[9px]">{t('todayBadge')}</Badge>
          )}
          {isSoon && (
            <Badge variant="outline" className="px-1.5 py-0 h-4 text-[9px] border-amber-500 text-amber-600 font-bold">{t('soon')}</Badge>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Desktop Job Row ──────────────────────────────────────────────────────────

interface DesktopJobRowProps {
  job: Job
  onEdit: (job: Job) => void
  onDelete: (id: string) => void
  onMarkApplied: (id: string) => void
  onView: (job: Job) => void
  t: (key: any) => string
  lang: string
}

function DesktopJobRow({ job, onEdit, onDelete, onMarkApplied, onView, t, lang }: DesktopJobRowProps) {
  const priority = (job.priority || 'Medium') as JobPriority

  const statusVariants: Record<JobStatus, 'default' | 'secondary' | 'outline' | 'destructive'> = {
    Applied: 'secondary', Interviewing: 'default', Rejected: 'destructive', Offer: 'outline', Saved: 'secondary',
  }
  const statusIcons: Record<JobStatus, React.ReactNode> = {
    Applied:      <Clock size={12} className="mr-1 shrink-0" />,
    Interviewing: <TrendingUp size={12} className="mr-1 shrink-0" />,
    Rejected:     <XCircle size={12} className="mr-1 shrink-0" />,
    Offer:        <CheckCircle size={12} className="mr-1 shrink-0" />,
    Saved:        <BookmarkPlus size={12} className="mr-1 shrink-0" />,
  }
  const priorityStyles: Record<JobPriority, string> = {
    High:   'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/50',
    Medium: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/50',
    Low:    'bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-800/50',
  }
  const priorityDots: Record<JobPriority, string> = { High: 'bg-rose-500', Medium: 'bg-amber-500', Low: 'bg-sky-500' }

  const followUpStatus = job.followUpDate ? getFollowUpStatus(job.followUpDate) : null
  const isOverdue = followUpStatus === 'overdue'
  const isToday   = followUpStatus === 'today'
  const isSoon    = followUpStatus === 'soon'

  return (
    <tr className="border-b border-border/40 last:border-0 hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => onView(job)}>
      {/* Company */}
      <td className="px-4 py-3 align-middle">
        <div className="flex flex-col">
          <span className="font-semibold text-primary text-sm">{job.company}</span>
          {job.jobType && (
            <span className="text-[10px] text-muted-foreground uppercase tracking-tighter">{job.jobType}</span>
          )}
        </div>
      </td>

      {/* Role */}
      <td className="px-4 py-3 align-middle">
        <span className="text-sm text-foreground">{job.role}</span>
      </td>

      {/* Status */}
      <td className="px-4 py-3 align-middle">
        <Badge variant={statusVariants[job.status]} className="flex items-center w-fit text-[11px] h-6">
          {statusIcons[job.status]}{getStatusLabel(job.status, lang)}
        </Badge>
      </td>

      {/* Follow-up */}
      <td className="px-4 py-3 align-middle">
        {job.followUpDate ? (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <Clock size={12} className={`shrink-0 ${isOverdue ? 'text-red-500' : isToday ? 'text-amber-500' : 'text-muted-foreground'}`} />
              <span className={`text-xs ${isOverdue ? 'text-destructive font-bold' : 'text-foreground'}`}>{job.followUpDate}</span>
            </div>
            {isOverdue && <Badge variant="destructive" className="px-1 py-0 h-4 text-[9px] w-fit">{t('overdue')}</Badge>}
            {isToday   && <Badge className="px-1 py-0 h-4 text-[9px] w-fit">{t('todayBadge')}</Badge>}
            {isSoon    && <Badge variant="outline" className="px-1 py-0 h-4 text-[9px] w-fit border-amber-500 text-amber-600 font-bold">{t('soon')}</Badge>}
          </div>
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        )}
      </td>

      {/* Priority */}
      <td className="px-4 py-3 align-middle">
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[11px] font-semibold ${priorityStyles[priority]}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${priorityDots[priority]}`} />
          {t(`priority${priority}` as any)}
        </span>
      </td>

      {/* Actions */}
      <td className="px-4 py-3 align-middle">
        <div className="flex items-center gap-1">
          {job.status === 'Saved' && (
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onMarkApplied(job.id) }}
              className="h-8 px-2.5 flex items-center justify-center rounded-md border border-primary/40 text-primary text-[11px] font-semibold hover:bg-primary/10 transition-colors whitespace-nowrap"
            >
              {t('markAsApplied')}
            </button>
          )}
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(job) }}
            className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
            aria-label={t('editLabel')}
          >
            <Edit2 size={14} />
          </button>
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(job.id) }}
            className="h-8 w-8 flex items-center justify-center rounded-md text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors"
            aria-label={t('deleteLabel')}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </td>
    </tr>
  )
}

// ─── ApplicationsTab ──────────────────────────────────────────────────────────

export function ApplicationsTab({ jobs, jobTypes, onEdit, onDelete, onMarkApplied, initialFilterStatus, onFilterConsumed }: ApplicationsTabProps) {
  const { t, lang } = useLanguage()
  const [searchQuery, setSearchQuery]   = useState('')
  const [sortOrder, setSortOrder]       = useState<'newest' | 'oldest' | 'priority-high' | 'priority-low' | 'followup-near'>('newest')
  const [filterType, setFilterType]     = useState<string | 'All'>('All')
  const [filterStatus, setFilterStatus] = useState<JobStatus | 'All'>('All')
  const [filterCL, setFilterCL]         = useState<CoverLetterStatus | 'All'>('All')
  const [viewingJob, setViewingJob]     = useState<Job | null>(null)

  // Derived values for the detail dialog
  const vPriority       = ((viewingJob?.priority) || 'Medium') as JobPriority
  const vFollowUpStatus = viewingJob?.followUpDate ? getFollowUpStatus(viewingJob.followUpDate) : null
  const vIsOverdue      = vFollowUpStatus === 'overdue'
  const vIsToday        = vFollowUpStatus === 'today'
  const vIsSoon         = vFollowUpStatus === 'soon'

  // Consume navigation filter from dashboard cards
  useEffect(() => {
    if (initialFilterStatus && initialFilterStatus !== 'All') {
      setFilterStatus(initialFilterStatus)
      onFilterConsumed?.()
    } else if (initialFilterStatus === 'All') {
      setFilterStatus('All')
      onFilterConsumed?.()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFilterStatus])

  // ─── Filtering + sorting ────────────────────────────────────────────────────

  const filteredJobs = jobs
    .filter(j => {
      const matchesSearch  = j.company.toLowerCase().includes(searchQuery.toLowerCase()) || j.role.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesType    = filterType   === 'All' || j.jobType           === filterType
      const matchesStatus  = filterStatus === 'All' || j.status            === filterStatus
      const matchesCL      = filterCL     === 'All' || j.coverLetterStatus === filterCL
      return matchesSearch && matchesType && matchesStatus && matchesCL
    })
    .sort((a, b) => {
      if (sortOrder === 'newest')        return b.createdAt - a.createdAt
      if (sortOrder === 'oldest')        return a.createdAt - b.createdAt
      if (sortOrder === 'priority-high') {
        const order: Record<string, number> = { High: 0, Medium: 1, Low: 2 }
        return (order[a.priority || 'Medium'] ?? 1) - (order[b.priority || 'Medium'] ?? 1)
      }
      if (sortOrder === 'priority-low') {
        const order: Record<string, number> = { High: 0, Medium: 1, Low: 2 }
        return (order[b.priority || 'Medium'] ?? 1) - (order[a.priority || 'Medium'] ?? 1)
      }
      if (sortOrder === 'followup-near') {
        if (!a.followUpDate) return 1
        if (!b.followUpDate) return -1
        return a.followUpDate.localeCompare(b.followUpDate)
      }
      return 0
    })

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4 animate-in fade-in duration-500">

      {/* Search bar — full width on all sizes */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={t('searchPlaceholder')}
          className="pl-9 h-10 shadow-sm"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      {/* ── Mobile filters: 2-column grid ──────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-2 md:hidden">
        {/* Sort */}
        <Select value={sortOrder} onValueChange={(val: any) => setSortOrder(val)}>
          <SelectTrigger className="h-10 shadow-sm bg-background border-border/50 w-full">
            <div className="flex items-center gap-2 min-w-0">
              {sortOrder.includes('priority') ? <Filter size={13} className="shrink-0" /> : sortOrder === 'followup-near' ? <Calendar size={13} className="shrink-0" /> : sortOrder === 'newest' ? <SortDesc size={13} className="shrink-0" /> : <SortAsc size={13} className="shrink-0" />}
              <SelectValue placeholder="Sort" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">{t('newestFirst')}</SelectItem>
            <SelectItem value="oldest">{t('oldestFirst')}</SelectItem>
            <SelectItem value="priority-high">{t('priorityHigh')} ↑</SelectItem>
            <SelectItem value="priority-low">{t('priorityLow')} ↓</SelectItem>
            <SelectItem value="followup-near">{t('followUpNearest')}</SelectItem>
          </SelectContent>
        </Select>

        {/* Status */}
        <Select value={filterStatus} onValueChange={(val: any) => setFilterStatus(val)}>
          <SelectTrigger className="h-10 shadow-sm bg-background border-border/50 w-full">
            <div className="flex items-center gap-2 min-w-0">
              <Filter size={13} className="shrink-0" />
              <SelectValue placeholder="Status" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">{t('allStatus')}</SelectItem>
            <SelectItem value="Saved">{t('statusSaved')}</SelectItem>
            <SelectItem value="Applied">{t('statusApplied')}</SelectItem>
            <SelectItem value="Interviewing">{t('statusInterviewing')}</SelectItem>
            <SelectItem value="Rejected">{t('statusRejected')}</SelectItem>
            <SelectItem value="Offer">{t('statusOffer')}</SelectItem>
          </SelectContent>
        </Select>

        {/* Job Type (mobile) */}
        {jobTypes.length > 0 && (
          <Select value={filterType} onValueChange={(val: any) => setFilterType(val)}>
            <SelectTrigger className="h-10 shadow-sm bg-background border-border/50 w-full">
              <div className="flex items-center gap-2 min-w-0">
                <Briefcase size={13} className="shrink-0" />
                <SelectValue placeholder="Type" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">{t('allTypes')}</SelectItem>
              {jobTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
            </SelectContent>
          </Select>
        )}

        {/* Cover Letter */}
        <Select value={filterCL} onValueChange={(val: any) => setFilterCL(val)}>
          <SelectTrigger className="h-10 shadow-sm bg-background border-border/50 w-full">
            <div className="flex items-center gap-2 min-w-0">
              <MessageSquare size={13} className="shrink-0" />
              <SelectValue placeholder="Cover Letter" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">{t('allCLStatus')}</SelectItem>
            <SelectItem value="Not started">{t('coverLetterNotStarted')}</SelectItem>
            <SelectItem value="Draft ready">{t('coverLetterDraft')}</SelectItem>
            <SelectItem value="Sent">{t('coverLetterSent')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* ── Desktop filters: original flex row ──────────────────────────────── */}
      <div className="hidden md:flex flex-wrap items-center gap-2">
        <Select value={sortOrder} onValueChange={(val: any) => setSortOrder(val)}>
          <SelectTrigger className="w-[180px] h-10 shadow-sm bg-background border-border/50">
            <div className="flex items-center gap-2">
              {sortOrder.includes('priority') ? <Filter size={14} /> : sortOrder === 'followup-near' ? <Calendar size={14} /> : sortOrder === 'newest' ? <SortDesc size={14} /> : <SortAsc size={14} />}
              <SelectValue placeholder="Sort by" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">{t('newestFirst')}</SelectItem>
            <SelectItem value="oldest">{t('oldestFirst')}</SelectItem>
            <SelectItem value="priority-high">{t('priorityHigh')} {t('priority')} ↑</SelectItem>
            <SelectItem value="priority-low">{t('priorityLow')} {t('priority')} ↓</SelectItem>
            <SelectItem value="followup-near">{t('followUpNearest')}</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={(val: any) => setFilterStatus(val)}>
          <SelectTrigger className="w-[130px] h-10 shadow-sm bg-background border-border/50">
            <div className="flex items-center gap-2">
              <Filter size={14} />
              <SelectValue placeholder="Status" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">{t('allStatus')}</SelectItem>
            <SelectItem value="Saved">{t('statusSaved')}</SelectItem>
            <SelectItem value="Applied">{t('statusApplied')}</SelectItem>
            <SelectItem value="Interviewing">{t('statusInterviewing')}</SelectItem>
            <SelectItem value="Rejected">{t('statusRejected')}</SelectItem>
            <SelectItem value="Offer">{t('statusOffer')}</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterCL} onValueChange={(val: any) => setFilterCL(val)}>
          <SelectTrigger className="w-[130px] h-10 shadow-sm bg-background border-border/50">
            <div className="flex items-center gap-2">
              <MessageSquare size={14} />
              <SelectValue placeholder="Cover Letter" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">{t('allCLStatus')}</SelectItem>
            <SelectItem value="Not started">{t('coverLetterNotStarted')}</SelectItem>
            <SelectItem value="Draft ready">{t('coverLetterDraft')}</SelectItem>
            <SelectItem value="Sent">{t('coverLetterSent')}</SelectItem>
          </SelectContent>
        </Select>

        {jobTypes.length > 0 && (
          <Select value={filterType} onValueChange={(val: any) => setFilterType(val)}>
            <SelectTrigger className="w-[130px] h-10 shadow-sm bg-background border-border/50">
              <div className="flex items-center gap-2 text-xs font-medium">
                <Badge variant="outline" className="h-4 px-1">{jobTypes.length}</Badge>
                <SelectValue placeholder="Type" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">{t('allTypes')}</SelectItem>
              {jobTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* ── Results count chip (mobile) ───────────────────────────────────── */}
      {filteredJobs.length > 0 && (
        <div className="flex items-center justify-between md:hidden">
          <span className="text-xs text-muted-foreground">
            {filteredJobs.length} {filteredJobs.length === 1 ? t('resultSingular') : t('resultPlural')}
          </span>
          {(filterStatus !== 'All' || filterType !== 'All' || filterCL !== 'All' || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setFilterStatus('All')
                setFilterType('All')
                setFilterCL('All')
                setSearchQuery('')
              }}
              className="text-xs text-primary font-medium underline-offset-2 hover:underline"
            >
              {t('clearAllFilters')}
            </button>
          )}
        </div>
      )}

      {filteredJobs.length === 0 ? (
        <EmptyState
          icon={<Briefcase />}
          title={t('noResultsFound')}
          description={t('noResultsDesc')}
        />
      ) : (
        <>
          {/* Mobile cards — below md */}
          <div className="md:hidden space-y-3">
            {filteredJobs.map(job => (
              <MobileJobCard
                key={job.id}
                job={job}
                onEdit={onEdit}
                onDelete={onDelete}
                onMarkApplied={onMarkApplied}
                onView={setViewingJob}
                t={t}
                lang={lang}
              />
            ))}
          </div>

          {/* Desktop custom table — md+ (no DataTable, no row click) */}
          <div className="hidden md:block">
            <Card className="border-border/50 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/40 bg-muted/30">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t('company')}</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t('role')}</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t('status')}</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t('followUp')}</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t('priorityCol')}</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide w-[90px]"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredJobs.map(job => (
                    <DesktopJobRow
                      key={job.id}
                      job={job}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onMarkApplied={onMarkApplied}
                      onView={setViewingJob}
                      t={t}
                      lang={lang}
                    />
                  ))}
                </tbody>
              </table>
            </Card>
          </div>
        </>
      )}

      {/* ── Job detail dialog ─────────────────────────────────────────────── */}
      <Dialog open={!!viewingJob} onOpenChange={open => !open && setViewingJob(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold leading-snug">{viewingJob?.company}</DialogTitle>
            <p className="text-base text-muted-foreground mt-0.5">{viewingJob?.role}</p>
          </DialogHeader>

          {viewingJob && (
            <div className="space-y-4 mt-1">

              {/* Status + Priority */}
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={
                  viewingJob.status === 'Interviewing' ? 'default'
                  : viewingJob.status === 'Rejected' ? 'destructive'
                  : viewingJob.status === 'Offer' ? 'outline'
                  : 'secondary'
                }>
                  {getStatusLabel(viewingJob.status, lang)}
                </Badge>
                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[11px] font-semibold ${
                  vPriority === 'High' ? 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/50'
                  : vPriority === 'Low' ? 'bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-800/50'
                  : 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/50'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${vPriority === 'High' ? 'bg-rose-500' : vPriority === 'Low' ? 'bg-sky-500' : 'bg-amber-500'}`} />
                  {t(`priority${vPriority}` as any)}
                </span>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                {viewingJob.dateApplied && (
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t('dateApplied')}</p>
                    <p className="text-sm text-foreground">{viewingJob.dateApplied}</p>
                  </div>
                )}
                {viewingJob.followUpDate && (
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t('followUpDate')}</p>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className={`text-sm ${vIsOverdue ? 'text-destructive font-semibold' : 'text-foreground'}`}>{viewingJob.followUpDate}</p>
                      {vIsOverdue && <Badge variant="destructive" className="px-1.5 py-0 h-4 text-[9px]">{t('overdue')}</Badge>}
                      {vIsToday   && <Badge className="px-1.5 py-0 h-4 text-[9px]">{t('todayBadge')}</Badge>}
                      {vIsSoon    && <Badge variant="outline" className="px-1.5 py-0 h-4 text-[9px] border-amber-500 text-amber-600 font-bold">{t('soon')}</Badge>}
                    </div>
                  </div>
                )}
              </div>

              {/* Job URL */}
              {viewingJob.jobUrl && (
                <a href={viewingJob.jobUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="gap-2 h-9 text-sm w-full sm:w-auto">
                    <ExternalLink size={14} />
                    {t('openOriginal')}
                  </Button>
                </a>
              )}

              {/* Interview Notes */}
              {viewingJob.interviewNotes && (
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t('interviewNotes')}</p>
                  <p className="text-sm text-foreground whitespace-pre-wrap bg-muted/40 rounded-lg p-3 border border-border/40">{viewingJob.interviewNotes}</p>
                </div>
              )}

              {/* General Notes */}
              {viewingJob.notes && (
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t('generalNotes')}</p>
                  <p className="text-sm text-foreground whitespace-pre-wrap bg-muted/40 rounded-lg p-3 border border-border/40">{viewingJob.notes}</p>
                </div>
              )}

              {/* Edit action */}
              <div className="flex justify-end pt-2 border-t border-border/40">
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => { setViewingJob(null); onEdit(viewingJob) }}
                >
                  <Edit2 size={14} />
                  {t('editLabel')}
                </Button>
              </div>

            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  )
}
