import { Card, CardHeader, CardTitle, CardContent, Badge, EmptyState } from '@blinkdotnew/ui'
import { FileText, MessageSquare, Clock } from 'lucide-react'
import { Job } from '../../types/job'
import { formatDate } from '../../lib/utils/date'
import { getStatusLabel } from '../../lib/utils'
import { useLanguage } from '../../lib/LanguageContext'

interface NotesTabProps {
  jobs: Job[]
}

export function NotesTab({ jobs }: NotesTabProps) {
  const { t, lang } = useLanguage()
  const jobsWithNotes = jobs.filter(j => j.interviewNotes || j.notes)

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <MessageSquare size={20} className="text-primary" />
          {t('interviewAppNotes')}
        </h2>
        <Badge variant="outline">{jobsWithNotes.length} {t('entries')}</Badge>
      </div>
      
      <div className="grid grid-cols-1 gap-4 pb-12">
        {jobsWithNotes.length > 0 ? (
          jobsWithNotes.map(job => (
            <Card key={job.id} className="border-border/50 shadow-sm hover:shadow-md transition-shadow duration-300">
              <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-border/30">
                <div className="space-y-0.5">
                  <CardTitle className="text-lg font-bold text-primary">{job.company}</CardTitle>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{job.role}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><Clock size={12} /> {formatDate(job.dateApplied)}</span>
                  </div>
                </div>
                <Badge variant="secondary">{getStatusLabel(job.status, lang)}</Badge>
              </CardHeader>
              <CardContent className="space-y-6 pt-4">
                {job.interviewNotes && (
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary/60 flex items-center gap-1.5">
                      <MessageSquare size={12} />
                      {t('interviewNotesSection')}
                    </h4>
                    <div className="text-sm whitespace-pre-wrap bg-primary/5 p-4 rounded-lg border border-primary/10 leading-relaxed italic text-slate-700">
                      "{job.interviewNotes}"
                    </div>
                  </div>
                )}
                {job.notes && (
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                      <FileText size={12} />
                      {t('generalNotesSection')}
                    </h4>
                    <p className="text-sm whitespace-pre-wrap text-muted-foreground leading-relaxed pl-1">
                      {job.notes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <EmptyState 
            icon={<FileText />}
            title={t('noNotesFound')}
            description={t('noNotesFoundDesc')}
          />
        )}
      </div>
    </div>
  )
}
