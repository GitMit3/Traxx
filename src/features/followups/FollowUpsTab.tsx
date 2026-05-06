import { Card, CardHeader, CardTitle, CardContent, Button, Badge, EmptyState } from '@blinkdotnew/ui'
import { CheckCircle, XCircle, TrendingUp, Edit2, Calendar, Clock, AlertCircle, MessageCircle } from 'lucide-react'
import { Job, JobStatus } from '../../types/job'
import { getFollowUpStatus, formatDate } from '../../lib/utils/date'
import { supabase } from '../../lib/supabase'
import { toast } from '@blinkdotnew/ui'
import { useLanguage } from '../../lib/LanguageContext'

interface FollowUpsTabProps {
  jobs: Job[]
  onRefresh: () => void
  onEdit: (job: Job) => void
}

export function FollowUpsTab({ jobs, onRefresh, onEdit }: FollowUpsTabProps) {
  const { t } = useLanguage()
  const followUpJobs = jobs.filter(j => j.followUpDate).sort((a, b) => a.followUpDate.localeCompare(b.followUpDate))
  
  const overdue = followUpJobs.filter(j => getFollowUpStatus(j.followUpDate) === 'overdue')
  const today = followUpJobs.filter(j => getFollowUpStatus(j.followUpDate) === 'today')
  const soon = followUpJobs.filter(j => getFollowUpStatus(j.followUpDate) === 'soon')

  const handleQuickAction = async (jobId: string, updates: Partial<Job>, message: string) => {
    try {
      const keyMap: Record<string, string> = {
        followUpDate: 'follow_up_date',
        nextStep: 'next_step',
        coverLetterStatus: 'cover_letter_status',
        interviewNotes: 'interview_notes',
        dateApplied: 'date_applied',
        matchScore: 'match_score',
        jobType: 'job_type',
        jobUrl: 'job_url',
      }
      const row = Object.fromEntries(
        Object.entries(updates).map(([k, v]) => [keyMap[k] ?? k, v])
      )
      const { error } = await supabase.from('jobs').update(row).eq('id', jobId)
      if (error) throw error
      toast.success(message)
      onRefresh()
    } catch {
      toast.error(t('failedToUpdateJob'))
    }
  }

  const renderJobCard = (job: Job) => {
    const status = getFollowUpStatus(job.followUpDate)
    const isOverdue = status === 'overdue'
    const isToday = status === 'today'
    
    return (
      <Card key={job.id} className={`border-l-4 transition-all hover:shadow-md ${isOverdue ? 'border-l-destructive bg-destructive/5' : isToday ? 'border-l-primary bg-primary/5' : 'border-l-amber-400 bg-amber-50/30'}`}>
        <CardContent className="p-3 sm:p-4">
          {/* Info section */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-base text-foreground">{job.company}</h3>
                <Badge variant="secondary" className="h-5 text-[10px] uppercase font-bold shrink-0">{job.status}</Badge>
                {job.coverLetterStatus === 'Sent' && <Badge variant="outline" className="h-5 text-[10px] border-emerald-200 text-emerald-700 bg-emerald-50 shrink-0">{t('clSentBadge')}</Badge>}
              </div>
              <p className="text-sm font-medium text-muted-foreground truncate">{job.role}</p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1">
                <div className="flex items-center gap-1 text-xs font-semibold">
                  <Calendar size={12} className={isOverdue ? "text-destructive" : "text-primary"} />
                  <span className={isOverdue ? "text-destructive" : "text-foreground"}>
                    {isOverdue ? t('overduePrefix') : isToday ? t('dueTodayPrefix') : t('followUpPrefix')}
                    {formatDate(job.followUpDate)}
                  </span>
                </div>
                {job.nextStep && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground italic">
                    <MessageCircle size={12} />
                    <span className="truncate max-w-[140px]">{t('nextLabel')} {job.nextStep}</span>
                  </div>
                )}
              </div>
            </div>
            {/* Edit icon — top right */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full hover:bg-muted shrink-0"
              onClick={() => onEdit(job)}
            >
              <Edit2 size={14} />
            </Button>
          </div>

          {/* Action buttons — full width on mobile, auto on desktop */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 sm:flex-none h-9 gap-1.5 text-xs font-bold border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
              onClick={() => handleQuickAction(job.id, { followUpDate: '', nextStep: t('followedUp') }, t('markedFollowedUp'))}
            >
              <CheckCircle size={14} />
              <span className="truncate">{t('followedUp')}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 sm:flex-none h-9 gap-1.5 text-xs font-bold border-primary/20 text-primary hover:bg-primary/5"
              onClick={() => handleQuickAction(job.id, { status: 'Interviewing' as JobStatus, nextStep: t('awaitingInterviewDetails') }, t('movedToInterview'))}
            >
              <TrendingUp size={14} />
              <span className="truncate">{t('interview')}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 sm:flex-none h-9 gap-1.5 text-xs font-bold text-destructive border-destructive/20 hover:bg-destructive/5"
              onClick={() => handleQuickAction(job.id, { status: 'Rejected' as JobStatus, followUpDate: '' }, t('markedRejected'))}
            >
              <XCircle size={14} />
              <span className="truncate">{t('rejected')}</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (overdue.length === 0 && today.length === 0 && soon.length === 0) {
    return (
      <EmptyState 
        icon={<Clock />}
        title={t('noUpcomingFollowUps')}
        description={t('noUpcomingFollowUpsDesc')}
      />
    )
  }

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      {overdue.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle size={20} />
            <h2 className="text-lg font-bold uppercase tracking-wider">{t('overdueSection')}</h2>
            <Badge variant="destructive">{overdue.length}</Badge>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {overdue.map(renderJobCard)}
          </div>
        </div>
      )}

      {today.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <Clock size={20} />
            <h2 className="text-lg font-bold uppercase tracking-wider">{t('dueTodaySection')}</h2>
            <Badge>{today.length}</Badge>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {today.map(renderJobCard)}
          </div>
        </div>
      )}

      {soon.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-amber-600">
            <Calendar size={20} />
            <h2 className="text-lg font-bold uppercase tracking-wider">{t('next7DaysSection')}</h2>
            <Badge variant="secondary" className="bg-amber-100 text-amber-800">{soon.length}</Badge>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {soon.map(renderJobCard)}
          </div>
        </div>
      )}
    </div>
  )
}
