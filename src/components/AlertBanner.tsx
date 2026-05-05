import { Badge, Button } from '@blinkdotnew/ui'
import { AlertCircle, ArrowRight, Bell } from 'lucide-react'
import { Job } from '../types/job'
import { getFollowUpStatus } from '../lib/utils/date'
import { useLanguage } from '../lib/LanguageContext'

interface AlertBannerProps {
  jobs: Job[]
  onViewFollowUps: () => void
}

export function AlertBanner({ jobs, onViewFollowUps }: AlertBannerProps) {
  const { t } = useLanguage()
  const dueToday = jobs.filter(j => getFollowUpStatus(j.followUpDate) === 'today').length
  const overdue = jobs.filter(j => getFollowUpStatus(j.followUpDate) === 'overdue').length

  if (dueToday === 0 && overdue === 0) return null

  return (
    <div className="bg-destructive/5 border-b border-destructive/10 py-2.5 px-4 mb-6 -mt-8 mx-auto max-w-6xl rounded-b-xl flex items-center justify-between gap-4 animate-in slide-in-from-top-4 duration-500">
      <div className="flex items-center gap-3">
        <div className="bg-destructive/10 p-1.5 rounded-full text-destructive">
          <Bell size={16} className="animate-bounce" />
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          {overdue > 0 && (
            <p className="text-sm font-bold text-destructive flex items-center gap-1.5">
              <AlertCircle size={14} />
              {overdue} {overdue > 1 ? t('overdueFollowUpsPlural') : t('overdueFollowUps')}
            </p>
          )}
          {dueToday > 0 && (
            <p className="text-sm font-medium text-destructive/80">
              {dueToday} {t('dueToday')}
            </p>
          )}
        </div>
      </div>
      <Button 
        variant="ghost" 
        size="sm" 
        className="h-8 text-xs font-bold text-destructive hover:bg-destructive/10 hover:text-destructive flex items-center gap-1"
        onClick={onViewFollowUps}
      >
        {t('viewActionItems')}
        <ArrowRight size={14} />
      </Button>
    </div>
  )
}
